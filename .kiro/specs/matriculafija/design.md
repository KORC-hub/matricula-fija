# Design — MatriculaFija

**Estado:** Diseño congelado para implementación  
**Alcance:** P0 obligatorio; P1 condicionado al cierre de P0  
**Producto:** Mockup web local de alta fidelidad  
**Fuente:** `requirements.md`, `README.md` y decisiones aprobadas en la Ronda 1

## 1. Decisiones de diseño

### 1.1 Frontera del mockup

MatriculaFija es un mockup de alta fidelidad. La interacción que aporta credibilidad —cruzar horarios, cambiar grupos, detectar conflictos y sugerir combinaciones— es real, pura y determinista. El resto se simula explícitamente en el cliente con fixtures locales y mensajes honestos.

La aplicación no crea usuarios, no matricula materias, no procesa pagos, no envía notificaciones y no persiste datos en servidor. El servidor solo ejecuta funciones de API sin estado; la sesión de la demo vive en el navegador.

### 1.2 Decisiones fijadas

- Next.js con App Router, frontend y backend en el mismo proyecto.
- TypeScript estricto, React, Tailwind CSS, `next/font` y una sola librería de iconos.
- Route Handlers en `app/api/**/route.ts`; no hay servidor separado.
- Fixtures TypeScript/JSON; no hay base de datos ni autenticación.
- API stateless; cada request recibe todos los datos necesarios.
- Store de cliente persistido en `localStorage` mediante un único adaptador y compuerta de hidratación.
- Rutas propias para cada pantalla del flujo.
- P0: ocho pantallas; P1: `POST /api/jobs/match` y pantalla de empleos.
- Tokens visuales índigo/navy, turquesa, superficies claras y estados semánticos fijos.
- `npm install && npm run dev` como ejecución local; no se diseña despliegue.

## 2. Arquitectura de alto nivel

```text
Browser
  ├─ App Router pages and client flow components
  ├─ Client store + localStorage adapter
  ├─ Typed API client
  └─ Pure schedule functions shared by client and Route Handlers
              │ fetch, full request payload on every call
              ▼
Next.js Route Handlers (`app/api/**/route.ts`)
  ├─ zod request validation
  ├─ fixture/catalog lookup
  ├─ pure schedule domain functions
  └─ uniform JSON response/error envelope
```

### 2.1 Capas

| Capa | Responsabilidad | Regla de dependencia |
|---|---|---|
| App Router | Rutas, layouts, estados de navegación y metadata | Consume componentes y store; no contiene reglas de choque |
| UI kit | Componentes visuales accesibles y tokens | No conoce endpoints ni fixtures |
| Flow screens | Composición de pantallas y microcopy | Consume store, cliente API y UI kit |
| Store | Estado de sesión de la demo y persistencia cliente | Nunca se importa desde Route Handlers |
| API client | Requests tipados, parseo de éxito/error y reintentos explícitos | No contiene reglas de negocio |
| Schedule domain | Tipos, validación, compatibilidad, conflictos y sugeridor | Funciones puras; no importa React, Next ni `localStorage` |
| Fixtures | Catálogo, caso Camilo, alertas y empleos ficticios | No contiene lógica de presentación |
| Route Handlers | Transporte HTTP, zod y adaptación de respuestas | No mantiene estado mutable entre requests |
| Scripts | Capturas y PDF reproducibles | Usa la aplicación como usuario, no APIs internas |

### 2.2 Estructura prevista

