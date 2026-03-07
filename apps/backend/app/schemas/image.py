from pydantic import BaseModel, ConfigDict


class ImageResponse(BaseModel):
    id: int
    s3_key: str
    original_filename: str
    file_type: str
    url: str  # presigned S3 URL, generated at serialisation time
    model_config = ConfigDict(from_attributes=True)
