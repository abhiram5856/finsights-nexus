import os
from dotenv import load_dotenv
from supabase import create_client

# Force override so uvicorn picks up the changed .env instead of its cached shell variables
load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

_supabase_client = None

def get_supabase():
    global _supabase_client
    if not _supabase_client:
        try:
            _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception:
            # Prevent crashes if network is entirely down
            pass
    return _supabase_client
