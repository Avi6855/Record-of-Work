from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:Avi6855%23@localhost:3306/record_of_work"
    JWT_SECRET: str = "recordofworkjwtsecretkey2024verylongandsecurekeygeneration"
    JWT_ACCESS_EXPIRATION: int = 3600000
    JWT_REFRESH_EXPIRATION: int = 604800000
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"


settings = Settings()
