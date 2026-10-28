# Requirements — MatriculaFija

**Estado:** Borrador aprobado para diseño técnico  
**Prioridad:** P0 salvo donde se indique P1  
**Producto:** Mockup web local de alta fidelidad para una entrega académica  
**Fuente funcional:** `README.md` y decisiones aprobadas en la Ronda 1

## 1. Propósito

MatriculaFija ayuda a un estudiante universitario que trabaja a armar su horario antes de matricular, cruzando su horario laboral con la oferta académica. El mockup debe hacer evidente, sin explicación verbal, qué materias son compatibles, cuáles tienen riesgo por desplazamiento y cuáles no son viables.

El producto es un **mockup de alta fidelidad**, no un sistema de matrícula productivo. La interacción del cruce de horarios, el cambio de grupos y la validación del plan deben ser reales y deterministas. La autenticación, matrícula, alertas, empleos y demás integraciones pueden ser simuladas cuando este documento lo indique.

## 2. Alcance y prioridades

### 2.1 P0 — entrega obligatoria

- Ocho pantallas del flujo principal.
- Navegación real entre pantallas mediante rutas de App Router.
- Caso demo de Camilo Ospina de principio a fin en aproximadamente tres minutos.
- Motor puro de choques compartido por cliente y API.
- API stateless con Route Handlers y validación zod.
- Store de cliente persistido en `localStorage`, con compuerta de hidratación.
- Modo demo mediante `?demo=1`, botón de carga y botón de reinicio.
- Identidad visual consistente, accesible y responsive desktop-first.
- Capturas Playwright a 1440×900 y PDF ordenado.
- README de ejecución local.

### 2.2 P1 — solo después de cerrar P0

- Pantalla 9, “Empleos compatibles”.
- `POST /api/jobs/match` con vacantes ficticias filtradas por el plan académico.
- Pulido responsive móvil más allá de la lista diaria mínima.

### 2.3 Fuera de alcance

- Login, contraseña o autenticación real.
- Base de datos o persistencia en servidor.
- Integración con universidades, sistemas de matrícula o pagos.
- Matrícula real o reserva de cupos.
- Datos reales de universidades, materias, precios, estudiantes o vacantes.
- Turnos laborales rotativos; el modelo usa horario semanal fijo.
- Panel B2B, notificaciones reales, WhatsApp o IA en tiempo de ejecución.
- Despliegue público o infraestructura externa.
- Botón “Compartir” en P0: se mantiene descargar/imprimir el plan, pero se recorta compartir para proteger el alcance.

## 3. Actor principal y caso dorado

**Camilo Ospina** es un estudiante ficticio de 23 años, de quinto semestre de Ingeniería de Software. Trabaja de lunes a viernes de 6:00 a. m. a 2:00 p. m. como auxiliar de soporte técnico, tarda aproximadamente 45 minutos en llegar a la universidad y quiere matricular cinco materias.

La oferta ficticia debe conservar este comportamiento:

| Materia | Créditos | Grupo | Horario | Resultado esperado |
|---|---:|---|---|---|
| Estadística Aplicada | 3 | Único | Lu–Mi, 10:00–12:00 | Choque directo; no viable |
| Bases de Datos II | 4 | G1 | Lu–Mi, 14:00–16:00 | Riesgo por desplazamiento |
| Bases de Datos II | 4 | G2 | Ma–Ju, 18:00–20:00 | Compatible |
| Ingeniería de Requisitos | 3 | G1 | Ma–Ju, 18:00–20:00 | Compatible sola; choca con Bases G2 |
| Ingeniería de Requisitos | 3 | G2 | Lu–Mi, 18:00–20:00 | Compatible |
| Desarrollo Web | 3 | G1 | Sáb, 08:00–12:00 | Compatible |
| Inglés V | 2 | G1 | Vi, 18:00–20:00 | Compatible |

