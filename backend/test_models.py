import os
import sys
from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import errors

key = os.getenv("GEMINI_API_KEY")
print("Key starts with:", key[:10] if key else "None")

try:
    client = genai.Client(api_key=key)
    print("Listing models...")
    for m in client.models.list():
        print(f"- {m.name} (Supported actions: {m.supported_actions})")
except Exception as e:
    import traceback
    traceback.print_exc()
