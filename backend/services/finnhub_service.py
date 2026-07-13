import requests
from typing import List, Dict

def search_stocks(query: str) -> List[Dict[str, str]]:
    """
    Search for stocks using Yahoo Finance API (No API Key Required).
    """
    if not query:
        return []

    try:
        url = "https://query2.finance.yahoo.com/v1/finance/search"
        params = {
            "q": query,
            "quotesCount": 10,
            "newsCount": 0
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        quotes = data.get("quotes", [])
        
        filtered_results = [
            {
                "symbol": item.get("symbol", ""),
                "description": item.get("shortname", item.get("longname", "")),
                "type": item.get("quoteType", "EQUITY")
            }
            for item in quotes if item.get("symbol")
        ]
        
        # Sort: Exact prefix matches first (case insensitive)
        query_lower = query.lower()
        
        def sort_key(item):
            desc = item["description"].lower()
            sym = item["symbol"].lower()
            
            if desc.startswith(query_lower) or sym.startswith(query_lower):
                return (0, desc)
            return (1, desc)
            
        filtered_results.sort(key=sort_key)
        
        return filtered_results

    except Exception as e:
        print(f"Error searching Yahoo Finance: {e}")
        return []