El recorrido dorado debe producir: primero, Estadística inviable y Bases G1 riesgosa; después, un choque entre Bases G2 y Requisitos G1; finalmente, un plan de cuatro materias, 12 créditos y sin choques, dejando Estadística como pendiente.

## 4. Requisitos funcionales por pantalla

Cada pantalla debe contar con estados de carga, vacío, error y éxito cuando sean aplicables. Los textos de la interfaz deben estar en español de Colombia, tratar al usuario de “tú” y evitar Lorem Ipsum.

### RF-01 — Bienvenida y propuesta de valor (P0)

**Objetivo:** explicar el valor del producto y permitir iniciar el flujo o cargar el caso dorado.

**Contenido y componentes:** encabezado de marca, etiqueta “Datos de ejemplo” cuando aplique, propuesta de valor, tres pasos ilustrados, botón primario y acceso al demo.

**Textos mínimos:**

- Título: “Matricula sin chocar con tu trabajo”.
- Subtítulo: “Arma tu horario antes de pagar la matrícula y descubre qué grupos sí caben en tu semana”.
- Acción primaria: “Armar mi semestre”.
- Acción secundaria: “Ver cómo funciona”.
- Acción demo: “Cargar caso de ejemplo”.

**Criterios de aceptación:**

- **DADO** que una persona visita la raíz sin datos persistidos, **CUANDO** observa la pantalla, **ENTONCES** entiende qué problema resuelve MatriculaFija sin una explicación externa.
- **CUANDO** selecciona “Armar mi semestre”, **ENTONCES** navega a la ruta de perfil.
- **CUANDO** selecciona “Ver cómo funciona”, **ENTONCES** se muestran los tres pasos y el usuario recibe una acción clara para continuar o cerrar esa explicación.
- **CUANDO** selecciona “Cargar caso de ejemplo” o entra con `?demo=1`, **ENTONCES** se carga el caso de Camilo y se puede avanzar sin diligenciar manualmente los formularios.
- No se muestran estadísticas no validadas ni promesas de evitar deserción.

### RF-02 — Perfil de estudiante (P0)

**Objetivo:** capturar el contexto mínimo para personalizar el flujo, sin crear una cuenta real.

**Datos:** nombre, correo, universidad ficticia, programa y semestre.

**Componentes:** stepper, formulario con `FormField`, selector de universidad, selector de semestre, botón primario y botón Atrás.

**Textos mínimos:**

- Título: “Cuéntanos un poco de ti”.
- Ayuda: “Usaremos estos datos solo para armar tu ejemplo de semestre”.
- Acción: “Continuar con correo”.
- Error de nombre: “Escribe tu nombre para continuar”.
- Error de correo: “Revisa el correo; parece que falta algo”.
- Error de selección: “Selecciona tu universidad, programa y semestre”.

**Criterios de aceptación:**

- **DADO** un formulario incompleto, **CUANDO** el usuario intenta continuar, **ENTONCES** cada campo inválido muestra un mensaje humano junto al campo y el foco va al primer error.
- **DADO** un formulario válido, **CUANDO** selecciona “Continuar con correo”, **ENTONCES** el perfil queda en el store cliente y navega al horario laboral.
- La validación no crea sesión, no llama a un proveedor externo y no solicita contraseña.
- En modo demo los datos de Camilo aparecen precargados y el usuario puede continuar.
- Al pulsar Atrás, el usuario vuelve a bienvenida sin perder datos ya diligenciados durante la sesión.

### RF-03 — Horario laboral y desplazamiento (P0)

**Objetivo:** registrar el horario semanal fijo y el tiempo que necesita para llegar a la universidad.

**Datos:** bloques laborales con día, inicio y fin; minutos de desplazamiento.

**Componentes:** asistente guionado, chips de respuesta rápida, grilla semanal editable, campos de hora, campo de desplazamiento, resumen del turno y navegación.

**Textos mínimos:**

