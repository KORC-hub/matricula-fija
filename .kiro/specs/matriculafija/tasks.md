# Tasks — MatriculaFija

**Estado:** Plan de implementación listo para ejecución  
**Prioridad:** P0 primero; P1 solo tras cerrar P0  
**Regla:** ninguna tarea de pantalla puede cambiar contratos congelados sin una tarea explícita de arquitectura

## 1. Roles y propiedad

| Rol | Responsabilidad | Carpetas principales |
|---|---|---|
| `arquitecto` | Spec, tipos y contratos congelados; resolución de ambigüedades | `.kiro/specs/matriculafija/` |
| `backend-dev` | Dominio/API, fixtures, motor de choques, Route Handlers y pruebas unitarias | `lib/schedule/`, `lib/api/`, `data/`, `app/api/` |
| `frontend-dev` | Fundación visual y luego las pantallas; store e integración de cliente | `app/(flow)/`, `components/`, `store/`, `styles/`, scaffold |
| `tech-lead` | Integración, modo demo, capturas/PDF, README y definición de terminado | `scripts/`, `docs/`, `README.md`, gates de integración |

Regla de propiedad: cada agente modifica primero sus carpetas. Un cambio cruzado requiere declarar la excepción en la tarea, entregar el contrato o parche mínimo y pedir revisión al dueño de la carpeta.

## 2. Dependencias globales

```text
SPEC-01 requirements aprobado
        │
        ▼
SPEC-02 design, tipos, contratos y matriz de pruebas congelados
        │
        ├──────────────► B-01 tipos + fixtures
        │                         │
        │                         ▼
        │                    B-02 motor base + tests
        │                         │
        │                         ▼
        │                    B-03 sugeridor
        │                         │
        │                         ▼
        │                    B-04 tests completos
        │                         │
        │                         ▼
        │                    B-05 Route Handlers + tests
        │                         │
        │                         ▼
        │                    B-06 cliente API tipado
        │                         │
        │                         ▼
        │                    F-03 store + API client integrado
        │
        └──────────────► F-01 scaffold + versiones + tokens
                                  │
                                  ▼
                            F-02 kit visual
                                  │
                                  ▼
                            TL-01 gate visual
                                  │
                                  ▼
                            F-04–F-08 pantallas secuenciadas

B-05 + F-08 ─────► TL-02 integración del demo
TL-02 ───────────► TL-03 capturas/PDF + TL-04 README
TL-03 + TL-04 ───► TL-05 gate Definition of Done P0
TL-05 ───────────► P1-01 en adelante, solo si P0 está cerrado
```

La documentación de spec ya contiene `requirements.md` y `design.md`; `SPEC-01` y `SPEC-02` representan su revisión y congelamiento, no una implementación.

## 3. Fase 0 — congelamiento previo

### SPEC-01 — Revisar y aprobar requirements

- **Asignado a:** `arquitecto`
- **Dependencias:** ninguna
- **Salida:** `requirements.md` aprobado.
- **Hecho cuando:** las ocho pantallas P0, el caso dorado, el alcance P1, el comportamiento mockup y los criterios de aceptación están explícitos; no quedan requisitos productivos implícitos.
- **Estado:** completada al crear este spec.

### SPEC-02 — Congelar design, tipos y contratos

- **Asignado a:** `arquitecto`
- **Dependencias:** SPEC-01
- **Salida:** `design.md` con estructura, tipos, contratos API, precedencia del motor, navegación, store, tokens y seams de prueba.
- **Hecho cuando:** `backend-dev` puede implementar el dominio sin inventar campos HTTP, `frontend-dev` puede consumir respuestas sin adivinar estados y ningún contrato depende de una decisión futura de UI.
- **Estado:** completada al crear este spec.

### SPEC-03 — Congelar matriz de pruebas del motor

- **Asignado a:** `arquitecto`
- **Dependencias:** SPEC-02
- **Salida:** lista de casos mínimos en `requirements.md`/`design.md` y sus expectativas.
- **Hecho cuando:** están cubiertos límites exactos, desplazamiento cero, mediodía, horario vacío, materia sin grupos, grupos sin cupos, choques y sugerencia dorada.
- **Estado:** completada al crear este spec.

### TL-00 — Registrar límites y handoffs del trabajo

- **Asignado a:** `tech-lead`
- **Dependencias:** SPEC-02, SPEC-03
- **Salida:** ramas o estrategia de trabajo acordada y registro de dueño por carpeta.
- **Hecho cuando:** cada tarea de implementación tiene un solo dueño, las dependencias están ordenadas y el equipo conoce que frontend no empieza pantallas antes del gate visual.

