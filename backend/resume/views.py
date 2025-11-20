import uuid
import io
import os
import re
import json
from qdrant_client.http import models
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from django.core.cache import cache
from rest_framework import status
import boto3
from botocore.exceptions import ClientError
from .services.qdrant_service import setup_qdrant_collections
from .services.history_service import ChatHistoryManager
from .services.qdrant_service import search_contracts, setup_qdrant_collections
from .services.s3_service import get_s3_bytes_from_url
from rest_framework.decorators import api_view
 
CONTRACT_CATEGORY_MAP = {
    "nda": "ndas",
    "loan_agreement": "loan_agreements",
    "employee_contract": "employee_contracts",
}
 
from .services.s3_service import upload_contract_to_s3, get_s3_bytes_from_url, generate_presigned_viewable_url
from .services.extract_data import ContractExtractor
from .services.embedding_service import get_text_embedding
from .services.qdrant_service import upsert_contract, search_contracts, get_all_contracts, setup_qdrant_collections, get_contract_alerts_and_reminders
from .services.bedrock_service import BedrockService
from .services.qdrant_service import (
    get_all_contracts,
    get_contracts_by_collection,
    CONTRACT_CATEGORY_MAP
)
 
CONTRACT_CATEGORY_MAP = {
    'loan_agreement': 'loan_agreements',
    'nda': 'ndas',
    'employee_contract': 'employee_contracts',
}
 
