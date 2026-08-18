from langchain_groq import ChatGroq
from langchain.messages import SystemMessage
from langchain.agents import create_agent
import os
from .json_response import JsonFormatResponse
from .system_message import message
from dotenv import load_dotenv
import json

load_dotenv()

os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")

class ModelEngine:

    def __init__(self):
        self.model = ChatGroq(
            model = "openai/gpt-oss-120b"
        )

        self.agent = create_agent(
            model=self.model,
            tools=[],
            system_prompt=message,
            response_format=JsonFormatResponse
        )

        print("[INFO] LLM Model loaded Successfully!")

    def run(self, markdown : str)->JsonFormatResponse:
        self.response =  self.agent.invoke(
            {
                "messages" : [
                    {
                        "role" : "user",
                        "content" : markdown
                    }
                ]
            }
        )["structured_response"]

        return self.response

    def save(self, file_name, persist_dir:str = "docs/")->str:
        try:
            os.makedirs(persist_dir, exist_ok=True)
            json_path = os.path.join(persist_dir, f"{file_name}.json")

            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(self.response.model_dump(), f, indent = 4, ensure_ascii=False)

            print(f"[SUCCESS] File Saved at : {json_path}")
            return json_path
        except Exception as e:
            print(f"Exception at file saving: {e}")



    