## 4. Fase 1 — dominio/API y fundación visual

### B-01 — Implementar tipos, schemas base, fixtures y configuración de ejemplo

- **Asignado a:** `backend-dev`
- **Dependencias:** SPEC-02, SPEC-03
- **Archivos:** `lib/schedule/types.ts`, `lib/api/contracts.ts`, `data/catalog.ts`, `data/demo.ts`, `lib/config.ts`.
- **Hecho cuando:**
  - Los tipos coinciden con `design.md`.
  - Los schemas zod validan horarios, IDs, grupos y requests.
  - El fixture conserva exactamente el caso dorado.
  - El valor por crédito está en una única configuración.
  - Se entrega una nota de handoff con tipos, IDs de fixture y ejemplos de requests.

### B-02 — Implementar clasificación trabajo-clase y utilidades puras

- **Asignado a:** `backend-dev`
- **Dependencias:** B-01
- **Archivos:** `lib/schedule/time.ts`, `lib/schedule/compatibility.ts`, `lib/schedule/index.ts`.
- **Hecho cuando:**
  - Se calculan solapamiento, límites y huecos por día.
  - Se distinguen compatible, riesgo, choque y sin cupos.
  - Las razones devueltas son legibles en español y tienen código estable.
  - El motor no importa Next, React, fetch ni store.

### B-03 — Implementar conflictos entre clases y sugeridor determinista

- **Asignado a:** `backend-dev`
- **Dependencias:** B-02
- **Archivos:** `lib/schedule/conflicts.ts`, `lib/schedule/suggest.ts`.
- **Hecho cuando:**
  - Detecta choques entre grupos seleccionados.
  - Excluye grupos sin cupos.
  - Respeta grupos fijados válidos.
  - Hace backtracking determinista y aplica la puntuación definida.
  - Devuelve plan dorado de 12 créditos y explica Estadística como bloqueante.

### B-04 — Escribir pruebas unitarias completas del motor

- **Asignado a:** `backend-dev`
- **Dependencias:** B-02, B-03
- **Archivos:** `lib/schedule/**/*.test.ts`.
- **Hecho cuando:** Vitest cubre los diez casos mínimos de RF-14, incluyendo fronteras exactas y determinismo, y todas las pruebas pasan en single-run.

### B-05 — Implementar Route Handlers P0 y validación de errores

- **Asignado a:** `backend-dev`
- **Dependencias:** B-01, B-02, B-03, B-04
- **Archivos:** `app/api/catalog/route.ts`, `app/api/compatibility/route.ts`, `app/api/plan/validate/route.ts`, `app/api/plan/suggest/route.ts`, `lib/api/errors.ts`.
- **Hecho cuando:**
  - Los cuatro endpoints aceptan los requests de `design.md`.
  - Toda entrada pasa por zod.
  - Los errores usan `{ error: { code, message } }` en español.
  - Los handlers no guardan estado entre requests.
  - Una prueba o smoke request cubre éxito, body inválido e ID inexistente.

### F-01 — Crear scaffold local y seleccionar versiones compatibles

- **Asignado a:** `frontend-dev`
- **Dependencias:** SPEC-02
- **Archivos:** `package.json`, configuración de Next/TypeScript/Tailwind, `app/layout.tsx`, estilos base, README y nota de versión en `design.md`.
- **Hecho cuando:**
  - `npm install`, `npm run dev` y una página mínima funcionan localmente.
  - Next, React y Tailwind son compatibles y quedan registrados.
  - TypeScript estricto está activo.
  - La fuente se carga mediante `next/font`.
  - No se introduce servidor separado ni servicio externo.

### F-02 — Implementar tokens y kit visual compartido

- **Asignado a:** `frontend-dev`
- **Dependencias:** F-01, SPEC-02
- **Archivos:** `tailwind.config.*`, `styles/*`, `components/ui/*`.
- **Hecho cuando:**
  - Los tokens índigo/navy, turquesa, superficies, estados, tipografía, radios y sombras están centralizados.
  - Existen `Button`, `Card`, `StatusBadge`, `Stepper`, `WeeklyGrid`, `GroupDrawer`, `Toast`, `EmptyState`, `FormField` y `Skeleton`.
  - Los estados usan icono y texto además del color.
  - Hay foco visible, variantes loading/disabled y contraste aceptable.
  - No hay estilos ad hoc de botón para una pantalla.

### TL-01 — Revisar y cerrar la fundación visual