```text
app/
  (flow)/
    page.tsx                    # bienvenida, puede ser Server Component
    perfil/page.tsx
    horario-laboral/page.tsx
    materias/page.tsx
    compatibilidad/page.tsx
    armador/page.tsx
    plan-listo/page.tsx
    mi-semestre/page.tsx
    empleos/page.tsx            # P1
    layout.tsx                  # shell del flujo y metadata compartida
  api/
    catalog/route.ts
    compatibility/route.ts
    plan/validate/route.ts
    plan/suggest/route.ts
    jobs/match/route.ts         # P1
components/
  ui/                           # Button, Card, Badge, Stepper, etc.
  flow/                         # piezas específicas del recorrido
  schedule/                     # WeeklyGrid, bloques y drawer
  feedback/                     # Toast, EmptyState, estados de API
data/
  catalog.ts                    # materias y grupos ficticios
  demo.ts                       # caso de Camilo
  jobs.ts                       # vacantes ficticias P1
lib/
  schedule/                     # dominio puro y tipos del horario
  api/
    contracts.ts                # schemas/types públicos compartidos
    client.ts                   # cliente HTTP tipado del navegador
    errors.ts                   # normalización de errores
  config.ts                     # nombre de producto y valor por crédito
  storage.ts                    # único adaptador de localStorage
store/
  semester-store.ts             # estado de sesión y acciones
styles/
  tokens.css                   # variables auxiliares si son necesarias
scripts/
  capture.ts                    # recorrido Playwright y PDF
  capture.config.ts
public/
  illustrations/                # SVG propios, si se requieren
docs/
  pantallazos.pdf               # salida generada, no fuente
.kiro/specs/matriculafija/
  requirements.md
  design.md
  tasks.md
```

La implementación puede ajustar nombres internos, pero debe conservar las fronteras y los contratos de este documento.

## 3. Tipos compartidos congelados

Los tipos públicos deben vivir en un módulo compartido que pueda ser importado por dominio, API client y UI. Los schemas de zod pueden ser la fuente de validación de requests, pero sus tipos inferidos deben mantener estos nombres y significados.

```ts
type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
type Time = `${number}:${number}`

type TimeBlock = {
  day: Day
  start: Time
  end: Time
}

type WorkSchedule = {
  blocks: TimeBlock[]
  commuteMinutes: number
}

type Course = {
  id: string
  name: string
  credits: number
  groupIds: string[]
}

type CourseGroup = {
  id: string
  courseId: string
  label: string
  blocks: TimeBlock[]
  seatsLeft: number
}

type Catalog = {
  courses: Course[]
  groups: CourseGroup[]
}
```

Los valores de tiempo se transportan como `HH:mm` de 24 horas. El dominio convierte a minutos desde medianoche para comparar. No se soportan bloques que atraviesen medianoche; “cruzar el mediodía” significa que el cálculo debe funcionar sin una división especial del día.

```ts
type CompatibilityStatus = 'compatible' | 'risk' | 'conflict'
type CourseStatus = 'compatible' | 'risk' | 'no_viable'
type ConflictType = 'work_class' | 'class_class'

type CompatibilityReason = {
  code: string
  message: string
  relatedBlock?: TimeBlock
}

type GroupCompatibility = {
  groupId: string
  courseId: string
  status: CompatibilityStatus | 'no_seats'
  reason: CompatibilityReason
  seatsLeft: number
}

type CourseCompatibility = {
  courseId: string
  status: CourseStatus
  groups: GroupCompatibility[]
  reason: CompatibilityReason
}

type Conflict = {
  type: ConflictType
  groupIds: string[]
  courseIds: string[]
  message: string
  blocks: TimeBlock[]
}

type Plan = {
  groupIds: string[]
  courseIds: string[]
  credits: number
  conflicts: Conflict[]
  isValid: boolean
}

type SuggestionResult = {
  plan?: Plan
  blockedCourses: Array<{
    courseId: string
    reason: string
  }>
  explanation?: string
}

type ApiError = {
  error: {
    code: string
    message: string
  }
}
```

### 3.1 Orden y precedencia

- En un grupo: `conflict` tiene prioridad sobre `risk`, y `risk` sobre `compatible`.
- Para una materia: `compatible` es mejor que `risk`, y ambos son mejores que `no_viable`.
- Un grupo sin cupos se representa como `no_seats`, se visualiza como “Sin cupos” y se excluye de cualquier sugerencia.
- Las listas de respuesta conservan el orden del catálogo; el sugeridor desempata por identificadores en orden lexicográfico para ser determinista.

## 4. Motor de horarios

El motor vive en `lib/schedule` y expone funciones puras. No importa React, Next, zod, fetch ni el store.

### 4.1 Funciones conceptuales

```ts
parseTime(value: Time): number
blocksOverlap(left: TimeBlock, right: TimeBlock): boolean
commuteGap(work: TimeBlock, classBlock: TimeBlock): number | null
classifyGroup(group: CourseGroup, work: WorkSchedule): GroupCompatibility
summarizeCourse(course: Course, groups: CourseGroup[], work: WorkSchedule): CourseCompatibility
findPlanConflicts(work: WorkSchedule, groups: CourseGroup[]): Conflict[]
suggestPlan(input: SuggestPlanInput, catalog: Catalog): SuggestionResult
```

