import { create } from "zustand";
import { persist } from "zustand/middleware";
import { listChatSessions } from "@/services/api";
import { getGuestSessionIdForChatRequest } from "@/services/chatSessionIdentity";

export const useChatStore = create(
    persist(
        (set, get) => ({
            sidebarOpen: true,
            activeMenu: "chat",
            sessionsList: [],
            isLoadingHistory: false,
            chatHistory: [],

            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            setActiveMenu: (menu) => set({ activeMenu: menu }),
            setSessionsList: (sessionsList) => set({ sessionsList }),
            setIsLoadingHistory: (isLoadingHistory) => set({ isLoadingHistory }),
            setChatHistory: (chatHistory) => set({ chatHistory }),

            loadSessions: async () => {
                try {
                    const guestSessionId = getGuestSessionIdForChatRequest();
                    const data = await listChatSessions(guestSessionId);
                    set({ sessionsList: data.sessions || [] });
                } catch (err) {
                    console.log("Gagal load sessions:", err.message);
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
            }),
        }
    )
);
