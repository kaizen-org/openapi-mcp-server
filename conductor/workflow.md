# Flujo de Trabajo del Proyecto

## Principios Rectores

1. **El Plan es la Fuente de Verdad:** Todo el trabajo debe estar registrado en `plan.md`
2. **El Stack Tecnológico es Deliberado:** Los cambios al stack deben documentarse en `tech-stack.md` _antes_ de implementarlos
3. **Desarrollo Dirigido por Tests:** Escribe tests unitarios antes de implementar la funcionalidad
4. **Alta Cobertura de Código:** Apuntar a >80% de cobertura para todos los módulos
5. **La Experiencia de Usuario Primero:** Cada decisión debe priorizar la experiencia del usuario
6. **No Interactivo y Compatible con CI:** Preferir comandos no interactivos. Usar `CI=true` para herramientas en modo watch (tests, linters) para garantizar ejecución única.

## Flujo de Tareas

Todas las tareas siguen un ciclo de vida estricto:

### Flujo de Tarea Estándar

1. **Seleccionar Tarea:** Elegir la siguiente tarea disponible en `plan.md` en orden secuencial

2. **Marcar en Progreso:** Antes de comenzar el trabajo, editar `plan.md` y cambiar la tarea de `[ ]` a `[~]`

3. **Escribir Tests Fallidos (Fase Roja):**
   - Crear un nuevo archivo de test para la funcionalidad o corrección de bug.
   - Escribir uno o más tests unitarios que definan claramente el comportamiento esperado y los criterios de aceptación de la tarea.
   - **CRÍTICO:** Ejecutar los tests y confirmar que fallan como se espera. Esta es la fase "Roja" del TDD. No continuar hasta tener tests fallidos.

4. **Implementar para Pasar Tests (Fase Verde):**
   - Escribir la cantidad mínima de código de aplicación necesaria para que los tests fallidos pasen.
   - Ejecutar la suite de tests nuevamente y confirmar que todos los tests pasan. Esta es la fase "Verde".

5. **Refactorizar (Opcional pero Recomendado):**
   - Con la seguridad de los tests pasando, refactorizar el código de implementación y el código de tests para mejorar la claridad, eliminar duplicación y mejorar el rendimiento sin cambiar el comportamiento externo.
   - Volver a ejecutar los tests para asegurarse de que siguen pasando tras la refactorización.

6. **Verificar Cobertura:** Ejecutar reportes de cobertura usando las herramientas elegidas del proyecto. Por ejemplo, en un proyecto Node.js:

   ```bash
   npm run test:coverage
   ```

   Objetivo: >80% de cobertura para código nuevo. Las herramientas y comandos específicos variarán según el lenguaje y framework.

7. **Documentar Desviaciones:** Si la implementación difiere del stack tecnológico:
   - **DETENER** la implementación
   - Actualizar `tech-stack.md` con el nuevo diseño
   - Agregar nota con fecha explicando el cambio
   - Retomar la implementación

8. **Commitear Cambios de Código:**
   - Stagear todos los cambios de código relacionados con la tarea.
   - Proponer un mensaje de commit claro y conciso, ej: `feat(ui): Crear estructura HTML básica para la calculadora`.
   - Realizar el commit.

9. **Adjuntar Resumen de Tarea con Git Notes:**
   - **Paso 9.1: Obtener Hash del Commit:** Obtener el hash del commit _recién completado_ (`git log -1 --format="%H"`).
   - **Paso 9.2: Redactar Contenido de la Nota:** Crear un resumen detallado de la tarea completada. Debe incluir el nombre de la tarea, un resumen de cambios, una lista de todos los archivos creados/modificados, y el "por qué" central del cambio.
   - **Paso 9.3: Adjuntar Nota:** Usar el comando `git notes` para adjuntar el resumen al commit.
     ```bash
     # El contenido de la nota del paso anterior se pasa mediante el flag -m.
     git notes add -m "<contenido de la nota>" <hash_del_commit>
     ```

