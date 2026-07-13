from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import portfolio, ai, stocks, search, expenses, user, market

app = FastAPI()

# ✅ CORS for local development and Vercel domains
origins = [
    "http://localhost:5174",
    "http://localhost:3000",
    "https://finsights-five.vercel.app",
    "*"  # Temporary broad allow to troubleshoot
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False, # Set to False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(portfolio.router, prefix="/api/portfolio")
app.include_router(stocks.router, prefix="/api/stocks")
app.include_router(search.router, prefix="/api/search")
app.include_router(expenses.router, prefix="/api/expenses")
app.include_router(user.router, prefix="/api/user")
app.include_router(market.router, prefix="/api/market")
app.include_router(ai.router, prefix="/api/ai")

@app.get("/")
def root():
    return {"message": "NEXUS API running 🚀", "version": "1.0.2"}