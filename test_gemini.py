
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise RuntimeError(
        "GOOGLE_API_KEY not found. Check your .env file."
    )

llm = ChatGoogleGenerativeAI(
    model="gemini-3.8-flash",
    temperature=0,
)

response = llm.invoke(
    "In one sentence, explain what RAG means in AI."
)

print(response.content)
