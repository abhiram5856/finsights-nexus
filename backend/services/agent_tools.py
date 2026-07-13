import pandas as pd
import yfinance as yf
import json
from langchain.tools import tool
from pydantic import BaseModel, Field
from duckduckgo_search import DDGS
from langchain_experimental.tools import PythonREPLTool
from services.alpha_engine import AlphaEngine
from services.rag_pipeline import search_knowledge_base, get_live_stock_news

class StockQuery(BaseModel):
    symbol: str = Field(description="The full stock symbol with exchange suffix (e.g., RELIANCE.NS, AAPL)")

class SearchQuery(BaseModel):
    query: str = Field(description="The financial concept to search for")

class WebSearchQuery(BaseModel):
    query: str = Field(description="The exact search query to look up on the live internet (e.g., 'Nvidia earnings report today')")

class ChartQuery(BaseModel):
    symbol: str = Field(description="The stock ticker symbol to generate a chart for")
    days: int = Field(default=30, description="The number of historical days to fetch for the chart")

class BacktestQuery(BaseModel):
    symbol: str = Field(description="The stock ticker symbol to backtest")

@tool(args_schema=StockQuery)
def get_stock_details(symbol: str) -> str:
    """
    Fetches the current price, 52-week high, 52-week low, and sector for a given stock symbol.
    Always pass the full symbol with its exchange suffix (e.g., RELIANCE.NS, TCS.NS, AAPL).
    """
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        hist = ticker.history(period="1d")
        if hist.empty:
            return f"Could not find stock data for {symbol}. Make sure the symbol is correct."
            
        price = hist["Close"].iloc[-1]
        high = info.get("fiftyTwoWeekHigh", "N/A")
        low = info.get("fiftyTwoWeekLow", "N/A")
        sector = info.get("sector", "N/A")
        short_name = info.get("shortName", symbol)
        
        return (f"Stock: {short_name} ({symbol})\n"
                f"Sector: {sector}\n"
                f"Current Price: ₹{price:,.2f} (or $ if US stock)\n"
                f"52-Week High: {high}\n"
                f"52-Week Low: {low}")
    except Exception as e:
        return f"Error fetching details for {symbol}: {str(e)}"

@tool(args_schema=StockQuery)
def predict_stock_trend(symbol: str) -> str:
    """
    Predicts the 7-day future price trend for a stock using a Hybrid ARIMA + Random Forest Machine Learning Model.
    Use this when the user asks for a forecast, prediction, or future trend of a stock.
    """
    try:
        df = yf.download(symbol, period="1y", progress=False, auto_adjust=True)
        if df.empty:
            return f"Could not fetch enough historical data to predict {symbol}."
            
        model = AlphaEngine(rf_estimators=50)
        model.fit(df)
        
        future_pred = model.predict(days=7)
        dates = pd.date_range(df.index[-1], periods=8, freq="B")[1:]
        
        result = f"7-Day Trend Forecast for {symbol}:\n"
        for d, p in zip(dates, future_pred):
            result += f"- {d.strftime('%Y-%m-%d')}: ₹{p:,.2f}\n"
            
        return result
    except Exception as e:
        return f"Error predicting trend for {symbol}: {str(e)}"

@tool(args_schema=SearchQuery)
def search_financial_knowledge(query: str) -> str:
    """
    Searches a local knowledge base for explanations of financial concepts (e.g., 'What is a Mutual Fund?', 'Explain P/E Ratio').
    Use this to answer educational or conceptual finance questions.
    """
    return search_knowledge_base(query)

@tool(args_schema=StockQuery)
def fetch_latest_news(symbol: str) -> str:
    """
    Fetches the latest real-time news headlines for a specific stock symbol.
    Use this when the user asks for recent news or why a stock is moving today.
    """
    return get_live_stock_news(symbol)

@tool(args_schema=StockQuery)
def get_financial_statements(symbol: str) -> str:
    """
    Fetches the latest income statement and balance sheet summaries for a stock.
    Use this when the user asks for fundamentals, revenue, profit, or balance sheet info.
    """
    try:
        ticker = yf.Ticker(symbol)
        inc = ticker.income_stmt
        bal = ticker.balance_sheet
        if inc is None or inc.empty or bal is None or bal.empty:
            return f"Financial statements not available for {symbol}."
            
        recent_inc = inc.iloc[:, 0]
        recent_bal = bal.iloc[:, 0]
        
        rev = recent_inc.get("Total Revenue", "N/A")
        net_inc = recent_inc.get("Net Income", "N/A")
        total_assets = recent_bal.get("Total Assets", "N/A")
        
        return (f"Latest Financials for {symbol}:\n"
                f"Total Revenue: {rev}\n"
                f"Net Income: {net_inc}\n"
                f"Total Assets: {total_assets}")
    except Exception as e:
        return f"Error fetching financials for {symbol}: {str(e)}"

