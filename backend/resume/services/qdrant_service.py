import os
import uuid
from qdrant_client import QdrantClient, models
from qdrant_client.http.models import PointStruct
import time
from datetime import date, timedelta, datetime
from typing import List, Dict, Any, Union
from dotenv import load_dotenv
import os
from .s3_service import generate_presigned_viewable_url

load_dotenv()

ALERT_MAX_DAYS = 20         # 0-20 days
REMINDER_MIN_DAYS = 21      # 21-60 days (1 day after alert window ends)
REMINDER_MAX_DAYS = 60      # 60 days
LOAN_PAYMENT_ALERT_DAYS = 5 # Monthly alert: 5 days before due date

COLLECTION_NAMES = ["loan_agreements", "ndas", "employee_contracts"]

CONTRACT_CATEGORY_MAP = {
    'loan_agreement': 'loan_agreements',
    'nda': 'ndas',
    'employee_contract': 'employee_contracts',
}
ALL_COLLECTION_NAMES = list(CONTRACT_CATEGORY_MAP.values())

DATE_FIELD_MAP = {
    "employee_contracts": {"end_date": "END_DATE", "renewal_date": "RENEWAL"},
    "loan_agreements": {"due_date": "LOAN_DUE"},
    "ndas": {"end_date": "END_DATE"},
}

QDRANT_CLUSTER_URL = os.getenv("QDRANT_CLUSTER_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

VECTOR_SIZE = 384

COLLECTION_FIELDS = {
    'loan_agreements': [
        "lender_name", "borrower_name", "loan_amount", "interest_rate", "due_date", "category",
    ],
    'ndas': [
        "disclosing_party", "receiving_party", "effective_date", "category"
    ],
    'employee_contracts': [
        "employer_name", "employee_name", "job_title", "start_date", "end_date", "salary", "renewal_date", "category"
    ]
}

try:
    qdrant_client = QdrantClient(url=QDRANT_CLUSTER_URL, api_key=QDRANT_API_KEY)
    print("🚀 Successfully connected to Qdrant.")
except Exception as e:
    print(f"❌ Failed to connect to Qdrant: {e}")
    qdrant_client = None

COLLECTION_NAMES = ["loan_agreements", "ndas", "employee_contracts"]

def initialize_qdrant_collections():
    if not qdrant_client:
        print("❌ Qdrant client not available. Skipping collection initialization.")
        return

    print("\nVerifying Qdrant collections...")
    for collection_name in COLLECTION_NAMES:
        try:
            qdrant_client.get_collection(collection_name=collection_name)
            print(f"✅ Collection '{collection_name}' already exists.")
        except Exception:
            print(f"⚠️ Collection '{collection_name}' not found. Creating it now...")
            try:
                qdrant_client.create_collection(
                    collection_name=collection_name,
                    vectors_config=models.VectorParams(size=VECTOR_SIZE, distance=models.Distance.COSINE)
                )
                print(f"✅ Collection '{collection_name}' created successfully.")
            except Exception as e:
                print(f"❌ Could not create collection '{collection_name}': {e}")

initialize_qdrant_collections()

def get_qdrant_client():
    client = QdrantClient(
        url=QDRANT_CLUSTER_URL,
        api_key=QDRANT_API_KEY
    )
    return client

def setup_qdrant_collections():
    client = get_qdrant_client()
    vector_size = 1024

    try:
        collections_response = client.get_collections()
        existing_collections = [col.name for col in collections_response.collections]
        print(f"Qdrant has existing collections: {existing_collections}")
    except Exception as e:
        print(f"❌ ERROR: Could not get collections from Qdrant: {e}")
        return

    for collection_name, fields in COLLECTION_FIELDS.items():
        print(f"\n--- Processing Collection: {collection_name} ---")
        try:
            if collection_name not in existing_collections:
                print(f"Collection '{collection_name}' not found. Creating...")
                client.create_collection(
                    collection_name=collection_name,
                    vectors_config=models.VectorParams(
                        size=vector_size, 
                        distance=models.Distance.COSINE
                    ),
                )
                print(f"✅ Collection '{collection_name}' created.")
                print("   -> Waiting 1s for collection to initialize...")
                time.sleep(1) 
            else:
                print(f"✅ Collection '{collection_name}' already exists. Skipping creation.")

            print(f"   -> Creating/updating indexes for '{collection_name}'...")
            for field in fields:
                try:
                    if field == 'category':
                        schema_type = models.PayloadSchemaType.KEYWORD
                        index_type = "keyword"
                    else:
                        schema_type = models.TextIndexParams(
                            type="text",
                            tokenizer=models.TokenizerType.WORD,
                            min_token_len=2,
                            max_token_len=15,
                            lowercase=True
                        )
                        index_type = "text"

                    client.create_payload_index(
                        collection_name=collection_name,
                        field_name=field,
                        field_schema=schema_type
                    )
                    print(f"     -> ✅ Index for '{field}' ({index_type}) created or already exists.")
                    
                except Exception as ie:
                    if "already exists with different parameters" in str(ie):
                        print(f"     -> ⚠️ Index for '{field}' exists with different params. Recreating...")
                        client.delete_payload_index(collection_name=collection_name, field_name=field)
                        time.sleep(0.5)
                        client.create_payload_index(
                            collection_name=collection_name,
                            field_name=field,
                            field_schema=schema_type
                        )
                        print(f"     -> ✅ Index for '{field}' ({index_type}) RECREATED.")
                    elif "already exists" in str(ie):
                         print(f"     -> ✅ Index for '{field}' ({index_type}) already exists.")
                    else:
                        print(f"     -> ❌ FAILED to create index for '{field}': {ie}")

        except Exception as e:
            print(f"❌ FAILED to process collection {collection_name}: {e}")

def upsert_contract(collection_name: str, point_id: str, vector: list[float], metadata: dict):
    if not qdrant_client:
        raise ConnectionError("Qdrant client is not connected.")

    if collection_name not in COLLECTION_NAMES:
        raise ValueError(f"'{collection_name}' is not a valid collection name.")
    
    if not vector or len(vector) != VECTOR_SIZE:
        raise ValueError(f"Embedding size mismatch for point ID {point_id}")

    try:
        qdrant_client.upsert(
            collection_name=collection_name,
            points=[PointStruct(id=point_id, vector=vector, payload=metadata)],
            wait=True
        )
        print(f"✅ Successfully upserted point {point_id} into collection '{collection_name}'.")
    except Exception as e:
        print(f"❌ Failed to upsert point {point_id} into '{collection_name}': {e}")
        raise

def search_contracts(
    collection_name: str,
    query_vector: list[float], 
    query_filter: models.Filter = None, 
    limit: int = 100, 
    score_threshold: float = 0.30
):
    if not query_vector or len(query_vector) != VECTOR_SIZE:
        raise ValueError(f"Invalid query vector size: {len(query_vector)} (expected {VECTOR_SIZE})")

    print(f"\n🔎 Searching collection '{collection_name}'...")
    try:
        results = qdrant_client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            query_filter=query_filter,
            limit=limit,
            with_payload=True,
            score_threshold=score_threshold,
        )
        confident_results = [r for r in results if r.score and r.score >= score_threshold]
        if not confident_results:
            print(f"⚠️ No results met the minimum score of {score_threshold}.")
            return results 
        print(f"✅ Found {len(confident_results)} relevant results.")
        return confident_results
    except Exception as e:
        print(f"❌ Search failed inside Qdrant: {e}")
        raise RuntimeError(f"Qdrant search error: {e}")

