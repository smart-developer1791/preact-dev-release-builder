import semver from 'semver'
import { z } from 'zod'

const commitTypeSchema = z.enum([
  'feat',
  'fix',
  'perf',
  'docs',
  'refactor',
  'chore',
  'test',
])

export const commitSchema = z.object({
  id: z.string().min(1),
  hash: z.string().min(4),
  type: commitTypeSchema,
  scope: z.string(),
  subject: z.string().min(1),
  author: z.string().min(1),
  email: z.string().email(),
  date: z.iso.datetime(),
  breaking: z.boolean(),
  selected: z.boolean(),
})

export const releaseWorkspaceSchema = z
  .object({
    project: z.object({
      name: z.string().min(1),
      repository: z.url(),
      currentVersion: z.string().min(1),
      targetVersion: z.string().min(1),
      channel: z.enum(['stable', 'beta', 'canary']),
      releaseDate: z.iso.date(),
    }),
    summary: z.string(),
    commits: z.array(commitSchema).min(1),
    checklist: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          complete: z.boolean(),
        }),
      )
      .min(1),
  })
  .superRefine((workspace, context) => {
    const commitIds = new Set(workspace.commits.map((commit) => commit.id))
    if (commitIds.size !== workspace.commits.length) {
      context.addIssue({
        code: 'custom',
        path: ['commits'],
        message: 'Commit IDs must be unique.',
      })
    }
    const checklistIds = new Set(workspace.checklist.map((item) => item.id))
    if (checklistIds.size !== workspace.checklist.length) {
      context.addIssue({
        code: 'custom',
        path: ['checklist'],
        message: 'Checklist IDs must be unique.',
      })
    }
  })

export type ReleaseCommit = z.infer<typeof commitSchema>
export type ReleaseWorkspace = z.infer<typeof releaseWorkspaceSchema>
export type CommitType = z.infer<typeof commitTypeSchema>

export const categoryLabels: Record<CommitType, string> = {
  feat: 'Features',
  fix: 'Fixes',
  perf: 'Performance',
  docs: 'Documentation',
  refactor: 'Refactoring',
  chore: 'Maintenance',
  test: 'Tests',
}

export const typeStyles: Record<CommitType, string> = {
  feat: 'bg-emerald-100 text-emerald-800',
  fix: 'bg-blue-100 text-blue-800',
  perf: 'bg-violet-100 text-violet-800',
  docs: 'bg-amber-100 text-amber-800',
  refactor: 'bg-cyan-100 text-cyan-800',
  chore: 'bg-slate-200 text-slate-700',
  test: 'bg-pink-100 text-pink-800',
}

export function selectedCommits(workspace: ReleaseWorkspace) {
  return workspace.commits.filter((commit) => commit.selected)
}

export function suggestedVersion(workspace: ReleaseWorkspace) {
  const commits = selectedCommits(workspace)
  const current =
    semver.coerce(workspace.project.currentVersion)?.version ?? '0.0.0'
  if (!commits.length) return current
  const release = commits.some((commit) => commit.breaking)
    ? 'major'
    : commits.some((commit) => commit.type === 'feat')
      ? 'minor'
      : 'patch'
  return semver.inc(current, release) ?? '0.0.1'
}

export function releaseStats(workspace: ReleaseWorkspace) {
  const commits = selectedCommits(workspace)
  return {
    selected: commits.length,
    breaking: commits.filter((commit) => commit.breaking).length,
    contributors: new Set(commits.map((commit) => commit.email)).size,
    checks: workspace.checklist.filter((item) => item.complete).length,
  }
}

export function groupedCommits(workspace: ReleaseWorkspace) {
  const commits = selectedCommits(workspace)
  return (Object.keys(categoryLabels) as CommitType[])
    .map((type) => ({
      type,
      label: categoryLabels[type],
      commits: commits.filter((item) => item.type === type),
    }))
    .filter((group) => group.commits.length)
}

export function releaseMarkdown(workspace: ReleaseWorkspace) {
  const commits = selectedCommits(workspace)
  const breaking = commits.filter((commit) => commit.breaking)
  const contributors = [
    ...new Map(commits.map((commit) => [commit.email, commit.author])).values(),
  ]
  return [
    `# ${workspace.project.name} ${workspace.project.targetVersion}`,
    '',
    workspace.summary.trim(),
    '',
    ...(breaking.length
      ? [
          '## Breaking changes',
          '',
          ...breaking.map((commit) => `- ${commit.subject} (${commit.hash})`),
          '',
        ]
      : []),
    ...groupedCommits(workspace).flatMap((group) => [
      `## ${group.label}`,
      '',
      ...group.commits.map(
        (commit) =>
          `- ${commit.scope ? `**${commit.scope}:** ` : ''}${commit.subject} (${commit.hash})`,
      ),
      '',
    ]),
    '## Contributors',
    '',
    ...contributors.map((contributor) => `- ${contributor}`),
    '',
  ].join('\n')
}

const conventionalPattern =
  /^(?:([a-f0-9]{4,40})\s+)?(feat|fix|perf|docs|refactor|chore|test)(?:\(([^)]+)\))?(!)?:\s+(.+)$/i

export function parseCommitText(source: string): ReleaseCommit[] {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const parsed = lines.map((line, index) => {
    const [
      message,
      author = 'Imported contributor',
      email = `imported-${index}@example.dev`,
      date,
    ] = line.split('|').map((part) => part.trim())
    const match = message.match(conventionalPattern)
    if (!match)
      throw new Error(
        `Line ${index + 1} is not a supported conventional commit.`,
      )
    const [, hash = `local${index}`, type, scope = '', breaking, subject] =
      match
    return commitSchema.parse({
      id: `imported-${index}-${hash}`,
      hash,
      type: type.toLowerCase(),
      scope,
      subject,
      author,
      email,
      date: date || new Date().toISOString(),
      breaking: Boolean(breaking),
      selected: true,
    })
  })
  if (!parsed.length) throw new Error('The commit file is empty.')
  return parsed
}