Los nombres pueden cambiar internamente, pero cada comportamiento debe conservar una seam testeable a nivel de función pura.

### 4.2 Reglas de cálculo

1. Dos bloques se solapan si pertenecen al mismo día y `left.start < right.end` y `right.start < left.end`.
2. Si `left.end === right.start` o `right.end === left.start`, no existe solapamiento.
3. Si existe solapamiento entre clase y trabajo, el grupo es `conflict` y no se evalúa como riesgo.
4. Si no existe solapamiento, se calcula el hueco entre el final de uno y el inicio del otro en el mismo día.
5. El estado es `risk` cuando el hueco es menor que `commuteMinutes`. Con desplazamiento cero, ningún hueco no negativo produce riesgo.
6. Si no hay choque ni riesgo, el grupo es `compatible`.
7. Se evalúan todos los pares de bloques de cada grupo contra todos los bloques laborales.
8. Los choques entre clases se calculan entre grupos seleccionados, sin aplicar desplazamiento entre clases.
9. Los bloques con datos inválidos se rechazan antes del cálculo: día permitido, `start < end`, formato de hora válido y desplazamiento entero no negativo.

### 4.3 Sugeridor determinista

El sugeridor recibe materias elegidas y grupos fijados opcionales. Recorre las materias en el orden del catálogo, descarta grupos sin cupos o con choque laboral, y hace backtracking sobre las alternativas restantes.

La puntuación de una solución se ordena así:

1. Mayor número de créditos.
2. Mayor número de materias.
3. Menor secuencia lexicográfica de `groupIds`.

Los grupos fijados se conservan si existen, tienen cupos y no generan conflicto; si un grupo fijado hace imposible la solución, la respuesta explica qué materia o conflicto lo bloquea. El algoritmo no modifica fixtures ni estado global.

## 5. Contratos de API

Todos los endpoints responden JSON, no leen cookies de sesión y no escriben estado en memoria. Los Route Handlers convierten excepciones de validación en el envelope `ApiError`.

### 5.1 `GET /api/catalog`

**Request:** sin body.

**Respuesta 200:**

```json
{
  "courses": [
    {
      "id": "estadistica-aplicada",
      "name": "Estadística Aplicada",
      "credits": 3,
      "groupIds": ["estadistica-aplicada-g1"]
    }
  ],
  "groups": [
    {
      "id": "estadistica-aplicada-g1",
      "courseId": "estadistica-aplicada",
      "label": "G1",
      "blocks": [{ "day": "mon", "start": "10:00", "end": "12:00" }],
      "seatsLeft": 30
    }
  ]
}
```

El catálogo completo incluye los datos del caso dorado. Los datos pueden crecer sin cambiar el contrato.

### 5.2 `POST /api/compatibility`

**Request:**

```json
{
  "workSchedule": {
    "blocks": [{ "day": "mon", "start": "06:00", "end": "14:00" }],
    "commuteMinutes": 45
  },
  "courseIds": ["estadistica-aplicada", "bases-datos-ii"]
}
```

**Respuesta 200:**

```json
{
  "courses": [
    {
      "courseId": "bases-datos-ii",
      "status": "compatible",
      "reason": { "code": "BEST_GROUP_COMPATIBLE", "message": "Hay un grupo compatible." },
      "groups": [
        {
          "groupId": "bases-datos-ii-g1",
          "courseId": "bases-datos-ii",
          "status": "risk",
          "reason": {
            "code": "COMMUTE_TOO_SHORT",
            "message": "Termina tu turno a las 2:00 p. m. y la clase empieza a las 2:00 p. m.; necesitas aproximadamente 45 minutos para llegar."
          },
          "seatsLeft": 20
        }
      ]
    }
  ]
}
```

La respuesta incluye todos los grupos de las materias solicitadas, incluidos `conflict` y `no_seats`, para que la UI pueda explicar la decisión.

### 5.3 `POST /api/plan/validate`

**Request:**

