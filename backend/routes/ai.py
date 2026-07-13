from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from services.alpha_engine import AlphaEngine
from services.multi_agent import nexus_graph
from langchain_core.messages import HumanMessage

router = APIRouter()

from typing import Optional, List
import asyncio
from services.cache import cache_get, cache_set

SENTIMENT_TTL = 3600   # 1 hour
PREDICTION_TTL = 3600  # 1 hour

class ChatRequest(BaseModel):
    prompt: str
    image_base64: Optional[str] = None

class SentimentResponse(BaseModel):
    score: int
    summary: str

def _get_cached_prediction(symbol: str, days: int = 7):
    cache_key = f"predict_{symbol.upper()}_{days}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached
    df = yf.download(symbol, period="1y", progress=False, auto_adjust=True)
    if df.empty:
        raise ValueError("Stock data not found")
    model = AlphaEngine(rf_estimators=100)
    model.fit(df)
    result = model.predict(days=days).tolist()
    cache_set(cache_key, result, ttl=PREDICTION_TTL)
    return result

@router.post("/predict/{symbol}")
async def predict_stock(symbol: str, days: int = 7):
    try:
        # Run heavy ML training in a background thread
        forecast = await asyncio.to_thread(_get_cached_prediction, symbol, days)
        return {"symbol": symbol, "forecast": forecast}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat_with_nexus(req: ChatRequest, request: Request):
    try:
        # Extract user_id from token if available to enable per-user chat memory
        from services.auth import get_current_user
        try:
            user_id = get_current_user(request)
            thread_id = f"nexus_user_{user_id}"
        except Exception:
            thread_id = "nexus_guest_session"

        if req.image_base64:
            content = [
                {"type": "text", "text": req.prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{req.image_base64}"}}
            ]
        else:
            content = req.prompt

        # Run the LangGraph execution in a background thread to prevent blocking
        def _invoke_graph():
            # Provide a thread_id to enable conversational memory across requests
            config = {"configurable": {"thread_id": thread_id}}
            return nexus_graph.invoke({
                "messages": [HumanMessage(content=content)]
            }, config=config)
            
        response = await asyncio.to_thread(_invoke_graph)
        
        # Extract the last generated message from the state
        last_msg = response["messages"][-1]
        content = last_msg.content if hasattr(last_msg, 'content') else last_msg.get('content', last_msg)
        
        if isinstance(content, list):
            text_parts = []
            for part in content:
                if isinstance(part, dict):
                    if part.get("type") == "text":
                        text_parts.append(part.get("text", ""))
                elif isinstance(part, str):
                    text_parts.append(part)
            output = "".join(text_parts)
        else:
            output = str(content)
            
        return {"response": output}
    except Exception as e:
        print(f"Error in chat_with_nexus endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from langchain_google_genai import ChatGoogleGenerativeAI
import json

def _get_cached_sentiment(symbol: str):
    cache_key = f"sentiment_{symbol.upper()}"
    cached_result = cache_get(cache_key)
    if cached_result is not None:
        return cached_result
    
    ticker = yf.Ticker(symbol)
    news_list = ticker.news
    if not news_list:
        result = {"score": 50, "summary": "No recent news found for this stock."}
        cache_set(cache_key, result, ttl=SENTIMENT_TTL)
        return result
        
    headlines = [n.get('title', '') for n in news_list[:10]]
    
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0, api_key=os.getenv("GEMINI_API_KEY", ""))
        
        prompt = (
            "You are a financial sentiment analysis tool. Analyze the following stock headlines "
            "and classify each as either 'positive', 'negative', or 'neutral'.\n"
            "Return the response strictly as a JSON object in this format:\n"
            "{\n"
            "  \"sentiments\": [\"positive\", \"neutral\", \"negative\", ...]\n"
            "}\n"
            "Do not include any markdown styling, backticks, or '```json' wrapper. Return raw JSON text.\n\n"
            "Headlines:\n" + "\n".join([f"- {h}" for h in headlines])
        )
        
        response = llm.invoke(prompt)
        res_text = response.content.strip()
        
        # Clean up any potential markdown wraps
        if "```json" in res_text:
            res_text = res_text.split("```json")[1].split("```")[0].strip()
        elif "```" in res_text:
            res_text = res_text.split("```")[1].split("```")[0].strip()
            
        data = json.loads(res_text)
        sentiments = data.get("sentiments", [])
        
        total_score = 0
        bullish_count = 0
        bearish_count = 0
        
        for label in sentiments:
            label_lower = label.lower()
            if 'positive' in label_lower:
                total_score += 100
                bullish_count += 1
            elif 'negative' in label_lower:
                total_score += 0
                bearish_count += 1
            else:
                total_score += 50
                
        final_score = int(total_score / len(sentiments)) if sentiments else 50
    except Exception as e:
        print(f"Gemini sentiment analysis error: {e}")
        final_score = 50
        bullish_count = 0
        bearish_count = 0
        
    if final_score > 60:
        summary = f"Core sentiment analysis detected bullish trend indicators across {bullish_count} recent headlines."
    elif final_score < 40:
        summary = f"Core sentiment analysis detected bearish trend indicators across {bearish_count} recent headlines."
    else:
        summary = "Core sentiment analysis detected neutral or mixed indicators in recent headlines."

    result = {"score": final_score, "summary": summary}
    cache_set(cache_key, result, ttl=SENTIMENT_TTL)
    return result

@router.get("/sentiment/{symbol}", response_model=SentimentResponse)
async def get_sentiment(symbol: str):
    try:
        result = await asyncio.to_thread(_get_cached_sentiment, symbol)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from typing import List

class Asset(BaseModel):
    symbol: str
    quantity: float
    buy_price: float
    current_price: float

class AnalyzePortfolioRequest(BaseModel):
    assets: List[Asset]
    total_value: float

class PortfolioInsight(BaseModel):
    id: str
    type: str
    title: str
    message: str
    confidence: int
    action: str

class AnalyzePortfolioResponse(BaseModel):
    insights: List[PortfolioInsight]

@router.post("/analyze_portfolio", response_model=AnalyzePortfolioResponse)
async def analyze_portfolio(req: AnalyzePortfolioRequest):
    try:
        def _invoke_analysis():
            llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0, api_key=os.getenv("GEMINI_API_KEY", ""))
            structured_llm = llm.with_structured_output(AnalyzePortfolioResponse)
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an elite quantitative hedge fund manager and AI portfolio analyst. "
                           "Analyze the user's portfolio and provide exactly 3 highly actionable insights. "
                           "Look for concentration risks, profit-taking opportunities, and underperforming assets. "
                           "The insight 'type' must be one of: 'warning', 'success', 'info'."),
                ("human", "My Portfolio: {portfolio_data}")
            ])
            
            portfolio_str = "\n".join([f"{a.symbol}: {a.quantity} shares @ {a.buy_price} (Current: {a.current_price})" for a in req.assets])
            portfolio_str += f"\nTotal Value: {req.total_value}"
            
            chain = prompt | structured_llm
            return chain.invoke({"portfolio_data": portfolio_str})
            
        response = await asyncio.to_thread(_invoke_analysis)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
