import asyncio
import os

from dotenv import load_dotenv

from app.adapters.anthropic_adapter import AnthropicAdapter


load_dotenv("../.env")


async def main():
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY no está configurada")

    adapter = AnthropicAdapter(api_key)

    response = await adapter.generate(
        prompt="Explica en una sola frase qué es un siniestro vehicular.",
        model="claude-sonnet-5",
    )

    print("\n--- RESPUESTA ANTHROPIC ---")
    print(response.text)

    print("\n--- MÉTRICAS ---")
    print(f"Input tokens: {response.input_tokens}")
    print(f"Output tokens: {response.output_tokens}")


if __name__ == "__main__":
    asyncio.run(main())