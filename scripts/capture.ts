import { chromium, type Page } from 'playwright'
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const VIEWPORT = { width: 1440, height: 900 }
const DEFAULT_URL = 'http://127.0.0.1:3000'
const CAPTURE_DIR = resolve(process.cwd(), 'docs', 'pantallazos')
const PDF_PATH = resolve(process.cwd(), 'docs', 'pantallazos.pdf')
const SERVER_TIMEOUT_MS = 60_000

type Capture = { name: string; buffer: Buffer }

const CATALOG_NAMES = {
  first: 'Álgebra Lineal',
  second: 'Ingeniería de Software II',
} as const

function wait(milliseconds: number) {
  return new Promise<void>((resolvePromise) => setTimeout(resolvePromise, milliseconds))
}

async function isServerReady(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_500) })
    return response.ok
  } catch {
    return false
  }
}

async function waitForServer(url: string, child?: ChildProcess) {
  const deadline = Date.now() + SERVER_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (await isServerReady(url)) return
    if (child?.exitCode !== null && child?.exitCode !== undefined) {
      throw new Error(`El servidor local terminó antes de estar disponible (código ${child.exitCode}).`)
    }
    await wait(250)
  }
  throw new Error(`No se pudo conectar con ${url} en ${SERVER_TIMEOUT_MS / 1000} segundos.`)
}

async function startServer(url: string) {
  if (await isServerReady(url)) {
    console.log(`Usando servidor existente en ${url}`)
    return { url, child: undefined }
  }

  const parsed = new URL(url)
  const nextBin = resolve(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next')
  const child = spawn(process.execPath, [nextBin, 'dev', '--hostname', parsed.hostname, '--port', parsed.port || '3000'], {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    stdio: 'inherit',
  })
  await waitForServer(url, child)
  console.log(`Servidor local iniciado en ${url}`)
  return { url, child }
}

async function waitForHeading(page: Page, name: RegExp | string) {
  await page.getByRole('heading', { name }).first().waitFor({ state: 'visible' })
  await page.waitForLoadState('domcontentloaded')
}

async function captureMoment(page: Page, captures: Capture[], moment: number, name: string) {
  await page.waitForTimeout(150)
  const filename = `${String(moment).padStart(2, '0')}-${name}.png`
  const path = join(CAPTURE_DIR, filename)
  const buffer = await page.screenshot({ path, animations: 'disabled' })
  captures.push({ name: filename, buffer })
  console.log(`Captura ${moment}/8: ${filename}`)
}

function stopServer(child: ChildProcess) {
  if (!child.pid) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' })
  } else {
    child.kill('SIGTERM')
  }
}

async function createPdf(captures: Capture[]) {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: VIEWPORT })
    const images = captures.map(({ buffer, name }) => `<section class="page"><img src="data:image/png;base64,${buffer.toString('base64')}" alt="${name}" /></section>`).join('')
    await page.setContent(`<!doctype html><html><head><style>@page{size:15in 9.375in;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}.page{width:1440px;height:900px;page-break-after:always;break-after:page;overflow:hidden}.page:last-child{page-break-after:auto;break-after:auto}img{display:block;width:1440px;height:900px;object-fit:cover}</style></head><body>${images}</body></html>`, { waitUntil: 'load' })
    await page.pdf({ path: PDF_PATH, printBackground: true, preferCSSPageSize: true })
  } finally {
    await browser.close()
  }
}

async function run() {
  mkdirSync(CAPTURE_DIR, { recursive: true })
  rmSync(CAPTURE_DIR, { recursive: true, force: true })
  mkdirSync(CAPTURE_DIR, { recursive: true })

  const requestedUrl = process.env.BASE_URL ?? DEFAULT_URL
  const browser = await chromium.launch({ headless: true })
  const captures: Capture[] = []
  let child: ChildProcess | undefined

  try {
    const server = await startServer(requestedUrl)
    const url = server.url
    child = server.child
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 })
    page.setDefaultTimeout(15_000)

    await page.goto(`${url}/?demo=1`, { waitUntil: 'domcontentloaded' })
    await waitForHeading(page, /Matricula sin chocar/)
    await captureMoment(page, captures, 1, 'bienvenida')

    await page.getByRole('button', { name: /Cargar\s+(?:el\s+)?(?:caso\s+de\s+)?(?:ejemplo|Camilo)/i }).click()
    await page.waitForURL('**/login')
    await waitForHeading(page, /(?:Entra|Ingresa)\s+a\s+tu\s+(?:plan|semestre)/i)
    await page.getByRole('button', { name: /Continuar\s+con\s+(?:mi|el)\s+correo/i }).click()
    await page.waitForURL('**/perfil')
    await waitForHeading(page, 'Hola, Camilo')
    await page.getByText('Oferta actual').first().waitFor({ state: 'visible' })
    await captureMoment(page, captures, 2, 'perfil')

    await page.getByRole('button', { name: /Definir\s+(?:mi\s+)?horario(?:\s+laboral)?/i }).click()
    await page.waitForURL('**/horario-laboral')
    await waitForHeading(page, 'Configura tu semana laboral')
    await captureMoment(page, captures, 3, 'horario-laboral')

    await page.getByRole('button', { name: /Continuar con mis materias/ }).click()
    await page.waitForURL('**/materias')
    await waitForHeading(page, 'Materias que puedes adelantar')
    await captureMoment(page, captures, 4, 'materias')

    await page.getByRole('button', { name: /Revisar compatibilidad detallada/ }).click()
    await page.waitForURL('**/compatibilidad')
    await waitForHeading(page, 'Así encaja tu semestre')
    await page.getByRole('heading', { name: /Así encaja tu semestre/ }).waitFor({ state: 'visible' })
    await captureMoment(page, captures, 5, 'compatibilidad')

    await page.getByRole('button', { name: /Armar mi horario/ }).click()
    await page.waitForURL('**/armador')
    await waitForHeading(page, 'Arma un horario que sí puedas cumplir')

    const changeGroupButtons = page.getByRole('button', { name: 'Cambiar grupo' })
    await changeGroupButtons.nth(0).click()
    await page.getByRole('heading', { name: CATALOG_NAMES.first }).waitFor({ state: 'visible' })
    await page.getByRole('button', { name: /^G2\b/ }).click()
    await page.getByText('Este grupo se cruza con otra clase de tu plan.').waitFor({ state: 'visible' })

    await changeGroupButtons.nth(1).click()
    await page.getByRole('heading', { name: CATALOG_NAMES.second }).waitFor({ state: 'visible' })
    await page.getByRole('button', { name: /^G2\b/ }).click()
    await page.getByText('Tu horario no tiene choques.').first().waitFor({ state: 'visible' })
    await captureMoment(page, captures, 6, 'armador')

    await page.getByRole('link', { name: /Ver mi plan listo/ }).click({ force: true })
    await page.waitForURL('**/plan-listo')
    await waitForHeading(page, 'Tu plan está listo')
    await captureMoment(page, captures, 7, 'plan-listo')

    await page.getByRole('button', { name: /Ver mi semestre/ }).click()
    await page.waitForURL('**/mi-semestre')
    await waitForHeading(page, 'Así se ve tu semestre')
    await captureMoment(page, captures, 8, 'mi-semestre')
  } finally {
    await browser.close()
    if (child) stopServer(child)
  }

  await createPdf(captures)
  console.log(`PDF generado: ${PDF_PATH}`)
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Capturas no generadas: ${message}`)
  if (message.toLowerCase().includes('executable') || message.toLowerCase().includes('browser')) {
    console.error('Instala Chromium con: npx playwright install chromium')
  }
  process.exitCode = 1
})