10. **Obtener y Registrar el SHA del Commit de la Tarea:**
    - **Paso 10.1: Actualizar Plan:** Leer `plan.md`, encontrar la línea de la tarea completada, actualizar su estado de `[~]` a `[x]`, y agregar los primeros 7 caracteres del hash del commit recién completado.
    - **Paso 10.2: Escribir Plan:** Escribir el contenido actualizado de vuelta en `plan.md`.

11. **Commitear Actualización del Plan:**
    - **Acción:** Stagear el archivo `plan.md` modificado.
    - **Acción:** Commitear este cambio con un mensaje descriptivo (ej: `conductor(plan): Marcar tarea 'Crear modelo de usuario' como completa`).

### Protocolo de Verificación y Checkpoint de Fase

**Disparador:** Este protocolo se ejecuta inmediatamente después de completar una tarea que también concluye una fase en `plan.md`.

1. **Anunciar Inicio del Protocolo:** Informar al usuario que la fase está completa y que el protocolo de verificación y checkpoint ha comenzado.

2. **Asegurar Cobertura de Tests para los Cambios de la Fase:**
   - **Paso 2.1: Determinar Alcance de la Fase:** Para identificar los archivos cambiados en esta fase, primero encontrar el punto de inicio. Leer `plan.md` para encontrar el SHA del commit del checkpoint de la _fase anterior_. Si no existe checkpoint previo, el alcance son todos los cambios desde el primer commit.
   - **Paso 2.2: Listar Archivos Modificados:** Ejecutar `git diff --name-only <sha_checkpoint_anterior> HEAD` para obtener una lista precisa de todos los archivos modificados durante esta fase.
   - **Paso 2.3: Verificar y Crear Tests:** Para cada archivo de la lista:
     - **CRÍTICO:** Primero verificar su extensión. Excluir archivos que no son código (ej: `.json`, `.md`, `.yaml`).
     - Para cada archivo de código restante, verificar que existe un archivo de test correspondiente.
     - Si falta un archivo de test, **debes** crearlo. Antes de escribir el test, **primero analiza otros archivos de test del repositorio para determinar la convención de nomenclatura y el estilo de testing.** Los nuevos tests **deben** validar la funcionalidad descrita en las tareas de esta fase (`plan.md`).

3. **Ejecutar Tests Automatizados con Depuración Proactiva:**
   - Antes de ejecutar, **debes** anunciar el comando exacto de shell que usarás.
   - **Ejemplo de Anuncio:** "Ahora ejecutaré la suite de tests automatizados para verificar la fase. **Comando:** `CI=true npm test`"
   - Ejecutar el comando anunciado.
   - Si los tests fallan, **debes** informar al usuario y comenzar la depuración. Puedes intentar proponer una solución un **máximo de dos veces**. Si los tests siguen fallando tras tu segunda propuesta, **debes detenerte**, reportar el fallo persistente y pedir orientación al usuario.

