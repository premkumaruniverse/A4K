from pydantic_settings import BaseSettings
from typing import List


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

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