- Título: “¿Cuándo trabajas?”.
- Pregunta: “Cuéntame tu horario y calculamos cuánto tiempo te queda para estudiar”.
- Chip demo: “Trabajo de lunes a viernes, de 6:00 a. m. a 2:00 p. m.”.
- Campo: “Tiempo para llegar a la universidad”.
- Acción: “Continuar con mis materias”.
- Error: “Indica un horario válido: la hora de salida debe ser después de la hora de inicio”.
- Éxito: “Listo. Ya tenemos tu semana laboral”.

**Criterios de aceptación:**

- **CUANDO** el usuario responde con un chip, **ENTONCES** la grilla se actualiza en vivo y muestra los bloques laborales con el estilo neutro definido.
- **CUANDO** edita directamente un bloque, **ENTONCES** el resumen y el store reflejan el cambio sin recargar la página.
- **DADO** un bloque inválido, vacío o con fin anterior al inicio, **ENTONCES** se muestra un error legible y no se permite continuar hasta corregirlo o eliminarlo.
- **CUANDO** el tiempo de desplazamiento es cero, **ENTONCES** se acepta como valor válido.
- El flujo es guionado y determinista; no depende de un LLM.
- En el demo se carga el turno de Camilo y 45 minutos de desplazamiento.

### RF-04 — Selección de materias (P0)

**Objetivo:** permitir seleccionar las materias que el estudiante desea revisar.

**Datos:** catálogo ficticio de materias, créditos, grupos disponibles y valor configurable por crédito de ejemplo.

**Componentes:** tarjetas o lista seleccionable, contador de créditos, valor estimado, estado vacío, aviso de límite, stepper y navegación.

**Textos mínimos:**

- Título: “Elige tus materias”.
- Ayuda: “Revisaremos cada grupo contra tu jornada laboral”.
- Valor: “Valor de referencia de ejemplo”.
- Acción: “Ver compatibilidad”.
- Vacío: “Selecciona al menos una materia para analizar tu semestre”.
- Límite: “Llegaste al límite de créditos de este ejemplo. Quita una materia para elegir otra”.
- Etiqueta global: “Datos de ejemplo”.

**Criterios de aceptación:**

- **DADO** el catálogo disponible, **CUANDO** el usuario marca una materia, **ENTONCES** se actualizan créditos y valor estimado inmediatamente.
- **CUANDO** intenta continuar sin materias, **ENTONCES** recibe un mensaje claro y permanece en la pantalla.
- **CUANDO** alcanza el límite configurado, **ENTONCES** el control de nuevas selecciones da feedback y no rompe el flujo.
- Las materias del demo precargan las cinco opciones de Camilo.
- El valor mostrado se calcula en código desde una única configuración y siempre se identifica como ficticio o de referencia.

### RF-05 — Análisis de compatibilidad (P0)

**Objetivo:** revelar el conflicto entre trabajo y oferta académica antes de elegir grupos finales.

**Datos:** horario laboral, materias elegidas y resultado de `POST /api/compatibility`.

**Componentes:** resumen superior, tarjeta por materia, filas por grupo, `Badge` semántico, razón textual, icono, leyenda y salida hacia el armador.

**Estados:** cargando, resultado, error recuperable y materia sin grupos viables.

**Textos mínimos:**

- Título: “Así encaja tu semestre”.
- Compatible: “Compatible”.
- Riesgo: “Riesgo por desplazamiento”.
- Choque: “Choque”.
- No viable: “No viable este semestre”.
- Razón de ejemplo: “Termina tu turno a las 2:00 p. m. y la clase empieza a las 2:00 p. m.; necesitas aproximadamente 45 minutos para llegar”.
- Acción: “Armar mi horario”.
- Error: “No pudimos analizar los grupos. Reintenta en un momento”.

**Criterios de aceptación:**

