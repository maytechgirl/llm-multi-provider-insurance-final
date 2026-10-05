import asyncio
import csv
import json
from pathlib import Path

import httpx


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROMPTS_FILE = PROJECT_ROOT / "prompts" / "benchmark_prompts.json"
RESULTS_DIR = PROJECT_ROOT / "results"

BENCHMARK_PROMPTS = ["P01", "P02", "P04", "P05", "P06"]
PROVIDERS = ["ollama", "openai", "anthropic"]

API_URL = "http://localhost:8000/compare"


def load_benchmark():
    with open(PROMPTS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


async def run_prompt(client, benchmark, prompt_data):
    payload = {
        "prompt_id": prompt_data["id"],
        "system_prompt": benchmark["system_prompt"],
        "prompt": prompt_data["prompt"],
        "providers": PROVIDERS,
    }

    response = await client.post(API_URL, json=payload)
    response.raise_for_status()

    return response.json()


async def main():
    benchmark = load_benchmark()

    selected_prompts = [
        prompt
        for prompt in benchmark["prompts"]
        if prompt["id"] in BENCHMARK_PROMPTS
    ]

    print("========================================")
    print("LLM Multi-Provider Insurance Benchmark")
    print("========================================")
    print(f"Prompts: {len(selected_prompts)}")
    print(f"Providers: {len(PROVIDERS)}")
    print(f"Evaluaciones: {len(selected_prompts) * len(PROVIDERS)}")
    print()

    results = []

    async with httpx.AsyncClient(timeout=120) as client:

        for prompt_data in selected_prompts:

            print(
                f"Ejecutando {prompt_data['id']} - "
                f"{prompt_data['name']}..."
            )

            result = await run_prompt(
                client,
                benchmark,
                prompt_data,
            )

            results.append(result)

            successful = sum(
                1
                for item in result["results"]
                if item["status"] == "success"
            )

            print(
                f"  Resultado: {successful}/{len(PROVIDERS)} "
                "proveedores exitosos"
            )

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    json_file = RESULTS_DIR / "benchmark-results.json"

    with open(json_file, "w", encoding="utf-8") as file:
        json.dump(
            {
                "benchmark_name": benchmark["benchmark_name"],
                "version": benchmark["version"],
                "prompts": BENCHMARK_PROMPTS,
                "providers": PROVIDERS,
                "total_evaluations": len(results) * len(PROVIDERS),
                "results": results,
            },
            file,
            ensure_ascii=False,
            indent=2,
        )

    csv_file = RESULTS_DIR / "benchmark-results.csv"

    rows = []

    for prompt_result in results:
        prompt_id = prompt_result["prompt_id"]

        for provider_result in prompt_result["results"]:
            rows.append(
                {
                    "prompt_id": prompt_id,
                    "provider": provider_result["provider"],
                    "model": provider_result["model"],
                    "response": provider_result["response"],
                    "input_tokens": provider_result["input_tokens"],
                    "output_tokens": provider_result["output_tokens"],
                    "latency_ms": provider_result["latency_ms"],
                    "estimated_cost_usd": provider_result[
                        "estimated_cost_usd"
                    ],
                    "status": provider_result["status"],
                    "error": provider_result.get("error", ""),
                }
            )

    fieldnames = [
        "prompt_id",
        "provider",
        "model",
        "response",
        "input_tokens",
        "output_tokens",
        "latency_ms",
        "estimated_cost_usd",
        "status",
        "error",
    ]

    with open(csv_file, "w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames,
        )

        writer.writeheader()
        writer.writerows(rows)

    print()
    print("========================================")
    print("Benchmark completado")
    print("========================================")
    print(f"JSON: {json_file}")
    print(f"CSV:  {csv_file}")


if __name__ == "__main__":
    asyncio.run(main())