import boto3
import uuid
from django.conf import settings
from botocore.exceptions import ClientError
from urllib.parse import urlparse
import io # Make sure to import io

def get_s3_client():
    """
    Initializes and returns an S3 client.
    Consolidates client creation logic.
    """
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION_NAME
        )
        return s3_client
    except AttributeError:
        print("❌ ERROR: Make sure AWS keys, region, and bucket name are in your settings.py.")
        raise # Re-raise the exception
    except ClientError as e:
        print(f"❌ ERROR: Could not connect to S3: {e}")
        raise # Re-raise the exception

# --- 1. NEW SIGNATURE ---
# It now accepts bucket_name and file_key from the view
def upload_contract_to_s3(file_buffer: io.BytesIO, bucket_name: str, file_key: str, content_type: str):
    """
    Uploads a file buffer from a Django request to your S3 bucket.
    The bucket name and object key are provided by the caller.

    Args:
        file_buffer (io.BytesIO): The in-memory binary file.
        bucket_name (str): The S3 bucket to upload to (from settings).
        file_key (str): The full S3 object key (e.g., "contracts/uuid.pdf").
        content_type (str): The MIME type (e.g., "application/pdf").

    Returns:
        str: The S3 URI (s3://...) of the uploaded file, or None if fails.
    """
    # 1. Initialize S3 client (this part was perfect)
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION_NAME
        )
    except AttributeError:
        print("❌ ERROR: Make sure AWS keys, region, and bucket name are in your settings.py.")
        return None

    # --- 2. LOGIC REMOVED ---
    # The file_key (object_key) generation is now done in the view,
    # so we remove that logic from here.

    print(f"\n📤 Uploading to S3 bucket '{bucket_name}'...")
    print(f"   -> S3 Key: {file_key}")

    # 3. Reset the file pointer (good practice)
    file_buffer.seek(0)

    try:
        # 4. Upload the file object
        s3_client.upload_fileobj(
            Fileobj=file_buffer,
            Bucket=bucket_name, # <-- Uses the parameter
            Key=file_key,       # <-- Uses the parameter
            ExtraArgs={
                'ContentType': content_type,
            }
        )

        # --- 5. CRITICAL CHANGE: Return S3 URI ---
        # We return the s3:// URI, not the https:// URL.
        # This is what AWS Textract needs to find the file.
        s3_uri = f"s3://{bucket_name}/{file_key}"
        print(f"✅ Upload successful! S3 URI: {s3_uri}")
        return s3_uri

    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        print(f"❌ S3 Upload Failed. Error Code: {error_code}")
        return None
    except Exception as e:
        print(f"❌ An unexpected error occurred during upload: {e}")
        return None

def get_s3_bytes_from_url(s3_url: str) -> bytes:
    """
    Downloads the raw binary content (bytes) from a given S3 URL.
    
    Expects an s3_url like "s3://bucket-name/path/to/key.pdf"
    """
    try:
        s3_client = get_s3_client()
    except Exception as e:
        print(f"FATAL: Could not initialize S3 client: {e}")
        raise e

    try:
        # Parse the S3 URL
        parsed_url = urlparse(s3_url)
        bucket_name = parsed_url.netloc
        object_key = parsed_url.path.lstrip('/')
        
        if not bucket_name or not object_key:
            raise ValueError(f"Invalid S3 URL format: {s3_url}")

        print(f"Fetching s3://{bucket_name}/{object_key}")
        
        # Get the object from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        
        # Read and return the raw bytes
        content = response['Body'].read()
        return content
    
    except ClientError as e:
        print(f"FATAL: Failed to get content from {s3_url}. Error: {e}")
        raise e 
    except Exception as e:
        print(f"FATAL: An unexpected error occurred fetching S3 content: {e}")
        raise e

# --- ✅ ADDED THIS NEW FUNCTION ---
def generate_presigned_viewable_url(s3_url: str, expiration: int = 3600) -> str:
    """
    Generates a temporary, viewable (pre-signed) URL from an S3 URI.

    Args:
        s3_url (str): The S3 URI (e.g., "s3://my-bucket/my-key.pdf")
        expiration (int): Time in seconds until the URL expires. Default is 1 hour.

    Returns:
        str: A viewable HTTPS URL, or None if generation fails.
    """
    if not s3_url or not s3_url.startswith('s3://'):
        print(f"⚠️ Cannot generate pre-signed URL for invalid S3 URI: {s3_url}")
        return None

    try:
        s3_client = get_s3_client()
    except Exception as e:
        print(f"FATAL: Could not initialize S3 client: {e}")
        return None

    try:
        # Parse the S3 URI
        parsed_url = urlparse(s3_url)
        bucket_name = parsed_url.netloc
        object_key = parsed_url.path.lstrip('/')
        
        if not bucket_name or not object_key:
            raise ValueError(f"Invalid S3 URL format: {s3_url}")

        # Generate the pre-signed URL
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': object_key},
            ExpiresIn=expiration
        )
        return url
    
    except ClientError as e:
        print(f"❌ Failed to generate pre-signed URL for {s3_url}. Error: {e}")
        return None
    except Exception as e:
        print(f"❌ An unexpected error occurred generating pre-signed URL: {e}")
        return None