- **CUANDO** la pantalla recibe un horario y materias válidos, **ENTONCES** muestra el estado de cada materia y grupo con texto, icono y razón; el color nunca es el único indicador.
- En el caso dorado, Estadística aparece como no viable porque su único grupo choca con el trabajo.
- En el caso dorado, Bases de Datos G1 aparece como riesgo por desplazamiento y Bases G2 como compatible.
- Si una materia no tiene grupos compatibles ni riesgosos, se destaca la explicación y se ofrece continuar con las materias viables.
- **CUANDO** falla la API, **ENTONCES** aparece un estado de error con una acción real de reintento y no una pantalla vacía.

### RF-06 — Armador de horario (P0)

**Objetivo:** construir y validar una combinación de grupos, haciendo visible cada conflicto.

**Datos:** horario laboral, materias elegidas, grupos seleccionados y respuestas de `POST /api/plan/validate` y `POST /api/plan/suggest`.

**Componentes:** `WeeklyGrid`, bloques laborales neutros, bloques de clase por materia, resaltado de choques, drawer de grupos, botón de sugerencia, resumen de conflictos y stepper.

**Textos mínimos:**

- Título: “Arma un horario que sí puedas cumplir”.
- Acción de grupo: “Cambiar grupo”.
- Acción de sugerencia: “Sugerir combinación sin choques”.
- Conflicto: “Este grupo se cruza con otra clase de tu plan”.
- Sin solución: “No encontramos una combinación completa sin choques”.
- Ayuda sin solución: “Puedes quitar una materia o revisar otra oferta; tus materias viables se mantienen guardadas”.
- Éxito: “Tu horario no tiene choques”.

**Criterios de aceptación:**

- **CUANDO** se abre el armador, **ENTONCES** se muestran trabajo y clases en una grilla semanal; en móvil la grilla se convierte en lista por día.
- **CUANDO** Camilo cambia Bases de Datos de G1 a G2, **ENTONCES** la app recalcula mediante la API y muestra el choque entre Bases G2 y Requisitos G1.
- **CUANDO** cambia Requisitos a G2, **ENTONCES** desaparece el choque entre clases y el plan queda en estado compatible.
- **CUANDO** selecciona un grupo sin cupos, **ENTONCES** se muestra “Sin cupos”, no se puede sugerir como parte de una solución y se da feedback al usuario.
- **CUANDO** solicita una sugerencia, **ENTONCES** el resultado es determinista, conserva grupos fijados cuando sea posible y explica las materias bloqueantes si no existe una solución.
- Cada cambio de grupo tiene estado de carga y error recuperable; no deja el drawer en un estado ambiguo.
- El botón Atrás y el stepper llevan a rutas reales sin perder el plan.

### RF-07 — Plan listo (P0)

**Objetivo:** confirmar el plan elegido y cerrar el momento de descubrimiento con un resumen convincente y honesto.

**Datos:** grupos finales, créditos, horas libres calculadas, conflictos evitados y valor de referencia por crédito.

**Componentes:** resumen del plan, lista de grupos, métricas, aviso de demo, descarga o impresión y navegación.

**Textos mínimos:**

- Título: “Tu plan está listo”.
- Resumen dorado: “4 materias · 12 créditos · sin choques”.
- Métrica: “Choques evitados”.
- Métrica: “Valor de referencia de ejemplo”.
- Acción: “Descargar mi plan”.
- Acción simulada: “Ir a matricular”.
- Aviso: “Esto es una demo: todavía no estás matriculando materias”.

**Criterios de aceptación:**

- **DADO** el plan final de Camilo, **ENTONCES** se muestran cuatro materias, 12 créditos, grupos elegidos y ausencia de choques.
- El dinero evitado se calcula desde el valor configurable por crédito y se etiqueta como ejemplo; nunca se presenta como precio real.
- **CUANDO** selecciona “Descargar mi plan”, **ENTONCES** se genera un archivo simple o se abre la impresión del resumen sin servicio externo.
- **CUANDO** selecciona “Ir a matricular”, **ENTONCES** recibe una confirmación o aviso de demo; no se realiza matrícula ni se envían datos.
- No se muestra un botón “Compartir” en P0.
- Si el plan no está validado, la pantalla informa qué falta y no presenta un éxito falso.

