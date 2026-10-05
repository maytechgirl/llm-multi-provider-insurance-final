from pydantic import BaseModel
from typing import Optional

class CompareRequest(BaseModel):
    prompt_id: str
    prompt: str
    system_prompt: str = ""
    providers: list[str] = ["ollama"]
    model_overrides: dict[str, str] = {}

class ProviderResult(BaseModel):
    prompt_id: str
    provider: str
    model: str
    response: str
    input_tokens: int = 0
    output_tokens: int = 0
    latency_ms: float = 0
    estimated_cost_usd: float = 0
    status: str = "success"
    error: Optional[str] = None
