import { del, get, set } from 'idb-keyval'
import {
  releaseWorkspaceSchema,
  type ReleaseWorkspace,
} from '../domain/release'

export async function loadRelease(key: string, sampleUrl: string) {
  const saved = releaseWorkspaceSchema.safeParse(await get(key))
  if (saved.success) return saved.data
  await del(key)
  const response = await fetch(sampleUrl)
  if (!response.ok)
    throw new Error('Could not load the sample release workspace.')
  return releaseWorkspaceSchema.parse(await response.json())
}

export async function saveRelease(key: string, workspace: ReleaseWorkspace) {
  const parsed = releaseWorkspaceSchema.parse(workspace)
  await set(key, parsed)
  return parsed
}

export async function resetRelease(key: string, sampleUrl: string) {
  await del(key)
  return loadRelease(key, sampleUrl)
}