### RF-08 — Mi semestre (P0)

**Objetivo:** dejar al usuario con una vista útil del plan y una oportunidad clara de volver cuando cambie la oferta.

**Datos:** plan final, materia pendiente, alerta simulada y estado local de aviso.

**Componentes:** vista semanal, tarjeta de materia pendiente, alerta simulada, CTA de aviso y teaser de empleos.

**Textos mínimos:**

- Título: “Así se ve tu semestre”.
- Pendiente: “Estadística Aplicada queda pendiente”.
- Acción: “Avísame cuando haya un grupo compatible”.
- Confirmación simulada: “Te avisaremos en esta demo si aparece un grupo compatible”.
- Alerta: “Se abrió un grupo de Estadística los martes de 6:00 p. m. a 8:00 p. m.”.
- Teaser: “¿Buscas un trabajo que también quepa en tu horario?”.

**Criterios de aceptación:**

- **DADO** el plan dorado, **ENTONCES** la vista semanal muestra las cuatro materias elegidas y los bloques laborales.
- Estadística permanece visible como pendiente y no se presenta como matriculada.
- **CUANDO** selecciona “Avísame…”, **ENTONCES** recibe feedback local y el control cambia a un estado confirmado; no se envía una notificación real.
- La alerta de nuevo grupo es claramente simulada o de ejemplo.
- El teaser de empleos navega a la pantalla P1 solo si esta está implementada; si P1 no está disponible, abre feedback explicando que es una vista futura y no queda como botón muerto.
- El botón “Reiniciar demo” está visible y devuelve al inicio limpiando el store cliente.

## 5. Modo demo y recorrido principal

### RF-09 — Carga y reinicio deterministas del demo (P0)

- **CUANDO** se abre la aplicación con `?demo=1`, **ENTONCES** el store se inicializa con el perfil, horario laboral, desplazamiento, materias y punto de partida del caso de Camilo.
- **CUANDO** se pulsa “Cargar caso de ejemplo”, **ENTONCES** se puede recorrer el flujo sin completar manualmente datos.
- **CUANDO** se pulsa “Reiniciar demo”, **ENTONCES** se elimina el estado persistido del cliente, se vuelve a la bienvenida y se muestra feedback de reinicio.
- La carga del demo no escribe estado en el servidor y puede repetirse en la misma sesión.
- El flujo dorado completo debe poder ejecutarse en tres minutos o menos, sin necesidad de explicaciones del presentador.

### RF-10 — Hidratación segura del store (P0)

- La pantalla de bienvenida puede renderizarse en servidor porque no depende de datos personales ni persistidos.
- Las pantallas del flujo que consumen el store son client components y muestran un skeleton mientras el store se hidrata.
- No se renderizan en servidor nombre, correo, universidad, horario laboral ni otros datos persistidos.
- El acceso a `localStorage` pasa por un único módulo cliente.
- El usuario nunca pierde el estado por una diferencia entre el primer render y la hidratación.

## 6. Requisitos de dominio y API

### RF-11 — Tipos compartidos congelados antes de implementar pantallas (P0)

Antes de repartir las tareas dependientes deben definirse y aprobarse los tipos compartidos mínimos:

- `TimeBlock { day, start, end }`.
- `WorkSchedule { blocks, commuteMinutes }`.
- `Course`.
- `CourseGroup { id, courseId, blocks, seatsLeft }`.
- Estados de compatibilidad, conflictos, materias y resultado de sugerencia.
- Envelope de error `{ error: { code, message } }`.

Backend debe entregar a frontend los fixtures y un cliente tipado de API después de cerrar estos contratos, para que frontend no replique tipos ni espere a decisiones del dominio.

### RF-12 — Reglas del motor de choques (P0)

