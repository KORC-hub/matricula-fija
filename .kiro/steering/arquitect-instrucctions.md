# PROMPT PARA EL AGENTE ARQUITECTO (KIRO) — Mockup interactivo de alta fidelidad "MatriculaFija"

## 0. Tu rol
Eres el arquitecto de software y líder técnico de un equipo de agentes. Tu trabajo NO es escribir la app: es producir el **spec completo** (requirements, design, tasks) para que otros agentes la construyan en paralelo sin pisarse y sin ambigüedad. Si algo bloquea una decisión, no te detengas: decláralo en una sección "Supuestos" con tu decisión por defecto y por qué.

## 1. Qué estamos construyendo (y qué NO)
**Producto:** MatriculaFija, una plataforma web que le permite a un estudiante universitario que trabaja armar su horario del semestre **antes de matricular**, cruzando su horario laboral con la oferta académica (materias y grupos), para no pagar por materias que no puede cursar.

**Esto es un MOCKUP DE ALTA FIDELIDAD para una entrega académica y para vender la idea.** No es un MVP productivo. Prioridades, en orden:
1. Que se vea y se sienta como una app real lista para lanzar (UI pulida, contenido real, microcopy cuidado).
2. Que un caso demo específico funcione de punta a punta, de forma creíble, sin explicación verbal.
3. Que la interacción sea real donde aporta credibilidad (el cruce de horarios) y mock en todo lo demás.

**Problema que ataca (hecho):** estudiantes que trabajan descubren el choque de horario tarde, después de matricularse/pagar. **Qué NO afirma la UI:** no hay cifras reales de impacto validadas; ver sección 9.

## 2. Criterios de la entrega (rúbrica del curso — son requisitos duros)
- Mínimo **8 pantallas** con acabado final, en secuencia lógica (Momento 1 → Momento 8).
- **Identidad visual:** paleta definida, tipografía legible, iconografía consistente, recursos gráficos de calidad.
- **Interactividad:** clics reales para navegar entre pantallas.
- **Contenido real:** cero Lorem Ipsum; todo botón, etiqueta y mensaje con el texto que vería el usuario (español de Colombia, trato de "tú").
- **Coherencia:** mismos componentes y estilos de la pantalla 1 a la 8 (un botón primario se ve igual en todas).
- **Jerarquía visual** clara y **microcopy** cuidado (errores, vacíos y éxitos escritos de forma humana).
- Un usuario externo debe entender la propuesta de valor sin que nadie se la explique.
- Entregables derivados: PDF con los pantallazos en orden (el Excel del prototipo conceptual ya existe y NO es tu responsabilidad). El proyecto corre solo en local; no planifiques link público ni despliegue.

## 3. Decisiones técnicas FIJADAS (no las discutas, planifica sobre ellas)
- **Framework único:** Next.js (App Router), ejecución **solo local**. Frontend y backend en el mismo proyecto. No planifiques despliegue en ninguna plataforma.
- **Frontend:** TypeScript estricto, React, Tailwind CSS. Iconos con una sola librería (p. ej. lucide-react). Fuentes con `next/font`.
- **Backend:** **Route Handlers** de Next.js en `app/api/**/route.ts`. Sin servidor aparte (no NestJS, no Express).
- **Sin base de datos y sin autenticación real.** Datos en fixtures TypeScript/JSON dentro del repo.
- **API stateless por diseño:** NO guardes estado en memoria del servidor. El estado de la sesión vive en el cliente (store de React tipo Zustand o Context + `localStorage`); la API recibe todo lo que necesita en cada request y responde funciones puras. Esto da determinismo en la demo y deja la puerta abierta a desplegar después sin reescribir.
- **Ejecución local:** `npm install && npm run dev` debe bastar en una máquina limpia, sin CLIs de terceros. Documenta los pasos en el README.
- **Sin LLM en tiempo de ejecución, sin WhatsApp real, sin llaves de API.** Cualquier "chatbot" es un flujo guionado con respuestas rápidas (chips) para que la demo sea determinista.
- Validación de entrada en la API con zod. Formato de error uniforme: `{ error: { code, message } }` con `message` en español legible para humanos.
- Pruebas unitarias (Vitest) obligatorias para el motor de choques; Playwright solo para el script de capturas (sección 10).
- Versiones: las estables vigentes al momento de planificar; verifica compatibilidad entre Next, React y Tailwind antes de fijarlas.
- Diseño responsive, **desktop-first (1440×900 como viewport de capturas)**; en móvil la grilla semanal colapsa a lista por día. No debe romperse, pero no se optimiza más allá de eso.

