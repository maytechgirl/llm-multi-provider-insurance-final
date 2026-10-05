# Criterios de éxito

## Funcionales

- [ ] Los 8 prompts se pueden seleccionar.
- [ ] Se pueden ejecutar los 3 providers.
- [ ] El mismo prompt llega a cada provider.
- [ ] Los resultados se normalizan.
- [ ] Se muestran tokens, latencia y costo.
- [ ] Los errores de un provider no bloquean otros.

## Calidad

Score 1–5 para:
- precisión;
- completitud;
- seguridad;
- claridad;
- utilidad;
- formato.

## Técnicos

- latencia promedio;
- p50/p95 si hay suficientes muestras;
- error rate;
- tokens;
- costo por caso;
- costo por 1.000 casos.

## Éxito de arquitectura

Agregar un cuarto provider debe requerir crear un nuevo adapter y configuración, sin modificar la lógica central del orquestador.
