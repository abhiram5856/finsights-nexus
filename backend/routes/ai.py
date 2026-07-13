from fastapi import APIRouter, HTTPException
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
from cachetools import TTLCache, cached

# Create caches (1 hour TTL, max 100 items)
prediction_cache = TTLCache(maxsize=100, ttl=3600)
sentiment_cache = TTLCache(maxsize=100, ttl=3600)

class ChatRequest(BaseModel):
    prompt: str
    image_base64: Optional[str] = None

class SentimentResponse(BaseModel):
    score: int
    summary: str

@cached(cache=prediction_cache)
def _get_cached_prediction(symbol: str, days: int = 7):
    df = yf.download(symbol, period="1y", progress=False, auto_adjust=True)
    if df.empty:
        raise ValueError("Stock data not found")
        
    model = AlphaEngine(rf_estimators=100)
    model.fit(df)
    return model.predict(days=days).tolist()

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
async def chat_with_nexus(req: ChatRequest):
    try:
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
            config = {"configurable": {"thread_id": "nexus_user_1"}}
            return nexus_graph.invoke({
                "messages": [HumanMessage(content=content)]
            }, config=config)
            
        response = await asyncio.to_thread(_invoke_graph)
        
        # Extract the last generated message from the state
        last_msg = response["messages"][-1]
        output = last_msg.content if hasattr(last_msg, 'content') else str(last_msg.get('content', last_msg))
        
        return {"response": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from transformers import pipeline

# Lazily loaded global pipeline to avoid crashing the server on boot
sentiment_analyzer = None

@cached(cache=sentiment_cache)
def _get_cached_sentiment(symbol: str):
    global sentiment_analyzer
    if sentiment_analyzer is None:
        sentiment_analyzer = pipeline("sentiment-analysis", model="ProsusAI/finbert")
        
    ticker = yf.Ticker(symbol)
    news_list = ticker.news
    if not news_list:
        return {"score": 50, "summary": "No recent news found for this stock."}
        
    headlines = [n.get('title', '') for n in news_list[:10]]
    
    total_score = 0
    bullish_count = 0
    bearish_count = 0
    
    for h in headlines:
        try:
            res = sentiment_analyzer(h)[0]
            label = res['label'].lower()
            if label == 'positive':
                total_score += 100
                bullish_count += 1
            elif label == 'negative':
                total_score += 0
                bearish_count += 1
            else:
                total_score += 50
        except:
            total_score += 50
            
    final_score = int(total_score / len(headlines)) if headlines else 50
    
    if final_score > 60:
        summary = f"FinBERT Deep Learning NLP detected Bullish sentiment across {bullish_count} recent headlines."
    elif final_score < 40:
        summary = f"FinBERT Deep Learning NLP detected Bearish sentiment across {bearish_count} recent headlines."
    else:
        summary = "FinBERT Deep Learning NLP detected Neutral/Mixed sentiment in recent news."
        
    return {"score": final_score, "summary": summary}

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
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0, api_key=os.getenv("GEMINI_API_KEY", ""))
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
