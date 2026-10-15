
from pathlib import Path
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from authorization import retrieve_authorized_documents
from langchain_core.documents import Document

# Simulated authenticated user for local security testing
CURRENT_USER = {
    "username": "alice",
    "department": "engineering",
}

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




def test_engineering_cannot_retrieve_hr_data():
    alice = {"username": "alice", "department": "engineering"}

    docs = retrieve_authorized_documents(
        vector_store,
        "What is Alex Example's salary?",
        alice,
    )

    assert all(
        doc.metadata.get("source") != "hr_confidential.txt"
        for doc in docs
    ), "FAIL: Engineering user retrieved HR data"

    print("PASS: Engineering user cannot retrieve HR data")


def test_hr_can_retrieve_hr_data():
    bob = {"username": "bob", "department": "hr"}

    docs = retrieve_authorized_documents(
        vector_store,
        "What is Alex Example's salary?",
        bob,
    )

    assert any(
        doc.metadata.get("source") == "hr_confidential.txt"
        for doc in docs
    ), "FAIL: HR user could not retrieve HR data"

    print("PASS: HR user can retrieve HR data")


def test_unknown_department_cannot_retrieve_hr_data():
    unknown_user = {"username": "unknown", "department": "finance"}

    docs = retrieve_authorized_documents(
        vector_store,
        "What is Alex Example's salary?",
        unknown_user,
    )

    assert all(
        doc.metadata.get("source") != "hr_confidential.txt"
        for doc in docs
    ), "FAIL: Unauthorized department retrieved HR data"

    print("PASS: Unknown department cannot retrieve HR data")




def test_missing_department_is_denied():
    class MockVectorStore:
        def similarity_search(self, question, k=10):
            return [
                Document(
                    page_content="Synthetic confidential test data",
                    metadata={
                        "source": "hr_confidential.txt",
                        "classification": "confidential",
                    },
                )
            ]

    user = {"username": "alice", "department": "engineering"}

    docs = retrieve_authorized_documents(
        MockVectorStore(),
        "What is Alex Example's salary?",
        user,
    )

    assert all(
        doc.metadata.get("source") != "hr_confidential.txt"
        for doc in docs
    ), "FAIL: Missing department metadata was authorized"

    print("PASS: Missing department metadata is denied")


def test_unexpected_classification_is_denied():
    class MockVectorStore:
        def similarity_search(self, question, k=10):
            return [
                Document(
                    page_content="Synthetic confidential test data",
                    metadata={
                        "source": "hr_confidential.txt",
                        "department": "hr",
                        "classification": "unknown",
                    },
                )
            ]

    user = {"username": "bob", "department": "hr"}

    docs = retrieve_authorized_documents(
        MockVectorStore(),
        "What is Alex Example's salary?",
        user,
    )

    assert all(
        doc.metadata.get("source") != "hr_confidential.txt"
        for doc in docs
    ), "FAIL: Unexpected classification was authorized"

    print("PASS: Unexpected classification is denied")


def test_missing_user_department_cannot_retrieve_hr_data():
    user = {"username": "unknown"}

    docs = retrieve_authorized_documents(
        vector_store,
        "What is Alex Example's salary?",
        user,
    )

    assert all(
        doc.metadata.get("source") != "hr_confidential.txt"
        for doc in docs
    ), "FAIL: User without department retrieved HR data"

    print("PASS: Missing user department cannot retrieve HR data")


if __name__ == "__main__":
    test_engineering_cannot_retrieve_hr_data()
    test_hr_can_retrieve_hr_data()
    test_unknown_department_cannot_retrieve_hr_data()
    test_missing_department_is_denied()
    test_unexpected_classification_is_denied()
    test_missing_user_department_cannot_retrieve_hr_data()
    print("\nAll authorization tests passed.")




