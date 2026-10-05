import os
import time
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.adapters.ollama import OllamaAdapter
from app.adapters.openai_adapter import OpenAIAdapter
from app.adapters.anthropic_adapter import AnthropicAdapter
from app.core.cost import estimate_cost

load_dotenv()

PRICING_FILE = (
    Path(__file__).resolve().parents[2] / "config" / "pricing.json"
)

with open(PRICING_FILE, "r", encoding="utf-8") as f:
    PRICING = json.load(f)

app = FastAPI(
    title="LLM Multi-Provider Insurance Comparator",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CompareRequest(BaseModel):
    prompt_id: str
    prompt: str
    system_prompt: str = ""
    providers: list[str] = ["ollama"]
    model_overrides: dict[str, str] = {}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/providers")
def providers():
    return {
        "providers": [
            {
                "name": "ollama",
                "models": list(
                    PRICING["providers"]["ollama"]["models"].keys()
                ),
                "local": True,
                "configured": True,
            },
            {
                "name": "openai",
                "models": list(
                    PRICING["providers"]["openai"]["models"].keys()
                ),
                "local": False,
                "configured": bool(os.getenv("OPENAI_API_KEY")),
            },
            {
                "name": "anthropic",
                "models": list(
                    PRICING["providers"]["anthropic"]["models"].keys()
                ),
                "local": False,
                "configured": bool(os.getenv("ANTHROPIC_API_KEY")),
            },
        ]
    }


@app.get("/benchmark/results")
def benchmark_results():
    results_file = (
        Path(__file__).resolve().parents[2]
        / "results"
        / "benchmark-results.json"
    )

    if not results_file.exists():
        return {
            "status": "not_found",
            "message": "No existen resultados de benchmark.",
        }

    with open(results_file, "r", encoding="utf-8") as f:
        return json.load(f)
    

@app.get("/benchmark/quality")
def benchmark_quality():
    quality_file = (
        Path(__file__).resolve().parents[2]
        / "results"
        / "quality-scores.csv"
    )

    if not quality_file.exists():
        return {
            "status": "not_found",
            "message": "No existe quality-scores.csv.",
        }

    with open(quality_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    if not lines:
        return {
            "status": "empty",
            "message": "quality-scores.csv está vacío.",
        }

    headers = [h.strip() for h in lines[0].strip().split(",")]

    rows = []

    for line in lines[1:]:
        values = [v.strip() for v in line.strip().split(",")]

        if len(values) == len(headers):
            rows.append(dict(zip(headers, values)))

    return {
        "status": "success",
        "rows": rows,
    }


@app.post("/compare")
async def compare(request: CompareRequest):

    async def run_provider(provider: str):
        model_defaults = {
            "ollama": "llama3.2",
            "openai": "gpt-6-luna",
            "anthropic": "claude-sonnet-5",
        }

        model = request.model_overrides.get(
            provider,
            model_defaults.get(provider, "default"),
        )

        if provider == "ollama":
            adapter = OllamaAdapter()

        elif provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")

            if not api_key:
                return {
                    "provider": provider,
                    "model": model,
                    "response": "",
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "latency_ms": 0,
                    "estimated_cost_usd": 0,
                    "status": "not_configured",
                    "error": "OPENAI_API_KEY no configurada",
                }

            adapter = OpenAIAdapter(api_key)

        elif provider == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY")

            if not api_key:
                return {
                    "provider": provider,
                    "model": model,
                    "response": "",
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "latency_ms": 0,
                    "estimated_cost_usd": 0,
                    "status": "not_configured",
                    "error": "ANTHROPIC_API_KEY no configurada",
                }

            adapter = AnthropicAdapter(api_key)

        else:
            return {
                "provider": provider,
                "model": model,
                "response": "",
                "input_tokens": 0,
                "output_tokens": 0,
                "latency_ms": 0,
                "estimated_cost_usd": 0,
                "status": "not_configured",
                "error": f"Proveedor no soportado: {provider}",
            }

        start_time = time.perf_counter()

        try:
            llm_response = await adapter.generate(
                prompt=request.prompt,
                model=model,
                system_prompt=request.system_prompt,
            )

            latency_ms = round(
                (time.perf_counter() - start_time) * 1000,
                2,
            )

            pricing = PRICING["providers"][provider]["models"][model]

            estimated_cost = estimate_cost(
                input_tokens=llm_response.input_tokens,
                output_tokens=llm_response.output_tokens,
                input_price_per_1m=pricing["input_per_1m_tokens"],
                output_price_per_1m=pricing["output_per_1m_tokens"],
            )

            return {
                "provider": provider,
                "model": model,
                "response": llm_response.text,
                "input_tokens": llm_response.input_tokens,
                "output_tokens": llm_response.output_tokens,
                "latency_ms": latency_ms,
                "estimated_cost_usd": estimated_cost,
                "status": "success",
            }

        except Exception as exc:
            latency_ms = round(
                (time.perf_counter() - start_time) * 1000,
                2,
            )

            return {
                "provider": provider,
                "model": model,
                "response": "",
                "input_tokens": 0,
                "output_tokens": 0,
                "latency_ms": latency_ms,
                "estimated_cost_usd": 0,
                "status": "error",
                "error": str(exc),
            }

    results = await asyncio.gather(
        *(run_provider(provider) for provider in request.providers)
    )

    return {
        "prompt_id": request.prompt_id,
        "results": results,
    }