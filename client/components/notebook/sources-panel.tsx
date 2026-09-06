"use client";

import { useState } from "react";
import {
    FileText,
    Globe,
    Link2,
    Plus,
    Trash2,
    Upload,
    Video,
    RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
    useCreateTextSource,
    useDeleteSource,
    useImportWebsite,
    useImportYoutube,
    useSources,
    useSource,
    useUploadPdf,
} from "@/hooks/use-sources";
import type { Source, SourceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const statusVariant: Record<SourceStatus, "default" | "secondary" | "outline" | "destructive"> = {
    PENDING: "secondary",
    PROCESSING: "outline",
    READY: "default",
    FAILED: "destructive",
};

const typeIcons = {
    PDF: FileText,
    WEBSITE: Globe,
    YOUTUBE: Video,
    TEXT: FileText,
    MARKDOWN: FileText,
};

function SourceDetailDialog({
    workspaceId,
    sourceId,
    open,
    onOpenChange,
}: {
    workspaceId: string;
    sourceId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data: source, isLoading } = useSource(workspaceId, sourceId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b bg-muted/30">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        {source && typeIcons[source.type] && (
                            <div className="rounded bg-primary/10 p-1.5 text-primary">
                                {(() => {
                                    const Icon = typeIcons[source.type];
                                    return <Icon className="size-5" />;
                                })()}
                            </div>
                        )}
                        <span className="truncate">{source?.title || "Source Detail"}</span>
                    </DialogTitle>
                    {source && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <Badge variant={statusVariant[source.status]} className="text-[10px]">
                                {source.status}
                            </Badge>
                            <span>{source.type}</span>
                            <span>•</span>
                            <span>Added {format(new Date(source.createdAt), "MMM d, yyyy")}</span>
                            {source.url && (
                                <>
                                    <span>•</span>
                                    <a href={source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                        <Link2 className="size-3" />
                                        Original Link
                                    </a>
                                </>
                            )}
                        </div>
                    )}
                </DialogHeader>
                
                <ScrollArea className="flex-1 bg-background">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center py-20">
                            <Spinner className="size-8 text-muted-foreground/50" />
                        </div>
                    ) : source ? (
                        <div className="p-6 md:p-8">
                            {source.status === "FAILED" ? (
                                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
                                    <p className="font-semibold">Failed to process this source.</p>
                                    <p className="mt-2 text-sm text-destructive/80">
                                        The system could not extract text or generate embeddings. Please try uploading it again or check if the source is accessible.
                                    </p>
                                </div>
                            ) : (
                                <div className="prose prose-sm prose-notebook dark:prose-invert max-w-none">
                                    {source.content ? (
                                        <ReactMarkdown>{source.content}</ReactMarkdown>
                                    ) : (
                                        <p className="italic text-muted-foreground text-center py-10">No content available.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

export function SourcesPanel({
    workspaceId,
    selectedIds,
    onToggle,
}: {
    workspaceId: string;
    selectedIds: string[];
    onToggle: (id: string) => void;
}) {
    const { data: sources = [], isLoading } = useSources(workspaceId);
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<"pdf" | "url" | "youtube" | "text">("pdf");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [url, setUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [viewSourceId, setViewSourceId] = useState<string | null>(null);

    const uploadPdf = useUploadPdf(workspaceId);
    const importWebsite = useImportWebsite(workspaceId);
    const importYoutube = useImportYoutube(workspaceId);
    const createText = useCreateTextSource(workspaceId);
    const deleteSource = useDeleteSource(workspaceId);

    const pending =
        uploadPdf.isPending ||
        importWebsite.isPending ||
        importYoutube.isPending ||
        createText.isPending;

    async function handleAdd() {
        if (tab === "pdf" && file) {
            await uploadPdf.mutateAsync({ file, title: title || undefined });
        } else if (tab === "url" && url) {
            await importWebsite.mutateAsync({ url, title: title || undefined });
        } else if (tab === "youtube" && url) {
            await importYoutube.mutateAsync({ url, title: title || undefined });
        } else if (tab === "text" && title && content) {
            await createText.mutateAsync({ type: "TEXT", title, content });
        }

        setOpen(false);
        setTitle("");
        setContent("");
        setUrl("");
        setFile(null);
    }

    return (
        <div className="flex h-full flex-col bg-background/50">
            <div className="flex items-center justify-between border-b px-4 py-3 glass z-10">
                <h2 className="font-heading text-sm font-semibold flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    Documents
                </h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger render={<Button size="sm" variant="outline" className="h-7 text-xs" />}>
                            <Plus className="mr-1 size-3" />
                            Add
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Upload Legal Document</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-2">
                            {(["pdf", "url", "youtube", "text"] as const).map((t) => (
                                <Button
                                    key={t}
                                    size="sm"
                                    variant={tab === t ? "default" : "outline"}
                                    onClick={() => setTab(t)}
                                    className="flex-1"
                                >
                                    {t === "pdf" && <Upload className="mr-1.5 size-3" />}
                                    {t === "url" && <Link2 className="mr-1.5 size-3" />}
                                    {t === "youtube" && <Video className="mr-1.5 size-3" />}
                                    {t === "text" && <FileText className="mr-1.5 size-3" />}
                                    <span className="capitalize">{t}</span>
                                </Button>
                            ))}
                        </div>
                        <div className="space-y-3 pt-2">
                            <div>
                                <Label>Title (optional)</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            {tab === "pdf" && (
                                <Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                            )}
                            {(tab === "url" || tab === "youtube") && (
                                <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
                            )}
                            {tab === "text" && (
                                <>
                                    <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                                    <Textarea placeholder="Paste your text..." value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="resize-none" />
                                </>
                            )}
                            <Button className="w-full" onClick={handleAdd} disabled={pending}>
                                {pending ? <Spinner className="size-4" /> : "Upload Document"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-1 p-2">
                    {isLoading && (
                        <div className="flex justify-center py-12">
                            <Spinner className="size-6 text-muted-foreground/50" />
                        </div>
                    )}
                    {!isLoading && sources.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-up">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Upload className="size-6" />
                            </div>
                            <h3 className="font-heading font-medium">No documents yet</h3>
                            <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
                                Upload contracts, NDAs, or legal policies to get started.
                            </p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen(true)}>
                                <Plus className="mr-1 size-3" /> Upload Document
                            </Button>
                        </div>
                    )}
                    {sources.map((source: Source) => {
                        const Icon = typeIcons[source.type];
                        const selected = selectedIds.includes(source.id);

                        return (
                            <div
                                key={source.id}
                                className={cn(
                                    "group flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-muted/50 cursor-pointer animate-fade-in transition-colors",
                                    selected && "bg-muted/60 shadow-sm border border-border/50",
                                )}
                                onClick={() => setViewSourceId(source.id)}
                            >
                                <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selected}
                                        onCheckedChange={() => onToggle(source.id)}
                                        disabled={source.status !== "READY"}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="rounded p-1 bg-primary/5 text-primary">
                                            <Icon className="size-3.5 shrink-0" />
                                        </div>
                                        <span className="truncate text-sm font-medium">{source.title}</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Badge variant={statusVariant[source.status]} className="text-[9px] uppercase">
                                            {source.status === "PROCESSING" && <Spinner className="mr-1 size-2" />}
                                            {source.status}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{source.type}</span>
                                    </div>
                                </div>
                                <Button
                                    size="icon-xs"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSource.mutate(source.id);
                                    }}
                                    disabled={deleteSource.isPending}
                                >
                                    <Trash2 className="size-3" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
            
            <SourceDetailDialog 
                workspaceId={workspaceId} 
                sourceId={viewSourceId} 
                open={!!viewSourceId} 
                onOpenChange={(open) => !open && setViewSourceId(null)} 
            />
        </div>
    );
}
