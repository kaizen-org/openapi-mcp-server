# Guía de Producto: OpenAPI MCP Server

## Concepto Inicial

Un servidor MCP (Model Context Protocol) que expone endpoints de OpenAPI como herramientas MCP, permitiendo a los Modelos de Lenguaje Grande (LLMs) descubrir e interactuar con APIs REST definidas mediante especificaciones OpenAPI.

## Visión

El OpenAPI MCP Server tiende un puente entre los agentes de IA basados en LLMs y las APIs REST existentes. Al traducir especificaciones OpenAPI en herramientas compatibles con MCP, el servidor permite que cualquier sistema de IA con soporte para MCP interactúe con prácticamente cualquier API REST sin necesidad de código de integración personalizado.

## Usuarios Objetivo

- **Ingenieros de IA/ML** que construyen aplicaciones basadas en LLMs que necesitan interactuar con APIs REST
- **Desarrolladores Backend** que desean exponer sus APIs existentes a agentes de IA de forma rápida
- **Equipos de DevOps/Plataforma** que proveen una forma estandarizada para que los servicios internos sean accesibles por IA
- **Desarrolladores Individuales** que usan Claude Desktop, Cursor u otros clientes MCP para automatizar interacciones con APIs

## Objetivos Principales

1. **Exposición de APIs sin fricción**: Cualquier API REST compatible con OpenAPI debe poder exponerse como herramientas MCP con configuración mínima
2. **Operación dual**: Soportar tanto el uso como CLI (npx) para usuarios finales como el uso como librería para desarrolladores
3. **Transporte flexible**: Soportar tanto el transporte stdio (para integración con Claude Desktop) como el transporte HTTP con streaming
4. **Flexibilidad de autenticación**: Soportar múltiples patrones de autenticación (claves API, OAuth, proveedores de auth personalizados)
5. **Extensibilidad**: Permitir a los desarrolladores conectar proveedores de autenticación y configuraciones personalizadas

## Características Clave

- **Conversión OpenAPI → herramientas MCP**: Parsea automáticamente especificaciones OpenAPI (JSON/YAML) y genera definiciones de herramientas MCP
- **Invocación dinámica de herramientas**: Enruta las llamadas a herramientas MCP hacia los endpoints de API correctos con el mapeo de parámetros adecuado
- **Sistema de proveedores de auth**: Autenticación enchufable con soporte para claves API, tokens Bearer y flujos OAuth personalizados
- **Soporte de recursos y prompts**: Exposición opcional de esquemas OpenAPI como recursos MCP y plantillas de prompts
- **Punto de entrada CLI**: `npx @ivotoby/openapi-mcp-server` para uso inmediato sin código
- **API de librería**: Clase `OpenAPIServer` para integración programática
- **Soporte Docker**: Dockerfile incluido para despliegues en contenedores
- **Interceptor de login OAuth vía navegador**: Cuando `--browser-auth` está activo, detecta respuestas 401/3xx con URLs de autenticación y abre automáticamente un navegador Chromium visible para que el usuario complete el flujo OAuth, reanudando la tool call al terminar

## Criterios de Éxito

- Un LLM puede descubrir todas las operaciones de API disponibles desde una especificación OpenAPI como herramientas MCP
- Las llamadas a la API se autentican y ejecutan correctamente con el mapeo de parámetros adecuado
- El servidor es usable tanto como herramienta CLI sin configuración como librería embebible
- Se pueden añadir nuevos patrones de autenticación sin modificar el servidor principal
- La cobertura de pruebas se mantiene por encima del 80%