```json
{
  "workSchedule": {
    "blocks": [{ "day": "mon", "start": "06:00", "end": "14:00" }],
    "commuteMinutes": 45
  },
  "groupIds": ["bases-datos-ii-g2", "ingenieria-requisitos-g1"]
}
```

**Respuesta 200:**

```json
{
  "isValid": false,
  "conflicts": [
    {
      "type": "class_class",
      "groupIds": ["bases-datos-ii-g2", "ingenieria-requisitos-g1"],
      "courseIds": ["bases-datos-ii", "ingenieria-requisitos"],
      "message": "Estos grupos se cruzan entre sí.",
      "blocks": [
        { "day": "tue", "start": "18:00", "end": "20:00" },
        { "day": "tue", "start": "18:00", "end": "20:00" }
      ]
    }
  ]
}
```

La validación devuelve conflictos de trabajo-clase y clase-clase. Un riesgo de desplazamiento no es un conflicto duro, pero puede devolverse como advertencia separada si el contrato final de UI lo necesita; no convierte `isValid` en falso por sí solo.

### 5.4 `POST /api/plan/suggest`

**Request:**

```json
{
  "workSchedule": {
    "blocks": [{ "day": "mon", "start": "06:00", "end": "14:00" }],
    "commuteMinutes": 45
  },
  "courseIds": [
    "estadistica-aplicada",
    "bases-datos-ii",
    "ingenieria-requisitos",
    "desarrollo-web",
    "ingles-v"
  ],
  "pinnedGroupIds": []
}
```

**Respuesta 200 con solución parcial:**

```json
{
  "plan": {
    "groupIds": [
      "bases-datos-ii-g2",
      "ingenieria-requisitos-g2",
      "desarrollo-web-g1",
      "ingles-v-g1"
    ],
    "courseIds": [
      "bases-datos-ii",
      "ingenieria-requisitos",
      "desarrollo-web",
      "ingles-v"
    ],
    "credits": 12,
    "conflicts": [],
    "isValid": true
  },
  "blockedCourses": [
    {
      "courseId": "estadistica-aplicada",
      "reason": "Su único grupo se cruza con tu horario laboral."
    }
  ],
  "explanation": "No hay un grupo compatible para todas las materias elegidas; se propone la mejor combinación disponible."
}
```

**Respuesta 200 sin solución:** `plan` puede omitirse, `blockedCourses` debe identificar las materias bloqueantes y `explanation` debe ser legible para una persona.

### 5.5 `POST /api/jobs/match` — P1

**Request mínimo:**

```json
{
  "plan": {
    "groupIds": ["bases-datos-ii-g2"],
    "courseIds": ["bases-datos-ii"],
    "credits": 4,
    "conflicts": [],
    "isValid": true
  }
}
```

**Respuesta 200:**

```json
{
  "jobs": [
    {
      "id": "soporte-remoto-ejemplo",
      "title": "Auxiliar de soporte remoto",
      "schedule": [{ "day": "mon", "start": "08:00", "end": "12:00" }],
      "matchReason": "Este turno deja libres tus clases del plan.",
      "isExampleData": true
    }
  ]
}
```

### 5.6 Errores comunes

| HTTP | Código | Uso |
|---:|---|---|
| 400 | `INVALID_REQUEST` | JSON ausente o con formato inválido |
| 400 | `INVALID_TIME_BLOCK` | Bloque con hora o día inválido |
| 404 | `CATALOG_ITEM_NOT_FOUND` | Materia o grupo inexistente |
| 409 | `INCONSISTENT_PLAN` | Grupos que no corresponden a las materias solicitadas |
| 422 | `NO_FEASIBLE_PLAN` | Solicitud válida pero sin solución completa |
| 500 | `INTERNAL_ERROR` | Error inesperado; mensaje humano y sin stack trace |

## 6. Store, persistencia e hidratación

### 6.1 Estado del store

El store cliente contiene únicamente datos de la sesión de la demo:

- `profile`: nombre, correo, universidad, programa y semestre.
- `workSchedule`.
- `selectedCourseIds`.
- `selectedGroupIds` y grupos fijados.
- `compatibility` y `validation` más recientes, como caché descartable.
- `finalPlan`.
- `demoMode`, `hydrated`, `noticeState` y versión del store.

Las respuestas de la API pueden recalcularse; no se tratan como fuente definitiva si cambian los inputs.

### 6.2 Flujo de hidratación

