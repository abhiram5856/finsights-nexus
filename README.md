# 💹 Finsights Nexus

Finsights Nexus is an advanced, full-stack, AI-driven wealth management and portfolio analysis platform designed to bridge the gap between retail investing and institutional-grade quantitative analysis. It integrates real-time market data, a multi-agent AI system, machine learning forecasting, and comprehensive financial planning tools into a highly performant, responsive React application.

---

## 🚀 Live Demo
*(Insert Live Vercel/Render Links Here once deployed)*
- **Frontend URL:** `https://finsights-nexus.vercel.app/`
- **Backend URL:** `https://finsights-backend.onrender.com/`

*(Insert a GIF or screenshot of the app dashboard here)*

---

## ✨ Executive Summary
Retail investors often rely on disconnected tools: a brokerage app for buying stocks, Yahoo Finance for news, and basic ChatGPT for general advice. This fragmentation leads to poor decision-making. Finsights Nexus solves this by unifying real-time data, Machine Learning forecasting, and Agentic AI into a cohesive, secure platform. 

## 🎯 Problem Statement & Objectives
The primary objective of Finsights Nexus is to provide everyday retail investors with the same level of quantitative analysis and deterministic AI reasoning used by hedge funds, without the complexity or cost. We aim to eliminate "LLM hallucination" in finance by strict tool-binding and RAG implementation.

## 🏗️ System Overview & Architecture
Finsights Nexus is split into a separated Frontend/Backend microservice architecture:
- **Client (Frontend)**: A React/Vite application styled with Tailwind CSS, utilizing Recharts for SVG-based charting and React Context for global state/multi-currency support.
- **Server (Backend)**: A Python FastAPI asynchronous backend handling heavy data pipelines, ML training, and AI orchestration.
- **AI Brain**: A LangGraph deterministic state machine that routes queries to specialized sub-agents.
- **Database**: Supabase (PostgreSQL) for user data and portfolio persistence.

---

## 🛠️ Technology Stack & Design Decisions

### **Core Stack**
- **Frontend Framework**: React.js (Vite)
- **Backend Framework**: Python (FastAPI)
- **Database**: PostgreSQL (via Supabase) with Row Level Security (RLS)
- **Authentication**: Supabase Auth (Google OAuth 2.0)

### **AI & Machine Learning Implementation**
- **LLM Engine**: Google Gemini 1.5 (Pro/Flash)
- **Agent Framework**: LangChain & LangGraph (Multi-Agent Tool Calling)
- **Predictive Quant Model**: AlphaEngine (A hybrid **Facebook Prophet + XGBoost** regressor using technical indicators like RSI and MACD to predict 7-30 day price movements).
- **Retrieval-Augmented Generation (RAG)**: ChromaDB (Vector DB) + HuggingFace `all-MiniLM-L6-v2` embeddings for hallucination-free financial definitions.
- **Sentiment Analysis**: HuggingFace FinBERT (NLP tuned specifically on financial news).

### **Financial Data Integration**
- **Market Data**: `yfinance` (Yahoo Finance API) for real-time prices, historical OHLCV data, insider trades, and corporate financials.

---

## 📦 Module-wise Implementation

### 1. 💬 Nexus AI (Multi-Agent Chatbot)
A conversational AI assistant that acts as a "tool-user". Using LangGraph, if you ask it to "analyze RELIANCE.NS", a Supervisor Agent routes the task to a Quant Agent, which bypasses the LLM, executes local Python scripts to fetch `yfinance` data, and returns real-time market data directly into the chat interface. It even has internet access via DuckDuckGo.

### 2. 📊 Real-Time Stock Insights & Compare
Get instant data on any NSE/BSE/US stock, including a local lightning-fast A-Z chip grid search, interactive historical charts, 52-week metrics, and direct ML predictions for momentum analysis. 

### 3. 💼 Portfolio Tracker
A persistent, cloud-synced portfolio dashboard. Users can add their holdings, and the backend dynamically batches `yfinance` requests to calculate total investment, current value, and exact P&L across a 1-year historical chart.

### 4. 🧭 Financial Planner (FinPlan Pro)
An interactive module to allocate monthly income based on risk profiling. It divides earnings between Needs, Wants, Investments, Emergency Funds, and Insurance, visually represented through Recharts donut graphs.

### 5. 📚 Learn Academy & Financial Modules
Extensive educational modules covering Advanced Planning, Credit Health, Government Schemes, Insurance, and Liability Structuring to educate the modern investor.

---

## 🗄️ Database & API Design
- **Database Design**: We utilized PostgreSQL via Supabase. User authentication creates a secure UUID, which is foreign-keyed to a `portfolio` table. 
- **API Design**: Built on FastAPI, the backend exposes asynchronous RESTful endpoints (`/api/portfolio`, `/api/ai/chat`, `/api/stocks`). Background tasks and caching (`cachetools`) are utilized to memoize heavy ML outputs and prevent rate-limiting from Yahoo Finance.

## 🔒 Security & Performance
- **Row Level Security (RLS)**: Enforced directly on the Supabase PostgreSQL database to ensure users can only ever query their own portfolio data.
- **Optimization**: Swapped heavy Docker-based ML containers for lightweight, optimized local builds. Replaced slow single-ticker API requests with vectorized Pandas batch-fetching.

## 🚧 Challenges & Solutions
1. **Challenge**: LLM Hallucination on live stock prices.
   **Solution**: Implemented a LangGraph state machine. The LLM is restricted to generating function calls; actual data fetching is handled by deterministic Python scripts.
2. **Challenge**: Slow UI loading on the Portfolio page.
   **Solution**: Moved from sequential `.info` scraping to a single, vectorized `yf.download(period="1d")` batch call for all portfolio assets simultaneously, dropping load times from 15s to <2s.

## 🔮 Results & Future Enhancements
The resulting application is a highly scalable, enterprise-grade financial dashboard. Future enhancements could include:
- Migrating from Yahoo Finance to an institutional WebSockets provider (e.g., Zerodha Kite Connect, Alpaca).
- Adding real-time user notification alerts for massive price drops.
- Implementing a multi-tenant portfolio sharing system.

---

## ⚙️ Setup & Installation

To run this project locally, follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/finsights-nexus.git
cd finsights-nexus
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```
**Create a `.env` file in the `backend` folder:**
```env
GEMINI_API_KEY="your_gemini_api_key"
SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_anon_key"
```
Run the server:
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup (React/Vite)
Open a new terminal.
```bash
cd frontend
npm install # or pnpm install
```
**Create a `.env` file in the `frontend` folder:**
```env
VITE_API_URL="http://localhost:8000"
VITE_SUPABASE_URL="your_supabase_url"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
```
Run the frontend:
```bash
npm run dev
```

The app will open in your browser at `http://localhost:5173`.

---

## 📄 License
This project is distributed under the MIT License. See LICENSE for more information.

## 👏 Acknowledgements
- Built by Abhiram M.
- Market Data via Yahoo Finance
- AI & NLP via Google Gemini and HuggingFace
- Frontend styled with TailwindCSS & Lucide Icons
