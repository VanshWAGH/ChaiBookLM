"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setTokenGetter } from "@/lib/auth-token";

/**
 * Bridges Clerk's `useAuth().getToken` into the module-level token getter
 * so that `apiFetch` / `apiUpload` (non-React code) can always obtain a
 * fresh JWT for Authorization headers.
 *
 * Must be rendered inside `<ClerkProvider>`.
 */
export function AuthTokenProvider({ children }: { children: React.ReactNode }) {
    const { getToken } = useAuth();

    useEffect(() => {
        setTokenGetter(() => getToken());
    }, [getToken]);

    return <>{children}</>;
}
