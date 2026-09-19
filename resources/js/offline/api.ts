import OfflineSyncController from "@/actions/App/Http/Controllers/OfflineSyncController";
import type { OfflineBootstrapCache } from "@/types/offline";

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "";
}

/** Thrown for any non-2xx response, carrying enough detail for the sync client to decide what happened. */
export class SyncApiError extends Error {
    status: number;
    body: unknown;

    constructor(status: number, message: string, body: unknown) {
        super(message);
        this.status = status;
        this.body = body;
    }
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...init,
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            "X-CSRF-TOKEN": csrfToken(),
            ...init.headers,
        },
    });

    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) {
        const message = typeof body === "object" && body !== null && "message" in body ? String((body as { message: unknown }).message) : response.statusText;
        throw new SyncApiError(response.status, message, body);
    }

    return body as T;
}

/** Confirms the Laravel session is still valid before attempting a sync. */
export async function checkSession(): Promise<{ authenticated: true; user: { id: number; name: string; email: string; role: string } }> {
    return request(OfflineSyncController.session().url, { method: "GET" });
}

/** Fetches the minimal assigned-case reference data used for offline field collection. */
export async function fetchBootstrap(): Promise<Omit<OfflineBootstrapCache, "ownerUserId">> {
    return request(OfflineSyncController.bootstrap().url, { method: "GET" });
}

export async function syncPhysicalSourceRecord(
    caseNumber: string,
    data: { offline_collection_id: string; label: string; source_type: string; description?: string | null; collection_location?: string | null },
): Promise<{ id: number; label: string; source_type: string; offline_collection_id: string }> {
    return request(OfflineSyncController.syncPhysicalSource(caseNumber).url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export interface SyncEvidencePayload {
    offline_collection_id: string;
    physical_source_id: number | null;
    title: string;
    description: string | null;
    evidence_type: string;
    client_sha256: string;
    collected_at: string;
    collected_timezone: string;
    file: Blob;
    filename: string;
}

export interface SyncEvidenceSuccess {
    outcome: "SUCCESS";
    evidence_number: string;
    server_sha256: string;
    registered_at: string;
    collected_at: string | null;
}

export async function syncEvidenceRecord(caseNumber: string, data: SyncEvidencePayload): Promise<SyncEvidenceSuccess> {
    const form = new FormData();
    form.append("offline_collection_id", data.offline_collection_id);
    if (data.physical_source_id !== null) {
        form.append("physical_source_id", String(data.physical_source_id));
    }
    form.append("title", data.title);
    if (data.description) {
        form.append("description", data.description);
    }
    form.append("evidence_type", data.evidence_type);
    form.append("client_sha256", data.client_sha256);
    form.append("collected_at", data.collected_at);
    form.append("collected_timezone", data.collected_timezone);
    form.append("file", data.file, data.filename);

    return request(OfflineSyncController.syncEvidence(caseNumber).url, {
        method: "POST",
        body: form,
    });
}
