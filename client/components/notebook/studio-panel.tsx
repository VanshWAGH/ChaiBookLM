"use client";

import { useState } from "react";
import {
    ShieldCheck,
    Clock,
    FileSearch,
    List,
    Sparkles,
    Trash2,
    Maximize2,
    Scale,
    FileText,
    Wand2,
    Pin,
    PenLine,
    Plus,
    X,
    Save,
    Copy,
    Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    useArtifacts,
    useDeleteArtifact,
    useGenerateArtifact,
} from "@/hooks/use-artifacts";
import {
    useNotes,
    useCreateNote,
    useUpdateNote,
    useDeleteNote,
} from "@/hooks/use-notes";
import { useTransformStream } from "@/hooks/use-transform";
import type { Artifact, ArtifactType, Note, TransformType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const artifactOptions: {
    type: ArtifactType;
    label: string;
    icon: typeof ShieldCheck;
}[] = [
    { type: "SUMMARY", label: "Summary", icon: FileText },
    { type: "FAQ", label: "Key Clauses", icon: FileSearch },
    { type: "STUDY_GUIDE", label: "Risk Audit", icon: ShieldCheck },
    { type: "BRIEFING", label: "Legal Brief", icon: List },
    { type: "TIMELINE", label: "Compliance Check", icon: Clock },
    { type: "CLAUSE_EXTRACTOR", label: "Extract Clauses", icon: PenLine },
];

const transformOptions: { type: TransformType; label: string }[] = [
    { type: "SUMMARIZE", label: "Summarize" },
    { type: "SIMPLIFY", label: "Simplify" },
    { type: "EXPAND", label: "Expand" },
    { type: "FORMAL", label: "Make Formal" },
    { type: "CASUAL", label: "Make Casual" },
    { type: "TRANSLATE", label: "Translate (EN/HI)" },
];

function MakeTab({ workspaceId }: { workspaceId: string }) {
    const { data: artifacts = [] } = useArtifacts(workspaceId);
    const generate = useGenerateArtifact(workspaceId);
    const deleteArtifact = useDeleteArtifact(workspaceId);
    const [selected, setSelected] = useState<Artifact | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    if (!selected && artifacts.length > 0) {
        setSelected(artifacts[0]);
    } else if (selected && artifacts.length > 0 && !artifacts.find((a) => a.id === selected.id)) {
        setSelected(artifacts[0]);
    }

    return (
        <div className="flex h-full flex-col animate-fade-in">
            <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 border-b">
                {artifactOptions.map(({ type, label, icon: Icon }) => (
                    <Button
                        key={type}
                        variant="outline"
                        className="h-auto flex-col gap-1.5 py-3 bg-background shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-all"
                        disabled={generate.isPending}
                        onClick={() =>
                            generate.mutate(type, {
                                onSuccess: (artifact) => setSelected(artifact),
                            })
                        }
                    >
                        {generate.isPending && generate.variables === type ? (
                            <Spinner className="size-4 text-primary" />
                        ) : (
                            <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                                <Icon className="size-3.5" />
                            </div>
                        )}
                        <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
                    </Button>
                ))}
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-2 p-3">
                    {artifacts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-up">
                            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Sparkles className="size-5" />
                            </div>
                            <h3 className="text-xs font-medium">No analysis yet</h3>
                            <p className="mt-1 max-w-[200px] text-[10px] text-muted-foreground">
                                Select a generator above to create legal analysis.
                            </p>
                        </div>
                    )}
                    {artifacts.map((artifact) => {
                        const option = artifactOptions.find((o) => o.type === artifact.type);
                        const Icon = option?.icon || Sparkles;

                        return (
                            <button
                                key={artifact.id}
                                type="button"
                                onClick={() => setSelected(artifact)}
                                className={cn(
                                    "w-full rounded-lg border p-3 text-left transition-all hover:bg-muted/50 group",
                                    selected?.id === artifact.id && "border-primary/50 bg-primary/5 shadow-sm",
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Icon className="size-3.5 text-muted-foreground" />
                                        <span className="truncate text-sm font-medium">
                                            {artifact.title}
                                        </span>
                                    </div>
                                    <Badge
                                        variant={artifact.status === "READY" ? "default" : artifact.status === "FAILED" ? "destructive" : "secondary"}
                                        className="shrink-0 text-[9px] uppercase tracking-wider"
                                    >
                                        {artifact.status === "GENERATING" && <Spinner className="mr-1 size-2" />}
                                        {artifact.status}
                                    </Badge>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="text-[10px] text-muted-foreground capitalize">
                                        {artifact.type.replace("_", " ").toLowerCase()}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </ScrollArea>

            {selected && (
                <div className="max-h-[45%] border-t bg-background flex flex-col shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] z-20">
                    <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/20">
                        <span className="truncate text-sm font-medium">{selected.title}</span>
                        <div className="flex items-center gap-1">
                            <Button size="icon-xs" variant="ghost" onClick={() => setIsFullScreen(true)}>
                                <Maximize2 className="size-3.5 text-muted-foreground" />
                            </Button>
                            <Button size="icon-xs" variant="ghost" onClick={() => { deleteArtifact.mutate(selected.id); setSelected(null); }} disabled={deleteArtifact.isPending}>
                                <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                        </div>
                    </div>
                    <ScrollArea className="flex-1 px-4 py-3 min-h-[200px]">
                        {selected.status === "GENERATING" ? (
                            <div className="flex justify-center py-10"><Spinner className="size-6 text-primary" /></div>
                        ) : selected.status === "FAILED" ? (
                            <div className="text-xs text-destructive text-center py-10">Failed to generate artifact.</div>
                        ) : (
                            <div className="prose prose-sm prose-notebook dark:prose-invert max-w-none text-xs pb-4">
                                <ReactMarkdown>{selected.content || ""}</ReactMarkdown>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            )}

            <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
                    <DialogHeader className="px-6 py-4 border-b bg-muted/30 flex-row justify-between items-center space-y-0">
                        <DialogTitle className="text-lg flex items-center gap-2">
                            {selected?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 bg-background p-8">
                        <div className="prose prose-notebook dark:prose-invert max-w-none">
                            <ReactMarkdown>{selected?.content || ""}</ReactMarkdown>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function NotesTab({ workspaceId }: { workspaceId: string }) {
    const { data: notes = [] } = useNotes(workspaceId);
    const createNote = useCreateNote(workspaceId);
    const updateNote = useUpdateNote(workspaceId);
    const deleteNote = useDeleteNote(workspaceId);

    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [previewMode, setPreviewMode] = useState(false);

    function startEdit(note: Note | null) {
        if (note) {
            setEditingNote(note);
            setEditTitle(note.title);
            setEditContent(note.content);
        } else {
            setEditingNote(null);
            setEditTitle("New Note");
            setEditContent("");
        }
        setPreviewMode(false);
    }

    async function handleSave() {
        if (!editTitle.trim()) return;

        if (editingNote) {
            await updateNote.mutateAsync({
                noteId: editingNote.id,
                data: { title: editTitle, content: editContent },
            });
        } else {
            await createNote.mutateAsync({ title: editTitle, content: editContent });
        }
        startEdit(null);
        setEditTitle("");
    }

    if (editingNote !== null || (editTitle && !editingNote)) {
        return (
            <div className="flex h-full flex-col bg-background animate-fade-in">
                <div className="flex items-center justify-between border-b p-2 bg-muted/10">
                    <Button variant="ghost" size="icon-sm" onClick={() => startEdit(null)}>
                        <X className="size-4" />
                    </Button>
                    <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-8 border-transparent bg-transparent shadow-none font-medium px-2 focus-visible:ring-0"
                    />
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setPreviewMode(!previewMode)}>
                        {previewMode ? "Edit" : "Preview"}
                    </Button>
                    <Button size="sm" className="h-8 ml-2" onClick={handleSave} disabled={createNote.isPending || updateNote.isPending}>
                        <Save className="size-3 mr-1" /> Save
                    </Button>
                </div>
                <div className="flex-1 relative">
                    {previewMode ? (
                        <ScrollArea className="h-full px-4 py-4">
                            <div className="prose prose-sm prose-notebook dark:prose-invert max-w-none pb-10">
                                {editContent ? <ReactMarkdown>{editContent}</ReactMarkdown> : <p className="text-muted-foreground italic">No content...</p>}
                            </div>
                        </ScrollArea>
                    ) : (
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="Write your note here... (Markdown supported)"
                            className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4"
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col animate-fade-in">
            <div className="flex items-center justify-between p-3 border-b bg-muted/10">
                <span className="text-xs font-medium text-muted-foreground">{notes.length} notes</span>
                <Button size="sm" className="h-7 text-xs" onClick={() => startEdit(null)}>
                    <Plus className="size-3 mr-1" /> New Note
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {notes.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-xs">
                            No notes yet. Create one to capture ideas!
                        </div>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} className="group relative rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-start justify-between">
                                    <button onClick={() => startEdit(note)} className="text-left font-medium text-sm flex-1 truncate pr-8">
                                        {note.title}
                                    </button>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="icon-xs"
                                            variant="ghost"
                                            className={note.isPinned ? "text-primary opacity-100" : "text-muted-foreground"}
                                            onClick={() => updateNote.mutate({ noteId: note.id, data: { isPinned: !note.isPinned } })}
                                        >
                                            <Pin className="size-3.5" fill={note.isPinned ? "currentColor" : "none"} />
                                        </Button>
                                        <Button size="icon-xs" variant="ghost" onClick={() => deleteNote.mutate(note.id)}>
                                            <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {note.content || "Empty note"}
                                </p>
                                <p className="text-[9px] text-muted-foreground mt-2 uppercase">
                                    {format(new Date(note.updatedAt), "MMM d, h:mm a")}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function TransformTab({ workspaceId }: { workspaceId: string }) {
    const [inputText, setInputText] = useState("");
    const { transform, streaming, streamText, reset } = useTransformStream(workspaceId);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(streamText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex h-full flex-col animate-fade-in bg-background p-3">
            <div className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="flex-1 border rounded-lg overflow-hidden shadow-sm flex flex-col min-h-0">
                    <Textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste text here to transform..."
                        className="flex-1 resize-none border-0 focus-visible:ring-0 p-3 text-sm bg-muted/5"
                    />
                </div>

                <div className="grid grid-cols-3 gap-2 shrink-0">
                    {transformOptions.map(({ type, label }) => (
                        <Button
                            key={type}
                            variant="secondary"
                            size="sm"
                            className="text-[10px] h-8 bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                            disabled={!inputText.trim() || streaming}
                            onClick={() => transform(inputText, type)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>

                <div className={cn(
                    "flex-1 border rounded-lg overflow-hidden shadow-sm flex flex-col min-h-0 transition-opacity",
                    !streamText && !streaming ? "opacity-50" : "opacity-100"
                )}>
                    <div className="flex items-center justify-between border-b bg-muted/20 px-3 py-1.5 shrink-0">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Wand2 className="size-3" /> Result
                            {streaming && <Spinner className="size-3 ml-1" />}
                        </span>
                        {streamText && !streaming && (
                            <Button size="icon-xs" variant="ghost" onClick={handleCopy}>
                                {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="flex-1 p-3">
                        {streamText ? (
                            <div className="prose prose-sm prose-notebook dark:prose-invert max-w-none pb-4">
                                <ReactMarkdown>{streamText}</ReactMarkdown>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-10">
                                AI transformation will appear here.
                            </p>
                        )}
                    </ScrollArea>
                </div>
                
                {(streamText || streaming) && (
                    <Button variant="ghost" size="sm" onClick={reset} disabled={streaming} className="text-xs h-7 self-end">
                        Clear Result
                    </Button>
                )}
            </div>
        </div>
    );
}

export function StudioPanel({ workspaceId }: { workspaceId: string }) {
    return (
        <div className="flex h-full flex-col border-l bg-background/50">
            <div className="flex items-center justify-between border-b px-4 py-3 glass z-10 shrink-0">
                <h2 className="font-heading text-sm font-semibold flex items-center gap-2">
                    <Scale className="size-4 text-primary" />
                    Studio
                </h2>
            </div>
            <Tabs defaultValue="make" className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-transparent p-0 h-10 shrink-0">
                    <TabsTrigger
                        value="make"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                    >
                        Make
                    </TabsTrigger>
                    <TabsTrigger
                        value="notes"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                    >
                        Notes
                    </TabsTrigger>
                    <TabsTrigger
                        value="transform"
                        className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                    >
                        Transform
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="make" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <MakeTab workspaceId={workspaceId} />
                </TabsContent>
                <TabsContent value="notes" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <NotesTab workspaceId={workspaceId} />
                </TabsContent>
                <TabsContent value="transform" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                    <TransformTab workspaceId={workspaceId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
