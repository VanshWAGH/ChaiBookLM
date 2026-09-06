import { ApiError, API_URL } from "./types";
import { getAuthToken } from "./auth-token";

type RequestOptions = RequestInit & {
    json?: unknown;
};

export async function apiFetch<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const { json, headers, ...rest } = options;

    const token = await getAuthToken();
    const authHeaders: Record<string, string> = {};
    if (token) {
        authHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...rest,
        headers: {
            ...(json ? { "Content-Type": "application/json" } : {}),
            ...authHeaders,
            ...headers,
        },
        body: json ? JSON.stringify(json) : rest.body,
    });

    if (!response.ok) {
        let details: unknown;
        try {
            details = await response.json();
        } catch {
            details = undefined;
        }

        const message =
            typeof details === "object" &&
            details &&
            "error" in details &&
            typeof (details as { error: unknown }).error === "string"
                ? (details as { error: string }).error
                : `Request failed (${response.status})`;

        throw new ApiError(message, response.status, details);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

export async function apiUpload<T>(
    path: string,
    formData: FormData,
): Promise<T> {
    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers,
        body: formData,
    });

    if (!response.ok) {
        const details = await response.json().catch(() => undefined);
        throw new ApiError(
            (details as { error?: string })?.error ?? "Upload failed",
            response.status,
            details,
        );
    }

    return response.json() as Promise<T>;
}
