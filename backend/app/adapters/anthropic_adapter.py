from anthropic import AsyncAnthropic

from .base import LLMProvider, LLMResponse


class AnthropicAdapter(LLMProvider):
    name = "anthropic"

    def __init__(self, api_key: str):
        self.client = AsyncAnthropic(api_key=api_key)

    async def generate(
        self,
        prompt: str,
        model: str,
        system_prompt: str = "",
    ) -> LLMResponse:

        response = await self.client.messages.create(
            model=model,
            max_tokens=1024,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        text = ""

        for block in response.content:
            if hasattr(block, "text"):
                text += block.text

        return LLMResponse(
            text=text,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
        )