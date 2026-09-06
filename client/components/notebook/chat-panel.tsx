"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Send, Trash2, MessageSquare, AlertCircle, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useChatStream,
    useCreateConversation,
    useDeleteConversation,
    useConversations,
    useMessages,
} from "@/hooks/use-chat";
import type { Citation, Message } from "@/lib/types";
import { cn } from "@/lib/utils";

function MessageBubble({
    message,
    streaming,
    streamText,
}: {
    message?: Message;
    streaming?: boolean;
    streamText?: string;
}) {
    const isUser = message?.role === "USER";
    const content = streaming ? streamText : message?.content;
    const citations = message?.citations as Citation[] | null;

    if (!content && !streaming) {
        return null;
    }

    return (
        <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm animate-fade-in",
                    isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted glass",
                )}
            >
                {isUser ? (
                    <p className="whitespace-pre-wrap">{content}</p>
                ) : (
                    <div className="prose prose-sm prose-notebook dark:prose-invert max-w-none">
                        {streaming && !content ? (
                            <span className="text-muted-foreground flex items-center gap-1.5 animate-pulse">
                                <Spinner className="size-3" />
                                Thinking...
                            </span>
                        ) : (
                            <>
                                <ReactMarkdown>{content ?? ""}</ReactMarkdown>
                                {streaming && <span className="inline-block animate-pulse">▍</span>}
                            </>
                        )}
                    </div>
                )}
                {citations && citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {citations.map((c) => (
                            <Badge key={c.chunkId} variant="outline" className="text-[10px] bg-background/50">
                                [{c.index}] {c.sourceTitle ?? "Source"}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export function ChatPanel({
    workspaceId,
    selectedSourceIds,
}: {
    workspaceId: string;
    selectedSourceIds: string[];
}) {
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    const { data: conversations = [] } = useConversations(workspaceId);
    const createConversation = useCreateConversation(workspaceId);
    const deleteConversation = useDeleteConversation(workspaceId);
    const { data: messages = [], isLoading: loadingMessages } = useMessages(workspaceId, conversationId);
    const { sendMessage, streaming, streamText, error: chatError, clearError: clearChatError } = useChatStream(
        workspaceId,
        conversationId,
    );

    // Auto-select first conversation if none selected and conversations exist
    useEffect(() => {
        if (!conversationId && conversations.length > 0) {
            setConversationId(conversations[0].id);
        } else if (conversations.length > 0 && !conversations.find((c) => c.id === conversationId)) {
            setConversationId(conversations[0].id);
        }
    }, [conversationId, conversations]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamText]);

    async function handleSend() {
        if (!input.trim() || streaming) {
            return;
        }

        clearChatError();
        let currentConvId = conversationId;

        // Auto-create conversation if none exists
        if (!currentConvId) {
            try {
                const newConv = await createConversation.mutateAsync(undefined);
                setConversationId(newConv.id);
                currentConvId = newConv.id;
            } catch (e) {
                console.error("Failed to create conversation:", e);
                return;
            }
        }

        const text = input.trim();
        setInput("");

        try {
            await sendMessage(
                text,
                selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
            );
        } catch (err) {
            console.error("Error sending message:", err);
        }
    }

    async function handleNewChat() {
        const conv = await createConversation.mutateAsync(undefined);
        setConversationId(conv.id);
    }

    async function handleDeleteChat() {
        if (conversationId) {
            await deleteConversation.mutateAsync(conversationId);
            setConversationId(null);
        }
    }

    return (
        <div className="flex h-full flex-col bg-background/50">
            <div className="flex items-center justify-between border-b px-4 py-3 glass z-10">
                <div className="flex items-center gap-3">
                    <h2 className="font-heading text-sm font-semibold flex items-center gap-2">
                        <MessageSquare className="size-4 text-primary" />
                        Chat
                    </h2>
                    {conversations.length > 0 && (
                        <Select
                            value={conversationId ?? ""}
                            onValueChange={setConversationId}
                        >
                            <SelectTrigger className="h-7 w-[180px] text-xs border-dashed">
                                <SelectValue placeholder="Select conversation" />
                            </SelectTrigger>
                            <SelectContent>
                                {conversations.map((c) => (
                                    <SelectItem key={c.id} value={c.id} className="text-xs">
                                        {c.title || "New Chat"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {conversationId && (
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={handleDeleteChat}
                            disabled={deleteConversation.isPending}
                            className="text-muted-foreground hover:text-destructive"
                            title="Delete Chat"
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNewChat}
                        disabled={createConversation.isPending}
                        className="h-7 text-xs"
                    >
                        {createConversation.isPending ? (
                            <Spinner className="mr-1 size-3" />
                        ) : (
                            <Plus className="mr-1 size-3" />
                        )}
                        New
                    </Button>
                </div>
            </div>

            <div className="px-4 py-1.5 border-b bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                    {selectedSourceIds.length > 0 
                        ? `${selectedSourceIds.length} source(s) selected for context` 
                        : "Ask questions about your sources"}
                </span>
            </div>

            <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-4">
                    {loadingMessages ? (
                        <div className="flex justify-center py-12">
                            <Spinner className="size-6 text-muted-foreground/50" />
                        </div>
                    ) : messages.length === 0 && !streaming ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-up">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <MessageSquare className="size-6" />
                            </div>
                            <h3 className="font-heading font-medium">No messages yet</h3>
                            <p className="mt-1 max-w-[250px] text-xs text-muted-foreground">
                                Start a conversation to ask questions and get insights from your sources.
                            </p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))}
                            {streaming && (
                                <MessageBubble streaming streamText={streamText} />
                            )}
                        </>
                    )}
                    <div ref={bottomRef} className="h-4" />
                </div>
            </ScrollArea>

            <div className="border-t p-4 glass z-10">
                {chatError && (
                    <div className="mb-3 flex items-start justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                            <span>{chatError}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={clearChatError}
                            className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 size-5"
                        >
                            <X className="size-3" />
                        </Button>
                    </div>
                )}
                <div className="relative flex items-end gap-2">
                    <Textarea
                        placeholder={
                            conversationId 
                                ? "Ask about your sources..." 
                                : "Type a message to start a new chat..."
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        rows={1}
                        className="min-h-[44px] max-h-[200px] resize-none pr-12 rounded-xl"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={streaming || !input.trim()}
                        className="absolute right-1.5 bottom-1.5 size-8 rounded-lg"
                    >
                        {streaming ? <Spinner className="size-4" /> : <Send className="size-4" />}
                    </Button>
                </div>
                <div className="mt-2 text-center text-[9px] text-muted-foreground">
                    AI can make mistakes. Verify important information.
                </div>
            </div>
        </div>
    );
}
