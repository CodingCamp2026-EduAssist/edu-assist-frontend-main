import React from "react";
import { History, SquarePen, Menu, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { useProfileStore } from "@/store/profile-store";
import ProfileSection from "./ProfileSection";

export default function Sidebar() {
    const navigate = useNavigate();
    const {
        sidebarOpen,
        setSidebarOpen,
        activeMenu,
        setActiveMenu,
        sessionsList,
        chatHistory,
    } = useChatStore();

    const user = useAuthStore((s) => s.user);
    const userProfile = useProfileStore((s) => s.userProfiles) || {};

    const initials = user.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "U";

    const handleNewChat = () => {
        // Clear active session keys
        const keys = Object.keys(sessionStorage);
        keys.forEach((key) => {
            if (key.startsWith("edu_assist_session_") || key.startsWith("session_")) {
                sessionStorage.removeItem(key);
            }
        });
        setActiveMenu("chat");
        navigate("/");
    };

    const handleLoadHistory = (session) => {
        const sessionId = session.id || session.conversationId;
        setActiveMenu("chat");
        if (sessionId) {
            navigate(`/chat/${sessionId}`);
        } else {
            // For local unsaved sessions, if they exist
            navigate(`/`);
        }
    };

    return (
        <aside
            className={`bg-white dark:bg-[#121218] border-r border-[#e5e7eb] dark:border-white/10 flex flex-col py-5 gap-1 transition-all duration-250 overflow-hidden relative z-20 ${sidebarOpen ? "w-[220px] min-w-[220px] px-4 max-[768px]:absolute max-[768px]:h-full" : "w-14 min-w-14 px-0 flex flex-col items-center max-[768px]:w-0 max-[768px]:min-w-0 max-[768px]:p-0"}`}
        >
            <div className={`flex items-center mb-4 ${sidebarOpen ? "justify-between px-2 w-full" : "justify-center w-auto"}`}>
                <img
                    src="/icons/image.png"
                    alt="EduAssist"
                    className={`w-32 object-contain transition-all duration-200 ${sidebarOpen ? "block" : "hidden"}`}
                />
                <button
                    className="bg-transparent border-none text-slate-500 dark:text-white/70 cursor-pointer text-lg p-1 rounded-md transition-all duration-200 shrink-0 hover:text-slate-800 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 flex items-center justify-center"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <Menu size={20} />
                </button>
            </div>
            <button
                className={`flex items-center bg-[#2563eb] dark:bg-blue-600 text-white text-[0.85rem] font-semibold cursor-pointer mb-3 transition-all duration-200 whitespace-nowrap hover:bg-[#2563eb]/90 dark:hover:bg-blue-500 shadow-sm border-none ${sidebarOpen ? "gap-2.5 py-2.5 px-3 rounded-lg w-full" : "w-10 h-10 p-0 rounded-full justify-center shrink-0"}`}
                onClick={handleNewChat}
            >
                <SquarePen size={18} className="shrink-0" />
                <span className={sidebarOpen ? "block" : "hidden"}>
                    New Chat
                </span>
            </button>
            <nav className={`flex flex-col gap-0.5 ${sidebarOpen ? "w-full" : "items-center w-auto"}`}>
                <button
                    className={`flex items-center rounded-lg border-none bg-transparent text-slate-600 dark:text-white/60 text-[0.85rem] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white ${sidebarOpen ? "gap-3 py-2.5 px-3 text-left w-full" : "w-10 h-10 p-0 justify-center shrink-0"} ${activeMenu === "history" ? "bg-slate-100 dark:bg-white/10 text-[#2563eb] dark:text-blue-400 font-semibold shadow-sm" : ""}`}
                    onClick={() => setActiveMenu("history")}
                >
                    <span className="text-base shrink-0">
                        <History size={18} />
                    </span>
                    <span className={`text-[0.85rem] whitespace-nowrap ${sidebarOpen ? "block" : "hidden"}`}>
                        History
                    </span>
                </button>
            </nav>
            <div
                className={`flex-1 py-3 px-2 overflow-hidden transition-all duration-200 ${sidebarOpen ? "block" : "hidden"}`}
            >
                <p className="text-[0.7rem] font-semibold tracking-wider uppercase text-slate-400 dark:text-white/30 mb-2 px-1">
                    Recent
                </p>
                <div className="overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-none">
                    {sessionsList.length > 0 ? (
                        sessionsList.slice(0, 5).map((session) => (
                            <button
                                key={session.id || session.conversationId}
                                className="text-[0.8rem] text-slate-500 dark:text-white/50 py-1.5 px-2 rounded-lg cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white text-left w-full flex items-center gap-1.5"
                                onClick={() => handleLoadHistory(session)}
                            >
                                <MessageSquare size={14} className="shrink-0 text-slate-400 dark:text-white/40" />
                                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                                    {session.title || "Percakapan"}
                                </span>
                            </button>
                        ))
                    ) : chatHistory.length > 0 ? (
                        chatHistory.map((item) => (
                            <button
                                key={item.id}
                                className="text-[0.8rem] text-slate-500 dark:text-white/50 py-1.5 px-2 rounded-lg cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white text-left w-full flex items-center gap-1.5"
                                onClick={() => handleLoadHistory(item)}
                            >
                                <MessageSquare size={14} className="shrink-0 text-slate-400 dark:text-white/40" />
                                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                                    {item.title}
                                </span>
                            </button>
                        ))
                    ) : (
                        <p className="text-[0.78rem] text-slate-400 dark:text-white/30 py-1 px-2">
                            Belum ada percakapan
                        </p>
                    )}
                </div>
            </div>
            <ProfileSection />
        </aside>
    );
}
