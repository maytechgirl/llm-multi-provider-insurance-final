export type ComparisonResult = {
  prompt_id: string;
  provider: string;
  model: string;
  response: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  estimated_cost_usd: number;
  status: string;
  error?: string;
};
