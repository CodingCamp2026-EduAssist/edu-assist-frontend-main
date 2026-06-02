import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import SourcesSidebar from "@/components/SourcesSidebar";
import HistoryPanel from "@/components/HistoryPanel";
import SettingsPanel from "@/components/SettingsPanel";
import { useChatStore } from "@/store/chat-store";
import { useEffect } from "react";

export default function ChatLayout() {
    const { activeMenu, theme } = useChatStore();
    const loadSessions = useChatStore((s) => s.loadSessions);

    useEffect(() => {
        loadSessions();
    }, []);

    return (
        <div
            className={`flex h-screen bg-[#f8f7f4] text-[#1a1a2e] font-sans overflow-hidden transition-colors duration-250 ${theme === "dark" ? "dark bg-[#0a0a0f] text-white" : ""}`}
        >
            <Sidebar />

            {activeMenu === "chat" && <SourcesSidebar />}

            <main className="flex-1 flex flex-col overflow-hidden relative bg-[#f8f7f4] dark:bg-[#0a0a0f]">
                {activeMenu === "history" && <HistoryPanel />}
                {activeMenu === "settings" && <SettingsPanel />}
                {activeMenu === "chat" && <Outlet />}
            </main>
        </div>
    );
}
