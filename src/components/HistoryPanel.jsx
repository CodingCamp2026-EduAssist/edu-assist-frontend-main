import React from "react";
import { History, MessageSquare, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "@/store/chat-store";
import { getChatHistory } from "../services/api";
import { getGuestSessionIdForChatRequest } from "../services/chatSessionIdentity";

export default function HistoryPanel() {
    const navigate = useNavigate();
    const {
        sessionsList,
        chatHistory,
        isLoadingHistory,
        setIsLoadingHistory,
        setActiveMenu,
    } = useChatStore();

    const handleLoadHistory = (session) => {
        const sessionId = session.id || session.conversationId;
        setActiveMenu("chat");
        if (sessionId) {
            navigate(`/chat/${sessionId}`);
        } else {
            navigate(`/`);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
            <div>
                <h2 className="text-[1.3rem] font-bold text-[#1a1a2e] dark:text-white mb-1 flex items-center gap-2">
                    <History
                        className="text-[#2563eb] dark:text-blue-400"
                        size={22}
                    />
                    Riwayat Percakapan
                </h2>
                <p className="text-[0.85rem] text-[#9ca3af]">
                    Klik percakapan untuk melanjutkan
                </p>
            </div>
            <div className="flex flex-col gap-2">
                {isLoadingHistory ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-center py-8 px-2">
                        <Loader2 className="w-10 h-10 text-[#2563eb] animate-spin mb-1" />
                        <p className="text-[0.875rem] font-semibold text-[#6b7280] dark:text-white/60">
                            Memuat riwayat...
                        </p>
                    </div>
                ) : sessionsList.length > 0 ? (
                    sessionsList.map((session) => (
                        <div
                            key={session.id || session.conversationId}
                            className="flex items-center gap-4 p-4 bg-white dark:bg-[#121218] border border-[#e5e7eb] dark:border-white/10 rounded-xl cursor-pointer transition-all duration-200 hover:border-[#2563eb] dark:hover:border-blue-500 hover:bg-[#eff6ff] dark:hover:bg-white/5 group"
                            onClick={() => handleLoadHistory(session)}
                        >
                            <MessageSquare
                                size={18}
                                className="text-slate-400 dark:text-white/40 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-[0.875rem] font-medium text-[#1a1a2e] dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">
                                    {session.title || "Percakapan"}
                                </p>
                                <p className="text-[0.75rem] text-[#9ca3af] mt-1">
                                    {session.createdAt
                                        ? new Date(session.createdAt).toLocaleString()
                                        : ""}
                                </p>
                            </div>
                            <span className="text-[#9ca3af] text-[1rem] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#2563eb] dark:group-hover:text-blue-400">
                                →
                            </span>
                        </div>
                    ))
                ) : chatHistory.length > 0 ? (
                    chatHistory.map((h) => (
                        <div
                            key={h.id}
                            className="flex items-center gap-4 p-4 bg-white dark:bg-[#121218] border border-[#e5e7eb] dark:border-white/10 rounded-xl cursor-pointer transition-all duration-200 hover:border-[#2563eb] dark:hover:border-blue-500 hover:bg-[#eff6ff] dark:hover:bg-white/5 group"
                            onClick={() => handleLoadHistory(h)}
                        >
                            <MessageSquare
                                size={18}
                                className="text-slate-400 dark:text-white/40 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-[0.875rem] font-medium text-[#1a1a2e] dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">
                                    {h.title}
                                </p>
                                <p className="text-[0.75rem] text-[#9ca3af] mt-1">
                                    {h.timestamp}
                                </p>
                            </div>
                            <span className="text-[#9ca3af] text-[1rem] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#2563eb] dark:group-hover:text-blue-400">
                                →
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-center py-8 px-2">
                        <History
                            size={40}
                            className="text-slate-300 dark:text-white/20 mb-1"
                        />
                        <p className="text-[0.875rem] font-semibold text-[#6b7280] dark:text-white/60">
                            Belum ada riwayat
                        </p>
                        <p className="text-[0.78rem] text-[#9ca3af] dark:text-white/40">
                            Mulai chat untuk menyimpan riwayat
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
