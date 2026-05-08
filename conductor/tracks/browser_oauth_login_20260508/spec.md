# Spec: Browser-Based OAuth Login Interceptor

## Resumen

Cuando el servidor MCP invoca un endpoint de API protegido y recibe una respuesta que indica que se requiere autenticación interactiva (flujo _user-to-machine_), el servidor no debe devolver esa respuesta cruda al LLM. En su lugar, debe interceptar la respuesta, extraer la URL de autenticación, abrir un navegador mediante Playwright para que el usuario complete el flujo de login, y mantener la tool call suspendida hasta que el proceso de autenticación concluya.

**Fuera de scope:** La captura, almacenamiento y reutilización del token generado tras el login se tratará en un track separado.

---

## Requisitos Funcionales

### RF-01: Detección de Respuesta de Autenticación

El servidor DEBE detectar que una respuesta de API requiere autenticación interactiva en los siguientes casos:

1. **Respuesta con redirect (HTTP 301/302/303/307/308):**
   - La cabecera `Location` contiene una URL de autenticación (ej: dominio de proveedor OIDC/OAuth).

2. **Respuesta HTTP 401 Unauthorized:**
   - La cabecera `WWW-Authenticate` contiene una URL de autenticación.
   - O el body de la respuesta es JSON y contiene un campo con una URL (ej: `auth_url`, `login_url`, `authorization_url`).

### RF-02: Extracción de la URL de Autenticación

El servidor DEBE extraer la URL de autenticación con la siguiente prioridad:

1. Cabecera `Location` (para respuestas 3xx).
2. Cabecera `WWW-Authenticate` (para respuestas 401).
3. Campo en el body JSON: buscar claves como `auth_url`, `login_url`, `authorization_url` (para respuestas 401 con body).

Si no se puede extraer ninguna URL válida, el error se propagará al LLM como un error MCP estándar.

### RF-03: Apertura de Navegador con Playwright

Una vez extraída la URL:

1. El servidor DEBE abrir una ventana de navegador usando `playwright-core` (usando el navegador Chromium por defecto).
2. El navegador DEBE navegar directamente a la URL de autenticación extraída.
3. El servidor DEBE informar al usuario en el log/stderr que se ha abierto el navegador y que debe completar el login.

### RF-04: Suspensión de la Tool Call

1. La tool call MCP que originó la petición a la API DEBE quedar suspendida (sin responder al LLM) mientras el navegador está abierto.
2. El servidor DEBE esperar activamente a que el usuario complete la interacción con el navegador (ej: hasta que el navegador cierre la página de login o navegue a una URL de callback).
3. Una vez que el flujo de autenticación en el navegador concluye, el servidor DEBE reanudar y devolver al LLM un mensaje informando que la autenticación fue completada y que el LLM debe reintentar la operación.

### RF-05: Configuración Opt-in

1. Este comportamiento DEBE estar desactivado por defecto.
2. Se DEBE poder activar mediante una nueva opción de configuración del servidor (ej: `--browser-auth` flag CLI o campo `browserAuth: true` en la configuración).
3. Si está desactivado, el comportamiento actual (devolver la respuesta cruda al LLM) se mantiene sin cambios.

---

## Requisitos No Funcionales

- **RNF-01:** `playwright-core` se añade como dependencia de producción. El navegador Chromium se descarga bajo demanda en el primer uso.
- **RNF-02:** El código de detección/interceptación debe ser modular y no acoplar la lógica de autenticación con el handler de tools existente.
- **RNF-03:** Si Playwright no está disponible en el entorno (ej: CI headless sin browsers instalados), el servidor DEBE capturar el error y propagarlo como error MCP descriptivo en lugar de crashear.
- **RNF-04:** El timeout de espera del navegador DEBE ser configurable (default: 5 minutos).

---

## Criterios de Aceptación

- [ ] Dado que `browserAuth` está activado y la API devuelve un 302 con `Location: https://auth.example.com/login`, el servidor abre Playwright en esa URL y suspende la tool call.
- [ ] Dado que `browserAuth` está activado y la API devuelve un 401 con body `{"auth_url": "https://auth.example.com/login"}`, el servidor abre Playwright en esa URL y suspende la tool call.
- [ ] Dado que `browserAuth` está desactivado, el servidor devuelve la respuesta 401/302 al LLM sin abrir el navegador (comportamiento actual).
- [ ] Dado que Playwright no puede iniciar el navegador, el servidor devuelve un error MCP descriptivo al LLM.
- [ ] Una vez que el usuario completa el login (navegador cierra o navega al callback), el LLM recibe un mensaje indicando que debe reintentar.

---

## Fuera de Scope

- Captura del token/código de autorización del callback URL.
- Almacenamiento o refresco de tokens.
- Flujos _machine-to-machine_ (Client Credentials, API Keys).
- Soporte para navegadores distintos a Chromium en esta iteración.
