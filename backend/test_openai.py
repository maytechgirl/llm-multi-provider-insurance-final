import asyncio
import os

from dotenv import load_dotenv

from app.adapters.openai_adapter import OpenAIAdapter


load_dotenv()


async def main():
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError("OPENAI_API_KEY no está configurada")

    adapter = OpenAIAdapter(api_key)

    response = await adapter.generate(
        prompt="Explica en una sola frase qué es un siniestro vehicular.",
        model="gpt-6-luna",
    )

    print("\n--- RESPUESTA OPENAI ---")
    print(response.text)

    print("\n--- MÉTRICAS ---")
    print(f"Input tokens: {response.input_tokens}")
    print(f"Output tokens: {response.output_tokens}")


if __name__ == "__main__":
    asyncio.run(main())