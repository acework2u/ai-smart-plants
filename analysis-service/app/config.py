from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    service_name: str = "smart-plant-analysis"
    log_level: str = "info"
    model_path: Path = Path("/models/plant_classifier.onnx")
    mock_analysis: bool = True

    class Config:
        env_file = ".env.local"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
