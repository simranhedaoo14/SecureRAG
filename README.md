# SecureRAG — Enterprise RAG Security Lab

A hands-on AI security project exploring vulnerabilities in Retrieval-Augmented Generation (RAG) systems and implementing defensive controls through controlled attack-and-defense experiments.

## Overview

SecureRAG is a security-focused RAG chatbot built with LangChain, ChromaDB, local sentence-transformer embeddings, and Google's Gemini API.

The project uses a fictional company knowledge base to investigate how retrieved documents can influence LLM behavior, how sensitive information can be exposed, and how authorization policies can restrict access to confidential content.

The goal is to build a working RAG pipeline, test its security boundaries, and evaluate defensive controls using repeatable experiments.

## Architecture

1. **Document ingestion:** Load fictional company documents from the local `data/` directory.
2. **Text processing:** Split documents into smaller chunks and attach metadata such as source, department, and classification.
3. **Embedding generation:** Generate local embeddings using Sentence Transformers.
4. **Vector storage:** Store document chunks in ChromaDB for semantic retrieval.
5. **Authorization:** Filter retrieved chunks according to the simulated user's department and document classification.
6. **LLM generation:** Pass authorized context to Gemini using a security-focused LangChain prompt.
7. **Security evaluation:** Run automated tests to verify document access restrictions.

## Technology Stack

- **Python** — application development and security testing
- **LangChain** — RAG pipeline orchestration
- **ChromaDB** — vector storage and semantic retrieval
- **Sentence Transformers** — local embedding generation
- **Google Gemini API** — language generation
- **Git and GitHub** — version control

## Security Features

- **Department-based access control:** Shared internal documents and HR-confidential documents follow separate access rules.
- **Metadata-based authorization:** Retrieved chunks are checked against department and classification metadata.
- **Default-deny behavior:** Documents with missing or unexpected metadata are not authorized by the current retrieval policy.
- **Prompt-injection defense:** The system prompt instructs the model to treat retrieved documents as untrusted data rather than executable instructions.
- **Automated regression tests:** Verify that unauthorized users cannot retrieve HR documents while authorized users can.

### Security Test Results

The current security regression suite contains nine passing tests covering:

- Department-based document authorization.
- Denial of access for unknown users and missing user departments.
- Denial of documents with missing or unexpected metadata.
- Verification that HR salary data is absent from Engineering users' retrieved context.
- Verification that HR salary data is absent when the user's department is missing.
- Verification that the synthetic prompt-injection payload can be retrieved from the security notice.

The tests exercise the shared authorization function and ChromaDB retrieval using synthetic data. They run without calling the Gemini API.

In a separate manual experiment, Gemini summarized the security notice rather than following its embedded malicious instruction. This demonstrates resistance to the specific payload tested, not guaranteed protection against all prompt-injection attacks.

These results validate the tested retrieval and authorization scenarios; they do not prove that every possible sensitive-data leakage path is prevented or that the application is production-secure.

### Indirect Prompt-Injection Experiment

A synthetic security notice contains instructions attempting to override the chatbot's normal behavior.

In the observed test, the model summarized the legitimate security guidance instead of following the embedded instruction. A strengthened prompt was then introduced to reinforce the distinction between retrieved data and trusted instructions.

This is a successful result for the tested example, not proof of immunity to prompt injection.

## Project Structure

```text
SecureRAG/
├── data/
│   ├── company_handbook.txt
│   ├── hr_confidential.txt
│   └── security_notice.txt
├── authorization.py
├── build_knowledge_base.py
├── rag_chatbot.py
├── test_authorization.py
├── test_gemini.py
├── check_retrieval.py
├── .gitignore
└── README.md
```

The `chroma_db/` directory is generated locally and should not be committed to version control.

## Getting Started

1. Install Python 3.12 or a compatible version.
2. Create and activate a Python virtual environment.
3. Install the required dependencies.
4. Create a local `.env` file containing your Gemini API key:

   ```text
   GOOGLE_API_KEY=your_api_key_here
   ```

5. Add the synthetic text documents to `data/`.
6. Build the knowledge base:

   ```bash
   python build_knowledge_base.py
   ```

7. Launch the chatbot:

   ```bash
   python rag_chatbot.py
   ```

8. Run the authorization regression tests:

   ```bash
   python test_authorization.py
   ```

Never commit API keys, credentials, real confidential documents, or local environment files.

## Current Limitations

- User identities and departments are simulated in local code rather than established through a production authentication system.
- Authorization is enforced by application-level retrieval filtering; this project has not been assessed as a complete production authorization architecture.
- Prompt-based defenses cannot guarantee resistance to all indirect prompt-injection attacks.
- The current automated authorization tests validate retrieval behavior, not every possible information-leakage path through an LLM.
- Gemini API usage is subject to the configured project's quota and rate limits.

## Learning Objectives

- Understand LangChain-based RAG architecture.
- Investigate indirect prompt injection and retrieval-related security failures.
- Implement and test document-level access restrictions.
- Explore sensitive-data protection and security logging.
- Compare baseline and hardened RAG behavior.
- Develop repeatable security regression tests for AI applications.

## Project Status

**In development** — Core RAG functionality, simulated department-based authorization, prompt-injection testing, and six authorization regression tests are implemented and passing.

Current capabilities include metadata-based document filtering, default-deny handling for missing or unexpected document metadata, and a security-focused prompt that treats retrieved documents as untrusted data.

Future work includes broader adversarial testing, sensitive-data leakage evaluation, input/output security controls, improved security logging, and systematic attack-versus-defense comparisons.

**Limitations:** User identities are simulated locally, and prompt-based defenses do not guarantee immunity to prompt injection. The project has not undergone a comprehensive production security assessment.