import { create } from "zustand";
import { persist } from "zustand/middleware";
import { listChatSessions, removeSession } from "@/services/api";

export const useChatStore = create(
    persist(
        (set, get) => ({
            sidebarOpen: true,
            activeMenu: "chat",
            sessionsList: [],
            isLoadingHistory: false,
            chatHistory: [],
            theme: "light",

            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            setActiveMenu: (menu) => set({ activeMenu: menu }),
            setSessionsList: (sessionsList) => set({ sessionsList }),
            setIsLoadingHistory: (isLoadingHistory) =>
                set({ isLoadingHistory }),
            setChatHistory: (chatHistory) => set({ chatHistory }),
            setTheme: (theme) => set({ theme }),

            loadSessions: async () => {
                try {
                    const data = await listChatSessions();
                    set({ sessionsList: data.sessions || [] });
                } catch (err) {
                    console.log("Gagal load sessions:", err.message);
                }
            },

            deleteSession: async (sessionId) => {
                try {
                    // Hanya panggil API jika ID adalah string (bukan timestamp Date.now() dari history lokal)
                    if (typeof sessionId === "string") {
                        await removeSession(sessionId);
                    }
                    set((state) => ({
                        sessionsList: state.sessionsList.filter(
                            (s) => (s.id || s.conversationId) !== sessionId
                        ),
                        chatHistory: state.chatHistory.filter(
                            (h) => h.id !== sessionId
                        )
                    }));
                } catch (err) {
                    console.error("Gagal menghapus session:", err.message);
                }
            },

            saveChatToHistory: (currentMessages) => {
                if (currentMessages.length < 2) return;
                const title =
                    currentMessages[0].content.slice(0, 30) +
                    (currentMessages[0].content.length > 30 ? "..." : "");
                const newHistoryItem = {
                    id: Date.now(),
                    title,
                    messages: currentMessages,
                    timestamp: new Date().toLocaleString(),
                };
                const { chatHistory } = get();
                const updatedHistory = [
                    newHistoryItem,
                    ...chatHistory.filter((h) => h.title !== title),
                ];
                set({ chatHistory: updatedHistory });
            },
        }),
        {
            name: "edu-assist-chat-history",
            partialize: (state) => ({
                chatHistory: state.chatHistory,
                theme: state.theme,
            }),
        },
    ),
);
