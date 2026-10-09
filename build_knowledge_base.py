
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

# Project paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_DIR = BASE_DIR / "chroma_db"

# Load the sample document
file_path = DATA_DIR / "company_handbook.txt"
text = file_path.read_text(encoding="utf-8")

documents = [
    Document(
        page_content=text,
        metadata={"source": file_path.name}
    )
]

# Split the document into smaller chunks
splitter = RecursiveCharacterTextSplitter(
    chunk_size=350,
    chunk_overlap=50
)
chunks = splitter.split_documents(documents)

print(f"Loaded document: {file_path.name}")
print(f"Created {len(chunks)} chunks")

# Convert chunks into embeddings locally
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"}
)

# Store the embeddings in ChromaDB
vector_store = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory=str(DB_DIR),
    collection_name="company_handbook"
)

print("Knowledge base created successfully!")

# Retrieve relevant chunks
query = "What are the requirements for remote access?"

results = vector_store.similarity_search(query, k=2)

print(f"\nQuery: {query}")
print("\nRetrieved context:")

for index, result in enumerate(results, start=1):
    print(f"\n--- Result {index} ---")
    print(result.page_content)
    print("Source:", result.metadata["source"])
