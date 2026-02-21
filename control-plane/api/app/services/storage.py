"""Storage service for artifact management."""

from datetime import timedelta
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import settings


class StorageService:
    """S3-compatible storage service using MinIO."""
    
    def __init__(self):
        self.endpoint = settings.s3_endpoint
        self.access_key = settings.s3_access_key
        self.secret_key = settings.s3_secret_key
        self.bucket = settings.s3_bucket
        self.region = settings.s3_region
        
        # Create S3 client
        self.s3 = boto3.client(
            's3',
            endpoint_url=self.endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region,
            config=Config(signature_version='s3v4')
        )
    
    def ensure_bucket(self):
        """Ensure the artifacts bucket exists."""
        try:
            self.s3.head_bucket(Bucket=self.bucket)
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                self.s3.create_bucket(Bucket=self.bucket)
                # Set bucket policy for private access
                self.s3.put_bucket_versioning(
                    Bucket=self.bucket,
                    VersioningConfiguration={'Status': 'Enabled'}
                )
    
    def generate_presigned_upload(self, key: str, content_type: str = None, expires: int = None) -> str:
        """Generate a presigned URL for uploading an artifact."""
        params = {
            'Bucket': self.bucket,
            'Key': key,
        }
        if content_type:
            params['ContentType'] = content_type
        
        url = self.s3.generate_presigned_url(
            'put_object',
            Params=params,
            ExpiresIn=expires or settings.s3_presign_expiry
        )
        return url
    
    def generate_presigned_download(self, key: str, expires: int = None) -> str:
        """Generate a presigned URL for downloading an artifact."""
        url = self.s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': self.bucket,
                'Key': key,
            },
            ExpiresIn=expires or settings.s3_presign_expiry
        )
        return url
    
    def delete_object(self, key: str):
        """Delete an object from storage."""
        self.s3.delete_object(Bucket=self.bucket, Key=key)


# Singleton instance
storage = StorageService()
