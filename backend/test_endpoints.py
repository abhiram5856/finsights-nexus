import json
import os
from dotenv import load_dotenv

# Load env vars before importing main
load_dotenv()

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_analyze_portfolio():
    print("Testing /api/ai/analyze_portfolio ...")
    payload = {
        "assets": [
            {"symbol": "RELIANCE.NS", "quantity": 10, "buy_price": 2500.0, "current_price": 2900.0},
            {"symbol": "TCS.NS", "quantity": 5, "buy_price": 3800.0, "current_price": 4100.0}
        ],
        "total_value": 49500.0
    }
    
    response = client.post("/api/ai/analyze_portfolio", json=payload)
    
    if response.status_code == 200:
        print("SUCCESS!")
        print(json.dumps(response.json(), indent=2))
    else:
        print("FAILED!")
        print("Status Code:", response.status_code)
        print(response.text)

if __name__ == "__main__":
    test_analyze_portfolio()
