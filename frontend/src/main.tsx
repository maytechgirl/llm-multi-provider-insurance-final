import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

type ProviderResult = {
  provider: string;
  model: string;
  response: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  estimated_cost_usd: number;
  status: string;
};

type PromptResult = {
  prompt_id: string;
  results: ProviderResult[];
};

type BenchmarkData = {
  benchmark_name: string;
  version: string;
  prompts: string[];
  providers: string[];
  total_evaluations: number;
  results: PromptResult[];
};

type QualityRow = {
  prompt_id: string;
  provider: string;
  model: string;
  precision: number;
  completeness: number;
  safety: number;
  clarity: number;
  utility: number;
  format_adherence: number;
  quality_score: number;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  status: string;
};

type QualityResponse = {
  status: string;
  rows: QualityRow[];
};

const providerNames: Record<string, string> = {
  ollama: "OllAMA",
  openai: "OpenAI",
  anthropic: "Anthropic",
};

function App() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qualityData, setQualityData] =
  useState<QualityResponse | null>(null);

useEffect(() => {
  Promise.all([
    fetch("http://localhost:8000/benchmark/results"),
    fetch("http://localhost:8000/benchmark/quality"),
  ])
    .then(async ([resultsResponse, qualityResponse]) => {
      if (!resultsResponse.ok) {
        throw new Error(
          "No se pudieron obtener los resultados."
        );
      }

      if (!qualityResponse.ok) {
        throw new Error(
          "No se pudieron obtener los resultados de calidad."
        );
      }

      const results = await resultsResponse.json();
      const quality = await qualityResponse.json();

      return { results, quality };
    })
    .then(({ results, quality }) => {
      setData(results);
      setQualityData(quality);
      setLoading(false);
    })
    .catch((err) => {
      setError(err.message);
      setLoading(false);
    });
}, []);

  const allResults = useMemo(() => {
    if (!data) return [];

    return data.results.flatMap((prompt) =>
      prompt.results.map((result) => ({
        ...result,
        prompt_id: prompt.prompt_id,
      }))
    );
  }, [data]);


const qualityStats = useMemo(() => {
  if (!qualityData?.rows) return [];

  return data.providers.map((provider) => {
    const rows = qualityData.rows.filter(
      (row) => row.provider === provider
    );

    const avgQuality =
      rows.reduce(
        (sum, row) => sum + Number(row.quality_score),
        0
      ) / rows.length;

    const avgSafety =
      rows.reduce(
        (sum, row) => sum + Number(row.safety),
        0
      ) / rows.length;

    return {
      provider,
      avgQuality,
      avgSafety,
    };
  });
}, [data, qualityData]);


