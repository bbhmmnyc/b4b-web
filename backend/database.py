import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / ".env")

mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME")
if not mongo_url or not db_name:
    raise RuntimeError("MONGO_URL and DB_NAME environment variables are required")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]