1. El servidor renderiza la bienvenida sin datos persistidos.
2. Las páginas client montan un skeleton de pantalla completa.
3. Tras montar, el store usa `lib/storage` para leer una clave versionada.
4. `hydrated` pasa a `true` y se renderizan datos personales y controles.
5. Si `localStorage` está bloqueado, corrupto o ausente, se usa estado vacío en memoria y un toast informativo; la app sigue siendo navegable.
6. “Reiniciar demo” limpia la clave, reinicia el store y navega a `/`.

No debe existir acceso directo a `window.localStorage` fuera del adaptador único.

## 7. Mapa de navegación

| Momento | Ruta | Pantalla | Entrada principal | Salida |
|---:|---|---|---|---|
| 1 | `/` | Bienvenida | ninguna | `/perfil` o cargar demo |
| 2 | `/perfil` | Tu perfil | `profile` | `/horario-laboral` |
| 3 | `/horario-laboral` | Tu horario laboral | `workSchedule` | `/materias` |
| 4 | `/materias` | Elige tus materias | `selectedCourseIds` | `/compatibilidad` |
| 5 | `/compatibilidad` | Análisis | `compatibility` | `/armador` |
| 6 | `/armador` | Armador | `selectedGroupIds`, conflictos | `/plan-listo` |
| 7 | `/plan-listo` | Plan listo | `finalPlan` | `/mi-semestre` |
| 8 | `/mi-semestre` | Mi semestre | plan, pendiente, alertas | reinicio o P1 |
| 9 | `/empleos` | Empleos compatibles | plan válido | P1; opcional |

El stepper aparece en momentos 2–7 e identifica el momento actual. Atrás usa la ruta previa del mapa y conserva el store. Los saltos del modo demo solo omiten formularios, no omiten el análisis ni la interacción de cambio de grupos.

## 8. Sistema visual

### 8.1 Tokens congelados

Estos nombres son la API visual. Los valores pueden expresarse como tokens de Tailwind o variables CSS, pero no deben cambiar durante la construcción de P0.

```text
brand.navy       #172554
brand.indigo     #4F46E5
brand.turquoise  #0F766E
surface.page     #F8FAFC
surface.card     #FFFFFF
text.primary     #172033
text.secondary   #475569
border.default   #CBD5E1
status.success   #15803D
status.warning   #B45309
status.danger    #B91C1C
status.work      #64748B
class.blue       #2563EB
class.purple     #7C3AED
class.teal       #0F766E
class.orange     #C2410C
```

- Fuente principal: sans-serif cargada con `next/font`; el nombre exacto se fija en el scaffold y se registra en README.
- Escala de espaciado: base de 4 px, con pasos `1, 2, 3, 4, 6, 8, 12, 16`.
- Radios: `sm` 8 px, `md` 12 px, `lg` 16 px, `pill` 9999 px.
- Sombras: una sombra sutil para tarjetas y una sombra de foco/drawer; sin efectos decorativos que reduzcan contraste.
- Foco: anillo visible de `brand.indigo` con separación del control.
- Estados: cada Badge combina color, icono y texto; nunca se comunica solo mediante color.

### 8.2 Componentes compartidos

| Componente | Responsabilidad mínima |
|---|---|
| `Button` | Variantes primary, secondary, ghost, danger; foco, disabled y loading |
| `Card` | Superficie, borde, radio y padding consistente |
| `StatusBadge` | Icono + texto + color para compatible, riesgo, choque, sin cupos |
| `Stepper` | Momentos 2–7, actual, completado y navegación accesible |
| `WeeklyGrid` | Trabajo, clases, conflictos y alternativa móvil por día |
| `GroupDrawer` | Lista de grupos, cupos, estado y selección de grupo |
| `Toast` | Feedback de éxito, aviso y error, con cierre accesible |
| `EmptyState` | Explicación y acción de salida, no pantalla vacía |
| `FormField` | Label, hint, input, error y asociación accesible |
| `Skeleton` | Placeholder de hidratación y carga de API |

Las pantallas componen estos componentes; no crean estilos de botones o estados ad hoc.

## 9. Flujo de datos del caso dorado

