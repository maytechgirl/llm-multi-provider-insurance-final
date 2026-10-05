# Proyecto 1 — Comparador Multi-Proveedor de LLMs con Panel de Costos

## Caso de uso: atención al cliente de una aseguradora — reporte de siniestro vehicular

Proyecto de evaluación del curso **Fundamentos de Arquitectura LLM**.

### Pregunta de negocio

> ¿Qué LLM ofrece el mejor equilibrio entre calidad, costo y latencia para asistir a un agente de una aseguradora durante el reporte de un siniestro vehicular?

La solución permite ejecutar el mismo conjunto de prompts contra:

- **Ollama / Llama 3.2** — proveedor local.
- **OpenAI** — proveedor cloud.
- **Anthropic** — proveedor cloud.

Los resultados se normalizan para comparar:

- calidad;
- completitud;
- seguridad/no alucinación;
- claridad;
- utilidad para el agente;
- adherencia al formato;
- latencia;
- tokens;
- costo estimado;
- errores.

> El proyecto es un laboratorio académico. El LLM no determina cobertura, responsabilidad ni indemnización. La decisión final corresponde a un agente humano.

---

# 1. Objetivo

Construir un benchmark reproducible para determinar qué modelo presenta el mejor trade-off entre **calidad, costo y performance** para un caso de atención de siniestros vehiculares.

## Resultado esperado

Ejecutar:

**5 prompts × 3 proveedores = 15 evaluaciones**

```text
             Ollama       OpenAI       Anthropic
Prompt 01       ✓            ✓             ✓
Prompt 02       ✓            ✓             ✓
Prompt 03       ✓            ✓             ✓
Prompt 04       ✓            ✓             ✓
Prompt 05       ✓            ✓             ✓
Prompt 06       ✓            ✓             ✓
Prompt 07       ✓            ✓             ✓
Prompt 08       ✓            ✓             ✓
```

---

# 2. Arquitectura

```text
                       ┌─────────────────────────┐
                       │     React Dashboard      │
                       │ Prompts / Benchmark      │
                       │ Cost / Latency / Score  │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │       FastAPI API       │
                       │                         │
                       │ /health                 │
                       │ /providers              │
                       │ /compare                │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │ Comparison Orchestrator │
                       │                         │
                       │ Prompt Builder          │
                       │ Provider Registry       │
                       │ Metrics Collector       │
                       │ Cost Calculator         │
                       │ Result Normalizer       │
                       └────────────┬────────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 ▼                  ▼                  ▼
          ┌────────────┐      ┌──────────┐      ┌────────────┐
          │  Ollama    │      │  OpenAI  │      │ Anthropic  │
          │  Adapter   │      │ Adapter  │      │  Adapter   │
          └─────┬──────┘      └────┬─────┘      └─────┬──────┘
                ▼                  ▼                  ▼
           llama3.2            Cloud API           Cloud API

                         ┌──────────────────┐
                         │ pricing.json     │
                         │ benchmark JSON   │
                         │ benchmark CSV    │
                         └──────────────────┘
```

---

# 3. Caso de negocio

Un asegurado contacta al centro de atención después de un accidente vehicular.

El LLM debe ayudar al agente a:

1. resumir el relato;
2. identificar información faltante;
3. proponer preguntas;
4. redactar una respuesta;
5. identificar riesgos;
6. estructurar información;
7. diferenciar escenarios;
8. preparar una ficha para el agente.

El LLM **no debe**:

- determinar cobertura;
- determinar responsabilidad legal;
- calcular indemnización;
- inventar información;
- sustituir la decisión humana.

---

# 4. Benchmark

El benchmark contiene 5 prompts:

| ID | Escenario | Dimensión principal |
|---|---|---|
| P01 | Resumen del siniestro | Comprensión/síntesis |
| P02 | Información faltante | Razonamiento |
| P04 | Respuesta al cliente | Calidad/empatía |
| P05 | Riesgo/alucinación | Seguridad |
| P06 | Extracción JSON | Estructuración |

Los prompts completos se encuentran en `prompts/benchmark_prompts.json`.

---

# 5. Modelo de evaluación

## Score de calidad

| Dimensión | Peso |
|---|---:|
| Calidad / precisión | 30% |
| Completitud | 20% |
| Seguridad / no alucinación | 20% |
| Claridad | 10% |
| Utilidad para el agente | 10% |
| Adherencia al formato | 10% |

Score final:

```text
Score =
  precision * 0.30
+ completitud * 0.20
+ seguridad * 0.20
+ claridad * 0.10
+ utilidad * 0.10
+ formato * 0.10
```

Cada dimensión se califica de 1 a 5.

---

# 6. Métricas técnicas

Para cada ejecución:

- provider;
- model;
- prompt_id;
- latency_ms;
- input_tokens;
- output_tokens;
- estimated_cost_usd;
- status;
- error;
- quality_score.

