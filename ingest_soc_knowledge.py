
from pathlib import Path

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

BASE_DIR = Path(__file__).resolve().parent
KB_DIR = BASE_DIR / "SecureRAG_SOC_Knowledge_Base"

if not KB_DIR.exists():
    raise FileNotFoundError(f"SOC knowledge base not found: {KB_DIR}")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"},
)

vector_store = Chroma(
    collection_name="soc_security_kb",
    embedding_function=embeddings,
    persist_directory=str(BASE_DIR / "chroma_db"),
)

documents = []

for path in sorted(KB_DIR.glob("*.md")):
    if path.name.lower() == "readme.md":
        continue

    content = path.read_text(encoding="utf-8").strip()

    if not content:
        continue

    documents.append(
        Document(
            page_content=content,
            metadata={
                "source": path.name,
                "department": "soc",
                "classification": "internal",
            },
        )
    )

if not documents:
    raise RuntimeError(
        f"No SOC Markdown playbooks found in {KB_DIR}"
    )

# Replace previously ingested copies of these playbooks.
for doc in documents:
    vector_store.delete(
        where={"source": doc.metadata["source"]}
    )

vector_store.add_documents(documents)

print(f"Indexed {len(documents)} SOC playbooks.")
print(f"Collection: {vector_store._collection.name}")