## 4. Alcance
**DENTRO (P0):** las 8 pantallas del flujo principal (sección 6), motor de choques real, API stateless, modo demo, capturas a PDF, README de ejecución local.
**DENTRO (P1, solo si P0 está cerrado):** pantalla 9 "Empleos compatibles" (dirección inversa: empleo según horario académico), responsive móvil más pulido.
**FUERA (no planifiques, no construyas):** login real, base de datos, integración con sistemas universitarios, pagos, datos reales de vacantes, turnos rotativos (el modelo asume horario laboral semanal fijo), panel B2B para universidades/empresas, notificaciones reales, WhatsApp, IA en runtime.

## 5. Caso demo "dorado" (todo el diseño se orienta a que ESTE caso brille)
**Persona (ficticia):** Camilo Ospina, 23 años, 5.º semestre de Ingeniería de Software, trabaja de lunes a viernes de 6:00 a 14:00 como auxiliar de soporte técnico. Demora ~45 min en llegar a la universidad. Quiere matricular 5 materias.

**Oferta de ejemplo (fixture, ajustable conservando el comportamiento):**
| Materia | Cr. | Grupos |
|---|---|---|
| Estadística Aplicada | 3 | **Único grupo** Lu–Mi 10:00–12:00 → CHOQUE directo con el trabajo |
| Bases de Datos II | 4 | G1 Lu–Mi 14:00–16:00 (RIESGO por desplazamiento); G2 Ma–Ju 18:00–20:00 (OK) |
| Ingeniería de Requisitos | 3 | G1 Ma–Ju 18:00–20:00 (OK con el trabajo, pero choca con Bases de Datos G2); G2 Lu–Mi 18:00–20:00 (OK) |
| Desarrollo Web | 3 | G1 Sáb 8:00–12:00 (OK) |
| Inglés V | 2 | G1 Vi 18:00–20:00 (OK) |

**Narrativa (el flujo debe sostener este guion de ~3 minutos):**
1. Camilo ingresa su horario laboral y su tiempo de desplazamiento.
2. Elige sus 5 materias.
3. El sistema le muestra de inmediato: Estadística es inviable este semestre (único grupo choca), Bases de Datos G1 es riesgosa por desplazamiento, el resto compatible. **Este es el momento "ajá".**
4. En el armador de horario, Camilo cambia Bases de Datos a G2 y la app detecta un nuevo choque *entre clases* con Requisitos G1; él cambia Requisitos a G2 y todo queda en verde. La interacción es real, recalculada por la API.
5. El plan final tiene 4 materias / 12 créditos sin choques; Estadística queda "pendiente" con opción de "Avísame si abren un grupo en la tarde o noche".
6. El resumen muestra el dinero que evitó perder en un matrícula fallida (valor de ejemplo, ver sección 9) y el panel final muestra una alerta simulada.

## 6. Pantallas (8 core + 1 opcional)
Para cada una, el spec debe detallar: objetivo, componentes, datos que consume, acciones y navegación, estados (vacío / cargando / error / éxito), y **textos finales** (títulos, botones, mensajes). Dirección de contenido sugerida:

