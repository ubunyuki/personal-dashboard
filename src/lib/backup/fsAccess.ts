import { saveDirHandle } from '../storage/idb'
import { selectFilesToDelete, KEEP_SNAPSHOTS, SNAPSHOT_RE } from './prune'

export function fsAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

/** Must be called from a user gesture. Returns null when the user cancels;
 *  throws SecurityError when the API is blocked by policy. */
export async function pickBackupFolder(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await window.showDirectoryPicker!({
      id: 'pwd-backup',
      mode: 'readwrite',
      startIn: 'documents',
    })
    await saveDirHandle(handle)
    return handle
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return null
    throw e
  }
}

export async function queryPerm(handle: FileSystemDirectoryHandle): Promise<PermissionState> {
  try {
    return (await handle.queryPermission?.({ mode: 'readwrite' })) ?? 'prompt'
  } catch {
    return 'denied'
  }
}

/** Must be called from a user gesture (throws SecurityError otherwise). */
export async function requestPerm(handle: FileSystemDirectoryHandle): Promise<PermissionState> {
  try {
    return (await handle.requestPermission?.({ mode: 'readwrite' })) ?? 'denied'
  } catch {
    return 'denied'
  }
}

export async function writeSnapshotFile(
  handle: FileSystemDirectoryHandle,
  name: string,
  json: string,
): Promise<void> {
  const file = await handle.getFileHandle(name, { create: true })
  const writable = await file.createWritable()
  await writable.write(json)
  await writable.close()
}

export async function listSnapshots(handle: FileSystemDirectoryHandle): Promise<string[]> {
  const names: string[] = []
  for await (const entry of handle.values()) {
    if (entry.kind === 'file' && SNAPSHOT_RE.test(entry.name)) names.push(entry.name)
  }
  return names.sort().reverse() // newest first
}

/** Best-effort: pruning must never fail a successful backup. */
export async function pruneSnapshots(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const names: string[] = []
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') names.push(entry.name)
    }
    for (const name of selectFilesToDelete(names, KEEP_SNAPSHOTS)) {
      await handle.removeEntry(name)
    }
  } catch {
    // e.g. OneDrive holding a lock — next backup prunes again
  }
}

export async function readSnapshot(
  handle: FileSystemDirectoryHandle,
  name: string,
): Promise<File> {
  const fh = await handle.getFileHandle(name)
  return fh.getFile()
}
