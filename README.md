# Finsights Nexus 🚀

**An Autonomous Quantitative AI Intelligence Terminal**

Finsights Nexus is a production-grade, multi-agent AI system designed to replicate the workflow of a Quantitative Hedge Fund Analyst. It leverages state-of-the-art Deep Learning NLP, dynamic Machine Learning hyperparameter tuning, and autonomous web-scraping agents to provide data-driven financial insights.

[Watch the 60-Second Demo Video Here] (Link your Loom/YouTube video here!)

---

## 🧠 System Architecture

Finsights Nexus is built on a modern, decoupled microservices architecture.

- **Frontend:** React, TailwindCSS, Recharts (Generative UI-as-Code)
- **Backend Core:** FastAPI (Asynchronous, High-Performance)
- **Cognitive Engine:** LangGraph (Multi-Agent State Machine)
- **Vector Database:** ChromaDB (Local RAG for SEC Filings)
- **NLP Sentiment:** HuggingFace FinBERT (Local `transformers` pipeline)
- **ML Engine:** XGBoost + Prophet with Optuna (Dynamic Tuning)
- **DevOps:** Docker, Docker Compose, GitHub Actions (CI/CD)

---

## ⚡ Core Features

### 1. LangGraph Multi-Agent Architecture
The system employs a Supervisor Agent that delegates tasks between a **Quantitative Agent** (for mathematical modeling and financial statements) and a **Research Agent** (for live news scraping and macroeconomic analysis). 
- **Persistent State:** Uses `SqliteSaver` to maintain contextual memory across server reboots.
- **Agentic Code Execution:** Equipped with a sandboxed Python REPL, allowing the AI to dynamically write and execute custom scripts for complex statistical queries.

### 2. Generative UI (UI-as-Code)
Moves beyond standard text-based LLM output. When requested, the backend Quant Agent generates strict JSON chart configurations. The React frontend intercepts this data stream and dynamically renders interactive `D3.js/Recharts` graphs natively inside the chat interface (similar to Claude Artifacts).

### 3. AlphaEngine: Dynamic ML & Backtesting
Predicts future price action by analyzing historical momentum.
- **Optuna Hyperparameter Tuning:** Instead of hardcoded parameters, the engine runs 10 dynamic micro-experiments on the fly to mathematically optimize the XGBoost learning rate and tree depth for *each specific stock*.
- **Algorithmic Backtester:** Simulates a $10,000 trading portfolio over 6 months using the algorithm's predictions, rendering the hypothetical growth directly to the UI.

### 4. Deep Learning NLP Sentiment Analysis
Replaces generic LLM sentiment with a specialized, local **FinBERT Deep Learning Pipeline**. It analyzes live financial news (scraped autonomously via `DuckDuckGo-Search`) to generate institutional-grade bullish/bearish probability scores.

---

## 🛠️ Quick Start Setup

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+) & Python (3.11+)
- Gemini API Key

### Option 1: Docker (Recommended)
The easiest way to spin up the entire application.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/finsights-nexus.git
cd finsights-nexus

# 2. Set your API keys
echo "GEMINI_API_KEY=your_key_here" > backend/.env

# 3. Build and run the containers
docker-compose up --build
```
The UI will be available at `http://localhost:5173`.

### Option 2: Local Development
```bash
# Terminal 1: Backend
cd backend
python -m venv venv
source venv/Scripts/activate # Windows
pip install -r requirements.txt
uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## 🧪 CI/CD Pipeline
This repository uses **GitHub Actions**. On every push to the `main` branch, an isolated Ubuntu runner is provisioned to install dependencies and execute the Pytest suite, ensuring zero regressions in the ML pipeline before deployment.

---

## ⚠️ Disclaimer
*Finsights Nexus is an educational and technical portfolio project. The Machine Learning predictions and Agentic analyses provided by this software are strictly for demonstration purposes and do not constitute financial advice. Do not use this software to make real-world trades.*
