"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Scale, LogOut, Plus, Trash2, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
    useCreateWorkspace,
    useDeleteWorkspace,
    useWorkspaces,
} from "@/hooks/use-workspaces";
import { Show, RedirectToSignIn, UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

function NotebooksDashboard() {
    const { user } = useUser();
    const { data: workspaces = [], isLoading } = useWorkspaces();
    const createWorkspace = useCreateWorkspace();
    const deleteWorkspace = useDeleteWorkspace();
    
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredWorkspaces = useMemo(() => {
        if (!searchQuery.trim()) return workspaces;
        const lowerQuery = searchQuery.toLowerCase();
        return workspaces.filter(
            (w) => w.title.toLowerCase().includes(lowerQuery) || 
                   w.description?.toLowerCase().includes(lowerQuery)
        );
    }, [workspaces, searchQuery]);

    async function handleCreate() {
        if (!title.trim()) {
            return;
        }

        await createWorkspace.mutateAsync({ title: title.trim() });
        setTitle("");
        setOpen(false);
    }

    return (
        <div className="flex min-h-screen flex-col bg-background/50 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 size-96 rounded-full bg-primary/5 blur-3xl -z-10 pointer-events-none animate-pulse duration-[10000ms]"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 size-96 rounded-full bg-secondary/5 blur-3xl -z-10 pointer-events-none animate-pulse duration-[8000ms]"></div>

            <header className="flex items-center justify-between border-b px-6 py-4 glass z-20 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 shadow-sm ring-1 ring-primary/20">
                        <Scale className="size-4 text-primary" />
                    </div>
                    <span className="font-heading text-lg font-bold tracking-tight">LexAssist</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden text-sm font-medium text-muted-foreground sm:inline mr-2">
                        {user?.firstName}
                    </span>
                    <ModeToggle />
                    <UserButton />
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-10 z-10">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
                    <div>
                        <h1 className="font-heading text-3xl font-bold tracking-tight">Legal Matters</h1>
                        <p className="text-muted-foreground mt-1">
                            {workspaces.length} {workspaces.length === 1 ? 'workspace' : 'workspaces'} in your library
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search workspaces..." 
                                className="pl-9 h-10 bg-background/50 backdrop-blur-sm border-muted-foreground/20 rounded-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger render={<Button className="h-10 rounded-full px-5 shadow-md transition-all hover:scale-105" />}>
                                    <Plus className="mr-2 size-4" />
                                    New
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Create new legal workspace</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            placeholder="E.g., Series A Term Sheet Review"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleCreate();
                                                }
                                            }}
                                            className="h-11"
                                            autoFocus
                                        />
                                    </div>
                                    <Button
                                        className="w-full h-11"
                                        onClick={handleCreate}
                                        disabled={createWorkspace.isPending || !title.trim()}
                                    >
                                        {createWorkspace.isPending ? (
                                            <Spinner className="size-4" />
                                        ) : (
                                            "Create Workspace"
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Spinner className="size-8 text-primary" />
                            <span className="text-sm font-medium text-muted-foreground animate-pulse">Loading library...</span>
                        </div>
                    </div>
                ) : workspaces.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-muted-foreground/20 bg-muted/10 py-24 px-6 text-center animate-scale-in">
                        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10">
                            <Sparkles className="size-10 text-primary" />
                        </div>
                        <h2 className="font-heading text-xl font-semibold">Welcome to LexAssist</h2>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                            Create your first workspace to start uploading contracts and generating legal analysis with AI.
                        </p>
                        <Button className="mt-8 rounded-full h-12 px-8 shadow-lg transition-transform hover:scale-105" onClick={() => setOpen(true)}>
                            <Plus className="mr-2 size-5" />
                            Create your first workspace
                        </Button>
                    </div>
                ) : filteredWorkspaces.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-muted-foreground/20 bg-muted/5 py-24 text-center">
                        <Search className="mb-4 size-10 text-muted-foreground/30" />
                        <h3 className="font-medium">No workspaces found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            No results matching "{searchQuery}"
                        </p>
                        <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                            Clear search
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredWorkspaces.map((workspace, i) => (
                            <div
                                key={workspace.id}
                                className={cn(
                                    "group relative flex flex-col rounded-2xl glass p-1 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 animate-fade-up",
                                    `delay-${Math.min(i * 100, 500)}`
                                )}
                            >
                                <Link
                                    href={`/notebooks/${workspace.id}`}
                                    className="flex h-full flex-col p-5"
                                >
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-2xl shadow-inner">
                                            {workspace.icon ?? "⚖️"}
                                        </div>
                                    </div>
                                    <h2 className="font-heading text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
                                        {workspace.title}
                                    </h2>
                                    <p className="mt-2 mb-6 line-clamp-2 text-xs text-muted-foreground min-h-[32px]">
                                        {workspace.description || "No description provided."}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                                                {workspace.defaultModel.split('/').pop()?.split('-')[0]}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium">
                                            {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </Link>
                                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                                    <Button
                                        size="icon-sm"
                                        variant="secondary"
                                        className="size-8 rounded-full bg-background/80 backdrop-blur shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            deleteWorkspace.mutate(workspace.id);
                                        }}
                                        disabled={deleteWorkspace.isPending}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function NotebooksPage() {
    return (
        <>
            <Show when="signed-in">
                <NotebooksDashboard />
            </Show>
            <Show when="signed-out">
                <RedirectToSignIn />
            </Show>
        </>
    );
}
