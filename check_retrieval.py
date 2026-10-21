from pathlib import Path
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

BASE_DIR = Path(__file__).resolve().parent

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"},
)

vector_store = Chroma(
    collection_name="company_handbook",
    embedding_function=embeddings,
    persist_directory=str(BASE_DIR / "chroma_db"),
)

results = vector_store.similarity_search(
    "What is Alex Example's salary?",
    k=5,
    filter={"department": "hr"},
)

print("HR-filtered results:", len(results))

for doc in results:
    print("\nSource:", doc.metadata.get("source"))
    print("Department:", doc.metadata.get("department"))
    print("Content:", doc.page_content)