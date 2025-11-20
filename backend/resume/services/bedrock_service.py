# services/bedrock_service.py
import boto3
import json
import re
from django.conf import settings
from botocore.exceptions import ClientError

# --- All possible filter keys from your CATEGORY_FIELDS ---
# We tell Bedrock these are the only keys it can use
ALL_FILTER_KEYS = [
    "lender_name", "borrower_name", "loan_amount", "interest_rate",
    "disclosing_party", "receiving_party", "effective_date",
    "employer_name", "employee_name", "job_title", "start_date",
    "end_date", "salary", "renewal_date"
]

# --- 1. Define fields for EACH category ---
# --- 1. Add "category" to each list (MUST MATCH qdrant_service.py) ---
CATEGORY_SPECIFIC_FIELDS = {
    'loan_agreement': [
        "lender_name", "borrower_name", "loan_amount", "interest_rate", "renewal_date", "category"
    ],
    'nda': [
        "disclosing_party", "receiving_party", "effective_date", "category"
    ],
    'employee_contract': [
        "employer_name", "employee_name", "job_title", "start_date", "end_date", "salary", "category"
    ]
}

# --- 2. Create the list of ALL keys from the map ---
ALL_FILTER_KEYS = list(set(
    key for keys_list in CATEGORY_SPECIFIC_FIELDS.values() for key in keys_list
))

class BedrockService:
    
    def __init__(self):
        """
        Initialize the Bedrock client
        """
        self.region_name = getattr(settings, 'AWS_REGION_BEDROCK', 'us-east-1')
        try:
            self.bedrock_runtime = boto3.client(
                'bedrock-runtime',
                region_name=self.region_name,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
        except AttributeError:
            raise Exception("FATAL ERROR: AWS keys not found in Django settings.")
        except ClientError as e:
            raise Exception(f"FATAL ERROR: Could not connect to Bedrock: {e}")

    def get_search_plan(self, natural_query: str, category: str = None):
        """
        Calls Bedrock (LLAMA 3) to convert a natural query into a structured
        JSON search plan (semantic_query + filters).
        
        If a 'category' is provided, it restricts the LLM to *only*
        the keys for that category.
        """
        print(f"Calling Bedrock Router (Llama 3) for query: '{natural_query}'")
        
        # --- 4. Dynamically choose which keys to allow ---
        if category and category in CATEGORY_SPECIFIC_FIELDS:
            allowed_keys = CATEGORY_SPECIFIC_FIELDS[category]
            print(f"   -> Planning for *specific* category: {category}")
        else:
            allowed_keys = ALL_FILTER_KEYS
            print(f"   -> Planning for *general* search (all categories)")

        system_prompt = (
            "You are a query analysis engine. Your job is to convert a user's"
            " natural language query into a JSON object with two keys:"
            " 1. `semantic_query`: The core *meaning* of the question."
            " 2. `filters`: A JSON object of key-value pairs to filter the payload."
            " Respond *only* with the valid JSON object and nothing else."
            f" The *only* allowed keys for the `filters` object are: {', '.join(allowed_keys)}."
            " If a key is not mentioned, do not include it in the filters."
            " **CRITICAL RULE:** If the user mentions a document type like 'loan agreement', 'nda', or 'employee contract',"
            " you *must* use the `category` key for filtering (e.g., `\"category\": \"loan_agreement\"`)."
            " Do *not* invent keys like 'document_type'."        )

        user_prompt = f"""
        **Guideline:** Do not use invented keys. Use *only* the allowed keys.

        Example 1 (Good):
        Query: "What are the termination clauses in the employee contract for John Doe?"
        Response:
        {{
            "semantic_query": "contract termination clauses",
            "filters": {{
                "employee_name": "John Doe",
                "category": "employee_contract"
            }}
        }}

        Example 2 (Good):
        Query: "Find me all NDAs with GreenLeaf Enterprises"
        Response:
        {{
            "semantic_query": "NDA contracts with GreenLeaf Enterprises",
            "filters": {{
                "disclosing_party": "GreenLeaf Enterprises",
                "category": "nda"
            }}
        }}
        
        Example 3 (NEW - Good):
        Query: "What is the usual interest rate for loan agreements?"
        Response:
        {{
            "semantic_query": "usual interest rate for loan agreements",
            "filters": {{
                "category": "loan_agreement"
            }}
        }}

        Example 4 (Bad - What to avoid):
        Query: "What is the usual interest rate for loan agreements?"
        Response:
        {{
            "semantic_query": "usual interest rate for loan agreements",
            "filters": {{
                "document_type": "loan agreement"
            }}
        }}

        ---
        Now, process this query:
        Query: "{natural_query}"
        Response:
        """

        model_id = 'meta.llama3-70b-instruct-v1:0' 
        # ... (rest of the function is unchanged) ...
        body = json.dumps({
            "prompt": f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{user_prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
            "max_gen_len": 2048,
            "temperature": 0.1,
            "top_p": 0.9,
        })
        try:
            response = self.bedrock_runtime.invoke_model(body=body, modelId=model_id)
            response_body = json.loads(response['body'].read())
            json_plan_str = response_body['generation']
            
            start = json_plan_str.find('{')
            end = json_plan_str.rfind('}')
            if start != -1 and end != -1:
                json_plan_str = json_plan_str[start:end+1]
            
            json_plan_str = re.sub(r",\s*([}\]])", r"\1", json_plan_str)
            print(f"Bedrock search plan: {json_plan_str}")
            return json.loads(json_plan_str)
        except Exception as e:
            print(f"Error calling Bedrock router: {e}")
            return {"semantic_query": natural_query, "filters": {}}                
        
    def get_answer_from_context(self, context: str, query: str) -> str:
        """
        Calls Bedrock (Llama 3 70B) to answer a query based *only* on the provided context.
        """
        print(f"Calling Bedrock RAG (Llama 3-70b) for query: '{query}'")
        
        # This system prompt is CRITICAL for grounding the model.
        system_prompt = (
            "You are an expert contract analysis assistant. You must answer the user's question based"
            " *only* on the text from the contract(s) provided in the context."
            " Do not make up information, infer, or use any external knowledge."
            " If the answer is not found in the provided context, you *must* state:"
            " Be concise and directly answer the question."
        )
        
        user_prompt = f"""
        **Context:**
        {context}
        
        ---
        **Question:**
        {query}
        """

        # We use the 8B model here. It's fast and excellent for RAG.
        model_id = 'meta.llama3-70b-instruct-v1:0'
        
        body = json.dumps({
            "prompt": f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{user_prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
            "max_gen_len": 1024,
            "temperature": 0.1, # Low temp for factual, grounded answers
            "top_p": 0.9,
        })
        
        try:
            response = self.bedrock_runtime.invoke_model(
                body=body,
                modelId=model_id,
                contentType='application/json',
                accept='application/json'
            )
            
            response_body = json.loads(response.get('body').read())
            answer = response_body.get('generation')
            
            return answer.strip() # Return the clean text answer
        
        except Exception as e:
            print(f"Error invoking Llama 3 for RAG: {e}")
            raise e        

