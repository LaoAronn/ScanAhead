import type { AppointmentDraft } from './types'

type CaptureMode = 'photos' | 'video'

type CapturedImageDraft = {
  id: string
  angle: string
  dataUrl: string
}

export type NewCaseDraft = {
  appointment: AppointmentDraft
  bodyPart: string
  images: CapturedImageDraft[]
  audio: Blob | null
  video: Blob | null
  captureMode: CaptureMode
  updatedAt: string
}

const DB_NAME = 'scanAheadDrafts'
const STORE_NAME = 'drafts'
const DRAFT_KEY = 'newCase'
const DB_VERSION = 1

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

export const loadNewCaseDraft = async (): Promise<NewCaseDraft | null> => {
  try {
    const db = await openDatabase()
    return await new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(DRAFT_KEY)
      request.onsuccess = () => resolve((request.result as NewCaseDraft | undefined) ?? null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export const saveNewCaseDraft = async (draft: NewCaseDraft): Promise<void> => {
  try {
    const db = await openDatabase()
    await new Promise<void>((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.put(draft, DRAFT_KEY)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
      transaction.onabort = () => resolve()
    })
  } catch {
    // Ignore persistence errors.
  }
}

export const clearNewCaseDraft = async (): Promise<void> => {
  try {
    const db = await openDatabase()
    await new Promise<void>((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.delete(DRAFT_KEY)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
      transaction.onabort = () => resolve()
    })
  } catch {
    // Ignore persistence errors.
  }
}