1. `/` activa demo y escribe el fixture de Camilo en el store cliente.
2. `/horario-laboral` muestra Lu–Vi 06:00–14:00 y 45 minutos.
3. `/materias` deja seleccionadas las cinco materias.
4. `/compatibilidad` llama al endpoint con horario y cursos; presenta Estadística como choque/no viable y Bases G1 como riesgo.
5. `/armador` selecciona una combinación inicial y valida grupos.
6. Cambiar Bases a G2 provoca la respuesta de choque con Requisitos G1.
7. Cambiar Requisitos a G2 produce `isValid: true` y cuatro materias viables.
8. `/plan-listo` resume el plan y permite imprimir/descargar.
9. `/mi-semestre` muestra plan, Estadística pendiente y alerta simulada.

## 10. Testing y seams

### 10.1 Seam principal

La seam de mayor valor es el módulo puro de `lib/schedule`. Las pruebas verifican comportamiento externo: estados, razones, conflictos, cupos y selección sugerida. No se prueba la implementación privada del algoritmo ni los detalles de React.

### 10.2 Pruebas unitarias Vitest

- Conversión y validación de horas.
- Solapamiento con frontera exacta.
- Riesgo con desplazamiento cero y huecos menores al desplazamiento.
- Bloques de lunes a sábado y horas alrededor del mediodía.
- Trabajo vacío, materia sin grupos y grupos sin cupos.
- Choques entre clases.
- Precedencia de estados por grupo y materia.
- Backtracking determinista y caso dorado.

### 10.3 Pruebas de Route Handlers

Se prueban requests válidos, entradas zod inválidas, elementos inexistentes, envelope de error y ausencia de estado entre requests. Los handlers se prueban con fixtures controlados y no con red externa.

### 10.4 Recorrido Playwright

Playwright se reserva para el script de capturas y un smoke test del recorrido demo: carga, selección, cambio de grupos, plan final, reinicio y generación del artefacto. Usa viewport 1440×900 y selectores accesibles o `data-testid` estables solo donde el texto no sea suficiente.

### 10.5 Gates de calidad

Antes de declarar P0 cerrado deben pasar build, lint, Vitest, smoke del demo, revisión de accesibilidad básica, ausencia de errores de consola y generación del PDF.

## 11. Estrategia de ejecución local

- `npm install` instala dependencias declaradas y fijadas por el scaffold.
- `npm run dev` inicia Next.js en local.
- `npm run build` verifica compilación de producción.
- `npm run lint` ejecuta el linter.
- `npm test` ejecuta Vitest en modo single-run.
- `npm run capturas` inicia o usa el servidor local, ejecuta Playwright y genera capturas y `docs/pantallazos.pdf`.
- La primera tarea de `frontend-dev` elige versiones compatibles de Next, React y Tailwind, las registra en README y añade una nota de versión a este diseño. El spec no fija números de versión.
- No se planifica despliegue ni se requieren servicios externos.

## 12. Propiedad de carpetas y coordinación

| Rol | Áreas principales | Entrega a |
|---|---|---|
| `arquitecto` | `.kiro/specs/matriculafija/` y contratos documentados | Los tres roles; congela decisiones |
| `backend-dev` | `lib/schedule/`, `lib/api/`, `data/`, `app/api/` | `frontend-dev` recibe tipos, fixtures y cliente |
| `frontend-dev` | `app/(flow)/`, `components/`, `store/`, `styles/`, scaffold visual | `tech-lead` revisa integración |
| `tech-lead` | `scripts/`, `docs/`, README, integración y gates | Todo el equipo |

Una tarea que requiera tocar el área de otro rol debe crear una excepción explícita, entregar primero un contrato o parche pequeño y dejar al dueño de la carpeta como revisor. El agente coordinador no reemplaza al dueño de una capa para resolver cambios silenciosos.

## 13. Supuestos

- El catálogo y el valor por crédito son ficticios y viven en fixtures/configuración local.
- La respuesta “Avísame” es estado local de demo.
- El PDF se genera localmente y no se publica.
- La etiqueta “Datos de ejemplo” acompaña universidad, materias, precios, alertas y empleos ficticios.
- La pantalla P1 no bloquea P0 y no debe introducir dependencias en el flujo principal.
- Si una decisión visual menor no aparece aquí, `frontend-dev` elige la opción que mantenga los tokens y `tech-lead` la registra en la revisión de integración.
