"""S3-backed image storage for user photos and verification documents.

Falls back gracefully when S3_BUCKET isn't configured (e.g. local dev without
AWS credentials): callers store the raw base64 data URI in the DB instead.
Objects are private; access is always through short-lived presigned URLs.
"""

import base64
import re
import uuid

import boto3
from botocore.exceptions import ClientError

from app.config import settings

_DATA_URI_RE = re.compile(r"^data:(image/[\w.+-]+);base64,(.+)$", re.DOTALL)

_client = None


def s3_enabled() -> bool:
    return bool(settings.s3_bucket)


def _s3():
    global _client
    if _client is None:
        _client = boto3.client("s3", region_name=settings.aws_region)
    return _client


def parse_data_uri(data_uri: str) -> tuple[bytes, str]:
    match = _DATA_URI_RE.match(data_uri.strip())
    if not match:
        raise ValueError("Invalid image data URI")
    content_type = match.group(1)
    raw = base64.b64decode(match.group(2))
    return raw, content_type


def upload_image(data_uri: str, key_prefix: str) -> str:
    """Uploads an image data URI to S3 and returns the object key."""
    raw, content_type = parse_data_uri(data_uri)
    ext = content_type.split("/")[-1].split("+")[0]
    key = f"{key_prefix}/{uuid.uuid4()}.{ext}"
    _s3().put_object(Bucket=settings.s3_bucket, Key=key, Body=raw, ContentType=content_type)
    return key


def delete_image(key: str) -> None:
    try:
        _s3().delete_object(Bucket=settings.s3_bucket, Key=key)
    except ClientError:
        pass


def presigned_url(key: str, expires_in: int = 3600) -> str:
    return _s3().generate_presigned_url(
        "get_object", Params={"Bucket": settings.s3_bucket, "Key": key}, ExpiresIn=expires_in
    )
