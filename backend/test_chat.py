import os
import sys
from dotenv import load_dotenv
load_dotenv()

sys.path.append('.')
from services.multi_agent import nexus_graph
from langchain_core.messages import HumanMessage

print("Checking Gemini API Key status...")
key = os.getenv("GEMINI_API_KEY")
if not key:
    print("WARNING: GEMINI_API_KEY environment variable is not set!")
else:
    print("GEMINI_API_KEY is configured (Length:", len(key), ")")

print("\nInvoking LangGraph locally to diagnose exception...")
try:
    config = {"configurable": {"thread_id": "test_thread_nexus"}}
    res = nexus_graph.invoke({"messages": [HumanMessage(content="Hello Nexus")]}, config=config)
    print("\nSUCCESS! Graph response:")
    print(res)
except Exception as e:
    print("\nFAILED! Traceback:")
    import traceback
    traceback.print_exc()
