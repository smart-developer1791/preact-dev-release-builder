import {
  AlertTriangle,
  ExternalLink,
  Sparkles,
  UsersRound,
} from 'lucide-preact'
import {
  categoryLabels,
  groupedCommits,
  selectedCommits,
  typeStyles,
  type ReleaseWorkspace,
} from '../domain/release'

export function ReleasePreview({ workspace }: { workspace: ReleaseWorkspace }) {
  const commits = selectedCommits(workspace)
  const breaking = commits.filter((commit) => commit.breaking)
  const contributors = [
    ...new Map(commits.map((commit) => [commit.email, commit.author])).values(),
  ]
  return (
    <section class="border-y border-slate-200 bg-white sm:border">
      <header class="border-b border-slate-200 p-4 sm:p-5">
        <p class="text-xs font-bold text-green-700">RELEASE PREVIEW</p>
        <h2 class="mt-1 text-xl font-bold">
          {workspace.project.name} {workspace.project.targetVersion}
        </h2>
        <p class="mt-2 text-sm leading-6 text-slate-500">
          {workspace.summary || 'Add a concise release summary.'}
        </p>
        <a
          class="mt-3 inline-flex items-center gap-2 text-xs font-bold text-green-800 hover:underline"
          href={`${workspace.project.repository}/compare/v${workspace.project.currentVersion}...v${workspace.project.targetVersion}`}
          target="_blank"
          rel="noreferrer"
        >
          Compare versions <ExternalLink size={13} />
        </a>
      </header>
      {breaking.length > 0 && (
        <section class="border-b border-red-200 bg-red-50 p-4 sm:p-5">
          <h3 class="flex items-center gap-2 font-bold text-red-900">
            <AlertTriangle size={17} /> Breaking changes
          </h3>
          <ul class="mt-3 space-y-2">
            {breaking.map((commit) => (
              <li class="text-sm leading-5 text-red-800" key={commit.id}>
                • {commit.subject}
              </li>
            ))}
          </ul>
        </section>
      )}
      <div class="divide-y divide-slate-100">
        {groupedCommits(workspace).map((group) => (
          <section class="p-4 sm:p-5" key={group.type}>
            <h3 class="flex items-center gap-2 font-bold">
              <Sparkles class="text-green-700" size={16} />{' '}
              {categoryLabels[group.type]}
            </h3>
            <div class="mt-3 space-y-3">
              {group.commits.map((commit) => (
                <article
                  class="grid grid-cols-[auto_minmax(0,1fr)] gap-2"
                  key={commit.id}
                >
                  <span
                    class={`h-fit px-2 py-1 text-xs font-bold ${typeStyles[commit.type]}`}
                  >
                    {commit.scope || commit.type}
                  </span>
                  <div>
                    <p class="text-sm leading-5 text-slate-700">
                      {commit.subject}
                    </p>
                    <span class="mt-1 block font-mono text-xs text-slate-400">
                      {commit.hash}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        {!commits.length && (
          <p class="p-10 text-center text-sm text-slate-500">
            Select commits to build the preview.
          </p>
        )}
      </div>
      {contributors.length > 0 && (
        <section class="border-t border-slate-200 p-4 sm:p-5">
          <h3 class="flex items-center gap-2 font-bold">
            <UsersRound size={17} /> Contributors
          </h3>
          <div class="mt-3 flex flex-wrap gap-2">
            {contributors.map((name) => (
              <span
                class="border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold"
                key={name}
              >
                {name}
              </span>
            ))}
          </div>
        </section>
      )}
    </section>
  )
}
