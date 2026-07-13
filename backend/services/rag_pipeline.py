import os
import bs4
import feedparser
import yfinance as yf
from typing import List, Dict
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import WebBaseLoader

# Initialize embedding model
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# We will initialize Chroma DB in memory or local directory
# For this project, we'll keep it in a local directory so it persists
persist_directory = "chroma_db"
vectorstore = None

# A sample static knowledge base (simulating ingested PDFs/Books)
STATIC_KNOWLEDGE = [
    Document(page_content="A stock represents a share in the ownership of a company, including a claim on the company's earnings and assets. When a company's stock price rises, it indicates that investors believe the company will grow.", metadata={"source": "Finance 101 Book"}),
    Document(page_content="A Mutual Fund pools money from many investors to purchase a diversified portfolio of stocks, bonds, or other securities. It is managed by a professional fund manager.", metadata={"source": "Finance 101 Book"}),
    Document(page_content="An Index Fund is a type of mutual fund or ETF with a portfolio constructed to match or track the components of a financial market index, such as the Standard & Poor's 500 Index (S&P 500).", metadata={"source": "Investing for Beginners"}),
    Document(page_content="Systematic Investment Plan (SIP) allows you to invest a fixed amount regularly in a mutual fund scheme, typically equity mutual funds. It helps in rupee cost averaging and benefits from the power of compounding.", metadata={"source": "Wealth Management Guide"}),
    Document(page_content="Inflation is the rate at which the general level of prices for goods and services is rising and, consequently, the purchasing power of currency is falling.", metadata={"source": "Macroeconomics Textbook"}),
    Document(page_content="A PE Ratio (Price-to-Earnings) relates a company's share price to its earnings per share. A high P/E could mean that a stock's price is high relative to earnings and possibly overvalued.", metadata={"source": "Stock Analysis Basics"}),
]

def initialize_vectorstore():
    global vectorstore
    if not os.path.exists(persist_directory):
        print("Initializing new Chroma Vector Store with static knowledge...")
        vectorstore = Chroma.from_documents(
            documents=STATIC_KNOWLEDGE, 
            embedding=embeddings, 
            persist_directory=persist_directory
        )
    else:
        print("Loading existing Chroma Vector Store...")
        vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)

def ingest_web_document(url: str):
    """Scrapes a live webpage (like a Wikipedia or SEC filing page), chunks the text, and stores it in the Vector Database."""
    global vectorstore
    if vectorstore is None:
        initialize_vectorstore()
        
    print(f"Scraping and ingesting {url} into Chroma Vector Store...")
    loader = WebBaseLoader(url)
    docs = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)
    
    vectorstore.add_documents(splits)
    # Note: Chroma auto-persists in newer versions, but we can explicitly call it if using older versions
    if hasattr(vectorstore, "persist"):
        vectorstore.persist()
    print(f"Successfully ingested {len(splits)} chunks from {url} into RAG database.")

def search_knowledge_base(query: str, k: int = 2) -> str:
    """Searches the static knowledge base for relevant financial concepts."""
    if vectorstore is None:
        initialize_vectorstore()
        
    docs = vectorstore.similarity_search(query, k=k)
    if not docs:
        return "No relevant information found in the knowledge base."
    
    result = "Found the following information:\n"
    for i, doc in enumerate(docs):
        result += f"- {doc.page_content} (Source: {doc.metadata.get('source', 'Unknown')})\n"
    return result

def get_live_stock_news(symbol: str) -> str:
    """Fetches the latest news headlines and summaries for a given stock symbol using Yahoo Finance."""
    try:
        ticker = yf.Ticker(symbol)
        news_list = ticker.news
        if not news_list:
            return f"No recent news found for {symbol}."
        
        formatted_news = f"Latest news for {symbol}:\n"
        for i, article in enumerate(news_list[:3]): # Get top 3 news
            title = article.get('title', 'No title')
            publisher = article.get('publisher', 'Unknown')
            formatted_news += f"{i+1}. {title} (Published by: {publisher})\n"
            
        return formatted_news
    except Exception as e:
        return f"Error fetching news for {symbol}: {str(e)}"