const providerStats = useMemo(() => {
  if (!data) return [];

  return data.providers
    .map((provider) => {
      const results = allResults.filter((r) => r.provider === provider);

      const avgLatency =
        results.reduce((sum, r) => sum + r.latency_ms, 0) / results.length;

      const totalCost = results.reduce(
        (sum, r) => sum + r.estimated_cost_usd,
        0
      );

      const totalTokens = results.reduce(
        (sum, r) => sum + r.input_tokens + r.output_tokens,
        0
      );

      return {
        provider,
        evaluations: results.length,
        avgLatency,
        totalCost,
        totalTokens,
      };
    })
    .sort((a, b) => a.avgLatency - b.avgLatency);
}, [data, allResults]);

  const executiveRanking = useMemo(() => {
  if (!data || !qualityData?.rows) return [];

  const providers = data.providers;

  const stats = providers.map((provider) => {
    const results = allResults.filter(
      (r) => r.provider === provider
    );

    const qualityRows = qualityData.rows.filter(
      (r) => r.provider === provider
    );

    const avgQuality =
      qualityRows.reduce(
        (sum, r) => sum + Number(r.quality_score),
        0
      ) / qualityRows.length;

    const avgSafety =
      qualityRows.reduce(
        (sum, r) => sum + Number(r.safety),
        0
      ) / qualityRows.length;

    const avgLatency =
      results.reduce(
        (sum, r) => sum + Number(r.latency_ms),
        0
      ) / results.length;

    const totalCost = results.reduce(
      (sum, r) => sum + Number(r.estimated_cost_usd),
      0
    );

    return {
      provider,
      avgQuality,
      avgSafety,
      avgLatency,
      totalCost,
    };
  });

  // Normalización:
  // calidad y seguridad: mayor es mejor.
  const maxQuality = Math.max(
    ...stats.map((s) => s.avgQuality)
  );

  const maxSafety = Math.max(
    ...stats.map((s) => s.avgSafety)
  );

  const maxLatency = Math.max(
    ...stats.map((s) => s.avgLatency)
  );

  const maxCost = Math.max(
    ...stats.map((s) => s.totalCost)
  );

  return stats
    .map((item) => {
      const qualityScore =
        (item.avgQuality / 10) * 100;

      const safetyScore =
        (item.avgSafety / 10) * 100;

      // Para latencia y costo:
      // menor valor = mejor score.
      const latencyScore =
        maxLatency === 0
          ? 100
          : (1 - item.avgLatency / maxLatency) * 100;

      const costScore =
        maxCost === 0
          ? 100
          : (1 - item.totalCost / maxCost) * 100;

      const executiveScore =
        qualityScore * 0.50 +
        safetyScore * 0.20 +
        latencyScore * 0.20 +
        costScore * 0.10;

      return {
        ...item,
        qualityScore,
        safetyScore,
        latencyScore,
        costScore,
        executiveScore,
      };
    })
    .sort(
      (a, b) =>
        b.executiveScore - a.executiveScore
    );
}, [data, allResults, qualityData]);

  const avgLatency =
    allResults.length > 0
      ? allResults.reduce((sum, r) => sum + r.latency_ms, 0) /
        allResults.length
      : 0;

  const totalCost = allResults.reduce(
    (sum, r) => sum + r.estimated_cost_usd,
    0
  );

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Cargando benchmark...</h2>
        <p>Conectando con FastAPI</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loading}>
        <h2>Error de conexión</h2>
        <p>{error}</p>
        <p>
          Verifica que FastAPI esté ejecutándose en{" "}
          <strong>http://localhost:8000</strong>
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>LLM EVALUATION PLATFORM</div>
          <h1 style={styles.title}>LLM Multi-Provider Comparator</h1>
          <p style={styles.subtitle}>
            Comparador de modelos para atención de siniestros vehiculares
          </p>
        </div>

        <div style={styles.badge}>BENCHMARK v{data.version}</div>
      </header>

      <section style={styles.kpiGrid}>
        <KpiCard
          title="Evaluaciones"
          value={String(data.total_evaluations)}
          detail="5 prompts × 3 proveedores"
        />

        <KpiCard
          title="Latencia promedio"
          value={`${(avgLatency / 1000).toFixed(2)} s`}
          detail="Tiempo de respuesta"
        />

        <KpiCard
          title="Costo total"
          value={`$${totalCost.toFixed(4)}`}
          detail="Costo estimado del benchmark"
        />

        <KpiCard
          title="Proveedores"
          value={String(data.providers.length)}
          detail="Ollama · OpenAI · Anthropic"
        />
      </section>

      <section style={styles.section}>
  <SectionTitle
    title="Ranking técnico"
    subtitle="Ordenado por latencia promedio en las 15 evaluaciones"
  />

    <section style={styles.section}>
  <h2 style={styles.sectionTitle}>
    🏆 Ranking ejecutivo
  </h2>

  <p style={styles.sectionDescription}>
    Evaluación ponderada de calidad, seguridad, latencia y costo.
  </p>

  <div style={styles.methodologyBox}>
  <strong>Criterios de evaluación:</strong>{" "}
  Quality 50% · Safety 20% · Latency 20% · Cost 10%
  <br />
  <span style={styles.methodologyNote}>
    Los scores de latencia y costo se normalizan de forma relativa
    entre los proveedores evaluados. El ranking representa únicamente
    este benchmark de 5 prompts × 3 proveedores.
  </span>