- **Asignado a:** `tech-lead`
- **Dependencias:** F-02
- **Salida:** gate visual aprobado.
- **Hecho cuando:** se revisan tokens, consistencia de componentes, nombres de estados, accesibilidad básica y viewport 1440×900; frontend recibe correcciones concretas o aprobación. Las pantallas no comienzan antes de este cierre.

## 5. Fase 2 — cliente y pantallas P0

### B-06 — Entregar fixtures y cliente tipado para frontend

- **Asignado a:** `backend-dev`
- **Dependencias:** B-01, B-05
- **Archivos:** `lib/api/client.ts`, exports públicos de contratos y fixtures documentados.
- **Hecho cuando:** frontend puede importar tipos, cargar catálogo, consultar compatibilidad, validar plan y sugerir combinación sin conocer detalles de fetch ni duplicar lógica del dominio; los errores se normalizan al envelope común.

### F-03 — Implementar store, adaptador de storage y compuerta de hidratación

- **Asignado a:** `frontend-dev`
- **Dependencias:** F-02, B-01, B-06
- **Archivos:** `store/semester-store.ts`, `lib/storage.ts`, providers o hooks de hidratación.
- **Hecho cuando:**
  - Solo `lib/storage.ts` accede a `localStorage`.
  - El estado tiene versión y reinicio completo.
  - Las páginas client muestran skeleton hasta `hydrated`.
  - No se renderizan datos personales en servidor.
  - `?demo=1` y “Reiniciar demo” son acciones idempotentes.

### F-04 — Implementar shell, rutas, bienvenida y perfil

- **Asignado a:** `frontend-dev`
- **Dependencias:** TL-01, F-03
- **Archivos:** rutas `/`, `/perfil`, layout del flujo y componentes de formulario.
- **Hecho cuando:**
  - Ambas rutas existen y navegan con acciones reales.
  - La bienvenida explica la propuesta de valor y ofrece demo.
  - Perfil valida campos con mensajes definidos.
  - Stepper y Atrás tienen apariencia y comportamiento consistentes.
  - El modo demo puede saltar el formulario sin botones muertos.

### F-05 — Implementar horario laboral y selección de materias

- **Asignado a:** `frontend-dev`
- **Dependencias:** F-04, B-06
- **Archivos:** `/horario-laboral`, `/materias`, componentes de edición de horario y selección.
- **Hecho cuando:**
  - El chip de Camilo llena la grilla en vivo.
  - La edición directa valida bloques y desplazamiento cero.
  - La selección actualiza créditos y valor de referencia.
  - Vacío, límite, error y éxito tienen salida clara.
  - Los datos se guardan en el store sin recarga.

### F-06 — Implementar compatibilidad y conexión con API

- **Asignado a:** `frontend-dev`
- **Dependencias:** F-05, B-05, B-06
- **Archivos:** `/compatibilidad`, tarjetas de compatibilidad y feedback de API.
- **Hecho cuando:**
  - Carga catálogo/resultados mediante cliente tipado.
  - Muestra compatible, riesgo, choque, no viable y sin cupos con icono, texto y razón.
  - El caso dorado muestra Estadística inviable y Bases G1 riesgosa.
  - Error y reintento funcionan sin recargar la app.
  - La salida a `/armador` conserva el estado.

### F-07 — Implementar armador, drawer y recálculo real

- **Asignado a:** `frontend-dev`
- **Dependencias:** F-06, B-05
- **Archivos:** `/armador`, `WeeklyGrid`, `GroupDrawer`, resumen de conflictos.
- **Hecho cuando:**
  - Se visualizan trabajo, clases y choques en desktop y lista por día en móvil.
  - Cambiar Bases G1 a G2 muestra el choque con Requisitos G1.
  - Cambiar Requisitos a G2 deja el plan sin choques.
  - “Sugerir combinación sin choques” muestra resultado o explicación.
  - Los grupos sin cupos están deshabilitados y explicados.
  - Loading y error de cada cambio dejan el estado recuperable.

### F-08 — Implementar plan listo y mi semestre

- **Asignado a:** `frontend-dev`
- **Dependencias:** F-07, TL-01
- **Archivos:** `/plan-listo`, `/mi-semestre`, acciones de impresión/descarga y alerta local.
- **Hecho cuando:**
  - Plan listo muestra cuatro materias, 12 créditos y cero choques en el caso dorado.
  - Dinero evitado lleva etiqueta de valor de referencia de ejemplo.
  - Descargar/imprimir produce un resultado local utilizable.
  - “Ir a matricular” solo da aviso de demo.
  - Mi semestre muestra materias, pendiente, alerta simulada y CTA de aviso local.
  - Reiniciar demo vuelve a `/` y limpia el estado.
  - No aparece “Compartir” en P0.