@tool(args_schema=StockQuery)
def get_insider_trades(symbol: str) -> str:
    """
    Fetches recent insider transactions (officers/directors buying or selling stock).
    Use this to see if executives are bullish or bearish on their own company.
    """
    try:
        ticker = yf.Ticker(symbol)
        insider = ticker.insider_transactions
        if insider is None or insider.empty:
            return f"No recent insider trades found for {symbol}."
            
        return f"Recent Insider Trades for {symbol}:\n{insider.head(3).to_string()}"
    except Exception as e:
        return f"Error fetching insider trades for {symbol}: {str(e)}"

@tool(args_schema=WebSearchQuery)
def search_the_web(query: str) -> str:
    """
    Searches the live internet for up-to-date information, news, or general knowledge.
    Use this when you need real-time data or answers to questions not covered by other tools.
    """
    try:
        results = ""
        with DDGS() as ddgs:
            # Get top 3 search results
            for r in ddgs.text(query, max_results=3):
                results += f"Title: {r['title']}\nBody: {r['body']}\n\n"
        if not results:
            return "No results found on the web."
        return results
    except Exception as e:
        return f"Web search failed: {str(e)}"

@tool(args_schema=ChartQuery)
def generate_stock_chart_data(symbol: str, days: int = 30) -> str:
    """
    Generates JSON data for a historical stock price chart. 
    Use this ONLY when the user explicitly asks to SEE a chart, graph, or plot of a stock.
    Return the EXACT JSON string output of this tool to the user without any extra markdown or conversational text.
    """
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=f"{days}d")
        if hist.empty:
            return f"No historical data found for {symbol}."
            
        data_points = []
        for date, row in hist.iterrows():
            data_points.append({
                "date": date.strftime("%Y-%m-%d"),
                "price": round(row["Close"], 2)
            })
            
        chart_config = {
            "type": "chart",
            "symbol": symbol.upper(),
            "data": data_points
        }
        return json.dumps(chart_config)
    except Exception as e:
        return f"Error generating chart for {symbol}: {str(e)}"

@tool(args_schema=BacktestQuery)
def run_ml_backtest(symbol: str) -> str:
    """
    Runs a historical algorithmic trading backtest using the AlphaEngine ML model.
    Use this ONLY when the user asks to backtest, simulate, or prove the model's performance on a stock.
    Returns the EXACT JSON string output representing the hypothetical portfolio growth over time without markdown formatting.
    """
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="2y")
        if df.empty or len(df) < 200:
            return f"Not enough historical data to backtest {symbol}."
            
        split_idx = int(len(df) * 0.75)
        train_df = df.iloc[:split_idx]
        test_df = df.iloc[split_idx:]
        
        from prophet import Prophet
        import logging
        logging.getLogger('cmdstanpy').setLevel(logging.ERROR)
        
        p_df = pd.DataFrame({'ds': train_df.index.tz_localize(None), 'y': train_df['Close']})
        m = Prophet(daily_seasonality=False, yearly_seasonality=True)
        m.fit(p_df)
        
        future = pd.DataFrame({'ds': test_df.index.tz_localize(None)})
        forecast = m.predict(future)
        
        capital = 10000.0
        shares = 0.0
        data_points = []
        
        for i in range(len(test_df) - 1):
            today_price = test_df['Close'].iloc[i]
            tomorrow_pred = forecast['yhat'].iloc[i+1]
            date_str = test_df.index[i].strftime("%Y-%m-%d")
            
            # Algorithmic Trading Strategy Simulation
            if tomorrow_pred > today_price and capital > 0:
                shares = capital / today_price
                capital = 0.0
            elif tomorrow_pred < today_price and shares > 0:
                capital = shares * today_price
                shares = 0.0
                
            current_value = capital + (shares * today_price)
            data_points.append({"date": date_str, "price": round(current_value, 2)})
            
        # Add final simulation day
        final_price = test_df['Close'].iloc[-1]
        final_value = capital + (shares * final_price)
        data_points.append({"date": test_df.index[-1].strftime("%Y-%m-%d"), "price": round(final_value, 2)})
        
        chart_config = {
            "type": "chart",
            "symbol": f"{symbol.upper()} AI Backtest ($10k Start)",
            "data": data_points
        }
        return json.dumps(chart_config)
    except Exception as e:
        return f"Backtest failed for {symbol}: {str(e)}"

def get_all_tools():
    """Returns the list of tools available to the LangChain Agent."""
    return [get_stock_details, predict_stock_trend, search_financial_knowledge, fetch_latest_news, get_financial_statements, get_insider_trades, search_the_web, PythonREPLTool(), generate_stock_chart_data, run_ml_backtest]
