def estimate_cost(input_tokens: int, output_tokens: int, input_price_per_1m: float, output_price_per_1m: float) -> float:
    return (
        (input_tokens / 1_000_000) * input_price_per_1m
        + (output_tokens / 1_000_000) * output_price_per_1m
    )
