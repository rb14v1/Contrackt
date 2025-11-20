# services/extract_data.py
import boto3
import json
import io
import re
import fitz  # PyMuPDF
from django.conf import settings
from botocore.exceptions import ClientError

class ContractExtractor:
    
    # --- 1. Schema (PLURAL keys) ---
# services/extract_data.py

    # --- 1. Schema (PLURAL keys) ---
    CATEGORY_FIELDS = {
        'loan_agreements': [
            "lender_name", "borrower_name", "loan_amount", "interest_rate", "due_date",
        ],
        'ndas': [
            "disclosing_party", "receiving_party", "effective_date"
        ],
        'employee_contracts': [
            "employer_name", "employee_name", "job_title", "start_date", "end_date", "salary", "renewal_date"
        ]
    }
    
    
    # --- 2. 🔥 ADD THIS MAP (Singular to Plural) ---
    CATEGORY_TO_COLLECTION_MAP = {
        'loan_agreement': 'loan_agreements',
        'nda': 'ndas',
        'employee_contract': 'employee_contracts',
    }

    def __init__(self):
        """
        Initialize *only* the Bedrock client, since Textract is gone.
        """
        self.region_name = getattr(settings, 'AWS_REGION_BEDROCK', 'us-east-1')
        try:
            # We only need the Bedrock runtime
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

    # --- 3. 🔥 UPDATED 'process_contract' ---
    def process_contract(self, file_buffer: io.BytesIO, category: str, s3_url: str):
        """
        Main function to run the full extraction pipeline.
        1. Extract text with Fitz
        2. Extract data with Bedrock
        3. Build the final payload
        """
        print(f"Processing contract with category: {category}") # 'employee_contract' (singular)
        
        # --- ADD THIS LOOKUP ---
        collection_name = self.CATEGORY_TO_COLLECTION_MAP.get(category)
        if not collection_name:
            raise ValueError(f"Invalid category key provided: {category}")
        print(f"   -> Mapped to collection: {collection_name}") # 'employee_contracts' (plural)

        # 1. NEW: Use Fitz to get text
        contract_text = self._extract_text_with_fitz(file_buffer)
        if not contract_text:
            raise ValueError("Fitz (PyMuPDF) failed to extract any text.")
            
        # 2. KEPT: Use Bedrock, but pass the PLURAL collection_name
        extracted_data = self._extract_data_with_bedrock(contract_text, collection_name)
        
        # 3. MOVED: Build the final payload
        #    Pass BOTH names: singular 'category' and plural 'collection_name'
        payload = self._build_payload(category, collection_name, s3_url, extracted_data, contract_text)
        
        # Return both, since the view needs the raw text for embedding
        return payload, contract_text

    def _extract_text_with_fitz(self, file_buffer: io.BytesIO):
        """
        REPLACES TEXTRACT:
        Uses Fitz (PyMuPDF) to extract text directly from the file buffer.
        """
        print("Starting text extraction with Fitz (PyMuPDF)...")
        full_text = ""
        try:
            # Ensure the buffer pointer is at the beginning
            file_buffer.seek(0) 
            
            # --- THIS IS THE CORRECTED LINE ---
            # 'file_type' was renamed to 'filetype'
            with fitz.open(stream=file_buffer, filetype="pdf") as doc:
                for page in doc:
                    full_text += page.get_text()            
            if not full_text:
                print("⚠️ Fitz ran but extracted no text. Check if PDF is image-based.")
            
            print("Fitz text extraction successful.")
            return full_text
        
        except Exception as e:
            # --- THIS IS THE CRITICAL CHANGE ---
            # Now, instead of failing silently, it will tell you *why*
            print(f"❌ Error during Fitz extraction: {e}")
            print("   This might be a corrupted file, a non-PDF file, or a broken install.")
            return None # Return None on failure
        
    # --- 4. 🔥 UPDATED '_extract_data_with_bedrock' ---
    #    Renamed 'category' param to 'collection_name' for clarity
    def _extract_data_with_bedrock(self, contract_text, collection_name):
        """
        Uses AWS Bedrock (Llama 3 70B) to extract structured data.
        """
        print(f"Calling Bedrock (Llama 3 70B) to extract data for collection: {collection_name}")
        
        # --- THIS LOOKUP NOW WORKS ---
        fields_to_extract = self.CATEGORY_FIELDS.get(collection_name) # Uses 'employee_contracts'
        
        if not fields_to_extract:
            print("No fields defined. Skipping Bedrock extraction.")
            return {}

        system_prompt = (
            "You are an expert legal contract analysis engine. "
            "Your job is to read a contract and extract specific data fields. "
            "You must respond *only* with a valid JSON object. "
            "The keys in your JSON response MUST exactly match the keys requested. "
            "If a piece of data is impossible to find, its value must be null."
        )
        
        user_prompt = f"""
        Analyze the following contract text.
        
        Extract the data for these *exact* JSON keys: {', '.join(fields_to_extract)}

        **CRITICAL INSTRUCTIONS:**
        You *must* map concepts, even if the wording is different. For example:
        - If I ask for "receiving_party" or "borrower_name", you should look for "Client", "The Company", "Buyer", or "Borrower".
        - If I ask for "disclosing_party" or "lender_name", you should look for "Service Provider", "Consultant", "Seller", or "Lender".
        - If I ask for "effective_date", you should look for "commencement date", "start date", or the main date of the agreement.
        - If I ask for "due_date", you should look for "maturity date", "repayment date", or "final payment due".
        
        Find the most logical value from the text for each requested key.

        Contract Text (first 4000 chars):
        ---
        {contract_text[:4000]} 
        ---
        
        Return *only* the JSON object.
        """
        
        model_id = 'meta.llama3-70b-instruct-v1:0'

        body = json.dumps({
            "prompt": f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{user_prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
            "max_gen_len": 2048,
            "temperature": 0.1,
            "top_p": 0.9,
        })

        try:
            response = self.bedrock_runtime.invoke_model(
                body=body,
                modelId=model_id,
                contentType='application/json',
                accept='application/json'
            )
            
            response_body = json.loads(response['body'].read())
            extracted_json_string = response_body['generation']
            
            if "```json" in extracted_json_string:
                extracted_json_string = extracted_json_string.split("```json")[1].split("```")[0].strip()
            
            start = extracted_json_string.find('{')
            end = extracted_json_string.rfind('}')
            if start != -1 and end != -1:
                extracted_json_string = extracted_json_string[start:end+1]

            extracted_json_string = re.sub(r",\s*([}\]])", r"\1", extracted_json_string)

            print("Bedrock call successful.")
            return json.loads(extracted_json_string)
        
        except Exception as e:
            print(f"Error calling Bedrock or parsing JSON: {e}")
            return {}
        
    # --- 5. 🔥 UPDATED '_build_payload' ---
    #    It now takes BOTH names
    def _build_payload(self, category, collection_name, s3_url, extracted_data, contract_text):
        """
        MOVED FROM VIEW:
        Builds the final JSON payload for Qdrant.
        """
        payload = {
            "s3_url": s3_url,
            "contract_text": contract_text, # For full-text search / embedding
            "category": category # <-- Saves the SINGULAR name ('employee_contract')
        }
        
        # --- THIS LOOKUP NOW WORKS ---
        #     Uses the PLURAL name for the field lookup
        fields_to_add = self.CATEGORY_FIELDS.get(collection_name, []) 
        
        for field in fields_to_add:
            payload[field] = extracted_data.get(field) 
        
        print(f"   -> Payload built with {len(fields_to_add)} extra fields.")
        return payload
    
    # This function is not part of the class, but was in your file
    # Adding it back to be complete.
    def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
        """
        Opens a PDF from in-memory bytes and extracts all text using Fitz.
        """
        full_text = ""
        try:
            # Open the PDF from a byte stream
            pdf_stream = io.BytesIO(pdf_bytes)
            doc = fitz.open(stream=pdf_stream, filetype="pdf")
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                full_text += page.get_text()
            
            doc.close()
            print(f"Successfully extracted {len(full_text)} chars from PDF bytes.")
            return full_text
            
        except Exception as e:
            print(f"❌ FATAL: Error extracting text from PDF bytes: {e}")
            # Return an error message so it's obvious in the context
            return f"Error: Could not parse PDF content. {e}"