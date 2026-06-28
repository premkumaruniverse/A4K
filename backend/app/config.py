import os
from typing import List
from pydantic_settings import BaseSettings

# In Docker, environment variables are injected by docker-compose and take priority.
# The .env file is only used for local development (when env vars are not set).
# We do NOT use load_dotenv(override=True) because that would override docker-compose
# injected env vars with the baked-in .env file values.

# Resolve absolute path to backend/.env for local development fallback
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_file_path = os.path.join(backend_dir, ".env")


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./rideapp.db"
    JWT_SECRET: str = "change-this-in-production"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days
    OTP_EXPIRE_SECONDS: int = 300    # 5 minutes
    DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    # env_file is only used if the environment variable is not already set
    model_config = {"env_file": env_file_path, "env_file_encoding": "utf-8"}


settings = Settings()
