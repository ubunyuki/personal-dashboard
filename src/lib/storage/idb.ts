import { del, get, set } from 'idb-keyval'
import type { StoredScene } from '../../types'

const DIR_HANDLE_KEY = 'backup-dir-handle'
const sceneKey = (boardId: string) => `board-scene:${boardId}`

export async function loadDirHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  try {
    return await get<FileSystemDirectoryHandle>(DIR_HANDLE_KEY)
  } catch {
    return undefined
  }
}

export async function saveDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await set(DIR_HANDLE_KEY, handle)
}

export async function clearDirHandle(): Promise<void> {
  await del(DIR_HANDLE_KEY)
}

export async function loadScene(boardId: string): Promise<StoredScene | undefined> {
  try {
    return await get<StoredScene>(sceneKey(boardId))
  } catch {
    return undefined
  }
}

export async function saveScene(boardId: string, scene: StoredScene): Promise<void> {
  await set(sceneKey(boardId), scene)
}

export async function deleteScene(boardId: string): Promise<void> {
  await del(sceneKey(boardId))
}