## 6. Fase 3 — integración y entrega P0

### TL-02 — Integrar y ejecutar el recorrido dorado

- **Asignado a:** `tech-lead`
- **Dependencias:** B-05, B-06, F-08
- **Salida:** recorrido completo integrado.
- **Hecho cuando:** desde `?demo=1` se recorren las ocho rutas, se reproduce el cambio de grupos, se confirma el plan final y se puede reiniciar sin datos residuales. Los bugs se devuelven al dueño de la carpeta, no se parchean silenciosamente en otra capa.

### TL-03 — Crear script de capturas y PDF

- **Asignado a:** `tech-lead`
- **Dependencias:** TL-02
- **Archivos:** `scripts/capture.*`, `docs/` y configuración Playwright.
- **Hecho cuando:**
  - El script fija viewport 1440×900.
  - Captura las ocho pantallas en orden usando modo demo.
  - Espera estados visibles, no tiempos arbitrarios como única sincronización.
  - Produce imágenes numeradas y `docs/pantallazos.pdf`.
  - Puede repetirse después de “Reiniciar demo”.

### TL-04 — Completar README y comandos locales

- **Asignado a:** `tech-lead`
- **Dependencias:** TL-02, TL-03, F-01
- **Archivos:** `README.md`, scripts de package si requieren ajuste.
- **Hecho cuando:** README explica instalación limpia, `npm run dev`, build, lint, tests, modo demo, Playwright, captura y ubicación del PDF; no menciona despliegue público ni servicios que no existan.

### TL-05 — Gate de definición de terminado P0

- **Asignado a:** `tech-lead`
- **Dependencias:** B-04, B-05, TL-02, TL-03, TL-04
- **Hecho cuando:**
  - `npm run build`, lint y tests pasan.
  - El recorrido dorado dura tres minutos o menos.
  - No hay botones muertos, textos de relleno ni errores de consola visibles.
  - El caso fuera de guion no rompe la UI.
  - La hidratación, accesibilidad básica y etiquetas de datos de ejemplo fueron revisadas.
  - PDF y README están presentes.
  - El equipo declara P0 cerrado por escrito antes de iniciar P1.

## 7. Fase 4 — P1 opcional

### P1-01 — Fixture y contrato de empleos ficticios

- **Asignado a:** `backend-dev`
- **Dependencias:** TL-05
- **Hecho cuando:** `POST /api/jobs/match` valida el plan, devuelve vacantes ficticias con horarios y razón de compatibilidad, y cubre éxito, vacío y error con zod.

### P1-02 — Pantalla de empleos compatibles

- **Asignado a:** `frontend-dev`
- **Dependencias:** P1-01, TL-01, TL-05
- **Hecho cuando:** `/empleos` muestra resultados, “Datos de ejemplo”, razones de match y estados de carga/vacío/error; no introduce integración real ni rompe el flujo P0.

### P1-03 — Captura y revisión de P1

- **Asignado a:** `tech-lead`
- **Dependencias:** P1-02
- **Hecho cuando:** la captura opcional está documentada como P1, la navegación desde el teaser funciona y todas las gates P0 siguen verdes.

## 8. Handoffs obligatorios

1. `arquitecto` entrega a `backend-dev` tipos, contratos y matriz de pruebas congelados.
2. `backend-dev` entrega a `frontend-dev` IDs de fixtures, tipos públicos, cliente tipado y ejemplos de error después de B-06.
3. `frontend-dev` entrega a `tech-lead` kit visual cerrado antes de F-04.
4. `frontend-dev` entrega el recorrido de pantallas P0 a `tech-lead` después de F-08.
5. `tech-lead` devuelve defectos al dueño de la carpeta con ruta, reproducción y criterio de aceptación afectado.

## 9. Definition of Done global

El proyecto se considera terminado cuando TL-05 está aprobado y, si se decide ejecutar P1, P1-03 también está aprobado. La aprobación exige:

- Ocho pantallas P0 pulidas y navegables.
- Motor real, probado y compartido por API/cliente.
- API stateless con validación y errores uniformes.
- Demo de Camilo reproducible en tres minutos o menos.
- Plan final de 4 materias y 12 créditos sin choques.
- Store persistido solo en cliente con hidratación segura.
- Tokens y kit visual consistentes.
- Build, lint, tests, smoke y capturas verdes.
- PDF ordenado y README ejecutable desde una máquina limpia.
- P1 separado y sin bloquear la entrega principal.