1. **Bienvenida / propuesta de valor.** Título tipo "Matricula sin chocar con tu trabajo". Subtítulo de beneficio, CTA primario "Armar mi semestre", secundario "Ver cómo funciona" (3 pasos ilustrados), acceso "Cargar caso de ejemplo". Debe comunicar el valor sin explicación.
2. **Tu perfil (registro rápido).** Nombre, correo, universidad (lista de ejemplo, ficticia), programa, semestre. Validaciones con mensajes humanos. Sin contraseña real: "Continuar con correo".
3. **Tu horario laboral.** Experiencia guiada tipo conversación (asistente con respuestas rápidas) con una **grilla semanal que se llena en vivo** y campo de tiempo de desplazamiento. Permite también editar la grilla directamente. Flujo guionado, sin LLM.
4. **Elige tus materias.** Lista de materias pendientes con créditos, selección múltiple, total de créditos y valor estimado. Estado vacío y límite de créditos con mensaje claro.
5. **Análisis de compatibilidad.** Semáforo por materia y por grupo (Compatible / Riesgo por desplazamiento / Choque) con la **razón escrita** ("Termina tu turno a las 2:00 p. m. y la clase empieza a las 2:00 p. m.; necesitas ~45 min para llegar"). Materias sin ningún grupo viable destacadas con explicación y salida.
6. **Armador de horario.** Calendario semanal con bloques de trabajo (neutros), clases (color por materia) y choques resaltados. Panel/drawer para cambiar de grupo; cada cambio recalcula vía API. Botón "Sugerir combinación sin choques". Variante de estado "Sin solución posible" con microcopy empático.
7. **Plan listo (confirmación).** Resumen: materias y grupos, créditos, horas libres por semana, choques evitados, dinero evitado (de ejemplo). CTAs: "Descargar mi plan" (genera archivo simple o imprime), "Compartir", "Ir a matricular" (simulado, con aviso claro de que es una demo).
8. **Mi semestre (panel).** Vista semanal del plan final, materia pendiente con "Avísame cuando haya un grupo compatible", una alerta simulada (p. ej. "Se abrió un grupo de Estadística los martes 18:00–20:00"), y teaser de "Empleos compatibles".
9. **(P1) Empleos compatibles.** Vacantes ficticias de medio tiempo filtradas por el horario académico del plan, con etiqueta visible "Datos de ejemplo".

Navegación: flujo lineal con **stepper/progreso** visible en pantallas 2–7, botón Atrás consistente, y no puede haber botones muertos: todo control visible navega, abre algo, o da feedback (toast). Los controles decorativos se eliminan, no se dejan.

## 7. Motor de choques (lógica real, librería pura en `/lib/schedule`, compartida por API y cliente)
Tipos mínimos: `TimeBlock {day, start, end}`, `WorkSchedule {blocks, commuteMinutes}`, `Course`, `CourseGroup {id, courseId, blocks, seatsLeft}`.
Reglas:
- **CHOQUE:** un bloque de clase se solapa con un bloque laboral. Frontera: si `fin == inicio` NO es solapamiento (pero puede ser RIESGO).
- **RIESGO:** no hay solapamiento, pero entre el fin de un bloque laboral y el inicio de la clase (o al revés) el hueco es menor que `commuteMinutes`.
- **COMPATIBLE:** ninguno de los anteriores.
- **CHOQUE ENTRE CLASES:** dos grupos seleccionados se solapan entre sí.
- **Estado por materia:** el mejor estado entre sus grupos; si ninguno es COMPATIBLE/RIESGO → "No viable".
- **Sugeridor:** búsqueda con backtracking sobre las materias elegidas (el tamaño es pequeño); devuelve un plan sin choques maximizando créditos, o la lista de materias que bloquean y por qué. Debe ser determinista.
- Casos límite a cubrir con tests: bloques en el límite exacto, desplazamiento 0, bloques que cruzan el mediodía, materia sin grupos, todos los grupos en choque, grupo con 0 cupos (se muestra "Sin cupos" y no se sugiere), horario laboral vacío.

## 8. API (Route Handlers, todas stateless y con zod)
- `GET /api/catalog` → materias y grupos de ejemplo.
- `POST /api/compatibility` → `{workSchedule, courseIds}` → estado por materia y por grupo con razón textual.
- `POST /api/plan/validate` → `{workSchedule, groupIds}` → lista de conflictos (trabajo vs clase y clase vs clase).
- `POST /api/plan/suggest` → `{workSchedule, courseIds, pinnedGroupIds?}` → plan o explicación de inviabilidad.
- (P1) `GET /api/jobs` o `POST /api/jobs/match` → vacantes ficticias compatibles con el plan.
El spec debe incluir los contratos completos (request/response/errores) y el archivo de tipos compartidos **antes** de repartir tareas.