4. **Proponer un Plan de Verificación Manual Detallado y Accionable:**
   - **CRÍTICO:** Para generar el plan, primero analizar `product.md`, `product-guidelines.md` y `plan.md` para determinar los objetivos orientados al usuario de la fase completada.
   - **Debes** generar un plan paso a paso que guíe al usuario a través del proceso de verificación, incluyendo los comandos necesarios y los resultados esperados específicos.
   - El plan que presentes al usuario **debe** seguir este formato:

     **Para un Cambio de Backend:**

     ```
     Los tests automatizados han pasado. Para verificación manual, por favor sigue estos pasos:

     **Pasos de Verificación Manual:**
     1.  **Asegúrate de que el servidor esté en ejecución.**
     2.  **Ejecuta el siguiente comando en tu terminal:** `curl -X POST http://localhost:8080/api/v1/users -d '{"name": "test"}'`
     3.  **Confirma que recibes:** Una respuesta JSON con estado `201 Created`.
     ```

5. **Esperar Confirmación Explícita del Usuario:**
   - Tras presentar el plan detallado, preguntar al usuario: "**¿Esto cumple con tus expectativas? Por favor confirma con sí o proporciona feedback sobre lo que necesita cambiarse.**"
   - **PAUSAR** y esperar la respuesta del usuario. No continuar sin un sí o confirmación explícita.

6. **Crear Commit de Checkpoint:**
   - Stagear todos los cambios. Si no hubo cambios en este paso, proceder con un commit vacío.
   - Realizar el commit con un mensaje claro y conciso (ej: `conductor(checkpoint): Checkpoint fin de Fase X`).

7. **Adjuntar Reporte de Verificación Auditable con Git Notes:**
   - **Paso 7.1: Redactar Contenido de la Nota:** Crear un reporte de verificación detallado que incluya el comando de tests automatizados, los pasos de verificación manual y la confirmación del usuario.
   - **Paso 7.2: Adjuntar Nota:** Usar el comando `git notes` y el hash completo del commit del paso anterior para adjuntar el reporte completo al commit de checkpoint.

8. **Obtener y Registrar el SHA del Checkpoint de Fase:**
   - **Paso 8.1: Obtener Hash del Commit:** Obtener el hash del commit de checkpoint _recién creado_ (`git log -1 --format="%H"`).
   - **Paso 8.2: Actualizar Plan:** Leer `plan.md`, encontrar el encabezado de la fase completada, y agregar los primeros 7 caracteres del hash en el formato `[checkpoint: <sha>]`.
   - **Paso 8.3: Escribir Plan:** Escribir el contenido actualizado de vuelta en `plan.md`.

9. **Commitear Actualización del Plan:**
   - **Acción:** Stagear el archivo `plan.md` modificado.
   - **Acción:** Commitear este cambio con un mensaje descriptivo siguiendo el formato `conductor(plan): Marcar fase '<NOMBRE DE FASE>' como completa`.

10. **Anunciar Completitud:** Informar al usuario que la fase está completa y el checkpoint ha sido creado, con el reporte de verificación detallado adjunto como git note.

### Puertas de Calidad

Antes de marcar cualquier tarea como completa, verificar:

- [ ] Todos los tests pasan
- [ ] La cobertura de código cumple los requisitos (>80%)
- [ ] El código sigue las guías de estilo del proyecto (definidas en `code_styleguides/`)
- [ ] Todas las funciones/métodos públicos están documentados (ej: docstrings, JSDoc)
- [ ] La seguridad de tipos está garantizada (ej: TypeScript types)
- [ ] Sin errores de linting o análisis estático (usando las herramientas configuradas del proyecto)
- [ ] Funciona correctamente en móvil (si aplica)
- [ ] Documentación actualizada si es necesario
- [ ] Sin vulnerabilidades de seguridad introducidas

## Comandos de Desarrollo

**INSTRUCCIÓN PARA EL AGENTE IA: Esta sección debe adaptarse al lenguaje, framework y herramientas de build específicas del proyecto.**

### Configuración

```bash
# Instalar dependencias
npm install
```

### Desarrollo Diario

```bash
# Iniciar servidor de desarrollo
npm run dev

# Ejecutar tests
npm test

# Ejecutar tests con cobertura
npm run test:coverage

# Linting
npm run lint

# Formatear código
npm run format
```

### Antes de Commitear

```bash
# Verificar tipos
npm run typecheck

# Linting
npm run lint

# Tests con cobertura
npm run test:coverage