def get_contracts_by_collection(collection_name: str, limit: int = 100):
    print(f"\n📄 Fetching up to {limit} contracts from '{collection_name}'...")
    try:
        if not qdrant_client.collection_exists(collection_name):
             print(f"⚠️ Collection '{collection_name}' does not exist. Skipping.")
             return []

        records, _ = qdrant_client.scroll(
            collection_name=collection_name,
            limit=limit,
            with_payload=True,
            with_vectors=False
        )
        print(f"✅ Fetched {len(records)} records from '{collection_name}'.")
        return records
    except Exception as e:
        print(f"❌ Failed to scroll collection '{collection_name}': {e}")
        return []

def get_all_contracts(limit_per_collection: int = 50):
    print(f"\n📄 Fetching up to {limit_per_collection} contracts from ALL collections...")
    all_records = []
    for collection_name in ALL_COLLECTION_NAMES:
        records = get_contracts_by_collection(
            collection_name=collection_name,
            limit=limit_per_collection
        )
        for r in records:
            r.payload['found_in_collection'] = collection_name
        all_records.extend(records)
    print(f"✅ Fetched a total of {len(all_records)} records from all collections.")
    return all_records

def setup_qdrant_collections():
    client = get_qdrant_client()
    print("\nRunning full Qdrant setup (collections and indexes)...")
    date_fields_to_index = []
    for fields in COLLECTION_FIELDS.values():
        for field in fields:
            if field.endswith('_date') or field == 'due_date':
                date_fields_to_index.append(field)

    for collection_name in COLLECTION_NAMES:
        print(f"-> Indexing date fields for collection: {collection_name}")
        for date_field in date_fields_to_index:
            try:
                client.create_payload_index(
                    collection_name=collection_name,
                    field_name=date_field,
                    field_schema=models.PayloadSchemaType.KEYWORD
                )
                print(f"   ✅ Index created for '{date_field}' as KEYWORD.")
            except Exception as e:
                if "already exists" in str(e):
                    print(f"   ⚠️ Index for '{date_field}' already exists. Continuing.")
                else:
                    print(f"   ❌ FAILED to create index for '{date_field}': {e}")
    return True

