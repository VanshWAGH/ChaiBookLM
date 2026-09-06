/**
 * Module-level auth token bridge.
 *
 * The Clerk `useAuth().getToken()` function is only available inside React
 * components, but `apiFetch` / `apiUpload` are plain utility functions.
 * This module stores a reference to Clerk's `getToken` so the API layer
 * can call it without being a hook.
 */

type TokenGetter = () => Promise<string | null>;

let _getToken: TokenGetter | null = null;

/** Called once by AuthTokenProvider to register the getter. */
export function setTokenGetter(fn: TokenGetter) {
    _getToken = fn;
}

/** Returns a current Clerk session JWT, or null. */
export async function getAuthToken(): Promise<string | null> {
    if (_getToken) {
        try {
            return await _getToken();
        } catch {
            return null;
        }
    }
    return null;
}
