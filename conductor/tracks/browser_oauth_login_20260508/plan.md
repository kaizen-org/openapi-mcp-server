# Plan de Implementación: Browser-Based OAuth Login Interceptor

## Fase 1: Detección de Respuestas de Autenticación [checkpoint: 9c346dc]

- [x] Task: Escribir tests para el detector de respuestas auth (f327804)
  - [x] Crear `src/auth/auth-response-detector.test.ts`
  - [x] Test: detecta redirect 302 con cabecera `Location` como auth response
  - [x] Test: detecta redirect 301/303/307/308 con cabecera `Location`
  - [x] Test: detecta 401 con cabecera `WWW-Authenticate` que contiene URL
  - [x] Test: detecta 401 con body JSON que contiene `auth_url`
  - [x] Test: detecta 401 con body JSON que contiene `login_url` y `authorization_url`
  - [x] Test: no detecta falsos positivos (200, 404, 500, 401 sin URL)
  - [x] Confirmar que los tests fallan (fase roja)
- [x] Task: Implementar `AuthResponseDetector` (f327804)
  - [x] Crear `src/auth/auth-response-detector.ts`
  - [x] Implementar `isAuthResponse(response): boolean`
  - [x] Implementar `extractAuthUrl(response): string | null` con prioridad: Location > WWW-Authenticate > body JSON
  - [x] Confirmar que los tests pasan (fase verde)
  - [x] Refactorizar si es necesario
- [x] Task: Verificar cobertura de tests (`npm run test:coverage` ≥80%) (f327804)
- [x] Task: Commitear cambios (`feat(auth): Add auth response detector`) (f327804)
- [x] Task: Conductor - User Manual Verification 'Fase 1: Detección de Respuestas de Autenticación' (Protocol in workflow.md) (9c346dc)

---

## Fase 2: Integrador de Playwright [checkpoint: 2ec15d4]

- [x] Task: Añadir `playwright-core` como dependencia de producción (08d451a)
  - [x] Ejecutar `npm install playwright-core`
  - [x] Actualizar `conductor/tech-stack.md` con la nueva dependencia
- [x] Task: Escribir tests para el `BrowserAuthHandler` (08d451a)
  - [x] Crear `src/auth/browser-auth-handler.test.ts`
  - [x] Test: abre el navegador Chromium con la URL de autenticación dada (mock de playwright)
  - [x] Test: registra en stderr/log que se ha abierto el navegador
  - [x] Test: espera a que el navegador cierre / navegue al callback
  - [x] Test: lanza error descriptivo si Playwright no puede iniciar el navegador
  - [x] Test: respeta el timeout configurable (default 5 min)
  - [x] Confirmar que los tests fallan (fase roja)
- [x] Task: Implementar `BrowserAuthHandler` (08d451a)
  - [x] Crear `src/auth/browser-auth-handler.ts`
  - [x] Implementar `openBrowserForAuth(authUrl: string, options?: { timeoutMs?: number }): Promise<void>`
  - [x] Manejo de error si Playwright no está disponible
  - [x] Confirmar que los tests pasan (fase verde)
  - [x] Refactorizar si es necesario
- [x] Task: Verificar cobertura de tests (`npm run test:coverage` ≥80%) (08d451a)
- [x] Task: Commitear cambios (`feat(auth): Add Playwright browser auth handler`) (08d451a)
- [x] Task: Conductor - User Manual Verification 'Fase 2: Integrador de Playwright' (Protocol in workflow.md) (2ec15d4)

---

## Fase 3: Interceptor en el Handler de Tools

- [ ] Task: Analizar el flujo de invocación de tools actual
  - [ ] Identificar dónde se procesa la respuesta HTTP de la API en el código existente
  - [ ] Documentar el punto de extensión (sin modificar código aún)
- [ ] Task: Escribir tests de integración para el interceptor
  - [ ] Crear `src/auth/browser-auth-interceptor.test.ts`
  - [ ] Test: cuando `browserAuth=false`, la respuesta 401 se devuelve al LLM sin cambios
  - [ ] Test: cuando `browserAuth=true` y respuesta es 302, se llama a `BrowserAuthHandler` y se suspende
  - [ ] Test: cuando `browserAuth=true` y respuesta es 401 con auth URL, se llama a `BrowserAuthHandler`
  - [ ] Test: tras completar el login en el navegador, el LLM recibe mensaje de reintento
  - [ ] Confirmar que los tests fallan (fase roja)
- [ ] Task: Implementar `BrowserAuthInterceptor`
  - [ ] Crear `src/auth/browser-auth-interceptor.ts`
  - [ ] Inyectar `AuthResponseDetector` y `BrowserAuthHandler`
  - [ ] Implementar `intercept(response, toolCallContext): Promise<ToolResult>`
  - [ ] Integrar en el handler de tools existente de forma no intrusiva
  - [ ] Confirmar que los tests pasan (fase verde)
  - [ ] Refactorizar si es necesario
- [ ] Task: Verificar cobertura de tests (`npm run test:coverage` ≥80%)
- [ ] Task: Commitear cambios (`feat(auth): Integrate browser auth interceptor into tool handler`)
- [ ] Task: Conductor - User Manual Verification 'Fase 3: Interceptor en el Handler de Tools' (Protocol in workflow.md)

---

## Fase 4: Configuración Opt-in

- [ ] Task: Escribir tests para la opción de configuración `browserAuth`
  - [ ] Test: `--browser-auth` flag CLI activa el comportamiento
  - [ ] Test: `browserAuth: true` en configuración programática activa el comportamiento
  - [ ] Test: por defecto (`browserAuth` ausente), el comportamiento está desactivado
  - [ ] Test: `--browser-auth-timeout` CLI configura el timeout (en segundos)
  - [ ] Confirmar que los tests fallan (fase roja)
- [ ] Task: Implementar la opción `browserAuth` en la configuración del servidor
  - [ ] Añadir `browserAuth?: boolean` y `browserAuthTimeoutMs?: number` a la interfaz de configuración
  - [ ] Añadir argumento `--browser-auth` y `--browser-auth-timeout` al parser CLI (`yargs`)
  - [ ] Pasar la configuración al `BrowserAuthInterceptor`
  - [ ] Confirmar que los tests pasan (fase verde)
- [ ] Task: Actualizar documentación
  - [ ] Añadir descripción de `--browser-auth` y `--browser-auth-timeout` al README
  - [ ] Actualizar JSDoc de las interfaces afectadas
- [ ] Task: Verificar cobertura de tests (`npm run test:coverage` ≥80%)
- [ ] Task: Commitear cambios (`feat(auth): Add browserAuth config option and CLI flag`)
- [ ] Task: Conductor - User Manual Verification 'Fase 4: Configuración Opt-in' (Protocol in workflow.md)
