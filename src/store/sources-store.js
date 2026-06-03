import { create } from "zustand";
import { uploadDocument, uploadURL, uploadDrive, uploadText } from "@/services/api";

export const useSourcesStore = create((set, get) => ({
    sources: [],
    sourcesOpen: true,
    showAddSource: false,
    activeSourceType: "file",
    sourceInput: "",
    dragOver: false,

    setSourcesOpen: (open) => set({ sourcesOpen: open }),
    setShowAddSource: (show) => set({ showAddSource: show }),
    setActiveSourceType: (type) => set({ activeSourceType: type }),
    setSourceInput: (input) => set({ sourceInput: input }),
    setDragOver: (dragOver) => set({ dragOver }),
    
    addSource: (source) => set((state) => ({
        sources: [...state.sources, source],
        showAddSource: false,
        sourceInput: "",
    })),

   deleteSource: (id) => set((state) => {
    const source = state.sources.find((s) => s.id === id)
    return {
        sources: state.sources.filter((s) => s.id !== id),
        documentIds: (state.documentIds || []).filter((d) => d !== source?.documentId),
    }
}),

    handleFileUpload: async (file) => {
    const tempId = Date.now();
    
    set((state) => ({
        sources: [...state.sources, {
            id: tempId,
            type: "file",
            name: file.name,
            meta: "Uploading...",
        }],
        showAddSource: false,
    }));

    try {
        const result = await uploadDocument(file)
        const documentId = result.document?.id
        set((state) => ({
            sources: state.sources.map((s) =>
                s.id === tempId
                    ? { ...s, documentId, meta: `${(file.size / 1024).toFixed(1)} KB` }
                    : s
            ),
        }));
    } catch (err) {
        set((state) => ({
            sources: state.sources.filter((s) => s.id !== tempId),
        }));
        alert(`Upload gagal: ${err.message}`);
    }
},
    handleAddSourceInput: async (userId) => {
        const { activeSourceType, sourceInput, addSource } = get();
        if (!sourceInput.trim()) return;

        try {
            if (activeSourceType === "drive") {
                await uploadDrive(sourceInput, userId);
                addSource({
                    id: Date.now(),
                    type: "drive",
                    name: "Google Drive",
                    meta: sourceInput,
                });
            } else if (activeSourceType === "url") {
                await uploadURL(sourceInput, userId);
                addSource({
                    id: Date.now(),
                    type: "url",
                    name: sourceInput,
                    meta: "Website",
                });
            } else if (activeSourceType === "text") {
                await uploadText(sourceInput, userId);
                addSource({
                    id: Date.now(),
                    type: "text",
                    name:
                        sourceInput.slice(0, 40) +
                        (sourceInput.length > 40 ? "..." : ""),
                    meta: `${sourceInput.length} karakter`,
                });
            }
        } catch (err) {
            alert(`Gagal tambah sumber: ${err.message}`);
        }
    },
}));
