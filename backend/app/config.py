import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Resolve absolute path to backend/.env
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_file_path = os.path.join(backend_dir, ".env")

# Force override system environment variables with local .env file settings
if os.path.exists(env_file_path):
    load_dotenv(env_file_path, override=True)


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

    model_config = {"env_file": env_file_path}


settings = Settings()
