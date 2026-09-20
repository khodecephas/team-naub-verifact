import type { OfflineBootstrapCache, OfflineEvidenceRecord } from "@/types/offline";

/**
 * Raw IndexedDB access for the offline-collection queue. Deliberately not
 * localStorage — evidence files (Blobs) and their metadata live only here,
 * scoped by the currently authenticated user's id so one signed-in user on
 * a shared device can never read another user's queue.
 *
 * This is a browser-local prototype store: it relies on the browser's
 * standard per-origin storage isolation, not custom encryption. See the
 * offline mode README note in PendingSync for that documented limitation.
 */
const DB_NAME = "h1-offline-evidence";
const DB_VERSION = 2;
const EVIDENCE_STORE = "evidence";
const PHYSICAL_SOURCE_STORE = "physicalSources";
const BOOTSTRAP_STORE = "bootstrap";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(EVIDENCE_STORE)) {
                const store = db.createObjectStore(EVIDENCE_STORE, { keyPath: "localId" });
                store.createIndex("ownerUserId", "ownerUserId");
            }

            // Removed in v2: evidence capture no longer depends on a
            // pre-synced physical source (case/source assignment happens
            // after sync, from the evidence record itself).
            if (db.objectStoreNames.contains(PHYSICAL_SOURCE_STORE)) {
                db.deleteObjectStore(PHYSICAL_SOURCE_STORE);
            }

            if (!db.objectStoreNames.contains(BOOTSTRAP_STORE)) {
                db.createObjectStore(BOOTSTRAP_STORE, { keyPath: "ownerUserId" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return dbPromise;
}

function runTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    task: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    return openDb().then(
        (db) =>
            new Promise<T>((resolve, reject) => {
                const tx = db.transaction(storeName, mode);
                const store = tx.objectStore(storeName);
                const request = task(store);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            }),
    );
}

function getAllByOwner<T>(storeName: string, ownerUserId: number): Promise<T[]> {
    return openDb().then(
        (db) =>
            new Promise<T[]>((resolve, reject) => {
                const tx = db.transaction(storeName, "readonly");
                const index = tx.objectStore(storeName).index("ownerUserId");
                const request = index.getAll(IDBKeyRange.only(ownerUserId));

                request.onsuccess = () => resolve(request.result as T[]);
                request.onerror = () => reject(request.error);
            }),
    );
}

export function putEvidenceRecord(record: OfflineEvidenceRecord): Promise<void> {
    return runTransaction(EVIDENCE_STORE, "readwrite", (store) => store.put(record)).then(() => undefined);
}

export function getEvidenceRecord(localId: string): Promise<OfflineEvidenceRecord | undefined> {
    return runTransaction(EVIDENCE_STORE, "readonly", (store) => store.get(localId));
}

export function getAllEvidenceRecords(ownerUserId: number): Promise<OfflineEvidenceRecord[]> {
    return getAllByOwner<OfflineEvidenceRecord>(EVIDENCE_STORE, ownerUserId);
}

export function deleteEvidenceRecord(localId: string): Promise<void> {
    return runTransaction(EVIDENCE_STORE, "readwrite", (store) => store.delete(localId)).then(() => undefined);
}

export function putBootstrapCache(cache: OfflineBootstrapCache): Promise<void> {
    return runTransaction(BOOTSTRAP_STORE, "readwrite", (store) => store.put(cache)).then(() => undefined);
}

export function getBootstrapCache(ownerUserId: number): Promise<OfflineBootstrapCache | undefined> {
    return runTransaction(BOOTSTRAP_STORE, "readonly", (store) => store.get(ownerUserId));
}
