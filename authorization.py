
def retrieve_authorized_documents(vector_store, question, user):
    """Retrieve relevant documents and enforce department-based access."""

    candidates = vector_store.similarity_search(question, k=10)
    authorized = []

    user_department = user.get("department", "").lower()

    for doc in candidates:
        metadata = doc.metadata
        department = metadata.get("department", "").lower()
        classification = metadata.get("classification", "").lower()

        # Shared internal documents
        if department == "all" and classification == "internal":
            authorized.append(doc)

        # Confidential HR documents
        elif (
            department == "hr"
            and classification == "confidential"
            and user_department == "hr"
        ):
            authorized.append(doc)

    return authorized[:3]