def get_all_points_with_dates(client: QdrantClient, collection_name: str, date_field: str):
    all_points = []
    exists_filter = models.Filter(
        must_not=[
            models.IsNullCondition(
                is_null=models.PayloadField(key=date_field)
            )
        ]
    )

    try:
        points, _ = client.scroll(
            collection_name=collection_name,
            scroll_filter=exists_filter,
            limit=5000,
            with_payload=True
        )
        all_points.extend(points)
        return all_points
    except Exception as e:
        print(f"Error scrolling {collection_name} for date field {date_field}: {e}")
        raise e

def _convert_mm_dd_yyyy_to_date(date_str: str) -> Union[date, None]:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str.split(' ')[0].split('T')[0], "%m/%d/%Y").date()
    except ValueError:
        return None

def _format_contract_payload(point: Any, date_field: str, type_key: str, collection: str) -> Dict[str, Any]:
    payload = point.payload
    date_str = payload.get(date_field)

    days_left = -1
    if date_str:
        try:
            expiry_date = _convert_mm_dd_yyyy_to_date(date_str)
            if expiry_date:
                days_left = (expiry_date - date.today()).days
        except Exception:
            pass

    title = (
        payload.get("employee_name") or
        payload.get("borrower_name") or
        payload.get("receiving_party") or
        payload.get("vendor_name") or
        f"Contract ID: {point.id}"
    )
    s3_url = payload.get("s3_url")
    viewable_url = s3_url
    if s3_url:
        try:
            viewable_url = generate_presigned_viewable_url(s3_url)
        except Exception as e:
            print(f"⚠️ Failed to generate presigned URL for alert: {e}")
            viewable_url = s3_url

    return {
        "id": point.id,
        "title": title,
        "daysLeft": days_left,
        "date": date_str or 'N/A',
        "type": type_key.lower().replace('_', '-'),
        "collection": collection,
        "s3_url": s3_url,
        "viewable_url": viewable_url        
    }

# --- THIS FUNCTION IS UPDATED TO FIX REMINDERS ---
def get_contract_alerts_and_reminders() -> Dict[str, List[Dict[str, Any]]]:
    """
    Queries Qdrant collections for all contracts with date fields and
    categorizes them into alerts (0-20 days) and reminders (21-60 days) in Python.
    """
    client = get_qdrant_client()
    alerts: List[Dict[str, Any]] = []
    reminders: List[Dict[str, Any]] = []
    processed_ids = set()

    contracts_to_check = []

    # Collect all contracts with relevant date fields
    for collection_name, field_map in DATE_FIELD_MAP.items():
        for date_field, type_key in field_map.items():
            points = get_all_points_with_dates(client, collection_name, date_field)
            for point in points:
                contract_key = (collection_name, point.id)
                if contract_key in processed_ids:
                    continue
                contract_data = _format_contract_payload(point, date_field, type_key, collection_name)
                if contract_data['daysLeft'] >= 0:
                    contracts_to_check.append(contract_data)
                    processed_ids.add(contract_key)

    # --- FIXED LOGIC BELOW: populate alerts and reminders correctly ---
    for contract in contracts_to_check:
        days_left = contract['daysLeft']

        # Specialized Loan Alert Logic (5 days before due date)
        if contract['collection'] == "loan_agreements" and contract['type'] == 'loan-due':
            if 0 <= days_left <= LOAN_PAYMENT_ALERT_DAYS:
                alerts.append(contract)
                continue

        # Standard Alert Logic (0-20 Days)
        if 0 <= days_left <= ALERT_MAX_DAYS:
            alerts.append(contract)

        # Standard Reminder Logic (21-60 Days)
        elif REMINDER_MIN_DAYS <= days_left <= REMINDER_MAX_DAYS:
            reminders.append(contract)

    alerts.sort(key=lambda x: x['daysLeft'])
    reminders.sort(key=lambda x: x['daysLeft'])

    return {
        "alerts": alerts,
        "reminders": reminders
    }

initialize_qdrant_collections()
