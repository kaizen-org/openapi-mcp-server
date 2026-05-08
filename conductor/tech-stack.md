# Stack Tecnológico: OpenAPI MCP Server

## Lenguaje

- **TypeScript 5.x** — Lenguaje principal. Proporciona tipado estático, mejor DX y seguridad en tiempo de compilación.

## Runtime

- **Node.js** (módulos ES nativos, `"type": "module"`) — Entorno de ejecución.

## Dependencias Principales

| Dependencia                 | Versión | Propósito                                                           |
| --------------------------- | ------- | ------------------------------------------------------------------- |
| `@modelcontextprotocol/sdk` | ^1.24.1 | Implementación del protocolo MCP (servidor, herramientas, recursos) |
| `axios`                     | ^1.13.6 | Cliente HTTP para invocar los endpoints de la API REST              |
| `yargs`                     | ^17.7.2 | Parseo de argumentos CLI                                            |
| `openapi-types`             | ^12.1.3 | Tipos TypeScript para especificaciones OpenAPI                      |

## Build

- **esbuild** — Empaquetado y transpilación rápida a un bundle `dist/bundle.js`.
- **tsc** — Verificación de tipos sin emisión (`--noEmit`).

## Testing

- **Vitest** — Framework de tests unitarios e integración.
- **@vitest/coverage-v8** — Cobertura de código (mínimo 80%).
- **msw (Mock Service Worker)** — Mocking de peticiones HTTP en tests.

## Calidad de Código

- **ESLint** con plugins `typescript-eslint`, `eslint-plugin-prettier`, `eslint-plugin-perfectionist`.
- **Prettier** — Formateo automático de código.

## Release y CI/CD

- **semantic-release** — Automatización de versiones y changelogs basado en Conventional Commits.
- **GitHub Actions** — Pipelines para PR checks y releases.

## Contenerización

- **Docker** — Dockerfile incluido para despliegues en contenedores.

## Arquitectura

- **Librería + CLI**: El paquete se puede usar como librería Node.js (`OpenAPIServer`) o como herramienta CLI (`npx @ivotoby/openapi-mcp-server`).
- **Ejemplos**: Directorio `examples/` con casos de uso básicos, auth providers y ejemplos de integración.
- **Transportes soportados**: stdio y Streamable HTTP.
