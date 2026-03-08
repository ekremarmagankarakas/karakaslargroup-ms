import io
from pathlib import Path
from uuid import uuid4

import boto3
import filetype as ft
from fastapi import UploadFile

from app.core.config import Settings


class StorageService:
    def __init__(self, settings: Settings) -> None:
        kwargs: dict = {"region_name": settings.AWS_REGION}
        if settings.USE_LOCALSTACK:
            kwargs["endpoint_url"] = settings.LOCALSTACK_ENDPOINT
            kwargs["aws_access_key_id"] = "test"
            kwargs["aws_secret_access_key"] = "test"
        elif settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        self.client = boto3.client("s3", **kwargs)
        self.bucket = settings.S3_BUCKET_NAME
        # Used to rewrite presigned URLs so the browser can reach LocalStack
        self._localstack_internal = settings.LOCALSTACK_ENDPOINT if settings.USE_LOCALSTACK else None
        self._localstack_public = settings.LOCALSTACK_PUBLIC_URL if settings.USE_LOCALSTACK else None

    async def upload_file(self, file: UploadFile, requirement_id: int) -> tuple[str, str]:
        """Upload file to S3. Returns (s3_key, file_type)."""
        content = await file.read()
        kind = ft.guess(content)

        if kind is None:
            raise ValueError("Cannot determine file type")

        mime = kind.mime
        if mime not in {"image/jpeg", "image/png", "image/gif", "application/pdf"}:
            raise ValueError(f"Unsupported file type: {mime}")

        file_type = "pdf" if mime == "application/pdf" else "image"
        ext = Path(file.filename or "file").suffix.lower()
        key = f"requirements/{requirement_id}/{uuid4()}{ext}"

        self.client.upload_fileobj(io.BytesIO(content), self.bucket, key)
        return key, file_type

    def get_presigned_url(self, s3_key: str, expiry: int = 3600) -> str:
        url = self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": s3_key},
            ExpiresIn=expiry,
        )
        # boto3 generates URLs using the internal Docker hostname (e.g.
        # http://localstack:4566/...). Rewrite to the public host so the
        # browser can actually reach LocalStack on localhost:4566.
        if self._localstack_internal and self._localstack_public:
            url = url.replace(self._localstack_internal, self._localstack_public)
        return url
