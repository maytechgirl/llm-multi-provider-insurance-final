from pathlib import Path
import json

PROMPTS_PATH = Path(__file__).resolve().parents[3] / "prompts" / "benchmark_prompts.json"

def load_prompts():
    with open(PROMPTS_PATH, encoding="utf-8") as f:
        return json.load(f)
