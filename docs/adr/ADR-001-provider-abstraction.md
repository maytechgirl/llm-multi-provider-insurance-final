# ADR-001 — Abstracción de proveedores mediante Adapter

- Estado: Accepted
- Fecha: 2026-10-04

## Contexto

Ollama, OpenAI y Anthropic tienen APIs y formatos distintos. La solución debe comparar los tres sin acoplar el negocio a un SDK.

## Decisión

Crear una interfaz común `LLMProvider` y adapters específicos:

```text
LLMProvider
├── OllamaAdapter
├── OpenAIAdapter
└── AnthropicAdapter
```

## Consecuencias positivas

- Bajo acoplamiento.
- Extensibilidad.
- Pruebas aisladas.
- Benchmark homogéneo.
- Facilita fallback.

## Consecuencias negativas

- Una capa adicional de abstracción.
- Algunas capacidades específicas pueden no entrar en el contrato común.

## Alternativas

### Código específico por proveedor en FastAPI
Rechazada por mayor acoplamiento.

### Un único proveedor
Rechazada porque contradice el objetivo multi-provider.

### Gateway externo
Reservado para una evolución productiva; no es necesario para el MVP académico.