# Build
npm run build
```

## Requisitos de Testing

### Tests Unitarios

- Cada módulo debe tener tests correspondientes.
- Usar mecanismos apropiados de setup/teardown (ej: `beforeEach`/`afterEach`).
- Mockear dependencias externas.
- Testear tanto casos de éxito como de fallo.

### Tests de Integración

- Testear flujos completos del usuario
- Verificar llamadas HTTP a la API
- Testear autenticación y autorización
- Verificar el mapeo correcto de parámetros OpenAPI → MCP

## Proceso de Revisión de Código

### Checklist de Auto-Revisión

Antes de solicitar revisión:

1. **Funcionalidad**
   - La funcionalidad trabaja según lo especificado
   - Los casos límite están manejados
   - Los mensajes de error son claros y accionables

2. **Calidad de Código**
   - Sigue la guía de estilo
   - Principio DRY aplicado
   - Nombres claros de variables/funciones
   - Comentarios apropiados

3. **Testing**
   - Tests unitarios exhaustivos
   - Tests de integración pasan
   - Cobertura adecuada (>80%)

4. **Seguridad**
   - Sin secretos hardcodeados
   - Validación de entrada presente
   - Sin vulnerabilidades introducidas

5. **Rendimiento**
   - Queries HTTP optimizadas
   - Sin fugas de memoria obvias
   - Caché implementado donde sea necesario

## Directrices de Commits

### Formato del Mensaje

```
<tipo>(<ámbito>): <descripción>

[cuerpo opcional]

[pie opcional]
```

### Tipos

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Solo documentación
- `style`: Formateo, punto y coma faltantes, etc.
- `refactor`: Cambio de código que no corrige un bug ni añade funcionalidad
- `test`: Añadir tests faltantes
- `chore`: Tareas de mantenimiento

### Ejemplos

```bash
git commit -m "feat(auth): Agregar soporte para proveedor de auth personalizado"
git commit -m "fix(tools): Corregir mapeo de parámetros para endpoints con path params"
git commit -m "test(openapi): Agregar tests para parsing de specs YAML"
git commit -m "docs(readme): Actualizar guía de configuración de transporte HTTP"
```

## Definición de Hecho

Una tarea está completa cuando:

1. Todo el código implementado según la especificación
2. Tests unitarios escritos y pasando
3. La cobertura de código cumple los requisitos del proyecto
4. Documentación completa (si aplica)
5. El código pasa todos los checks de linting y análisis estático configurados
6. Notas de implementación añadidas a `plan.md`
7. Cambios commiteados con mensaje apropiado
8. Git note con resumen de la tarea adjunto al commit

## Procedimientos de Emergencia

### Bug Crítico en Producción

1. Crear rama hotfix desde main
2. Escribir test fallido para el bug
3. Implementar corrección mínima
4. Testear exhaustivamente
5. Publicar inmediatamente
6. Documentar en plan.md

### Pérdida de Datos

1. Detener todas las operaciones de escritura
2. Restaurar desde el último backup
3. Verificar integridad de datos
4. Documentar el incidente
5. Actualizar procedimientos de backup

### Brecha de Seguridad

1. Rotar todos los secretos inmediatamente
2. Revisar logs de acceso
3. Parchear la vulnerabilidad
4. Notificar a usuarios afectados (si corresponde)
5. Documentar y actualizar procedimientos de seguridad

## Flujo de Despliegue

### Checklist Pre-Despliegue

- [ ] Todos los tests pasando
- [ ] Cobertura >80%
- [ ] Sin errores de linting
- [ ] Variables de entorno configuradas
- [ ] Build generado correctamente

### Pasos de Despliegue

1. Mergear rama feature a main
2. Etiquetar release con versión (semantic-release lo gestiona automáticamente)
3. GitHub Actions publica el paquete en npm
4. Verificar el despliegue
5. Testear rutas críticas
6. Monitorear errores

### Post-Despliegue

1. Monitorear analytics
2. Revisar logs de errores
3. Recopilar feedback de usuarios
4. Planificar siguiente iteración

## Mejora Continua

- Revisar el workflow semanalmente
- Actualizar basándose en puntos de dolor
- Documentar lecciones aprendidas
- Optimizar para la satisfacción del usuario
- Mantener las cosas simples y mantenibles