</div>

  <div style={styles.providerGrid}>
    {executiveRanking.map((item, index) => (
      <div
        key={item.provider}
        style={styles.providerCard}
      >
        <div style={styles.providerName}>
          #{index + 1} {item.provider}
        </div>

        <div style={styles.metricValue}>
          {item.executiveScore.toFixed(1)}
          <span style={styles.metricUnit}>
            /100
          </span>
        </div>

        <div style={styles.metricLabel}>
          Executive Score
        </div>

        <div style={styles.metricSecondary}>
          Quality:{" "}
          <strong>
            {item.avgQuality.toFixed(2)}/10
          </strong>
        </div>

        <div style={styles.metricSecondary}>
          Safety:{" "}
          <strong>
            {item.avgSafety.toFixed(1)}/10
          </strong>
        </div>

        <div style={styles.metricSecondary}>
          Latencia:{" "}
          <strong>
            {(item.avgLatency / 1000).toFixed(2)} s
          </strong>
        </div>

        <div style={styles.metricSecondary}>
          Costo:{" "}
          <strong>
            ${item.totalCost.toFixed(6)}
          </strong>
        </div>
      </div>
    ))}
  </div>
</section>

  <section style={styles.section}>
  <h2 style={styles.sectionTitle}>
    Calidad y seguridad
  </h2>

  <div style={styles.providerGrid}>
    {qualityStats
      .slice()
      .sort((a, b) => b.avgQuality - a.avgQuality)
      .map((item) => (
        <div
          key={item.provider}
          style={styles.providerCard}
        >
          <div style={styles.providerName}>
            {item.provider}
          </div>

          <div style={styles.metricValue}>
            {item.avgQuality.toFixed(2)}
            <span style={styles.metricUnit}>
              /10
            </span>
          </div>

          <div style={styles.metricLabel}>
            Quality Score
          </div>

          <div style={styles.metricSecondary}>
            Safety Score:{" "}
            <strong>
              {item.avgSafety.toFixed(1)}/10
            </strong>
          </div>
        </div>
      ))}
  </div>
