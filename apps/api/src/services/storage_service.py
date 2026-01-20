"""
Storage Service
================

File storage abstraction for local filesystem and S3-compatible storage.
"""

import os
import uuid
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import BinaryIO

from PIL import Image

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


class StorageError(Exception):
    """Storage operation failed."""
    pass


class StorageService:
    """
    File storage service with support for local and S3 backends.
    """

    def __init__(self):
        self.backend = settings.storage_backend
        self._local_path = Path("./storage")
        self._s3_client = None

    async def _ensure_local_path(self, subdir: str = "uploads") -> Path:
        """Ensure local storage directory exists."""
        path = self._local_path / subdir
        path.mkdir(parents=True, exist_ok=True)
        return path

    async def _get_s3_client(self):
        """Get or create S3 client."""
        if self._s3_client is None:
            import boto3
            
            self._s3_client = boto3.client(
                "s3",
                endpoint_url=settings.s3_endpoint_url,
                aws_access_key_id=settings.s3_access_key_id,
                aws_secret_access_key=settings.s3_secret_access_key,
                region_name=settings.s3_region,
            )
        return self._s3_client

    async def upload_image(
        self,
        content: bytes,
        filename: str,
        user_id: str,
        generate_thumbnail: bool = True,
    ) -> tuple[str, str | None]:
        """
        Upload an image file.
        
        Args:
            content: File content as bytes
            filename: Original filename
            user_id: User ID for path organization
            generate_thumbnail: Whether to generate a thumbnail
            
        Returns:
            Tuple of (image_url, thumbnail_url)
        """
        # Generate unique filename
        ext = Path(filename).suffix.lower() or ".jpg"
        unique_name = f"{uuid.uuid4()}{ext}"
        date_prefix = datetime.utcnow().strftime("%Y/%m/%d")
        key = f"uploads/{user_id}/{date_prefix}/{unique_name}"

        thumbnail_url = None

        try:
            if self.backend == "s3":
                url, thumbnail_url = await self._upload_to_s3(
                    content, key, generate_thumbnail
                )
            else:
                url, thumbnail_url = await self._upload_to_local(
                    content, key, generate_thumbnail
                )

            logger.info(
                "Image uploaded",
                key=key,
                backend=self.backend,
                size_bytes=len(content),
            )

            return url, thumbnail_url

        except Exception as e:
            logger.error("Upload failed", error=str(e), key=key)
            raise StorageError(f"Failed to upload image: {str(e)}")

    async def _upload_to_local(
        self,
        content: bytes,
        key: str,
        generate_thumbnail: bool,
    ) -> tuple[str, str | None]:
        """Upload to local filesystem."""
        # Save main image
        file_path = self._local_path / key
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(content)
        
        url = f"/storage/{key}"
        thumbnail_url = None

        # Generate thumbnail
        if generate_thumbnail:
            try:
                thumbnail_url = await self._create_thumbnail(
                    content, key, "local"
                )
            except Exception as e:
                logger.warning("Thumbnail generation failed", error=str(e))

        return url, thumbnail_url

    async def _upload_to_s3(
        self,
        content: bytes,
        key: str,
        generate_thumbnail: bool,
    ) -> tuple[str, str | None]:
        """Upload to S3-compatible storage."""
        client = await self._get_s3_client()
        bucket = settings.s3_bucket_name

        # Upload main image
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=content,
            ContentType="image/jpeg",
        )

        # Generate URL
        if settings.s3_endpoint_url:
            url = f"{settings.s3_endpoint_url}/{bucket}/{key}"
        else:
            url = f"https://{bucket}.s3.{settings.s3_region}.amazonaws.com/{key}"

        thumbnail_url = None

        # Generate thumbnail
        if generate_thumbnail:
            try:
                thumbnail_url = await self._create_thumbnail(
                    content, key, "s3"
                )
            except Exception as e:
                logger.warning("Thumbnail generation failed", error=str(e))

        return url, thumbnail_url

    async def _create_thumbnail(
        self,
        content: bytes,
        original_key: str,
        backend: str,
        size: tuple[int, int] = (256, 256),
    ) -> str:
        """Create and store thumbnail image."""
        # Create thumbnail
        image = Image.open(BytesIO(content))
        image.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Convert to RGB if necessary (for JPEG)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # Save to bytes
        thumb_buffer = BytesIO()
        image.save(thumb_buffer, format="JPEG", quality=85)
        thumb_content = thumb_buffer.getvalue()

        # Generate thumbnail key
        thumb_key = original_key.replace("/uploads/", "/thumbnails/")

        if backend == "s3":
            client = await self._get_s3_client()
            client.put_object(
                Bucket=settings.s3_bucket_name,
                Key=thumb_key,
                Body=thumb_content,
                ContentType="image/jpeg",
            )
            if settings.s3_endpoint_url:
                return f"{settings.s3_endpoint_url}/{settings.s3_bucket_name}/{thumb_key}"
            return f"https://{settings.s3_bucket_name}.s3.{settings.s3_region}.amazonaws.com/{thumb_key}"
        else:
            # Local storage
            thumb_path = self._local_path / thumb_key
            thumb_path.parent.mkdir(parents=True, exist_ok=True)
            thumb_path.write_bytes(thumb_content)
            return f"/storage/{thumb_key}"

    async def delete_file(self, key: str) -> bool:
        """Delete a file from storage."""
        try:
            if self.backend == "s3":
                client = await self._get_s3_client()
                client.delete_object(Bucket=settings.s3_bucket_name, Key=key)
            else:
                file_path = self._local_path / key
                if file_path.exists():
                    file_path.unlink()
            
            logger.info("File deleted", key=key)
            return True
        except Exception as e:
            logger.error("Delete failed", error=str(e), key=key)
            return False

    async def get_file(self, key: str) -> bytes | None:
        """Get file content."""
        try:
            if self.backend == "s3":
                client = await self._get_s3_client()
                response = client.get_object(
                    Bucket=settings.s3_bucket_name, Key=key
                )
                return response["Body"].read()
            else:
                file_path = self._local_path / key
                if file_path.exists():
                    return file_path.read_bytes()
                return None
        except Exception as e:
            logger.error("Get file failed", error=str(e), key=key)
            return None


# Global instance
storage = StorageService()
