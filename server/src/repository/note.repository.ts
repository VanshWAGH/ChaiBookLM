import prisma from "../lib/db.js";

export const noteSelect = {
    id: true,
    workspaceId: true,
    title: true,
    content: true,
    isPinned: true,
    createdAt: true,
    updatedAt: true,
} as const;

export function findNotesByWorkspace(workspaceId: string) {
    return prisma.note.findMany({
        where: { workspaceId },
        select: noteSelect,
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });
}

export function findNoteById(noteId: string, workspaceId: string) {
    return prisma.note.findFirst({
        where: { id: noteId, workspaceId },
        select: noteSelect,
    });
}

export function createNoteRecord(data: {
    workspaceId: string;
    title: string;
    content?: string;
}) {
    return prisma.note.create({
        data: {
            workspaceId: data.workspaceId,
            title: data.title,
            content: data.content ?? "",
        },
        select: noteSelect,
    });
}

export function updateNoteRecord(
    noteId: string,
    data: {
        title?: string;
        content?: string;
        isPinned?: boolean;
    },
) {
    return prisma.note.update({
        where: { id: noteId },
        data,
        select: noteSelect,
    });
}

export function deleteNoteRecord(noteId: string) {
    return prisma.note.delete({ where: { id: noteId } });
}
