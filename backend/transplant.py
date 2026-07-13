import os
import shutil
import re

source_dir = r"C:\Users\ABHIRAM MODUKURU\.gemini\antigravity-ide\scratch\finsights_ai"
dest_services = r"C:\Users\ABHIRAM MODUKURU\Downloads\finsights-main\finsights-main\backend\services"
dest_routes = r"C:\Users\ABHIRAM MODUKURU\Downloads\finsights-main\finsights-main\backend\routes"
backend_main = r"C:\Users\ABHIRAM MODUKURU\Downloads\finsights-main\finsights-main\backend\main.py"

# 1. Copy AI files
files_to_copy = ["alpha_engine.py", "agent_tools.py", "rag_pipeline.py"]
os.makedirs(dest_services, exist_ok=True)
for file in files_to_copy:
    shutil.copy(os.path.join(source_dir, file), os.path.join(dest_services, file))

# 2. Create routes/ai.py
ai_route_code = """from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain.agents import AgentExecutor, create_tool_calling_agent
from services.alpha_engine import AlphaEngine
from services.agent_tools import get_all_tools

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: str

class SentimentResponse(BaseModel):
    score: int
    summary: str

@router.post("/predict/{symbol}")
def predict_stock(symbol: str, days: int = 7):
    try:
        df = yf.download(symbol, period="1y", progress=False, auto_adjust=True)
        if df.empty:
            raise HTTPException(status_code=404, detail="Stock data not found")
            
        model = AlphaEngine(rf_estimators=100)
        model.fit(df)
        forecast = model.predict(days=days).tolist()
        return {"symbol": symbol, "forecast": forecast}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
def chat_with_nexus(req: ChatRequest):
    try:
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=os.getenv("OPENAI_API_KEY", ""))
        tools = get_all_tools()
        
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are Nexus, an advanced and friendly Indian finance chatbot AI. You have access to tools to fetch live stock prices, predict stock trends using an ML model, search a financial knowledge base, and fetch live news. Use them when necessary to provide accurate and helpful answers."),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ])
        
        agent = create_tool_calling_agent(llm, tools, prompt_template)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
        
        response = agent_executor.invoke({"input": req.prompt})
        return {"response": response["output"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sentiment/{symbol}", response_model=SentimentResponse)
def get_sentiment(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        news_list = ticker.news
        if not news_list:
            return {"score": 50, "summary": "No recent news found for this stock."}
            
        headlines = [n.get('title', '') for n in news_list[:10]]
        news_text = "\\n".join(headlines)
        
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=os.getenv("OPENAI_API_KEY", ""))
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert financial analyst. Analyze the sentiment of the following news headlines for a stock. Output a Sentiment Score from 0 (Extremely Bearish) to 100 (Extremely Bullish) on the first line (just the number). Then provide a 2-3 sentence summary explaining why on the following lines."),
            ("human", "{news}")
        ])
        
        chain = prompt | llm
        response = chain.invoke({"news": news_text})
        
        output = response.content
        score_str = output.split('\\n')[0]
        import re
        score_match = re.search(r'\d+', score_str)
        score = int(score_match.group(0)) if score_match else 50
        
        return {"score": score, "summary": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
"""

with open(os.path.join(dest_routes, "ai.py"), "w", encoding="utf-8") as f:
    f.write(ai_route_code)

# 3. Update backend/main.py
with open(backend_main, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("from routes import portfolio", "from routes import portfolio, ai")
content = content.replace('app.include_router(market.router, prefix="/api/market")', 'app.include_router(market.router, prefix="/api/market")\napp.include_router(ai.router, prefix="/api/ai")')
content = content.replace("FINSIGHTS API", "NEXUS API")

with open(backend_main, "w", encoding="utf-8") as f:
    f.write(content)

print("AI transplant successful!")
