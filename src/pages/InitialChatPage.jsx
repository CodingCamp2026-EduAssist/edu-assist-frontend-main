import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, Brain, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useProfileStore } from "@/store/profile-store";
import { useChatStore } from "@/store/chat-store";
import { createChatSession } from "../services/api";
import {
    getChatSessionStorageKey,
    getOrCreateGuestSessionId,
    isAuthenticatedUser,
} from "../services/chatSessionIdentity";

const SUGGESTIONS = [
    { icon: <BookOpen size={18} />, label: "Bantu belajar" },
    { icon: <FileText size={18} />, label: "Rangkumin materi" },
    { icon: <Brain size={18} />, label: "Latihan soal" },
    { icon: <Search size={18} />, label: "Jelaskan konsep" },
];

export default function InitialChatPage() {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const user = useAuthStore((state) => state.user);
    const userProfile = useProfileStore((state) => state.userProfiles) || {};
    const { loadSessions } = useChatStore();

    async function handleSend() {
        if (!input.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const sessionStorageKey = getChatSessionStorageKey(userProfile);
            const authenticated = isAuthenticatedUser();
            const guestSessionId = authenticated ? null : getOrCreateGuestSessionId();

            const session = await createChatSession({
                title: input.trim().slice(0, 50),
                guestSessionId,
                studentProfile: {
                    educationLevel: userProfile.educationLevel || "undergraduate",
                    difficultyPreference: userProfile.difficultyPreference || "medium",
                    favouriteSubjects: userProfile.favouriteSubjects || [],
                    pace: userProfile.pace || "medium",
                    explanationStyle: userProfile.explanationStyle || "concise",
                },
            });

            const sessionId = session.conversationId;
            sessionStorage.setItem(sessionStorageKey, sessionId);

            // Fetch list in sidebar
            await loadSessions();

            // Store the initial message in session storage to be picked up by the ChatPage
            sessionStorage.setItem(`pending_msg_${sessionId}`, input.trim());

            // Navigate to the conversation page
            navigate(`/chat/${sessionId}`);
        } catch (err) {
            console.error("Gagal memulai chat:", err);
            alert(`Gagal memulai chat: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    function handleSuggestion(label) {
        setInput(label);
        inputRef.current?.focus();
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight text-center">
                Halo,{" "}
                <span className="text-[#2563eb] dark:text-blue-400">
                    {user.name || "Pelajar"}
                </span>
            </h1>
            <p className="text-base text-[#6b7280] dark:text-white/60 text-center -mt-3">
                Ada yang bisa EduAssist bantu hari ini?
            </p>
            <div className="flex items-center gap-2 bg-white dark:bg-[#121218] border border-[#e5e7eb] dark:border-white/10 rounded-xl p-2.5 pl-4 transition-all duration-200 w-full shadow-md focus-within:border-[#2563eb] dark:focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-[#2563eb]/10 dark:focus-within:ring-blue-500/10 max-w-[600px]">
                <textarea
                    ref={inputRef}
                    className="flex-1 bg-transparent border-none outline-none text-[#1a1a2e] dark:text-white text-[0.9rem] resize-none leading-relaxed max-h-[120px] overflow-y-auto placeholder-[#c4cad4] dark:placeholder-white/30"
                    placeholder="Tanya apa saja..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={isLoading}
                />
                <button
                    className={`w-8 h-8 rounded-lg border-none bg-[#e5e7eb] dark:bg-white/10 text-[#9ca3af] dark:text-white/40 text-[1.1rem] cursor-pointer flex items-center justify-center shrink-0 transition-all duration-200 ${input.trim() ? "bg-[#2563eb] dark:bg-blue-500 text-white dark:text-white hover:opacity-90" : ""}`}
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                >
                    {isLoading ? "..." : "↑"}
                </button>
            </div>
            <div className="flex gap-2.5 flex-wrap justify-center">
                {SUGGESTIONS.map((s) => (
                    <button
                        key={s.label}
                        className="flex items-center gap-1.5 py-2 px-4 rounded-full border border-[#e5e7eb] dark:border-white/10 bg-white dark:bg-[#121218] text-[#6b7280] dark:text-white/60 text-[0.82rem] cursor-pointer transition-all duration-200 shadow-sm hover:bg-[#eff6ff] dark:hover:bg-white/5 hover:border-[#2563eb] dark:hover:border-blue-500 hover:text-[#2563eb] dark:hover:text-blue-400"
                        onClick={() => handleSuggestion(s.label)}
                    >
                        <span className="shrink-0">{s.icon}</span>
                        <span>{s.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