class ContractUploadView(APIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.s3_bucket_name = settings.S3_CONTRACTS_BUCKET
        try:
            self.extractor = ContractExtractor()
        except Exception as e:
            raise Exception(f"Failed to initialize ContractExtractor: {e}")
 
    def post(self, request, *args, **kwargs):
        contract_file = request.FILES.get('contract_file')
        contract_category = request.POST.get('contract_category')
 
        if not contract_file:
            return Response({'error': 'No contract file was provided.'}, status=status.HTTP_400_BAD_REQUEST)
       
        if not contract_category or contract_category not in CONTRACT_CATEGORY_MAP:
            valid_categories = ", ".join(CONTRACT_CATEGORY_MAP.keys())
            return Response(
                {'error': f'A valid contract_category must be provided. Options are: {valid_categories}'},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        collection_name = CONTRACT_CATEGORY_MAP[contract_category]
        file_content = contract_file.read()
       
        s3_buffer = io.BytesIO(file_content)
        parser_buffer = io.BytesIO(file_content)
       
        s3_key = f"{collection_name}/{uuid.uuid4()}-{contract_file.name}"
        try:
            s3_url = upload_contract_to_s3(
                s3_buffer,
                self.s3_bucket_name,
                s3_key,
                contract_file.content_type
            )
            if not s3_url:
                raise Exception("S3 upload returned no URL.")
        except Exception as e:
            return Response({'error': f'S3 upload failed: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
        try:
            payload, contract_text = self.extractor.process_contract(
                parser_buffer,
                contract_category,
                s3_url
            )
            if not contract_text:
                raise ValueError("Fitz failed to extract any text.")
        except Exception as e:
            return Response({'error': f'Failed to process contract: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
        try:
            embedding = get_text_embedding(contract_text)
            if not embedding:
                raise ValueError("Failed to generate text embedding.")
        except Exception as e:
            return Response({'error': f'Embedding generation failed: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
        point_id = str(uuid.uuid4())
        try:
            upsert_contract(collection_name, point_id, embedding, payload)
        except Exception as e:
            return Response({'error': f'Failed to save data to Qdrant: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            print("Invalidating caches due to new upload...")
            keys_to_delete = [
                AllContractsListView.CACHE_KEY,
                AlertsRemindersView.CACHE_KEY,
                f"{ContractByCategoryView.CACHE_KEY_PREFIX}_{contract_category}"
            ]
            cache.delete_many(keys_to_delete)
            print("✅ Caches invalidated.")
        except Exception as e:
            # Don't fail the upload, just log the warning
            print(f"⚠️ Warning: Failed to invalidate cache: {e}")
 
        return Response({
            'message': f'Contract processed and saved to "{collection_name}" collection!',
            'qdrant_id': point_id,
            'data': payload,
        }, status=status.HTTP_201_CREATED)
 
class ContractSearchView(APIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.bedrock_service = BedrockService()
        self.default_threshold = 0.3
        self.hybrid_threshold = 0.1
 
    def post(self, request, *args, **kwargs):
        natural_query = request.data.get('query', '')
        category = request.data.get('category', None)
        limit_per_collection = request.data.get('limit', 100)
 
        if not natural_query:
            return Response({'error': 'A search query is required.'}, status=status.HTTP_400_BAD_REQUEST)
 
        try:
            plan = self.bedrock_service.get_search_plan(natural_query, category=category)
            semantic_query = plan.get('semantic_query', natural_query)
            payload_filters = plan.get('filters', {})
            search_threshold = self.default_threshold
            if payload_filters:
                print("   -> Filters found. Using *original* query for semantic vector.")
                semantic_query = natural_query
                search_threshold = self.hybrid_threshold            
        except Exception as e:
            return Response({'error': f'Bedrock query router failed: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
        target_collections = []
        if category and category in CONTRACT_CATEGORY_MAP:
            target_collections.append(CONTRACT_CATEGORY_MAP[category])
            print(f"Targeting specific collection: {target_collections}")
        else:
            target_collections = list(CONTRACT_CATEGORY_MAP.values())
            print(f"Targeting all collections: {target_collections}")
 
        try:
            query_embedding = get_text_embedding(semantic_query)
            if not query_embedding:
                raise ValueError("Embedding service returned no vector.")
        except Exception as e:
            return Response({'error': f'Failed to get text embedding: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
        must_conditions = []
        for key, value in payload_filters.items():
            if value:
                must_conditions.append(models.FieldCondition(
                    key=key,
                    match=models.MatchText(text=value)
                ))
       
        qdrant_filter = models.Filter(must=must_conditions) if must_conditions else None
       
        all_results = []
        for collection in target_collections:
            try:
                collection_results = search_contracts(
                    collection_name=collection,
                    query_vector=query_embedding,
                    query_filter=qdrant_filter,
                    limit=limit_per_collection,
                    score_threshold=search_threshold
                )
                all_results.extend(collection_results)
            except Exception as e:
                print(f"Failed to search collection {collection}: {e}")
 
        all_results.sort(key=lambda r: r.score, reverse=True)
       
        formatted_results = [
            {
                'id': match.id,
                'score': round(match.score, 4),
                'data': {
                    k: v for k, v in match.payload.items()
                    if k != 'contract_text'
                }
            }
            for match in all_results
        ]
 
        return Response({
            "search_type": "hybrid_semantic_search",
            "query": natural_query,
            "search_plan": plan,
            "results": formatted_results[:limit_per_collection],
        }, status=status.HTTP_200_OK)
 
def _format_contract_list_payload(record):
    payload = record.payload
   
    name_key = (
        payload.get("employee_name") or
        payload.get("borrower_name") or
        payload.get("receiving_party") or
        "N/A"
    )
   
    date_key = (
        payload.get("start_date") or
        payload.get("effective_date") or
        payload.get("due_date") or
        "N/A"
    )
   
    s3_url = payload.get("s3_url")
   
    viewable_url = None
    if s3_url:
        viewable_url = generate_presigned_viewable_url(s3_url)
 
    return {
        "qdrant_id": record.id,
        "s3_url": s3_url,
        "viewable_url": viewable_url,
        "category": payload.get("category"),
        "collection": payload.get("found_in_collection", payload.get("category")),
        "name": name_key,
        "date": date_key,
    }
   
# Inside views.py
 
def refresh_viewable_urls(contract_list):
    """
    Iterates through a list of contract dictionaries,
    takes the permanent s3_url, and generates a FRESH viewable_url.
    """
    updated_list = []
    for contract in contract_list:
        # Create a copy so we don't mutate the cached object directly if we don't want to
        item = contract.copy()
       
        s3_url = item.get("s3_url")
        if s3_url:
            # Generate a brand new 1-hour link right now
            item["viewable_url"] = generate_presigned_viewable_url(s3_url)
        else:
            item["viewable_url"] = None
           
        updated_list.append(item)
    return updated_list    
 
class AllContractsListView(APIView):
    CACHE_KEY = "all_contracts_list"
    CACHE_TIMEOUT = 60 * 60 * 24 # 24 hours
 
    def get(self, request, *args, **kwargs):
        # 1. TRY TO GET FROM CACHE
        print("Checking cache for 'all_contracts_list'...")
        cached_results = cache.get(self.CACHE_KEY)
       
        if cached_results:
            print("✅ Cache HIT. Refreshing URLs and returning.")
            # THIS IS THE FIX: Re-sign the URLs before returning
            fresh_results = refresh_viewable_urls(cached_results)
            return Response({"results": fresh_results}, status=status.HTTP_200_OK)
 
        # 2. CACHE MISS: Run the slow query
        print("⚠️ Cache MISS. Running expensive query...")
        try:
            all_contracts = get_all_contracts(limit_per_collection=100000)
           
            formatted_results = [
                _format_contract_list_payload(record)
                for record in all_contracts
            ]
           
            # 3. SAVE TO CACHE
            # We save the results (urls might be valid now, but will expire in cache later)
            cache.set(self.CACHE_KEY, formatted_results, timeout=self.CACHE_TIMEOUT)
           
            return Response({"results": formatted_results}, status=status.HTTP_200_OK)
       
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )        
 
class AlertsRemindersView(APIView):
    CACHE_KEY = "alerts_reminders"
    CACHE_TIMEOUT = 60 * 30 # 30 minutes
   
    def get(self, request, *args, **kwargs):
        print("Checking cache for 'alerts_reminders'...")
        cached_data = cache.get(self.CACHE_KEY)
       
        if cached_data:
            print("✅ Cache HIT. Refreshing URLs...")
           
            # FIX: Refresh URLs for both lists inside the dictionary
            fresh_alerts = refresh_viewable_urls(cached_data.get('alerts', []))
            fresh_reminders = refresh_viewable_urls(cached_data.get('reminders', []))
           
            return Response({
                "alerts": fresh_alerts,
                "reminders": fresh_reminders
            }, status=status.HTTP_200_OK)
       
        # 2. CACHE MISS
        print("⚠️ Cache MISS. Running expensive query...")
        try:
            data = get_contract_alerts_and_reminders()
            cache.set(self.CACHE_KEY, data, timeout=self.CACHE_TIMEOUT)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Failed to fetch alerts", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
 
class ContractQnAView(APIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.bedrock_service = BedrockService()
        self.history_manager = ChatHistoryManager()
        self.RAG_CONTEXT_LIMIT = 4
        self.default_threshold = 0.3
        self.hybrid_threshold = 0.1
 
    def post(self, request, *args, **kwargs):
        natural_query = request.data.get('query', '')
        category = request.data.get('category', None)
        scoped_search = request.data.get('scoped_search', False)
        s3_urls = request.data.get('s3_urls', [])
 
        if not natural_query:
            return Response({'error': 'A query is required.'}, status=status.HTTP_400_BAD_REQUEST)
 
        # === SCOPED SEARCH LOGIC ===
        if scoped_search and s3_urls:
            print(f"🔍 Scoped search mode: Searching in {len(s3_urls)} selected documents")
            structured_answers = []
           
            try:
                for s3_url in s3_urls:
                    try:
                        print(f"   -> Processing: {s3_url}")
                       
                        raw_pdf_bytes = get_s3_bytes_from_url(s3_url)
                        full_text = ContractExtractor.extract_text_from_pdf_bytes(raw_pdf_bytes)
                       
                        if not full_text:
                            raise ValueError("Failed to extract text")
                       
                        answer = self.bedrock_service.get_answer_from_context(
                            context=full_text,
                            query=natural_query
                        )
                       
                        doc_name = s3_url.split('/')[-1].replace('.pdf', '')
                        viewable_url = generate_presigned_viewable_url(s3_url)
                       
                        structured_answers.append({
                            'id': str(uuid.uuid4()),
                            'source_name': doc_name,
                            's3_url': s3_url,
                            'viewable_url': viewable_url,
                            'answer': answer.strip()
                        })
                       
                        print(f"   ✅ Generated answer for: {doc_name}")
                       
                    except Exception as e:
                        print(f"   ❌ Error processing {s3_url}: {e}")
                        doc_name = s3_url.split('/')[-1].replace('.pdf', '')
                        try:
                            viewable_url = generate_presigned_viewable_url(s3_url)
                        except:
                            viewable_url = s3_url
                        structured_answers.append({
                            'id': str(uuid.uuid4()),
                            'source_name': doc_name,
                            's3_url': s3_url,
                            'viewable_url': viewable_url,
                            'answer': f"Error reading document: {e}"
                        })
               
                try:
                    user_id = str(request.user.id) if request.user.is_authenticated else "anonymous_user_session"
                    combined_answer = "\n\n".join([f"{a['source_name']}: {a['answer']}" for a in structured_answers])
                    self.history_manager.save_interaction(
                        user_id=user_id,
                        query=natural_query,
                        response=combined_answer
                    )
                except Exception as e:
                    print(f"⚠️ Failed to save chat history: {e}")
               
                return Response({
                    'results': structured_answers,
                    'scoped_search': True,
                    'documents_searched': len(s3_urls)
                }, status=status.HTTP_200_OK)
               
            except Exception as e:
                print(f"❌ Error in scoped search: {e}")
                return Response(
                    {'error': f'Scoped search failed: {e}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
       
        # === REGULAR SEARCH LOGIC ===
        try:
            plan = self.bedrock_service.get_search_plan(natural_query, category=category)
            semantic_query = plan.get('semantic_query', natural_query)
            payload_filters = plan.get('filters', {})
            search_threshold = self.default_threshold
 
            if payload_filters:
                print("   -> Filters found. Using *original* query for semantic vector.")
                semantic_query = natural_query
                search_threshold = self.hybrid_threshold
 
            target_collections = []
            if category and category in CONTRACT_CATEGORY_MAP:
                target_collections.append(CONTRACT_CATEGORY_MAP[category])
            else:
                target_collections = list(CONTRACT_CATEGORY_MAP.values())
 
            query_embedding = get_text_embedding(semantic_query)
            if not query_embedding:
                raise ValueError("Embedding service returned no vector.")
 
            must_conditions = [
                models.FieldCondition(key=key, match=models.MatchText(text=value))
                for key, value in payload_filters.items() if value
            ]
            qdrant_filter = models.Filter(must=must_conditions) if must_conditions else None
 
            all_results = []
            limit_per_collection = self.RAG_CONTEXT_LIMIT
 
            for collection in target_collections:
                print(f"\n🔎 Searching collection '{collection}'...")
                try:
                    collection_results = search_contracts(
                        collection_name=collection,
                        query_vector=query_embedding,
                        query_filter=qdrant_filter,
                        limit=limit_per_collection,
                        score_threshold=search_threshold
                    )
                    print(f"✅ Found {len(collection_results)} relevant results.")
                    all_results.extend(collection_results)
                except Exception as e:
                    print(f"⚠️ Failed to search collection {collection} (skipping): {e}")
 
            all_results.sort(key=lambda r: r.score, reverse=True)
            top_k_results = all_results[:self.RAG_CONTEXT_LIMIT]
 
            if not top_k_results:
                return Response({
                    'answer': "Sorry, I couldn't find any relevant documents to answer that question.",
                    'results': []
                }, status=status.HTTP_200_OK)
 
        except Exception as e:
            return Response({'error': f'Retrieval (search) step failed: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
        structured_answers = []
 
        print(f"--- Augmenting & Generating answers for {len(top_k_results)} documents ---")
 
        for result in top_k_results:
            if not hasattr(result, 'payload') or not result.payload:
                continue
 
            s3_url = result.payload.get('s3_url')
            doc_name = result.payload.get('file_name', s3_url)
 
            if not s3_url:
                continue
 
            try:
                print(f"   -> Processing doc: {doc_name}")
                raw_pdf_bytes = get_s3_bytes_from_url(s3_url)
                full_text = ContractExtractor.extract_text_from_pdf_bytes(raw_pdf_bytes)
 
                if not full_text:
                    raise ValueError("Fitz failed to extract any text from the S3 file.")
 
                answer_for_this_doc = self.bedrock_service.get_answer_from_context(
                    context=full_text,
                    query=natural_query
                )
 
                # ✅ ADDED: Generate viewable URL
                viewable_url = generate_presigned_viewable_url(s3_url)
 
                structured_answers.append({
                    'id': result.id,
                    'source_name': doc_name,
                    's3_url': s3_url,
                    'viewable_url': viewable_url,  # ✅ ADDED
                    'retrieval_score': round(result.score, 4),
                    'collection': result.payload.get('category'),
                    'answer': answer_for_this_doc.strip()
                })
 
            except Exception as e:
                print(f"❌ Failed to process {s3_url}: {e}")
               
                # ✅ ADDED: Generate viewable URL for errors
                try:
                    viewable_url = generate_presigned_viewable_url(s3_url)
                except:
                    viewable_url = s3_url
               
                structured_answers.append({
                    'id': result.id,
                    'source_name': doc_name,
                    's3_url': s3_url,
                    'viewable_url': viewable_url,  # ✅ ADDED
                    'retrieval_score': round(result.score, 4),
                    'collection': result.payload.get('category'),
                    'answer': f"Error reading document: {e}"
                })
 
        try:
            user_id = str(request.user.id) if request.user.is_authenticated else "anonymous_user_session"
            combined_answer = "\n\n".join([f"{a['source_name']}: {a['answer']}" for a in structured_answers])
            self.history_manager.save_interaction(
                user_id=user_id,
                query=natural_query,
                response=combined_answer
            )
        except Exception as e:
            print(f"⚠️ Failed to save chat history: {e}")
 
        return Response({'results': structured_answers}, status=status.HTTP_200_OK)
 
class DocumentChatView(APIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.bedrock_service = BedrockService()
        self.history_manager = ChatHistoryManager()
 
    def post(self, request, *args, **kwargs):
        query = request.data.get("query", "").strip()
        s3_url = request.data.get("viewable_url", "").strip()
 
        if not query or not s3_url:
            return Response(
                {"error": "Both 'query' and 's3_url' are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        print(f"--- 📄 Document Chat Query: '{query}' for doc: '{s3_url}' ---")
 
        try:
            raw_pdf_bytes = get_s3_bytes_from_url(s3_url)
            full_text = ContractExtractor.extract_text_from_pdf_bytes(raw_pdf_bytes)
 
            if not full_text:
                raise ValueError("Failed to extract text from the S3 file.")
 
            answer = self.bedrock_service.get_answer_from_context(
                context=full_text,
                query=query,
            )
 
            try:
                user_id = (
                    str(request.user.id)
                    if request.user and request.user.is_authenticated
                    else "anonymous_user_session"
                )
 
                self.history_manager.save_interaction(
                    user_id=user_id,
                    query=query,
                    response=answer,
                    doc_s3_url=s3_url,
                )
                print("✅ Document chat interaction saved successfully.")
            except Exception as save_err:
                print(f"⚠️ Failed to save document chat history: {save_err}")
 
            return Response(
                {
                    "answer": answer.strip(),
                    "query": query,
                    "viewable_url": s3_url,
                },
                status=status.HTTP_200_OK,
            )
 
        except Exception as e:
            print(f"❌ Error in DocumentChatView: {e}")
            return Response(
                {"error": f"Failed to get answer: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
 
class ChatHistoryView(APIView):
    def get(self, request):
        user_id = (
            str(request.user.id)
            if request.user and request.user.is_authenticated
            else "anonymous_user_session"
        )
 
        try:
            manager = ChatHistoryManager()
            history = manager.get_conversation(user_id, limit=None)
 
            if not history:
                return Response(
                    {"message": "No chat history found for this user."},
                    status=status.HTTP_200_OK,
                )
 
            print(f"📜 Retrieved {len(history)} chat entries for user {user_id}.")
            return Response(history, status=status.HTTP_200_OK)
 
        except Exception as e:
            print(f"❌ Failed to fetch chat history: {e}")
            return Response(
                {"error": f"Failed to fetch chat history: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
 
class ChatHistorySaveView(APIView):
    def post(self, request):
        data = request.data
        user_id = str(request.user.id) if request.user and request.user.is_authenticated else "anonymous_user_session"
 
        query = data.get("query")
        response_text = data.get("response")
        doc_s3_url = data.get("doc_s3_url", None)
 
        if not query or not response_text:
            return Response({"error": "Both 'query' and 'response' are required."}, status=status.HTTP_400_BAD_REQUEST)
 
        try:
            manager = ChatHistoryManager()
            manager.save_interaction(user_id, query, response_text, doc_s3_url)
            return Response({"message": "Chat interaction saved."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"Failed to save chat interaction: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
class ContractByCategoryView(APIView):
    CACHE_KEY_PREFIX = "contracts_list"
    CACHE_TIMEOUT = 60 * 60 * 24
   
    def get(self, request, category):
        if category not in CONTRACT_CATEGORY_MAP:
            return Response({"error": "Invalid category."}, status=400)
           
        cache_key = f"{self.CACHE_KEY_PREFIX}_{category}"
 
        # 1. TRY TO GET FROM CACHE
        print(f"Checking cache for '{cache_key}'...")
        cached_results = cache.get(cache_key)
       
        if cached_results:
            print("✅ Cache HIT. Refreshing URLs...")
            # FIX: Refresh URLs
            fresh_results = refresh_viewable_urls(cached_results)
            return Response({"category": category, "results": fresh_results}, status=200)
 
        # 2. CACHE MISS
        print(f"⚠️ Cache MISS. Running expensive query for '{category}'...")
        try:
            collection_name = CONTRACT_CATEGORY_MAP[category]
            contracts = get_contracts_by_collection(collection_name)
 
            formatted_results = [_format_contract_list_payload(record) for record in contracts]
           
            cache.set(cache_key, formatted_results, timeout=self.CACHE_TIMEOUT)
           
            return Response({"category": category, "results": formatted_results}, status=200)
 
        except Exception as e:
            return Response({"error": f"Failed to fetch contracts: {e}"}, status=500)
       
class SetupQdrantView(APIView):
    def get(self, request):
        try:
            result = setup_qdrant_collections()
            return Response({
                "message": "✅ Qdrant setup completed successfully.",
                "details": result
            }, status=200)
        except Exception as e:
            return Response({
                "error": f"❌ Failed to set up Qdrant: {str(e)}"
            }, status=500)
 
class DocumentChatHistoryView(APIView):
    def get(self, request):
        user_id = str(request.user.id) if request.user.is_authenticated else "anonymous_user_session"
        doc_name = request.query_params.get('doc_name', None)
 
        if not doc_name:
            return Response({"error": "Please provide a doc_name parameter."}, status=400)
 
        try:
            manager = ChatHistoryManager()
            history = manager.get_conversation(user_id, limit=None)
           
            if not history:
                return Response({"message": "No chat history found."}, status=200)
 
            doc_chats = []
            for record in history:
                chat_with_doc = record.get("chat_with_doc", {})
                for key, value in chat_with_doc.items():
                    if doc_name.lower() in key.lower():
                        doc_chats.append({
                            "doc_key": key,
                            "query": value.get("query"),
                            "response": value.get("response"),
                            "timestamp": value.get("timestamp")
                        })
 
            if not doc_chats:
                return Response({"message": f"No chats found for document '{doc_name}'."}, status=200)
 
            return Response({"document": doc_name, "chats": doc_chats}, status=200)
 
        except Exception as e:
            return Response({"error": f"Failed to fetch document chat history: {e}"}, status=500)
 
@api_view(['POST'])
def summarize_multiple_documents(request):
    """
    Summarize multiple documents by their S3 URLs
    """
    try:
        data = request.data
        s3_urls = data.get('s3_urls', [])
       
        if not s3_urls or len(s3_urls) == 0:
            return Response(
                {"error": "No S3 URLs provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
       
        print(f"📄 Summarizing {len(s3_urls)} documents...")
       
        all_contents = []
        doc_names = []
       
        for s3_url in s3_urls:
            try:
                print(f"   -> Processing: {s3_url}")
               
                pdf_bytes = get_s3_bytes_from_url(s3_url)
                full_text = ContractExtractor.extract_text_from_pdf_bytes(pdf_bytes)
               
                if full_text:
                    all_contents.append(full_text)
                   
                    doc_name = s3_url.split('/')[-1].replace('.pdf', '')
                    doc_names.append(doc_name)
                   
                    print(f"   ✅ Successfully extracted text from: {doc_name}")
                else:
                    print(f"   ⚠️ No text extracted from: {s3_url}")
               
            except Exception as e:
                print(f"   ❌ Error processing {s3_url}: {str(e)}")
                continue
       
        if not all_contents:
            return Response(
                {"error": "Could not extract content from any documents"},
                status=status.HTTP_400_BAD_REQUEST
            )
       
        print(f"✅ Successfully processed {len(all_contents)} documents")
       
        combined_text = "\n\n=== DOCUMENT SEPARATOR ===\n\n".join(
            [f"Document {i+1}: {name}\n\n{content[:5000]}"
             for i, (name, content) in enumerate(zip(doc_names, all_contents))]
        )
       
        try:
            bedrock_service = BedrockService()
           
            summary = bedrock_service.get_answer_from_context(
                context=combined_text,
                query="Please provide a comprehensive summary of all these documents."
            )
           
            print("✅ Summary generated successfully")
           
            return Response({
                "summary": summary,
                "documents_processed": len(all_contents),
                "document_names": doc_names
            }, status=status.HTTP_200_OK)
           
        except Exception as e:
            print(f"❌ Error generating summary: {str(e)}")
            return Response(
                {"error": f"Failed to generate summary: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
       
    except Exception as e:
        print(f"❌ Error in summarize_multiple_documents: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
 
 