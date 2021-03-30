import ibm_boto3
from ibm_botocore.client import Config, ClientError

from decouple import config
import urllib.parse
import logging

COS_ENDPOINT = config("COS_ENDPOINT")
COS_API_KEY_ID = config("COS_API_KEY_ID")
COS_INSTANCE_CRN = config("COS_INSTANCE_CRN")
COS_BUCKET_LOCATION=config("COS_BUCKET_LOCATION")
COS_BUCKET_NAME=config("COS_BUCKET_NAME")

cos = ibm_boto3.resource("s3",
    ibm_api_key_id=COS_API_KEY_ID,
    ibm_service_instance_id=COS_INSTANCE_CRN,
    config=Config(signature_version="oauth"),
    endpoint_url=COS_ENDPOINT
)

def get_buckets():
    try:
        buckets = cos.buckets.all()
        buckets = [bucket.name for bucket in buckets]
        return buckets
    except (ClientError, Exception) as e:
        print(f"Unable to retrieve list buckets: {e}")
    return []

def create_bucket(COS_BUCKET_NAME):
    try:
        cos.Bucket(COS_BUCKET_NAME).create(
            CreateBucketConfiguration={
                "LocationConstraint":COS_BUCKET_LOCATION
            }
        )
        logging.info("Bucket created")
        return True, f"Bucket: {COS_BUCKET_NAME} created!"
    except (ClientError, Exception) as e:
        return False, f"Unable to create bucket: {e}"

def upload_to_bucket(filename, file_obj):
    buckets = get_buckets()
    if COS_BUCKET_NAME not in buckets:
        success, info = create_bucket(COS_BUCKET_NAME)
        if not success:
            return False, info
    try:
        cos.Object(COS_BUCKET_NAME, filename).upload_fileobj(file_obj)
    except (ClientError, Exception) as error:
        return False, f"Error uploading {filename} : {error}"
    return True, f"Upload successful for {filename}"

def get_item_url(filename):
    url_encoded_filename = urllib.parse.quote(filename)
    url = f"{COS_ENDPOINT}/{COS_BUCKET_NAME}/{url_encoded_filename}"
    return url
