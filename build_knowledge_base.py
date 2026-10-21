
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_DIR = BASE_DIR / "chroma_db"
COLLECTION_NAME = "company_handbook"

# 1. Load every text document and assign lab access metadata
documents = []

print("Data directory:", DATA_DIR)

for file_path in sorted(DATA_DIR.glob("*.txt")):
    text = file_path.read_text(encoding="utf-8")

    if file_path.name == "hr_confidential.txt":
        department = "hr"
        classification = "confidential"
    else:
        department = "all"
        classification = "internal"

    documents.append(
        Document(
            page_content=text,
            metadata={
                "source": file_path.name,
                "department": department,
                "classification": classification,
            },
        )
    )

print(f"\nLoaded {len(documents)} documents:")
for doc in documents:
    print(
        f"- {doc.metadata['source']} "
        f"(department={doc.metadata['department']})"
    )

# 2. Split all documents into chunks
splitter = RecursiveCharacterTextSplitter(
    chunk_size=350,
    chunk_overlap=50,
)

chunks = splitter.split_documents(documents)

print(f"\nCreated {len(chunks)} chunks:")
for chunk in chunks:
    print(
        f"Source: {chunk.metadata['source']} | "
        f"Department: {chunk.metadata['department']}"
    )

# 3. Create local embeddings
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"},
)

# 4. Replace the lab's existing collection
vector_store = Chroma(
    collection_name=COLLECTION_NAME,
    embedding_function=embeddings,
    persist_directory=str(DB_DIR),
)

vector_store.delete_collection()

vector_store = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory=str(DB_DIR),
    collection_name=COLLECTION_NAME,
)

print("\nKnowledge base rebuilt successfully!")
print("Total indexed chunks:", vector_store._collection.count())

# 5. Test ordinary semantic retrieval
query = "What are the requirements for remote access?"
results = vector_store.similarity_search(query, k=2)

print(f"\nQuery: {query}")
print("\nRetrieved context:")

for index, result in enumerate(results, start=1):
    print(f"\n--- Result {index} ---")
    print(result.page_content)
    print("Source:", result.metadata.get("source"))
