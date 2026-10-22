
def retrieve_authorized_documents(vector_store, question, user):
    """Retrieve documents allowed for the authenticated user's role."""

    candidates = vector_store.similarity_search(question, k=10)
    authorized = []

    department = str(user.get("department", "")).strip().lower()
    role = str(user.get("role", "")).strip().lower()

    # SOC analysts can access only documents explicitly classified
    # for the SOC role in the SOC knowledge base.
    if role == "soc_analyst" or department == "soc":
        for doc in candidates:
            metadata = doc.metadata or {}
            doc_department = str(
                metadata.get("department", "")
            ).strip().lower()
            doc_classification = str(
                metadata.get("classification", "")
            ).strip().lower()

            if (
                doc_department == "soc"
                and doc_classification in {"internal", "confidential"}
            ):
                authorized.append(doc)

        return authorized[:3]

    # Existing departmental access rules.
    if department not in {"hr", "engineering", "finance"}:
        return []

    for doc in candidates:
        metadata = doc.metadata or {}
        doc_department = str(
            metadata.get("department", "")
        ).strip().lower()
        doc_classification = str(
            metadata.get("classification", "")
        ).strip().lower()

        # Shared internal documents.
        if (
            doc_department == "all"
            and doc_classification == "internal"
        ):
            authorized.append(doc)

        # Confidential HR documents.
        elif (
            doc_department == "hr"
            and doc_classification == "confidential"
            and department == "hr"
        ):
            authorized.append(doc)

        # Engineering and Finance receive no additional access
        # until their own document policies are explicitly defined.

    return authorized[:3]
