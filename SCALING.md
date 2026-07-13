# Finsights Nexus: DevOps & Scaling Architecture

This document provides a comprehensive overview of the architecture, security practices, and CI/CD scaling pipelines for the Finsights Nexus Quantitative Terminal.

## 1. Database Architecture
Unlike traditional CRUD applications, this quantitative terminal operates on specialized data paradigms:

### A. Real-Time Data (No SQL DB Required)
We intentionally bypass traditional persistent databases (like PostgreSQL or MongoDB) for market data. Financial markets move in milliseconds; storing stale prices in a DB is an anti-pattern. Instead, our backend acts as a high-speed proxy, querying live institutional feeds (`yfinance`) directly on request. 

### B. Vector Database (ChromaDB)
For unstructured textual data (e.g., SEC Filings, 10-K Reports, News articles), we use **ChromaDB** as our local Vector Store. 
- Documents are scraped via `WebBaseLoader`, chunked, and embedded into high-dimensional vectors.
- The `ChromaDB` instance persists locally in the `backend/chroma_db/` volume mounted via Docker.
- This empowers our LangGraph RAG (Retrieval-Augmented Generation) pipeline to perform semantic search instantly.

### C. In-Memory State (LRU / TTL Caching)
To drastically reduce latency on duplicate ML predictions, we utilize `cachetools.TTLCache`. This stores the most recent 100 Prophet+XGBoost predictions directly in the server's RAM for 1 hour. This drops response times from ~4,000ms to <10ms.

## 2. Security Best Practices
- **Environment Variables**: The `GEMINI_API_KEY` and Supabase keys must never be committed. They are injected securely at runtime via the `docker-compose.yml` environment block.
- **Pydantic Validation**: All LangGraph agent tools are secured by strict `Pydantic` schemas. This prevents Prompt Injection attacks and hallucinations, as the agent cannot execute a tool unless the arguments strictly match the expected data types.
- **Stateless Authentication**: We rely on Supabase JWT tokens for user authentication on the frontend, ensuring the FastAPI backend remains entirely stateless (improving horizontal scalability).

## 3. Docker Containerization
The application is fully containerized for production deployment:
- Run `docker-compose up --build -d` in the root directory.
- The frontend will be served statically via `serve` on port `3000`.
- The FastAPI backend will run on port `8000` using the `uvicorn` ASGI server.

## 4. CI/CD & Testing Pipeline
To integrate this into a Continuous Integration pipeline (e.g., GitHub Actions):
1. Navigate to the `backend/` folder.
2. Install dependencies: `pip install -r requirements.txt`
3. Run the automated Pytest suite: `pytest tests/`
The test suite validates the core `AlphaEngine` mathematics using synthetic data to prevent rate-limiting against live APIs during CI/CD.
