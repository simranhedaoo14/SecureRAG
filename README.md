# SecureRAG — Enterprise RAG Security Lab

A hands-on AI security project exploring vulnerabilities in Retrieval-Augmented Generation (RAG) systems and demonstrating how to mitigate them.

## Overview

SecureRAG uses LangChain, ChromaDB, and Google's Gemini API to build a chatbot that retrieves relevant information from a fictional company knowledge base.

The project follows an attack-and-defense approach: first establish a working RAG pipeline, then demonstrate security weaknesses in a controlled environment and implement defensive controls.

## Technology Stack

- **Python** — application development
- **LangChain** — RAG pipeline orchestration
- **ChromaDB** — vector storage and similarity search
- **Sentence Transformers** — local text embeddings
- **Google Gemini API** — language generation
- **Git and GitHub** — version control

## Current Progress

- [x] Document loading and chunking
- [x] Local embedding generation
- [x] ChromaDB vector storage
- [x] Semantic retrieval
- [x] Gemini API integration
- [x] Working RAG chatbot
- [ ] Indirect prompt-injection testing
- [ ] Unauthorized document retrieval testing
- [ ] Sensitive-data leakage testing
- [ ] Access-control enforcement
- [ ] Input and output security controls
- [ ] Security evaluation and attack-versus-defense comparison

## Project Structure

```text
SecureRAG/
├── data/
│   └── company_handbook.txt
├── build_knowledge_base.py
├── rag_chatbot.py
├── test_gemini.py
├── .gitignore
└── README.md
```

## Getting Started

1. Install Python 3.12 or a compatible version.
2. Create and activate a Python virtual environment.
3. Install the required Python packages.
4. Configure your Gemini API key in a local `.env` file.
5. Add fictional text documents to the `data/` directory.
6. Build the knowledge base and launch the chatbot.

Never commit API keys, credentials, private documents, or local environment files.

## Security Scope

All vulnerability demonstrations will use synthetic documents and fake credentials in a controlled test environment. Security controls will be evaluated against the same test cases used against the vulnerable baseline.

## Learning Objectives

- Understand LangChain-based RAG architecture.
- Investigate indirect prompt injection and retrieval-related security failures.
- Implement and evaluate document access controls.
- Explore sensitive-data protection and security logging.
- Compare vulnerable and hardened RAG behavior.

**Project status:** In development.
