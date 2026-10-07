import { CheckCircle2, ListChecks, ShieldAlert } from 'lucide-preact'
import type { ReleaseWorkspace } from '../domain/release'

type Props = { workspace: ReleaseWorkspace; onToggle: (id: string) => void }

export function ReadinessPanel({ workspace, onToggle }: Props) {
  const complete = workspace.checklist.filter((item) => item.complete).length
  const ready = complete === workspace.checklist.length
  return (
    <section class="border-y border-slate-200 bg-white sm:border">
      <header class="border-b border-slate-200 p-4 sm:p-5">
        <div class="flex items-center justify-between gap-3">
          <h2 class="flex items-center gap-2 font-bold">
            <ListChecks class="text-green-700" size={18} /> Release gates
          </h2>
          <strong class="text-sm">
            {complete}/{workspace.checklist.length}
          </strong>
        </div>
        <div class="mt-3 h-2 bg-slate-200">
          <div
            class={`h-full ${ready ? 'bg-green-600' : 'bg-amber-500'}`}
            style={{
              width: `${(complete / workspace.checklist.length) * 100}%`,
            }}
          />
        </div>
      </header>
      <div class="space-y-2 p-4 sm:p-5">
        {workspace.checklist.map((item) => (
          <label
            class="flex cursor-pointer items-start gap-3 border border-slate-200 p-3 hover:bg-slate-50"
            key={item.id}
          >
            <input
              class="mt-0.5 size-4 accent-green-700"
              type="checkbox"
              checked={item.complete}
              onChange={() => onToggle(item.id)}
            />
            <span
              class={`text-sm font-semibold ${item.complete ? 'text-slate-400 line-through' : 'text-slate-700'}`}
            >
              {item.label}
            </span>
          </label>
        ))}
      </div>
      <footer
        class={`flex items-start gap-2 border-t p-4 text-sm font-semibold sm:p-5 ${ready ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}
      >
        {ready ? (
          <CheckCircle2 class="mt-0.5 shrink-0" size={17} />
        ) : (
          <ShieldAlert class="mt-0.5 shrink-0" size={17} />
        )}
        {ready
          ? 'All release gates are complete.'
          : `${workspace.checklist.length - complete} gates still need evidence.`}
      </footer>
    </section>
  )
}