</section>

        <div style={styles.rankingCard}>
          {providerStats.map((stat, index) => (
            <div key={stat.provider} style={styles.rankingRow}>
              <div style={styles.rankNumber}>
                #{index + 1}
              </div>

              <div style={styles.rankProvider}>
                <strong>
                  {providerNames[stat.provider] || stat.provider}
                </strong>
                <span>{stat.evaluations}/5 evaluaciones exitosas</span>
              </div>

              <div style={styles.rankMetric}>
                <strong>{(stat.avgLatency / 1000).toFixed(2)} s</strong>
                <span>latencia promedio</span>
              </div>

              <div style={styles.rankMetric}>
                <strong>${stat.totalCost.toFixed(4)}</strong>
                <span>costo total</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <SectionTitle
          title="Comparación por proveedor"
          subtitle="Métricas técnicas obtenidas durante el benchmark"
        />

        <div style={styles.providerGrid}>
          {providerStats.map((stat) => (
            <div key={stat.provider} style={styles.providerCard}>
              <div style={styles.providerHeader}>
                <h3>{providerNames[stat.provider] || stat.provider}</h3>

                <span style={styles.successBadge}>● {stat.evaluations}/5</span>
              </div>

              <div style={styles.metricRow}>
                <span>Latencia promedio</span>
                <strong>{(stat.avgLatency / 1000).toFixed(2)} s</strong>
              </div>

              <div style={styles.metricRow}>
                <span>Costo total</span>
                <strong>${stat.totalCost.toFixed(4)}</strong>
              </div>

              <div style={styles.metricRow}>
                <span>Tokens procesados</span>
                <strong>{stat.totalTokens.toLocaleString()}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <SectionTitle
          title="Matriz de benchmark"
          subtitle="Resultados por prompt y proveedor"
        />

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Prompt</th>
                {data.providers.map((provider) => (
                  <th key={provider}>
                    {providerNames[provider] || provider}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.results.map((prompt) => (
                <tr key={prompt.prompt_id}>
                  <td style={styles.promptCell}>{prompt.prompt_id}</td>

                  {data.providers.map((provider) => {
                    const result = prompt.results.find(
                      (r) => r.provider === provider
                    );

                    return (
                      <td key={provider}>
                        {result ? (
                          <div>
                            <div style={styles.status}>
                              <span>●</span> {result.status}
                            </div>
                            <small>
                              {(result.latency_ms / 1000).toFixed(2)} s
                            </small>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={styles.section}>
        <SectionTitle
          title="Casos destacados"
          subtitle="Aspectos relevantes para la evaluación del caso de negocio"
        />

        <div style={styles.highlightGrid}>
          <HighlightCard
            prompt="P05"
            title="Seguridad y alucinación"
            text="Evalúa si el modelo evita determinar cobertura, responsabilidad o indemnización sin contar con la información necesaria."
          />

          <HighlightCard
            prompt="P06"
            title="Extracción estructurada"
            text="Evalúa la capacidad del modelo para devolver la información del siniestro en el formato JSON solicitado."
          />
        </div>
      </section>

      <footer style={styles.footer}>
        <span>Vehicle Claims LLM Benchmark</span>
        <span>15 evaluaciones · 3 proveedores</span>
      </footer>
    </div>
  );
}

function KpiCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiTitle}>{title}</div>
      <div style={styles.kpiValue}>{value}</div>
      <div style={styles.kpiDetail}>{detail}</div>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div style={styles.sectionTitle}>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function HighlightCard({
  prompt,
  title,
  text,
}: {
  prompt: string;
  title: string;
  text: string;
}) {
  return (
    <div style={styles.highlightCard}>
      <div style={styles.promptBadge}>{prompt}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {

  rankingCard: {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
  },

  rankingRow: {
    display: "grid",
    gridTemplateColumns: "60px 1fr 180px 180px",
    alignItems: "center",
    gap: 20,
    padding: "18px 22px",
    borderBottom: "1px solid #eef2f7",
  },

  rankNumber: {
    fontSize: 20,
    fontWeight: 800,
    color: "#3156a3",
  },

  rankProvider: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  rankMetric: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "36px 48px",
  },

  header: {
    maxWidth: 1250,
    margin: "0 auto 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#64748b",
    marginBottom: 8,
  },

  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 750,
    letterSpacing: -1,
  },

  subtitle: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 16,
  },

  badge: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "#e8eefc",
    color: "#3156a3",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  kpiGrid: {
    maxWidth: 1250,
    margin: "0 auto 32px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 18,
  },

  kpiCard: {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 14,
    padding: 22,
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
  },

  kpiTitle: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
  },

  kpiValue: {
    fontSize: 30,
    fontWeight: 750,
    marginTop: 8,
  },

  kpiDetail: {
    marginTop: 6,
    fontSize: 12,
    color: "#94a3b8",
  },

  section: {
    maxWidth: 1250,
    margin: "0 auto 36px",
  },

  sectionTitle: {
    marginBottom: 16,
  },

  sectionTitleH2: {
    margin: 0,
  },

  providerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 18,
  },

  providerCard: {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 14,
    padding: 22,
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
  },

  providerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  successBadge: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: 700,
  },

  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderTop: "1px solid #eef2f7",
    fontSize: 13,
    color: "#64748b",
  },

  tableContainer: {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },

  promptCell: {
    fontWeight: 750,
  },

  status: {
    color: "#15803d",
    fontWeight: 650,
    marginBottom: 4,
  },

  highlightGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 18,
  },

  highlightCard: {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
  },

  promptBadge: {
    display: "inline-block",
    background: "#172033",
    color: "#ffffff",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 700,
  },

  footer: {
    maxWidth: 1250,
    margin: "48px auto 0",
    paddingTop: 20,
    borderTop: "1px solid #dfe5ed",
    display: "flex",
    justifyContent: "space-between",
    color: "#94a3b8",
    fontSize: 12,
  },

  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    fontFamily: "Arial, sans-serif",
  },
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);