# Guion del video de evaluación

Duración recomendada: 8–12 minutos.

## 1. Problema — 1 min

Explicar el caso de la aseguradora y la pregunta de negocio.

## 2. Arquitectura — 1:30 min

Mostrar:
React → FastAPI → Orchestrator → Adapters → 3 providers.

Explicar Adapter Pattern.

## 3. Repositorio — 45 s

Mostrar:
backend, frontend, prompts, config, results y docs.

## 4. Ollama — 45 s

```bash
ollama list
ollama run llama3.2
```

## 5. API — 1 min

```bash
cd backend
uvicorn app.main:app --reload
```

Mostrar `/docs`.

## 6. Benchmark — 3 min

Mostrar los 8 prompts.

Ejecutar al menos:
- P04 Respuesta al cliente;
- P05 Riesgo/alucinación;
- P06 JSON;
- P08 Copiloto.

Mostrar comparación de los tres providers.

## 7. Métricas — 1 min

Mostrar:
- calidad;
- latencia;
- tokens;
- costo.

Explicar que son 24 evaluaciones.

## 8. Decisión — 1 min

No decir "X es mejor" sin evidencia.

Explicar el trade-off:
calidad vs costo vs latencia vs seguridad.

## 9. Cierre — 30 s

"El valor de la arquitectura es generar evidencia comparable para tomar una decisión de adopción de LLMs."
