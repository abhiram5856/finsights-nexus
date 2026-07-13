import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_endpoint(name, url, method="GET", payload=None):
    print(f"\n--- Testing {name} ---")
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        else:
            response = requests.post(url, json=payload, timeout=20)
            
        if response.status_code == 200:
            print(f"[PASS] {name} (Status 200)")
            print("Response Sample:", json.dumps(response.json(), indent=2)[:300] + "...")
            return True
        else:
            print(f"[FAIL] {name} (Status {response.status_code})")
            print("Error Details:", response.text)
            return False
    except Exception as e:
        print(f"[ERROR] {name} (Exception: {e})")
        return False

def main():
    print("Starting Comprehensive Backend QA...")
    
    # 1. Test Search Engine (Should use Yahoo Finance now)
    test_endpoint("Search Endpoint", f"{BASE_URL}/api/search?q=MSFT")
    
    # 2. Test AI Sentiment Analysis
    # Let's test TSLA since it always has news
    test_endpoint("Sentiment Analysis", f"{BASE_URL}/api/ai/sentiment/TSLA")
    
    # 3. Test AI Portfolio Analyzer
    portfolio_payload = {
        "assets": [
            {"symbol": "AAPL", "quantity": 10, "buy_price": 150.0, "current_price": 200.0},
            {"symbol": "TSLA", "quantity": 5, "buy_price": 250.0, "current_price": 180.0}
        ],
        "total_value": 2900.0
    }
    test_endpoint("AI Portfolio Analyzer", f"{BASE_URL}/api/ai/analyze_portfolio", method="POST", payload=portfolio_payload)
    
    print("\n✅ QA Testing Complete!")

if __name__ == "__main__":
    main()
