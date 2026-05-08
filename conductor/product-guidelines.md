# Directrices de Producto: OpenAPI MCP Server

## Principios Generales

1. **Claridad sobre brevedad**: Los mensajes de error, logs y documentación deben ser claros y descriptivos, incluso si son más largos.
2. **Convención sobre configuración**: Las opciones por defecto deben funcionar para el 80% de los casos sin configuración adicional.
3. **Compatibilidad hacia atrás**: Los cambios de API deben ser retrocompatibles. Los cambios que rompan la compatibilidad requieren una nueva versión mayor (semver).
4. **Seguridad por defecto**: Las credenciales y tokens nunca se deben registrar en logs ni exponer en mensajes de error.

## Estilo de Código

- Seguir las reglas de ESLint y Prettier definidas en el proyecto.
- Preferir interfaces sobre tipos en TypeScript cuando sea posible.
- Usar nombres descriptivos en inglés para variables, funciones y clases.
- Los comentarios de código pueden escribirse en español o inglés, pero deben ser consistentes dentro de un mismo módulo.

## Estilo de Comunicación (Docs y Mensajes)

- **Idioma principal de la documentación**: Español para la documentación interna del proyecto (conductor/); inglés para la documentación pública (README, docs/).
- **Tono**: Técnico pero accesible. Evitar jerga innecesaria.
- **Mensajes de error**: Deben indicar qué salió mal, por qué, y cómo resolverlo.
- **Logs**: Usar niveles de log apropiados (debug, info, warn, error). No usar `console.log` directamente en producción.

## Principios de UX (CLI y Librería)

- **Inicio rápido**: El caso de uso más común debe funcionar con el mínimo de argumentos posibles.
- **Mensajes de ayuda**: Todos los comandos y opciones CLI deben tener descripción en `--help`.
- **Errores accionables**: Cuando algo falla, el mensaje debe sugerir cómo corregirlo.
- **Sin efectos secundarios silenciosos**: Cualquier operación que modifique estado externo (llamadas a API, escritura de archivos) debe confirmarse en el log.

## Pruebas y Calidad

- Cobertura mínima de tests: **80%**.
- Las funciones públicas de la librería deben tener tests unitarios.
- Los flujos de autenticación deben tener tests de integración.
- No mergear PRs con tests fallidos.

## Control de Versiones

- Seguir [Conventional Commits](https://www.conventionalcommits.org/) para todos los mensajes de commit.
- Las releases se gestionan automáticamente mediante `semantic-release`.
- Las ramas de features deben nombrarse: `feature/<descripcion-corta>`.
- Las ramas de bugfix deben nombrarse: `fix/<descripcion-corta>`.

## Seguridad

- Nunca commitear claves API, tokens ni secretos.
- Revisar dependencias con `npm audit` regularmente.
- Las vulnerabilidades críticas o altas deben resolverse antes de la siguiente release.