## 9. Reglas de contenido y honestidad (obligatorias)
- Todo dato del demo es **ficticio y está etiquetado** ("Datos de ejemplo"). Universidad, materias, vacantes y precios son inventados. No uses logos ni nombres de instituciones reales ni de competidores.
- El dinero evitado se calcula en código a partir de un valor por crédito de ejemplo (configurable en un solo lugar) y se muestra como "Valor de referencia de ejemplo".
- **No pongas en la UI estadísticas de deserción como si validaran el producto.** Si el equipo decide citar una cifra, debe decir exactamente qué mide y de qué fuente; está prohibido atribuirle al "choque de horarios" una cifra que mide "asuntos laborales".
- Claims de producto prudentes: el sistema "te muestra", "te avisa", "te sugiere"; no promete "que no desertes".
- El nombre "MatriculaFija" es provisional: centralízalo en una constante.

## 10. Diseño visual y calidad
- Define en `design.md` los **tokens** (color, tipografía, espaciado, radios, sombras) como configuración de Tailwind. Tono: confiable, calmado, académico-moderno.
- Colores semánticos fijos y consistentes en toda la app: compatible = verde, riesgo = ámbar, choque = rojo, trabajo = gris azulado, clases = paleta de materia. **Nunca dependas solo del color:** acompaña con icono y texto (accesibilidad).
- Kit de componentes único (Button, Card, Badge de estado, Stepper, WeeklyGrid, Drawer, Toast, EmptyState, FormField). Prohibido estilar botones ad hoc por pantalla.
- Jerarquía: una acción primaria por pantalla. Contraste AA. Foco visible. Navegable con teclado en el flujo principal.
- Ilustraciones/recursos: SVG propios o recursos de licencia libre y consistentes entre sí. Nada de imágenes genéricas de stock mezcladas con estilos distintos.
- **Modo demo:** `?demo=1` y botón "Cargar caso de ejemplo" precargan los datos de Camilo y permiten saltar entradas; botón visible "Reiniciar demo" que limpia el estado.
- **Capturas:** un script (Playwright) que recorre el flujo en modo demo a 1440×900 y genera las capturas numeradas y un PDF en orden (`/docs/pantallazos.pdf`).

## 11. Qué debe producir tu spec
1. `requirements.md`: historias de usuario con criterios de aceptación verificables (formato EARS cuando aplique), priorizadas P0/P1.
2. `design.md`: arquitectura de carpetas, tipos compartidos, contratos de API, motor de choques, store del cliente, mapa de navegación, tokens visuales, estrategia de testing y de despliegue.
3. `tasks.md`: tareas atómicas con dependencias, criterio de "hecho" por tarea y **asignación por agente** para ejecución en paralelo.

**Reparto sugerido (ajústalo si ves una mejor división):**
- **Agente Fundación:** scaffold, Tailwind/tokens, kit de componentes, layout, stepper.
- **Agente Dominio/API:** tipos, fixtures, motor de choques, route handlers, tests unitarios.
- **Agente Pantallas:** las 9 vistas y el store del cliente, consumiendo el kit y los contratos.
- **Agente QA/Entrega:** modo demo, script de capturas/PDF, pruebas de recorrido, README de ejecución local.
Reglas de coordinación: los **tipos compartidos y contratos de API se congelan primero**; ningún agente modifica archivos de otro sin pasar por una tarea explícita; define qué carpetas son de quién.

## 12. Definición de "terminado"
- `npm run dev` y `npm run build` pasan sin errores; lint y tests en verde.
- El caso de Camilo se completa de principio a fin en ≤ 3 minutos y se puede repetir tras "Reiniciar demo".
- Si el evaluador se sale del guion (cambia horas, elige otros grupos), la app responde con coherencia, no se rompe.
- Cero botones muertos, cero textos de relleno, cero errores en consola.
- PDF de pantallazos generado y en el orden del flujo; README que permite correr el proyecto desde cero en una máquina limpia.

## 13. Antes de empezar a planificar, devuélveme (breve)
- Los 5 riesgos técnicos más probables de este plan y cómo los mitigas.
- Qué recortarías primero si el tiempo no alcanza (orden de recorte).
- Cualquier contradicción que detectes en estas instrucciones.
