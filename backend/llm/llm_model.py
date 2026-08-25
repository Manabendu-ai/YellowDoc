from langchain_groq import ChatGroq
from langchain.messages import SystemMessage
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from groq import BadRequestError
import os
import time
from .json_response import JsonFormatResponse
from .system_message import message
from dotenv import load_dotenv
import json

load_dotenv()

os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")

class ModelEngine:

    def __init__(self):
        self.model = ChatGroq(
            model = "openai/gpt-oss-120b",
            temperature = 0
        )

        self.agent = create_agent(
            model=self.model,
            tools=[],
            system_prompt=message,
            response_format=ToolStrategy(JsonFormatResponse)
        )

        print("[INFO] LLM Model loaded Successfully!")

    def run(self, markdown : str)->JsonFormatResponse:
        """Invoke the agent, retrying transient Groq JSON-validation failures.

        Groq structured output intermittently returns an empty generation
        ('json_validate_failed' with empty failed_generation). A short retry
        loop resolves it without failing the whole conversion.
        """
        max_attempts = 3
        last_error = None

        for attempt in range(1, max_attempts + 1):
            try:
                result = self.agent.invoke(
                    {
                        "messages" : [
                            {
                                "role" : "user",
                                "content" : markdown
                            }
                        ]
                    }
                )
                self.response = result.get("structured_response")
                if self.response is None:
                    raise ValueError("Model returned an empty structured response.")
                return self.response

            except (BadRequestError, ValueError, KeyError) as e:
                last_error = e
                message_text = str(e)
                transient = (
                    isinstance(e, (ValueError, KeyError))
                    or "json_validate_failed" in message_text
                )
                if not transient or attempt == max_attempts:
                    raise
                print(f"[WARN] LLM attempt {attempt}/{max_attempts} failed, retrying: {message_text[:150]}")
                time.sleep(2 * attempt)

        raise RuntimeError(f"LLM failed after {max_attempts} attempts: {last_error}")

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
