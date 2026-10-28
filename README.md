# MatriculaFija

Mockup web local de alta fidelidad para que un estudiante que trabaja organice su semestre antes de matricularse. La aplicación cruza datos académicos de ejemplo, prerrequisitos, oferta de grupos y horario laboral para mostrar materias compatibles y sugerir una combinación posible. Todo dato visible es ficticio y está identificado como **Datos de ejemplo**.

## Requisitos

- Node.js `>=20.9.0` y npm (probado con Node 24 LTS).
- Chromium administrado por Playwright si se quieren generar capturas.

El proyecto usa Next 15, React 19 y Tailwind 3 con versiones fijadas. No requiere servidor separado, base de datos ni servicios externos.

## Instalación y ejecución local

Desde la raíz del proyecto:

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. También puedes iniciar el recorrido demo en <http://localhost:3000/?demo=1> y pulsar **Cargar caso de ejemplo**.

El acceso es mock. En `/login` puedes usar el correo de ejemplo `camilo.ospina@ejemplo.local`; no se solicita ni se verifica una contraseña.

## Fuente académica y adaptadores

Los JSON son la fuente académica de verdad:

- `data/curriculum.json`: malla, créditos, semestre y prerrequisitos.
- `data/course-offerings.json`: asignaturas ofertadas y sus grupos, horarios, modalidad, sede y cupos.
- `data/students.json`: perfiles de estudiantes de ejemplo.
- `data/academic-records.json`: historial de materias aprobadas, homologadas o no aprobadas.

Los adaptadores TypeScript `data/curriculum.ts`, `data/catalog.ts` y `data/academic.ts` cargan esos archivos y exponen tipos, mapas e índices para el dominio y la interfaz. Una asignatura puede tener múltiples grupos; cada grupo se evalúa por separado. El recomendador también muestra materias de semestres futuros que se pueden adelantar cuando sus prerrequisitos aparecen como **aprobados** o **homologados** en el historial.

## Recorrido actualizado del demo de Camilo

Camilo Ospina es un estudiante ficticio de quinto semestre de Ingeniería de Software. El caso demo carga una jornada de lunes a viernes, de 6:00 a. m. a 2:00 p. m., 45 minutos de desplazamiento y una oferta académica de ejemplo.

1. Entra por `/?demo=1`, selecciona **Cargar caso de ejemplo**, continúa con el correo mock y llega al panel de Camilo.
2. En **Configura tu semana laboral**, cada día puede marcarse como **Office**, **Remoto** o **Libre**. Ajusta las horas de cada día y el **tiempo de desplazamiento**; la grilla se actualiza en el navegador.
3. Para probar preferencias, cambia por ejemplo un día de **Office** a **Remoto** o **Libre** y selecciona un **día ancla para clases presenciales**. El día ancla solo prioriza grupos que lo incluyan; no bloquea otras opciones compatibles. Pulsa **Continuar con mis materias** para volver a consultar las recomendaciones.
4. En **Materias que puedes adelantar**, el sistema separa las opciones **Para tu semestre actual** y **Para más adelante**. Las futuras solo se pueden seleccionar si los prerrequisitos están aprobados u homologados; las bloqueadas explican qué falta.
5. Marca una o más materias, ajusta el máximo de créditos y pulsa **Armar la mejor combinación**. También puedes seleccionar una materia futura adelantable para comprobar cómo entra en la combinación; el límite de créditos, los cupos y los cruces se recalculan.
6. En el armador, revisa los grupos recomendados y cambia un grupo desde **Cambiar grupo**. La validación vuelve a detectar choques entre trabajo y clases o entre clases. **Sugerir combinación sin choques** busca otra combinación determinista.
7. Cuando el plan sea válido, continúa a **Tu plan está listo** para descargar el resumen de texto y luego a **Mi semestre**. Las alertas, avisos y el botón de matrícula son simulados.

## API de recomendaciones

`POST /api/recommendations` es stateless: recibe todo el contexto en cada solicitud y no guarda estado en el servidor. El cuerpo incluye `studentId`, `workSchedule`, `maxCredits`, `selectedCourseIds` opcional y `preferences.anchorDay` opcional. La respuesta contiene:

- recomendaciones individuales por materia, con estado de compatibilidad, razón, grupos compatibles, cupos y estado de prerrequisitos;
- una combinación completa sugerida (`plan`) con materias, grupos, créditos, explicación y materias no incluidas.

La misma operación calcula materias individuales y la mejor combinación completa respetando horario laboral, modalidad, desplazamiento, cupos, prerrequisitos, límite de créditos y cruces entre clases. La validación de entrada usa Zod y los errores siguen `{ error: { code, message } }`.

## Verificaciones

```bash
npm run build
npm run lint
npm run typecheck
npm test
```

`npm test` ejecuta las pruebas unitarias del motor de horarios y recomendaciones. Después de `npm run build`, `npm run start` sirve opcionalmente la compilación de producción.

## Capturas y PDF

Instala Chromium una vez:

```bash
npx playwright install chromium
```

Con el servidor local apagado o disponible en el puerto 3000:

```bash
npm run capturas
```

El script usa `http://127.0.0.1:3000` o la variable `BASE_URL`, fija el viewport en `1440×900` y genera las imágenes en `docs/pantallazos/` y el PDF en `docs/pantallazos.pdf`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo local |
| `npm run build` | Compilación de producción |
| `npm run start` | Servir la compilación después de `npm run build` |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir archivos |
| `npm test` | Pruebas unitarias con Vitest |
| `npm run capturas` | Recorrido Playwright y generación de capturas/PDF |

## Alcance y limitaciones

Es un mockup académico de alta fidelidad, no un sistema de matrícula. El proyecto corre solo en local. No hay autenticación real, base de datos, persistencia en servidor, integración con sistemas universitarios, pagos, vacantes reales, notificaciones reales, WhatsApp, IA en runtime ni despliegue público. El estado de la sesión se conserva únicamente en `localStorage` del navegador y la API permanece stateless.

La universidad, estudiantes, historial, malla, oferta, cupos, horarios y valores son datos ficticios de ejemplo. El valor mostrado por crédito es una referencia configurable, no un precio oficial. Los avisos de apertura de grupos, la descarga, el botón **Ir a matricular** y cualquier función de compartir solo simulan el flujo; no ejecutan una matrícula ni envían comunicaciones externas.

## Reiniciar el demo

Usa **Reiniciar demo** en el encabezado para limpiar el estado local y volver al inicio. El flujo puede repetirse sin borrar archivos del proyecto ni modificar los JSON académicos.
