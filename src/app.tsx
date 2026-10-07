import { useSignal } from '@preact/signals'
import {
  CalendarDays,
  Download,
  FileJson,
  GitCommitHorizontal,
  ListChecks,
  RefreshCw,
  Rocket,
  Upload,
  WandSparkles,
} from 'lucide-preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { ZodError } from 'zod'
import { CommitList } from './components/commit-list'
import { ReadinessPanel } from './components/readiness-panel'
import { ReleasePreview } from './components/release-preview'
import { WorkspaceState } from './components/workspace-state'
import {
  parseCommitText,
  releaseWorkspaceSchema,
  releaseMarkdown,
  releaseStats,
  suggestedVersion,
  type ReleaseWorkspace,
} from './domain/release'
import {
  loadRelease,
  resetRelease,
  saveRelease,
} from './services/release-store'

const storageKey = 'dev-release-builder-v1'
const sampleUrl = '/sample-release-workspace.json'

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function importError(reason: unknown) {
  if (reason instanceof ZodError) {
    const issue = reason.issues[0]
    const path = issue.path.length ? ` at ${issue.path.join('.')}` : ''
    return `Commit file is invalid${path}: ${issue.message}`
  }
  return reason instanceof Error ? reason.message : 'Could not import commits.'
}

export function App() {
  const noticeTimer = useRef<number | undefined>(undefined)
  const query = useSignal('')
  const filter = useSignal('all')
  const [workspace, setWorkspace] = useState<ReleaseWorkspace | null>(null)
  const [view, setView] = useState<'changes' | 'preview' | 'gates'>('changes')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{
    text: string
    error?: boolean
  } | null>(null)

  useEffect(() => {
    void loadRelease(storageKey, sampleUrl)
      .then(setWorkspace)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Unexpected workspace error.',
        ),
      )
  }, [])
  useEffect(() => () => window.clearTimeout(noticeTimer.current), [])

  function notify(text: string, isError = false) {
    window.clearTimeout(noticeTimer.current)
    setNotice({ text, error: isError })
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2400)
  }

  async function persist(next: ReleaseWorkspace) {
    try {
      const parsed = releaseWorkspaceSchema.parse(next)
      setWorkspace(parsed)
      await saveRelease(storageKey, parsed)
      return true
    } catch (reason) {
      notify(
        reason instanceof Error
          ? reason.message
          : 'Could not save the release.',
        true,
      )
      return false
    }
  }

  async function importCommits(file: File) {
    if (!workspace) return
    try {
      const commits = parseCommitText(await file.text())
      const next = { ...workspace, commits }
      next.project = { ...next.project, targetVersion: suggestedVersion(next) }
      if (!(await persist(next))) return
      query.value = ''
      filter.value = 'all'
      notify(`${commits.length} conventional commits imported.`)
    } catch (reason) {
      notify(importError(reason), true)
    }
  }

  if (!workspace) return <WorkspaceState error={error} />
  const stats = releaseStats(workspace)
  const suggestion = suggestedVersion(workspace)

  return (
    <main class="min-h-screen bg-slate-100 text-slate-900">
      <header class="border-b border-[#30483a] bg-[#17261f] text-white">
        <div class="mx-auto flex min-h-16 max-w-[1700px] items-center gap-3 px-4 sm:px-6">
          <span class="grid size-10 place-items-center bg-green-300 text-[#17261f]">
            <Rocket size={20} />
          </span>
          <div>
            <strong class="block text-sm">Release Foundry</strong>
            <span class="block text-xs text-green-100/65">
              Ship notes with evidence
            </span>
          </div>
          <span class="ml-auto hidden text-xs text-green-100/60 md:block">
            Local workspace · draft mode
          </span>
          <button
            class="grid size-10 place-items-center border border-white/15 hover:bg-white/5 max-md:ml-auto"
            type="button"
            aria-label="Restore sample release"
            title="Restore sample release"
            onClick={() =>
              void resetRelease(storageKey, sampleUrl)
                .then((data) => {
                  setWorkspace(data)
                  setView('changes')
                  query.value = ''
                  filter.value = 'all'
                  notify('Sample release restored.')
                })
                .catch((reason: unknown) =>
                  notify(
                    reason instanceof Error ? reason.message : 'Reset failed.',
                    true,
                  ),
                )
            }
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </header>

      <section class="border-b border-slate-200 bg-white">
        <div class="mx-auto max-w-[1700px] px-4 py-5 sm:px-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold text-green-700">
                {workspace.project.channel.toUpperCase()} RELEASE
              </p>
              <h1 class="mt-1 text-2xl font-bold sm:text-3xl">
                {workspace.project.name}
              </h1>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Curate changes, validate release gates, and produce notes that
                match the exact commit set.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <label class="inline-flex h-11 cursor-pointer items-center gap-2 border border-slate-300 px-3 text-sm font-bold hover:bg-slate-50">
                <Upload size={17} />{' '}
                <span class="hidden sm:inline">Import commits</span>
                <span class="sm:hidden">Import</span>
                <input
                  class="sr-only"
                  type="file"
                  accept="text/plain,.txt"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    if (file) void importCommits(file)
                    event.currentTarget.value = ''
                  }}
                />
              </label>
              <button
                class="inline-flex h-11 items-center gap-2 border border-slate-300 px-3 text-sm font-bold hover:bg-slate-50"
                type="button"
                disabled={!stats.selected}
                onClick={() => {
                  download(
                    'release-notes.md',
                    releaseMarkdown(workspace),
                    'text/markdown',
                  )
                  notify('Release notes exported.')
                }}
              >
                <Download size={17} /> Notes
              </button>
              <button
                class="grid size-11 place-items-center border border-slate-300 hover:bg-slate-50"
                type="button"
                aria-label="Export release JSON"
                title="Export release JSON"
                onClick={() => {
                  download(
                    'release-workspace.json',
                    JSON.stringify(workspace, null, 2),
                    'application/json',
                  )
                  notify('Release workspace exported.')
                }}
              >
                <FileJson size={17} />
              </button>
            </div>
          </div>

          <div class="mt-5 grid border border-slate-200 bg-slate-50 sm:grid-cols-2 xl:grid-cols-4">
            <label class="border-b border-r border-slate-200 p-3 sm:p-4">
              <span class="block text-xs font-bold text-slate-500">
                TARGET VERSION
              </span>
              <input
                class="mt-2 h-9 w-full border border-slate-300 bg-white px-2 font-mono text-sm font-bold"
                value={workspace.project.targetVersion}
                onInput={(event) =>
                  void persist({
                    ...workspace,
                    project: {
                      ...workspace.project,
                      targetVersion: event.currentTarget.value,
                    },
                  })
                }
              />
            </label>
            <label class="border-b border-r border-slate-200 p-3 sm:p-4">
              <span class="block text-xs font-bold text-slate-500">
                CHANNEL
              </span>
              <select
                class="mt-2 h-9 w-full border border-slate-300 bg-white px-2 text-sm font-bold"
                value={workspace.project.channel}
                onChange={(event) =>
                  void persist({
                    ...workspace,
                    project: {
                      ...workspace.project,
                      channel: event.currentTarget
                        .value as ReleaseWorkspace['project']['channel'],
                    },
                  })
                }
              >
                <option>stable</option>
                <option>beta</option>
                <option>canary</option>
              </select>
            </label>
            <label class="border-b border-r border-slate-200 p-3 sm:p-4">
              <span class="block text-xs font-bold text-slate-500">
                RELEASE DATE
              </span>
              <span class="relative mt-2 block">
                <CalendarDays
                  class="absolute top-1/2 left-2 -translate-y-1/2 text-slate-400"
                  size={15}
                />
                <input
                  class="h-9 w-full border border-slate-300 bg-white pr-2 pl-8 text-sm font-bold"
                  type="date"
                  value={workspace.project.releaseDate}
                  onInput={(event) =>
                    void persist({
                      ...workspace,
                      project: {
                        ...workspace.project,
                        releaseDate: event.currentTarget.value,
                      },
                    })
                  }
                />
              </span>
            </label>
            <div class="p-3 sm:p-4">
              <span class="block text-xs font-bold text-slate-500">
                SEMVER SUGGESTION
              </span>
              <button
                class="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 border border-green-700 bg-white px-2 text-sm font-bold text-green-800 hover:bg-green-50"
                type="button"
                onClick={() =>
                  void persist({
                    ...workspace,
                    project: {
                      ...workspace.project,
                      targetVersion: suggestion,
                    },
                  })
                }
              >
                <WandSparkles size={15} /> Apply {suggestion}
              </button>
            </div>
          </div>
          <label class="mt-3 block">
            <span class="sr-only">Release summary</span>
            <textarea
              class="min-h-20 w-full resize-y border border-slate-300 bg-slate-50 p-3 text-sm leading-6"
              value={workspace.summary}
              onInput={(event) =>
                void persist({
                  ...workspace,
                  summary: event.currentTarget.value,
                })
              }
              placeholder="Release summary"
            />
          </label>

          <div class="mt-3 grid grid-cols-2 border border-slate-200 sm:grid-cols-4">
            {[
              [stats.selected, 'Selected changes'],
              [stats.breaking, 'Breaking'],
              [stats.contributors, 'Contributors'],
              [
                `${stats.checks}/${workspace.checklist.length}`,
                'Gates complete',
              ],
            ].map(([value, label]) => (
              <div
                class="border-r border-b border-slate-200 p-3 sm:p-4"
                key={label}
              >
                <strong class="block text-xl">{value}</strong>
                <span class="mt-1 block text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <nav
        class="border-b border-slate-200 bg-white xl:hidden"
        aria-label="Release builder views"
      >
        <div class="flex">
          {(
            [
              ['changes', GitCommitHorizontal, 'Changes'],
              ['preview', Rocket, 'Preview'],
              ['gates', ListChecks, 'Gates'],
            ] as const
          ).map(([value, Icon, label]) => (
            <button
              class={`inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 border-b-2 px-2 text-xs font-bold ${view === value ? 'border-green-700 text-green-800' : 'border-transparent text-slate-500'}`}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              key={value}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </nav>

      <div class="mx-auto grid max-w-[1700px] items-start gap-4 p-0 sm:p-6 xl:grid-cols-[minmax(0,1fr)_500px]">
        <div class={view === 'changes' ? 'block' : 'hidden xl:block'}>
          <CommitList
            commits={workspace.commits}
            query={query.value}
            filter={filter.value}
            onQuery={(value) => (query.value = value)}
            onFilter={(value) => (filter.value = value)}
            onToggle={(id) =>
              void persist({
                ...workspace,
                commits: workspace.commits.map((commit) =>
                  commit.id === id
                    ? { ...commit, selected: !commit.selected }
                    : commit,
                ),
              })
            }
          />
        </div>
        <div class="min-w-0 space-y-4">
          <div class={view === 'preview' ? 'block' : 'hidden xl:block'}>
            <ReleasePreview workspace={workspace} />
          </div>
          <div class={view === 'gates' ? 'block' : 'hidden xl:block'}>
            <ReadinessPanel
              workspace={workspace}
              onToggle={(id) =>
                void persist({
                  ...workspace,
                  checklist: workspace.checklist.map((item) =>
                    item.id === id
                      ? { ...item, complete: !item.complete }
                      : item,
                  ),
                })
              }
            />
          </div>
        </div>
      </div>

      {notice && (
        <div
          class={`fixed right-4 bottom-4 z-50 max-w-sm border bg-white px-4 py-3 text-sm font-bold shadow-xl ${notice.error ? 'border-red-200 text-red-800' : 'border-green-200 text-green-800'}`}
          role={notice.error ? 'alert' : 'status'}
        >
          {notice.text}
        </div>
      )}
    </main>
  )
}
