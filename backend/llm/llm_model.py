from langchain_groq import ChatGroq
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from groq import BadRequestError
import os
import threading
import time
from .json_response import JsonFormatResponse
from .system_message import message
from dotenv import load_dotenv
import json

load_dotenv()

# os.environ[...] = None raises TypeError, so a missing key used to crash the
# server at import time rather than reporting itself as a configuration problem.
_groq_key = os.getenv("GROQ_API_KEY")
if _groq_key:
    os.environ["GROQ_API_KEY"] = _groq_key


_agent = None
_agent_lock = threading.Lock()


def get_agent():
    """The one structuring agent for this process.

    Built per request before, which meant a new ChatGroq client and a new agent
    graph on every upload. Cheaper than the Docling converter, but it is the same
    mistake and it compounds the same way.
    """
    global _agent
    if _agent is not None:
        return _agent
    with _agent_lock:
        if _agent is None:
            if not os.getenv("GROQ_API_KEY"):
                raise RuntimeError(
                    "GROQ_API_KEY is not set; the structuring step cannot run."
                )
            model = ChatGroq(model="openai/gpt-oss-120b", temperature=0)
            _agent = create_agent(
                model=model,
                tools=[],
                system_prompt=message,
                response_format=ToolStrategy(JsonFormatResponse),
            )
            print("[INFO] LLM agent built (first use)")
        return _agent


class ModelEngine:

    def __init__(self):
        self.response = None

    @property
    def agent(self):
        return get_agent()

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
