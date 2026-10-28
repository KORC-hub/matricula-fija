export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12" aria-labelledby="not-found-title">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">MatriculaFija</p>
        <h1 id="not-found-title" className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          No encontramos esa pantalla
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
          Puede que el enlace haya cambiado o que la pantalla ya no esté disponible. Regresa al inicio para continuar armando tu semestre.
        </p>
        <form action="/" method="get" className="mt-8">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-indigo px-5 py-3 font-semibold text-white shadow-soft transition duration-200 hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
          >
            Volver al inicio
          </button>
        </form>
      </section>
    </main>
  )
}
