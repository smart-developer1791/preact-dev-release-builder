import Fuse from 'fuse.js'
import { AlertTriangle, Search } from 'lucide-preact'
import { useMemo } from 'preact/hooks'
import {
  typeStyles,
  type CommitType,
  type ReleaseCommit,
} from '../domain/release'

type Props = {
  commits: ReleaseCommit[]
  query: string
  filter: string
  onQuery: (value: string) => void
  onFilter: (value: string) => void
  onToggle: (id: string) => void
}

export function CommitList({
  commits,
  query,
  filter,
  onQuery,
  onFilter,
  onToggle,
}: Props) {
  const visible = useMemo(() => {
    const searched = query.trim()
      ? new Fuse(commits, {
          keys: ['subject', 'scope', 'author', 'hash'],
          threshold: 0.3,
        })
          .search(query)
          .map((result) => result.item)
      : commits
    return searched.filter(
      (commit) =>
        filter === 'all' ||
        commit.type === filter ||
        (filter === 'breaking' && commit.breaking),
    )
  }, [commits, filter, query])

  return (
    <section class="border-y border-slate-200 bg-white sm:border">
      <header class="border-b border-slate-200 p-4 sm:p-5">
        <div class="flex items-end justify-between gap-3">
          <div>
            <h2 class="font-bold">Release changes</h2>
            <p class="mt-1 text-sm text-slate-500">
              Choose exactly what ships in this release.
            </p>
          </div>
          <span class="text-xs font-bold text-green-800">
            {visible.length} in view
          </span>
        </div>
        <div class="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px]">
          <label class="relative">
            <span class="sr-only">Search commits</span>
            <Search
              class="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              class="h-10 w-full border border-slate-300 bg-slate-50 pr-3 pl-9 text-sm"
              value={query}
              onInput={(event) => onQuery(event.currentTarget.value)}
              placeholder="Search changes"
            />
          </label>
          <label>
            <span class="sr-only">Filter commit type</span>
            <select
              class="h-10 w-full border border-slate-300 bg-white px-3 text-sm font-semibold"
              value={filter}
              onChange={(event) => onFilter(event.currentTarget.value)}
            >
              <option value="all">All types</option>
              <option value="breaking">Breaking only</option>
              {(
                [
                  'feat',
                  'fix',
                  'perf',
                  'docs',
                  'refactor',
                  'chore',
                  'test',
                ] as CommitType[]
              ).map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div class="divide-y divide-slate-100">
        {visible.map((commit) => (
          <label
            class={`flex cursor-pointer items-start gap-3 p-4 hover:bg-slate-50 sm:p-5 ${commit.selected ? '' : 'opacity-55'}`}
            key={commit.id}
          >
            <input
              class="mt-1 size-4 shrink-0 accent-green-700"
              type="checkbox"
              checked={commit.selected}
              onChange={() => onToggle(commit.id)}
            />
            <span class="min-w-0 flex-1">
              <span class="flex flex-wrap items-center gap-2">
                <span
                  class={`px-2 py-1 text-xs font-bold ${typeStyles[commit.type]}`}
                >
                  {commit.type}
                </span>
                {commit.scope && (
                  <span class="font-mono text-xs text-slate-500">
                    {commit.scope}
                  </span>
                )}
                {commit.breaking && (
                  <span class="inline-flex items-center gap-1 bg-red-100 px-2 py-1 text-xs font-bold text-red-800">
                    <AlertTriangle size={13} /> Breaking
                  </span>
                )}
              </span>
              <strong class="mt-2 block text-sm leading-5 text-slate-800">
                {commit.subject}
              </strong>
              <span class="mt-1 block truncate text-xs text-slate-500">
                {commit.hash} · {commit.author}
              </span>
            </span>
          </label>
        ))}
        {!visible.length && (
          <p class="p-10 text-center text-sm text-slate-500">
            No commits match this view.
          </p>
        )}
      </div>
    </section>
  )
}
