import os
from dotenv import load_dotenv
from .vector_store import FaissVectorStore
from langchain_groq import ChatGroq
from .data_loader import DocumentLoader
from .structured_response import RAGResponse
load_dotenv()

class RAGSearch:
    def __init__(self, persist_dir: str = "faiss_store",
                embedding_model: str = "all-MiniLM-L6-v2",
                llm_model: str = "openai/gpt-oss-120b"
                ):
        self.vectorstore = FaissVectorStore(persist_dir, embedding_model)

        faiss_path = os.path.join(persist_dir, "faiss.index")
        meta_path = os.path.join(persist_dir, "metadata.pkl")

        if not (os.path.exists(faiss_path) and os.path.exists(meta_path)):
            docs = DocumentLoader().load_all_documents()
            self.vectorstore.build_from_documents(docs)

        else:
            self.vectorstore.load()
     
        groq_api_key = os.getenv("GROQ_API_KEY")
        self.llm = ChatGroq(groq_api_key=groq_api_key, model_name = llm_model)
        print(f"[INFO] Groq LLM initiated: {llm_model}")

    def search_and_summarize(self, query: str, top_k:int = 5)->str:
        results = self.vectorstore.query(query, top_k=top_k)
        texts = [r['metadata'].get("text", "") for r in results if r['metadata']]
        context = "\n\n".join(texts)
        if not context:
            return "No Relavant Document Found!"


        prompt = f"""
You are YellowDoc.ai, an AI assistant that answers questions about financial documents.

Your task is to answer the user's question using ONLY the information provided in the retrieved context.

Instructions:
- Base every answer strictly on the retrieved context.
- Do not use outside knowledge or make assumptions.
- If the answer is not present in the context, say:
  "The uploaded documents do not contain enough information to answer this question."
- When appropriate, quote important values exactly (invoice numbers, dates, totals, tax amounts, vendor names, etc.).
- If the question requires calculations using values present in the context, perform them.
- Keep answers clear, concise, and well structured.
- Use bullet points or tables whenever they improve readability.
- Never hallucinate missing information.
- Return the response in the specified JSON format.

User Question:
{query}

Retrieved Context:
{context}
"""
        
        structured_llm = self.llm.with_structured_output(RAGResponse)
        response = structured_llm.invoke([prompt])
        return response

