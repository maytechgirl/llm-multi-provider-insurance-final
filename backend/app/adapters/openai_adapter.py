from openai import AsyncOpenAI

from .base import LLMProvider, LLMResponse


class OpenAIAdapter(LLMProvider):
    name = "openai"

    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def generate(
        self,
        prompt: str,
        model: str,
        system_prompt: str = "",
    ) -> LLMResponse:

        response = await self.client.responses.create(
            model=model,
            instructions=system_prompt,
            input=prompt,
        )

        usage = response.usage

        return LLMResponse(
            text=response.output_text,
            input_tokens=usage.input_tokens if usage else 0,
            output_tokens=usage.output_tokens if usage else 0,
        )