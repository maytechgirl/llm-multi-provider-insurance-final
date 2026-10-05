# Diseño de arquitectura

## Componentes

1. React Dashboard
2. FastAPI
3. Comparison Orchestrator
4. Provider Registry
5. Prompt Builder
6. Provider Adapters
7. Metrics Collector
8. Cost Calculator
9. Result Normalizer
10. Result Store

## Adapter Pattern

```text
LLMProvider
├── OllamaAdapter
├── OpenAIAdapter
└── AnthropicAdapter
```

El orquestador conoce únicamente el contrato común.

## Flujo

1. Seleccionar prompts.
2. Seleccionar providers.
3. Construir prompt.
4. Ejecutar providers independientemente.
5. Capturar respuesta.
6. Capturar tokens.
7. Medir latencia.
8. Calcular costo.
9. Normalizar.
10. Guardar resultados.
11. Mostrar dashboard.

## Principios

- separación de responsabilidades;
- configuración externa;
- seguridad de secretos;
- datos sintéticos;
- human-in-the-loop;
- tolerancia a fallas parciales;
- observabilidad.
