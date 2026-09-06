"use client";
import React, { useState } from 'react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/types';

const QueryProvider = ({ children }: { children: React.ReactNode }) => {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: (failureCount, error) => {
                    // Don't retry auth errors — they won't self-heal
                    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
                        return false;
                    }
                    return failureCount < 2;
                },
                refetchOnWindowFocus: false,
                staleTime: 30_000, // 30s before refetch
            },
        },
    }))
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}

export default QueryProvider