import os
from typing import Annotated, Literal, Sequence, TypedDict
import operator

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3
from services.agent_tools import get_stock_details, predict_stock_trend, search_financial_knowledge, fetch_latest_news, get_financial_statements, get_insider_trades

# Define the State for the Multi-Agent Graph
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    next: str

# Initialize Gemini LLM
def get_llm():
    return ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0, api_key=os.getenv("GEMINI_API_KEY", ""))

# --- WORKER AGENTS ---

def _extract_text_content(content) -> str:
    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, dict):
                if part.get("type") == "text":
                    text_parts.append(part.get("text", ""))
            elif isinstance(part, str):
                text_parts.append(part)
        return "".join(text_parts)
    return str(content)

def research_agent(state: AgentState):
    """Agent responsible for gathering news and macroeconomic knowledge."""
    llm = get_llm()
    from services.agent_tools import search_the_web
    tools = [fetch_latest_news, search_financial_knowledge, search_the_web]
    # create_react_agent handles the tool calling loop
    agent = create_react_agent(llm, tools)
    
    # Inject a system prompt
    messages = [
        {"role": "system", "content": "You are the Finsights Research Agent. Use your tools to fetch the latest news or financial concepts. Summarize your findings clearly."}
    ] + list(state["messages"])
    
    response = agent.invoke({"messages": messages})
    # We append the final response from this agent to the state
    final_message = response["messages"][-1]
    text_content = _extract_text_content(final_message.content)
    return {"messages": [{"role": "assistant", "content": f"Research Agent: {text_content}"}]}

def quant_agent(state: AgentState):
    """Agent responsible for pulling stock data and running ML predictions."""
    llm = get_llm()
    tools = [get_stock_details, predict_stock_trend, get_financial_statements, get_insider_trades]
    agent = create_react_agent(llm, tools)
    
    messages = [
        {"role": "system", "content": "You are the Finsights Quantitative Analyst. Use your tools to fetch stock details or predict trends using the AlphaEngine ML model. Provide data-driven insights."}
    ] + list(state["messages"])
    
    response = agent.invoke({"messages": messages})
    final_message = response["messages"][-1]
    text_content = _extract_text_content(final_message.content)
    return {"messages": [{"role": "assistant", "content": f"Quant Agent: {text_content}"}]}

# --- SUPERVISOR ---

def supervisor_node(state: AgentState):
    """Supervisor determines who should act next, or if the task is finished."""
    llm = get_llm()
    system_prompt = (
        "You are the Nexus Multi-Agent Supervisor. You have Multimodal Vision capabilities.\n"
        "You manage two worker agents: 'Researcher' and 'Quant'.\n"
        "If the user asks for stock prices, trends, ML predictions, financial statements, insider trades, OR uploads a chart/image for analysis, route to 'Quant'.\n"
        "If the user asks for news, market sentiment, or financial concepts, route to 'Researcher'.\n"
        "If a question requires both (e.g. 'What is the news on AAPL and what is its prediction?'), route to one, and then the other in the next turn.\n"
        "If the user's request has been fully answered by the agents, or if it's a simple greeting, respond with 'FINISH'.\n"
        "Respond strictly with ONE of the following words: 'Researcher', 'Quant', or 'FINISH'."
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="messages"),
        ("system", "Given the conversation above, who should act next? Or should we FINISH? Output a single word: 'Researcher', 'Quant', or 'FINISH'.")
    ])
    
    chain = prompt | llm
    response = chain.invoke({"messages": state["messages"]})
    
    next_action = response.content.strip().replace("'", "").replace('"', '')
    if next_action not in ["Researcher", "Quant", "FINISH"]:
        next_action = "FINISH" # fallback
        
    return {"next": next_action}

# --- BUILD THE GRAPH ---

def build_multi_agent_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("Researcher", research_agent)
    workflow.add_node("Quant", quant_agent)
    workflow.add_node("Supervisor", supervisor_node)
    
    # Edges from workers always go back to the supervisor
    workflow.add_edge("Researcher", "Supervisor")
    workflow.add_edge("Quant", "Supervisor")
    
    # The supervisor decides the next step
    workflow.add_conditional_edges(
        "Supervisor",
        lambda x: x["next"],
        {
            "Researcher": "Researcher",
            "Quant": "Quant",
            "FINISH": END
        }
    )
    
    workflow.add_edge(START, "Supervisor")
    
    # Compile the graph with persistent stateful memory
    conn = sqlite3.connect("checkpoints.sqlite", check_same_thread=False)
    memory = SqliteSaver(conn)
    graph = workflow.compile(checkpointer=memory)
    return graph

# Expose a singleton graph instance
nexus_graph = build_multi_agent_graph()
