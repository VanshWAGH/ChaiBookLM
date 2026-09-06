"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, LogOut, Settings } from "lucide-react";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { ChatPanel } from "@/components/notebook/chat-panel";
import { SourcesPanel } from "@/components/notebook/sources-panel";
import { StudioPanel } from "@/components/notebook/studio-panel";
import { buttonVariants, Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Spinner } from "@/components/ui/spinner";
import { useWorkspace, useUpdateWorkspace } from "@/hooks/use-workspaces";
import { Show, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/lib/types";

const CHAT_MODELS = [
    "google/gemma-4-26b-a4b-it:free",
    "google/gemma-4-31b-it:free",
];

function NotebookSettingsDialog({ workspace }: { workspace: Workspace }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(workspace.title);
    const [description, setDescription] = useState(workspace.description || "");
    const [defaultModel, setDefaultModel] = useState(workspace.defaultModel);
    
    const updateWorkspace = useUpdateWorkspace(workspace.id);

    // Reset when opened
    useEffect(() => {
        if (open) {
            setTitle(workspace.title);
            setDescription(workspace.description || "");
            setDefaultModel(workspace.defaultModel);
        }
    }, [open, workspace]);

    async function handleSave() {
        if (!title.trim()) return;
        
        await updateWorkspace.mutateAsync({
            title,
            description,
            defaultModel,
        });
        
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="ghost" size="icon-sm" title="Settings" />}>
                <Settings className="size-4 text-muted-foreground" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Notebook Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input 
                            id="title" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="My Notebook" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea 
                            id="description" 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            rows={3} 
                            className="resize-none"
                            placeholder="What is this notebook about?" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model">Default Model</Label>
                        <Select value={defaultModel} onValueChange={(val) => val && setDefaultModel(val)}>
                            <SelectTrigger id="model">
                                <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                                {CHAT_MODELS.map(model => (
                                    <SelectItem key={model} value={model} className="text-xs font-mono">
                                        {model.split('/').pop()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">
                            This model will be used for chat and artifact generation in this notebook.
                        </p>
                    </div>
                    
                    <div className="flex justify-end pt-2">
                        <Button 
                            onClick={handleSave} 
                            disabled={!title.trim() || updateWorkspace.isPending}
                        >
                            {updateWorkspace.isPending ? <Spinner className="mr-2 size-4" /> : null}
                            Save Changes
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function WorkspaceView({ workspaceId }: { workspaceId: string }) {
    const { data: workspace, isLoading } = useWorkspace(workspaceId);
    const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
    
    // For mobile responsive
    const [activeTab, setActiveTab] = useState<"sources" | "chat" | "studio">("chat");

    function toggleSource(id: string) {
        setSelectedSourceIds((prev) =>
            prev.includes(id)
                ? prev.filter((s) => s !== id)
                : [...prev, id],
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Spinner className="size-8 text-primary" />
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 animate-fade-in">
                <div className="rounded-full bg-muted p-4">
                    <BookOpen className="size-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Notebook not found</p>
                <Link
                    href="/notebooks"
                    className={cn(buttonVariants({ variant: "default" }), "mt-2")}
                >
                    Back to notebooks
                </Link>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <header className="flex shrink-0 items-center justify-between border-b px-4 py-2 glass z-20">
                <div className="flex items-center gap-3">
                    <Link
                        href="/notebooks"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                        title="Back to Notebooks"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div className="flex size-8 items-center justify-center rounded bg-primary/10">
                        <BookOpen className="size-4 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-heading text-sm font-semibold truncate max-w-[200px] md:max-w-xs">
                                {workspace.title}
                            </h1>
                            <NotebookSettingsDialog workspace={workspace} />
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px] md:max-w-xs font-mono">
                            {workspace.defaultModel.split('/').pop()}
                        </p>
                    </div>
                </div>
                
                {/* Mobile Tabs */}
                <div className="flex md:hidden items-center p-1 rounded-md bg-muted/50 border">
                    <Button 
                        variant={activeTab === "sources" ? "default" : "ghost"} 
                        size="sm" 
                        className="h-7 text-xs px-2"
                        onClick={() => setActiveTab("sources")}
                    >
                        Sources
                    </Button>
                    <Button 
                        variant={activeTab === "chat" ? "default" : "ghost"} 
                        size="sm" 
                        className="h-7 text-xs px-2"
                        onClick={() => setActiveTab("chat")}
                    >
                        Chat
                    </Button>
                    <Button 
                        variant={activeTab === "studio" ? "default" : "ghost"} 
                        size="sm" 
                        className="h-7 text-xs px-2"
                        onClick={() => setActiveTab("studio")}
                    >
                        Studio
                    </Button>
                </div>
                
                <div className="flex items-center gap-2 hidden md:flex">
                    <ModeToggle />
                    <UserButton />
                </div>
            </header>


            {/* Desktop Layout */}
            <ResizablePanelGroup id="notebook-layout" orientation="horizontal" className="hidden md:flex flex-1">
                <ResizablePanel id="sources" defaultSize="22%" minSize="15%" maxSize="35%">
                    <SourcesPanel
                        workspaceId={workspaceId}
                        selectedIds={selectedSourceIds}
                        onToggle={toggleSource}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle className="w-1 bg-border/50 transition-colors hover:bg-primary/50" />
                <ResizablePanel id="chat" defaultSize="48%" minSize="30%">
                    <ChatPanel
                        workspaceId={workspaceId}
                        selectedSourceIds={selectedSourceIds}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle className="w-1 bg-border/50 transition-colors hover:bg-primary/50" />
                <ResizablePanel id="studio" defaultSize="30%" minSize="20%" maxSize="40%">
                    <StudioPanel workspaceId={workspaceId} />
                </ResizablePanel>
            </ResizablePanelGroup>
            
            {/* Mobile Layout */}
            <div className="flex md:hidden flex-1 overflow-hidden relative">
                <div className={cn("absolute inset-0 transition-transform duration-300", activeTab === "sources" ? "translate-x-0" : "-translate-x-full")}>
                    <SourcesPanel
                        workspaceId={workspaceId}
                        selectedIds={selectedSourceIds}
                        onToggle={toggleSource}
                    />
                </div>
                <div className={cn("absolute inset-0 transition-transform duration-300", activeTab === "chat" ? "translate-x-0" : activeTab === "sources" ? "translate-x-full" : "-translate-x-full")}>
                    <ChatPanel
                        workspaceId={workspaceId}
                        selectedSourceIds={selectedSourceIds}
                    />
                </div>
                <div className={cn("absolute inset-0 transition-transform duration-300", activeTab === "studio" ? "translate-x-0" : "translate-x-full")}>
                    <StudioPanel workspaceId={workspaceId} />
                </div>
            </div>
        </div>
    );
}

export default function WorkspacePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return (
        <>
            <Show when="signed-in">
                <WorkspaceView workspaceId={id} />
            </Show>
            <Show when="signed-out">
                <RedirectToSignIn />
            </Show>
        </>
    );
}