- Un solapamiento entre clase y trabajo es `CHOQUE`.
- Si el fin de un bloque coincide exactamente con el inicio de otro, no hay solapamiento.
- Un hueco menor que `commuteMinutes` entre trabajo y clase es `RIESGO` cuando no existe solapamiento.
- Si no hay solapamiento ni riesgo, el grupo es `COMPATIBLE`.
- Dos grupos seleccionados que se solapan generan `CHOQUE ENTRE CLASES`.
- El estado de una materia es el mejor estado disponible entre sus grupos; si no hay grupo compatible ni riesgoso, es `NO_VIABLE`.
- Un grupo con cero cupos se muestra como “Sin cupos” y nunca se propone.
- El sugeridor usa búsqueda determinista y maximiza créditos dentro de una combinación sin choques.

### RF-13 — API stateless y errores uniformes (P0)

- `GET /api/catalog` devuelve materias y grupos ficticios del catálogo.
- `POST /api/compatibility` recibe `workSchedule` y `courseIds`, y devuelve estado y razón por materia y grupo.
- `POST /api/plan/validate` recibe `workSchedule` y `groupIds`, y devuelve conflictos trabajo-clase y clase-clase.
- `POST /api/plan/suggest` recibe `workSchedule`, `courseIds` y `pinnedGroupIds` opcional, y devuelve plan o explicación de inviabilidad.
- P1: `POST /api/jobs/match` recibe el plan y devuelve vacantes ficticias compatibles.
- Todas las entradas se validan con zod.
- Una entrada inválida responde con `{ error: { code, message } }`, donde `message` es legible en español.
- Cada request contiene todos los datos necesarios; ningún Route Handler depende de estado mutable en memoria del servidor.
- El backend comparte funciones puras con el cliente donde corresponda, sin duplicar reglas en la UI.

### RF-14 — Casos mínimos del motor (P0)

Deben existir pruebas unitarias que cubran, como mínimo:

1. Bloques cuyo límite coincide exactamente.
2. Desplazamiento igual a cero.
3. Bloques que cruzan el mediodía.
4. Materia sin grupos.
5. Todos los grupos en choque.
6. Grupo con cero cupos.
7. Horario laboral vacío.
8. Riesgo en ambos sentidos entre trabajo y clase.
9. Choque entre dos clases seleccionadas.
10. Sugerencia determinista del caso dorado.

## 7. Requisitos de experiencia visual y calidad

### RF-15 — Sistema visual fijo (P0)

- La identidad usa índigo/navy como principal, turquesa como acento y superficies claras.
- La tipografía es sans-serif legible y se carga con `next/font`.
- Los estados semánticos son fijos: compatible verde, riesgo ámbar, choque rojo, trabajo gris azulado y clases con una paleta consistente por materia.
- Cada estado usa siempre icono y texto además del color.
- Los tokens se definen en la configuración de Tailwind y quedan congelados antes de construir las pantallas.
- Todas las pantallas usan el kit compartido: `Button`, `Card`, `Badge`, `Stepper`, `WeeklyGrid`, `Drawer`, `Toast`, `EmptyState` y `FormField`.
- Hay una acción primaria dominante por pantalla.

### RF-16 — Accesibilidad, responsive y contenido (P0)

- El contraste cumple AA en contenido y controles principales.
- El foco de teclado es visible y el flujo principal se puede recorrer con teclado.
- Las etiquetas no dependen solo del color.
- En 1440×900 el layout se ve completo y estable para las capturas.
- En móvil la grilla semanal se transforma en lista agrupada por día sin romperse.
- Todos los botones, enlaces y controles navegan, abren una superficie, ejecutan una acción o muestran feedback.
- No hay Lorem Ipsum, nombres reales de instituciones, logos de terceros ni afirmaciones de impacto no validadas.
- Los datos ficticios visibles llevan la etiqueta “Datos de ejemplo” donde puedan confundirse con datos reales.

## 8. Capturas y ejecución local