También se calcularán:

- latencia promedio;
- p50/p95 cuando exista suficiente muestra;
- costo por caso;
- costo por 1.000 casos;
- costo mensual hipotético;
- score promedio de calidad;
- error rate.

---

# 7. Pre-requisitos Mac

- macOS
- Python 3.12+
- Node.js/npm
- Git
- Ollama
- `llama3.2`
- OpenAI API Key
- Anthropic API Key

La guía del curso indica para macOS:

```bash
brew install ollama
```

y:

```bash
ollama pull llama3.2
```

También utiliza:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

La API local de Ollama se expone en:

```text
http://localhost:11434
```

---

# 8. Instalación

```bash
git clone <TU_REPOSITORIO>
cd llm-multi-provider-insurance

python3.12 -m venv .venv
source .venv/bin/activate

pip install -r backend/requirements.txt

cp .env.example .env
```

Configurar `.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

APP_ENV=development
LOG_LEVEL=INFO
REQUEST_TIMEOUT_SECONDS=60
```

Nunca subir `.env` a GitHub.

---

# 9. Ollama

```bash
ollama serve
```

En otra terminal:

```bash
ollama pull llama3.2
ollama list
```

Prueba:

```bash
ollama run llama3.2 "Responde en una oración: ¿qué es un siniestro vehicular?"
```

---

# 10. Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Abrir:

```text
http://localhost:8000/docs
```

Endpoints:

```text
GET  /health
GET  /providers
POST /compare
GET /benchmark/results
GET /benchmark/quality
```

---

# 11. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```

---

# 12. Flujo del benchmark

```text
Seleccionar prompts
       ↓
Seleccionar 3 providers
       ↓
Construir prompt estándar
       ↓
Ejecutar Ollama
       ↓
Ejecutar OpenAI
       ↓
Ejecutar Anthropic
       ↓
Normalizar resultados
       ↓
Medir tokens + latencia
       ↓
Calcular costo
       ↓
Evaluar calidad
       ↓
Guardar JSON/CSV
       ↓
Dashboard
```

---

# 13. Resultados

Los resultados se guardarán en:

```text
results/
├── benchmark-results.json
└── benchmark-results.csv
```

No incluir claves API en estos archivos.

---

# 14. Criterios de éxito

## Must Have

- [ ] Tres providers operativos.
- [x] 5 prompts ejecutables.
- [x] 15 evaluaciones.
- [ ] Respuestas normalizadas.
- [ ] Latencia real.
- [ ] Tokens.
- [ ] Costo.
- [ ] Score de calidad.
- [ ] Dashboard.
- [ ] Manejo de errores.
- [ ] Secrets protegidos.

## Arquitectura

- [ ] Adapter Pattern.
- [ ] Orquestador desacoplado.
- [ ] Configuración externa.
- [ ] Provider Registry.
- [ ] Degradación parcial.
- [ ] Observabilidad.

---

# 15. Beneficios

### Negocio

- Selección objetiva de modelos.
- Comparación calidad/costo.
- Reducción de dependencia de un proveedor.
- Evidencia para una decisión de adopción.

### Arquitectura

- Bajo acoplamiento.
- Extensibilidad.
- Benchmark reproducible.
- Base para AI Governance.

### Operación

- Medición de latencia.
- Control de costos.
- Identificación de errores.
- Comparación histórica.

---

# 16. Riesgos

| Riesgo | Mitigación |
|---|---|
| Alucinación | Evaluación de seguridad + human-in-the-loop |
| PII | Datos sintéticos |
| Costo inesperado | Pricing + límites |
| Provider caído | Ejecución independiente |
| Respuestas inconsistentes | Prompt controlado |
| Cambio de pricing | `pricing.json` versionado |

---

# 17. ADR

La decisión arquitectónica principal está documentada en:

```text
docs/adr/ADR-001-provider-abstraction.md
```

Se utiliza Adapter Pattern:

```text
LLMProvider
├── OllamaAdapter
├── OpenAIAdapter
└── AnthropicAdapter
```

Esto evita que la lógica de negocio dependa de SDKs específicos.

---

# 18. Evolución futura

- RAG con condiciones de póliza.
- PII detection.
- Guardrails.
- OpenTelemetry.
- AI Gateway.
- Routing inteligente.
- Persistencia histórica.
- Evaluación automática.
- Dataset de siniestros.
- A/B testing de prompts.

---

# 19. Entrega

La evaluación debe demostrar:

1. Problema de negocio.
2. Arquitectura.
3. Decisiones.
4. Código.
5. Ejecución local.
6. Comparación de los tres proveedores.
7. Métricas.
8. Costos.
9. Resultados.
10. Conclusión arquitectónica.

Ver `docs/demo/video-script.md` para el guion.
