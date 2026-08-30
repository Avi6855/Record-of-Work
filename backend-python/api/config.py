import os
import ssl
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = os.environ.get(
        "DATABASE_URL",
        "mysql+pymysql://sW3SSnxsFYh1HMp.root:KALaxEoSw1bvyKLy@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/record_of_work?charset=utf8mb4"
    )
    JWT_SECRET: str = "recordofworkjwtsecretkey2024verylongandsecurekeygeneration"
    JWT_ACCESS_EXPIRATION: int = 3600000
    JWT_REFRESH_EXPIRATION: int = 604800000
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"


settings = Settings()

# Ensure TiDB connection uses SSL
if "tidbcloud.com" in settings.DATABASE_URL and "ssl" not in settings.DATABASE_URL.lower():
    separator = "&" if "?" in settings.DATABASE_URL else "?"
    settings.DATABASE_URL += f"{separator}ssl=%7B%22rejectUnauthorized%22%3Atrue%7D"