### RF-17 — Entrega reproducible (P0)

- `npm install` seguido de `npm run dev` inicia la aplicación local sin servicios externos.
- `npm run build` termina sin errores.
- El README explica instalación, ejecución, modo demo, pruebas y capturas.
- El script Playwright usa viewport 1440×900, recorre el caso demo y genera capturas numeradas en orden.
- El PDF final queda en `docs/pantallazos.pdf` y corresponde al flujo de las ocho pantallas.
- Vitest ejecuta las pruebas del motor sin depender del servidor de desarrollo.
- No se requiere despliegue público ni cuenta de terceros.

## 9. Pantalla P1 — Empleos compatibles

### RF-18 — Coincidencia de empleos ficticios (P1)

Solo se construye cuando todos los requisitos P0 estén cerrados.

- **DADO** un plan académico válido, **CUANDO** el usuario abre empleos compatibles, **ENTONCES** la pantalla solicita coincidencias mediante `POST /api/jobs/match`.
- Las vacantes son ficticias, de medio tiempo y muestran “Datos de ejemplo”.
- Cada vacante explica por qué cabe en el horario académico; no se afirma que esté disponible en el mercado real.
- La pantalla tiene estados de cargando, vacío, error y resultados.
- No se integra postulación, contacto real ni bolsa de empleo externa.

## 10. Criterios de aceptación de la entrega

La entrega cumple requirements cuando:

1. Las ocho pantallas P0 tienen acabado visual final y rutas navegables.
2. El caso de Camilo se completa en tres minutos o menos desde `?demo=1`.
3. El motor detecta los choques y riesgos del caso dorado sin lógica hardcodeada en las pantallas.
4. El cambio Bases G1 → G2 → Requisitos G1 → G2 recalcula y actualiza el estado correctamente.
5. El plan final muestra cuatro materias, 12 créditos y cero choques, con Estadística pendiente.
6. La API valida entradas, es stateless y usa el envelope de error acordado.
7. Los casos límite del motor tienen pruebas unitarias en verde.
8. La hidratación no expone datos persistidos en el render del servidor.
9. No quedan botones muertos, textos de relleno ni errores de consola en el recorrido dorado.
10. `npm run build`, lint, pruebas y script de capturas pasan en una máquina limpia con las dependencias documentadas.
11. El PDF de capturas está generado y ordenado.
12. P1 solo se incluye si todos los puntos anteriores están cerrados.

## 11. Supuestos

- La aplicación usa una única semana laboral repetible; no hay fechas de calendario ni excepciones por festivos.
- El valor por crédito es una constante configurable de ejemplo, no un precio universitario real.
- “Avisar” cambia un estado local y muestra feedback; no crea suscripciones ni envía notificaciones.
- “Ir a matricular” es una acción simulada con aviso explícito.
- “Descargar mi plan” puede producir un archivo de texto/HTML o abrir impresión, siempre que el usuario obtenga un resumen utilizable.
- La UI puede presentar un catálogo completo ficticio, pero el fixture debe conservar el comportamiento del caso dorado.
- La primera tarea de implementación de `frontend-dev` elegirá versiones compatibles de Next, React y Tailwind y las registrará en README y en el diseño; este documento no fija números de versión.
- El término “mockup funcional” significa que las interacciones críticas del flujo son operativas y que el resto del producto se simula de forma explícita, estable y honesta.

## 12. Dependencias de decisión

El siguiente documento debe convertir estos requisitos en contratos técnicos sin cambiar su intención:

1. Congelar tipos compartidos y estados.
2. Congelar request/response de API y envelope de errores.
3. Congelar casos de prueba del motor.
4. Congelar tokens visuales y kit de componentes antes de construir las pantallas.
5. Secuenciar las tareas de `frontend-dev`: fundación y kit primero; pantallas después.
6. Entregar fixtures y cliente tipado desde `backend-dev` antes de que `frontend-dev` integre el flujo completo.
