import httpx

from .base import LLMProvider, LLMResponse


class OllamaAdapter(LLMProvider):
    name = "ollama"

    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url

    async def generate(
        self,
        prompt: str,
        model: str,
        system_prompt: str = "",
    ) -> LLMResponse:

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": model,
                    "system": system_prompt,
                    "prompt": prompt,
                    "stream": False,
                },
            )

            response.raise_for_status()
            data = response.json()

        return LLMResponse(
            text=data.get("response", ""),
            input_tokens=data.get("prompt_eval_count", 0) or 0,
            output_tokens=data.get("eval_count", 0) or 0,
        )