import { create } from "zustand";
import { deleteSource, getListDocuments, uploadDocument } from "@/services/api";
import { toast } from "sonner";

export const useSourcesStore = create((set, get) => ({
    sources: [],
    sourcesOpen: true,
    showAddSource: false,
    activeSourceType: "file",
    sourceInput: "",
    dragOver: false,
    loading: false,
    uploading: false,

    selectedPaths: [],
    toggleSelectDocument: (path) =>
        set((state) => {
            const isSelected = state.selectedPaths.includes(path);
            return {
                selectedPaths: isSelected
                    ? state.selectedPaths.filter((p) => p !== path)
                    : [...state.selectedPaths, path],
            };
        }),
    setSourcesOpen: (open) => set({ sourcesOpen: open }),
    setShowAddSource: (show) => set({ showAddSource: show }),
    setActiveSourceType: (type) => set({ activeSourceType: type }),
    setSourceInput: (input) => set({ sourceInput: input }),
    setDragOver: (dragOver) => set({ dragOver }),

    addSource: (source) =>
        set((state) => ({
            sources: [...state.sources, source],
            showAddSource: false,
            sourceInput: "",
        })),

    handleDeleteSource: async (fileKey) => {
        try {
            const response = await deleteSource(Array.from([fileKey]));
            if (response.status === 204 || response.ok) {
                set((state) => ({
                    sources: state.sources.filter((s) => s.id !== fileKey),
                }));
            }
        } catch (error) {
            console.error("Error deleting source:", error);
            toast.error(`Gagal menghapus source: ${error.message}`);
        }
    },

    handleFileUpload: async (file) => {
        if (file.size > 2 * 1024 * 1024) {
            toast.error(`File "${file.name}" melebihi batas ukuran 2MB!`);
            return;
        }
        const tempId = Date.now() + Math.random();

        // Add temporary upload state
        set((state) => ({
            sources: [
                ...state.sources,
                {
                    id: tempId,
                    type: "file",
                    fileName: file.name,
                    fileSize: "Uploading...",
                    status: "uploading",
                },
            ],
            showAddSource: false,
            uploading: true,
        }));

        try {
            const response = await uploadDocument(file);
            const doc = response?.document || response || {};
            set((state) => {
                const nextSources = state.sources.map((s) =>
                    s.id === tempId
                        ? {
                              ...s,
                              id: doc.id || tempId,
                              fileName: doc.fileName || file.name,
                              fileSize: doc.fileSize
                                  ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB`
                                  : `${(file.size / 1024).toFixed(1)} KB`,
                              status: "success",
                          }
                        : s,
                );
                return {
                    sources: nextSources,
                    uploading: nextSources.some(
                        (s) => s.status === "uploading",
                    ),
                };
            });
        } catch (err) {
            set((state) => {
                const nextSources = state.sources.filter(
                    (s) => s.id !== tempId,
                );
                return {
                    sources: nextSources,
                    uploading: nextSources.some(
                        (s) => s.status === "uploading",
                    ),
                };
            });
            toast.error(`Upload gagal: ${err.message}`);
        }
    },

    getListDocuments: async () => {
        set({ loading: true });
        try {
            const response = await getListDocuments();
            set((state) => {
                // To avoid duplication, we filter out response documents that are already in sources
                const existingIds = new Set(state.sources.map((s) => s.id));
                const newDocs = response.documents
                    .filter((doc) => !existingIds.has(doc.id))
                    .map((s) => ({
                        ...s,
                        fileSize: `${(s.fileSize / 1024 / 1024).toFixed(1)} MB`,
                        status: "success",
                    }));

                return {
                    sources: [...state.sources, ...newDocs],
                };
            });
        } catch (error) {
            console.error("Error fetching documents:", error);
            toast.error(`Gagal mengambil list documents: ${error.message}`);
        } finally {
            set({ loading: false });
        }
    },
}));
