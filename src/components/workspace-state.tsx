import { AlertTriangle, RefreshCw } from 'lucide-preact'

export function WorkspaceState({ error }: { error?: string }) {
  return (
    <main class="grid min-h-screen place-items-center bg-slate-100 p-6">
      {error ? (
        <section
          class="w-full max-w-md border border-red-200 bg-white p-6 text-center"
          role="alert"
        >
          <AlertTriangle class="mx-auto text-red-600" size={25} />
          <h1 class="mt-3 text-lg font-bold">
            Release workspace could not load
          </h1>
          <p class="mt-2 text-sm leading-6 text-slate-600">{error}</p>
          <button
            class="mt-5 inline-flex h-10 items-center gap-2 bg-slate-900 px-4 text-sm font-bold text-white"
            onClick={() => location.reload()}
            type="button"
          >
            <RefreshCw size={16} /> Try again
          </button>
        </section>
      ) : (
        <p class="text-sm font-semibold text-slate-600">
          Loading release workspace...
        </p>
      )}
    </main>
  )
}
