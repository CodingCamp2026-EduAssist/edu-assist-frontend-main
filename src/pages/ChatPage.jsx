import { useState, useRef, useEffect } from "react";
import {
    sendMessage,
    createChatSession,
    getChatHistory,
    logout,
} from "../services/api";
import {
    getChatSessionStorageKey,
    getGuestSessionIdForChatRequest,
    getOrCreateGuestSessionId,
    isAuthenticatedUser,
} from "../services/chatSessionIdentity";
import {
    BookOpen,
    FileText,
    Brain,
    Search,
    History,
    Settings,
    MessageSquare,
    Loader2,
    LogOut,
    ChevronDown,
} from "lucide-react";

import { useProfileStore } from "@/store/profile-store";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import Sidebar from "@/components/Sidebar";
import SourcesSidebar from "@/components/SourcesSidebar";

const SUBJECTS = [
    "Matematika",
    "Fisika",
    "Kimia",
    "Biologi",
    "Sejarah",
    "Bahasa Inggris",
    "Ekonomi",
    "Sastra",
    "Ilmu Komputer",
    "Geografi",
    "Sosiologi",
    "Seni & Budaya",
];

const SUGGESTIONS = [
    { icon: <BookOpen size={18} />, label: "Bantu belajar" },
    { icon: <FileText size={18} />, label: "Rangkumin materi" },
    { icon: <Brain size={18} />, label: "Latihan soal" },
    { icon: <Search size={18} />, label: "Jelaskan konsep" },
];

function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState("light");
    const [focusedField, setFocusedField] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const accessToken = useAuthStore((state) => state.accessToken);
    const user = useAuthStore((state) => state.user);
    const userProfile = useProfileStore((state) => state.userProfiles);
    const updateUserProfile = useProfileStore((state) => state.updateUserProfile);

    // Global Chat State from Zustand Store
    const {
        activeMenu,
        setActiveMenu,
        sessionsList,
        chatHistory,
        isLoadingHistory,
        setIsLoadingHistory,
        saveChatToHistory,
        loadSessions,
    } = useChatStore();

    useEffect(() => {
        if (!accessToken) {
            navigate("/login");
        }
    }, [accessToken]);

    function handleProfileUpdate(key, value) {
        updateUserProfile({
            ...userProfile,
            [key]: value,
        });
    }

    const isNewChat = messages.length === 0;

    const initials = user.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "U";

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        loadSessions();
    }, []);

    async function handleSend() {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: "user", content: input.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const sessionStorageKey = getChatSessionStorageKey(userProfile);
            let sessionId = sessionStorage.getItem(sessionStorageKey);

            const authenticated = isAuthenticatedUser();
            const guestSessionId = authenticated
                ? null
                : getOrCreateGuestSessionId();

            if (!sessionId) {
                const session = await createChatSession({
                    title: input.trim().slice(0, 50),
                    guestSessionId,
                    studentProfile: {
                        educationLevel:
                            userProfile.educationLevel || "undergraduate",
                        difficultyPreference:
                            userProfile.difficultyPreference || "medium",
                        favouriteSubjects: userProfile.favouriteSubjects || [],
                        pace: userProfile.pace || "medium",
                        explanationStyle:
                            userProfile.explanationStyle || "concise",
                    },
                });
                sessionId = session.conversationId;
                sessionStorage.setItem(sessionStorageKey, sessionId);

                await loadSessions();
            }

            const result = await sendMessage(sessionId, userMsg.content);

            const assistantMsg = {
                role: "assistant",
                content:
                    result.assistantMessage?.content ||
                    result.content ||
                    result.message ||
                    result.reply ||
                    "Tidak ada response.",
            };

            setMessages((prev) => {
                const updated = [...prev, assistantMsg];
                saveChatToHistory(updated);
                return updated;
            });
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: ` Error: ${err.message}` },
            ]);
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

    function handleNewChat() {
        if (messages.length >= 2) saveChatToHistory(messages);
        setMessages([]);
        setInput("");
        sessionStorage.removeItem(getChatSessionStorageKey(userProfile));
        setActiveMenu("chat");
    }

    async function loadHistory(session) {
        try {
            setIsLoadingHistory(true);
            const guestSessionId = getGuestSessionIdForChatRequest();
            if (session.id || session.conversationId) {
                const sessionId = session.id || session.conversationId;
                const data = await getChatHistory(sessionId, guestSessionId);
                const formattedMessages = (data.messages || []).map((msg) => ({
                    role: msg.role === "user" ? "user" : "assistant",
                    content: msg.content,
                }));
                setMessages(formattedMessages);
                sessionStorage.setItem(
                    getChatSessionStorageKey(userProfile),
                    sessionId,
                );
            } else {
                setMessages(session.messages || []);
            }
            setActiveMenu("chat");
        } catch (err) {
            console.log("Gagal load history:", err.message);
            if (session.messages) {
                setMessages(session.messages);
                setActiveMenu("chat");
            }
        } finally {
            setIsLoadingHistory(false);
        }
    }

    return (
        <div
            className={`flex h-screen bg-[#f8f7f4] text-[#1a1a2e] font-sans overflow-hidden transition-colors duration-250 ${theme === "dark" ? "dark bg-[#0a0a0f] text-white" : ""}`}
        >
            <Sidebar
                handleNewChat={handleNewChat}
                onNewChat={handleNewChat}
                onLoadHistory={loadHistory}
            />

            {activeMenu === "chat" && <SourcesSidebar />}

            <main className="flex-1 flex flex-col overflow-hidden relative bg-[#f8f7f4] dark:bg-[#0a0a0f]">
                {activeMenu === "history" && (
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
                                        key={
                                            session.id || session.conversationId
                                        }
                                        className="flex items-center gap-4 p-4 bg-white dark:bg-[#121218] border border-[#e5e7eb] dark:border-white/10 rounded-xl cursor-pointer transition-all duration-200 hover:border-[#2563eb] dark:hover:border-blue-500 hover:bg-[#eff6ff] dark:hover:bg-white/5 group"
                                        onClick={() => loadHistory(session)}
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
                                                    ? new Date(
                                                          session.createdAt,
                                                      ).toLocaleString()
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
                                        onClick={() => loadHistory(h)}
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
                )}

                {activeMenu === "settings" && (
                    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
                        <div>
                            <h2 className="text-[1.3rem] font-bold text-[#1a1a2e] dark:text-white mb-1 flex items-center gap-2">
                                <Settings
                                    className="text-[#2563eb] dark:text-blue-400"
                                    size={22}
                                />
                                Pengaturan
                            </h2>
                            <p className="text-[0.85rem] text-[#9ca3af]">
                                Kelola profil dan tampilan aplikasi
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[0.8rem] font-semibold uppercase tracking-wider text-[#9ca3af]">
                                Profil
                            </h3>
                            <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#121218] border border-[#e5e7eb] dark:border-white/10 rounded-xl">
                                <div className="shrink-0">
                                    {user.foto ? (
                                        <img
                                            src={user.foto}
                                            alt="foto"
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-base font-bold shrink-0">
                                            {initials}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[0.95rem] font-semibold text-[#1a1a2e] dark:text-white">
                                        {user.name || "User"}
                                    </p>
                                    <p className="text-[0.8rem] text-[#6b7280] dark:text-white/60 mt-0.5">
                                        {user.email || "email@gmail.com"}
                                    </p>
                                    <span className="inline-block text-[0.7rem] bg-[#eff6ff] dark:bg-white/5 text-[#2563eb] dark:text-blue-400 border border-[#bfdbfe] dark:border-white/10 py-0.5 px-2 rounded-full mt-1.5">
                                        Dari Google Account
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[0.8rem] font-semibold uppercase tracking-wider text-[#9ca3af]">
                                Preferensi Belajar
                            </h3>
                            <div className="flex flex-col gap-4 p-5 bg-white dark:bg-[#121218] border border-[#e5e7eb] dark:border-white/10 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[0.8rem] font-semibold text-slate-500 dark:text-white/60">
                                            Jenjang Pendidikan
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={userProfile.educationLevel || "undergraduate"}
                                                onChange={(e) => handleProfileUpdate("educationLevel", e.target.value)}
                                                onFocus={() => setFocusedField("educationLevel")}
                                                onBlur={() => setFocusedField(null)}
                                                className="w-full bg-white dark:bg-[#1a1a24] border border-[#e5e7eb] dark:border-white/10 rounded-lg py-2 pl-3 pr-10 text-[#1a1a2e] dark:text-white text-[0.82rem] outline-none focus:border-[#2563eb] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#2563eb]/10 transition-all duration-200 appearance-none cursor-pointer"
                                            >
                                                <option value="high_school">Sekolah Menengah (SMA)</option>
                                                <option value="undergraduate">Diploma / Sarjana (S1)</option>
                                                <option value="graduate">Pascasarjana (S2/S3)</option>
                                            </select>
                                            <ChevronDown
                                                size={16}
                                                className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${focusedField === "educationLevel" ? "rotate-180 text-[#2563eb]" : "text-[#9ca3af]"}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[0.8rem] font-semibold text-slate-500 dark:text-white/60">
                                            Gaya Penjelasan
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={userProfile.explanationStyle || "concise"}
                                                onChange={(e) => handleProfileUpdate("explanationStyle", e.target.value)}
                                                onFocus={() => setFocusedField("explanationStyle")}
                                                onBlur={() => setFocusedField(null)}
                                                className="w-full bg-white dark:bg-[#1a1a24] border border-[#e5e7eb] dark:border-white/10 rounded-lg py-2 pl-3 pr-10 text-[#1a1a2e] dark:text-white text-[0.82rem] outline-none focus:border-[#2563eb] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#2563eb]/10 transition-all duration-200 appearance-none cursor-pointer"
                                            >
                                                <option value="concise">Ringkas & To-the-point</option>
                                                <option value="detailed">Lengkap & Komprehensif</option>
                                                <option value="step_by_step">Step by Step (Tahapan)</option>
                                                <option value="analogy">Analogi & Cerita</option>
                                            </select>
                                            <ChevronDown
                                                size={16}
                                                className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${focusedField === "explanationStyle" ? "rotate-180 text-[#2563eb]" : "text-[#9ca3af]"}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[0.8rem] font-semibold text-slate-500 dark:text-white/60">
                                            Tingkat Kesulitan
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={userProfile.difficultyPreference || "medium"}
                                                onChange={(e) => handleProfileUpdate("difficultyPreference", e.target.value)}
                                                onFocus={() => setFocusedField("difficultyPreference")}
                                                onBlur={() => setFocusedField(null)}
                                                className="w-full bg-white dark:bg-[#1a1a24] border border-[#e5e7eb] dark:border-white/10 rounded-lg py-2 pl-3 pr-10 text-[#1a1a2e] dark:text-white text-[0.82rem] outline-none focus:border-[#2563eb] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#2563eb]/10 transition-all duration-200 appearance-none cursor-pointer"
                                            >
                                                <option value="easy">Santai / Pemula</option>
                                                <option value="medium">Standar / Menengah</option>
                                                <option value="hard">Tantangan / Lanjut</option>
                                                <option value="adaptive">Adaptif (AI-Powered)</option>
                                            </select>
                                            <ChevronDown
                                                size={16}
                                                className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${focusedField === "difficultyPreference" ? "rotate-180 text-[#2563eb]" : "text-[#9ca3af]"}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[0.8rem] font-semibold text-slate-500 dark:text-white/60">
                                            Kecepatan Belajar
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={userProfile.pace || "medium"}
                                                onChange={(e) => handleProfileUpdate("pace", e.target.value)}
                                                onFocus={() => setFocusedField("pace")}
                                                onBlur={() => setFocusedField(null)}
                                                className="w-full bg-white dark:bg-[#1a1a24] border border-[#e5e7eb] dark:border-white/10 rounded-lg py-2 pl-3 pr-10 text-[#1a1a2e] dark:text-white text-[0.82rem] outline-none focus:border-[#2563eb] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#2563eb]/10 transition-all duration-200 appearance-none cursor-pointer"
                                            >
                                                <option value="slow">Perlahan (Slow)</option>
                                                <option value="medium">Sedang (Medium)</option>
                                                <option value="fast">Cepat (Fast)</option>
                                            </select>
                                            <ChevronDown
                                                size={16}
                                                className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${focusedField === "pace" ? "rotate-180 text-[#2563eb]" : "text-[#9ca3af]"}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 border-t border-[#e5e7eb] dark:border-white/10 pt-4 col-span-1 md:col-span-2">
                                        <label className="text-[0.8rem] font-semibold text-slate-500 dark:text-white/60">
                                            Mata Pelajaran Favorit
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {SUBJECTS.map((sub) => {
                                                const isSelected = (userProfile.favouriteSubjects || []).includes(sub);
                                                return (
                                                    <button
                                                        key={sub}
                                                        onClick={() => {
                                                            const current = userProfile.favouriteSubjects || [];
                                                            const next = isSelected
                                                                ? current.filter((s) => s !== sub)
                                                                : [...current, sub];
                                                            handleProfileUpdate("favouriteSubjects", next);
                                                        }}
                                                        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                                                            isSelected
                                                                ? "bg-[#2563eb] border-[#2563eb] text-white shadow-sm"
                                                                : "bg-white dark:bg-[#1a1a24] border-[#e5e7eb] dark:border-white/10 text-[#6b7280] dark:text-white/60 hover:border-[#2563eb] dark:hover:border-blue-500 hover:text-[#2563eb] dark:hover:text-blue-400"
                                                        }`}
                                                    >
                                                        {isSelected && <span className="text-xs">✓</span>}
                                                        <span>{sub}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[0.8rem] font-semibold uppercase tracking-wider text-[#9ca3af]">
                                Tema Tampilan
                            </h3>
                            <div className="flex gap-3">
                                <button
                                    className={`flex flex-col items-center gap-2 py-3 px-6 rounded-xl border-2 border-[#e5e7eb] dark:border-white/10 bg-white dark:bg-[#121218] cursor-pointer text-[0.85rem] font-medium text-[#6b7280] dark:text-white/60 transition-all duration-200 hover:border-[#2563eb]/50 ${theme === "light" ? "border-[#2563eb] dark:border-blue-500 text-[#2563eb] dark:text-blue-400" : ""}`}
                                    onClick={() => setTheme("light")}
                                >
                                    <span className="w-12 h-8 rounded-md border border-[#e5e7eb] dark:border-white/10 bg-[#f8f7f4]" />
                                    <span>Light</span>
                                </button>
                                <button
                                    className={`flex flex-col items-center gap-2 py-3 px-6 rounded-xl border-2 border-[#e5e7eb] dark:border-white/10 bg-white dark:bg-[#121218] cursor-pointer text-[0.85rem] font-medium text-[#6b7280] dark:text-white/60 transition-all duration-200 hover:border-[#2563eb]/50 ${theme === "dark" ? "border-[#2563eb] dark:border-blue-500 text-[#2563eb] dark:text-blue-400" : ""}`}
                                    onClick={() => setTheme("dark")}
                                >
                                    <span className="w-12 h-8 rounded-md border border-[#e5e7eb] dark:border-white/10 bg-[#0a0a0f]" />
                                    <span>Dark</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[0.8rem] font-semibold uppercase tracking-wider text-[#9ca3af]">
                                Akun
                            </h3>
                            <button
                                className="py-3 px-6 rounded-lg border border-[#fecaca] bg-[#fff5f5] dark:bg-red-950/20 text-[#ef4444] text-[0.875rem] font-semibold cursor-pointer transition-all duration-200 text-left w-fit hover:bg-[#fee2e2] dark:hover:bg-red-900/30 flex items-center gap-2"
                                onClick={logout}
                            >
                                <LogOut size={16} />
                                Keluar dari EduAssist
                            </button>
                        </div>
                    </div>
                )}

                {activeMenu === "chat" && (
                    <>
                        {isNewChat ? (
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
                                <div className="flex items-end gap-2 bg-white dark:bg-[#121218] border border-[#e5e7eb] dark:border-white/10 rounded-xl p-2.5 pl-4 transition-all duration-200 w-full shadow-md focus-within:border-[#2563eb] dark:focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-[#2563eb]/10 dark:focus-within:ring-blue-500/10 max-w-[600px]">
                                    <textarea
                                        ref={inputRef}
                                        className="flex-1 bg-transparent border-none outline-none text-[#1a1a2e] dark:text-white text-[0.9rem] resize-none leading-relaxed max-h-[120px] overflow-y-auto placeholder-[#c4cad4] dark:placeholder-white/30"
                                        placeholder="Tanya apa saja..."
                                        value={input}
                                        onChange={(e) =>
                                            setInput(e.target.value)
                                        }
                                        onKeyDown={handleKeyDown}
                                        rows={1}
                                    />
                                    <button
                                        className={`w-8 h-8 rounded-lg border-none bg-[#e5e7eb] dark:bg-white/10 text-[#9ca3af] dark:text-white/40 text-[1.1rem] cursor-pointer flex items-center justify-center shrink-0 transition-all duration-200 ${input.trim() ? "bg-[#2563eb] dark:bg-blue-500 text-white dark:text-white hover:opacity-90" : ""}`}
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                    >
                                        ↑
                                    </button>
                                </div>
                                <div className="flex gap-2.5 flex-wrap justify-center">
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={s.label}
                                            className="flex items-center gap-1.5 py-2 px-4 rounded-full border border-[#e5e7eb] dark:border-white/10 bg-white dark:bg-[#121218] text-[#6b7280] dark:text-white/60 text-[0.82rem] cursor-pointer transition-all duration-200 shadow-sm hover:bg-[#eff6ff] dark:hover:bg-white/5 hover:border-[#2563eb] dark:hover:border-blue-500 hover:text-[#2563eb] dark:hover:text-blue-400"
                                            onClick={() =>
                                                handleSuggestion(s.label)
                                            }
                                        >
                                            <span className="shrink-0">
                                                {s.icon}
                                            </span>
                                            <span>{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto py-8 px-6 flex flex-col gap-5 scrollbar-thin">
                                    {messages.map((msg, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-end gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}
                                        >
                                            {msg.role === "assistant" && (
                                                <div className="w-7 h-7 rounded-full bg-[#2563eb] flex items-center justify-center text-[0.65rem] font-bold text-white shrink-0">
                                                    EA
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[65%] py-3 px-4 rounded-2xl text-[0.875rem] leading-relaxed ${msg.role === "user" ? "bg-[#2563eb] text-white rounded-br-[4px]" : "bg-white dark:bg-[#121218] text-[#374151] dark:text-white/95 rounded-bl-[4px] border border-[#e5e7eb] dark:border-white/10 shadow-sm"}`}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex items-end gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-[#2563eb] flex items-center justify-center text-[0.65rem] font-bold text-white shrink-0">
                                                EA
                                            </div>
                                            <div className="max-w-[65%] py-3 px-4 rounded-2xl text-[0.875rem] leading-relaxed bg-white dark:bg-[#121218] text-[#374151] rounded-bl-[4px] border border-[#e5e7eb] dark:border-white/10 shadow-sm flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce" />
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce [animation-delay:0.2s]" />
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="py-4 px-6 pb-5 border-t border-[#e5e7eb] dark:border-white/10 bg-[#f8f7f4] dark:bg-[#0a0a0f]">
                                    <div className="flex items-end gap-2 bg-white dark:bg-[#121218] border border-[#e5e7eb] dark:border-white/10 rounded-xl p-2.5 pl-4 transition-all duration-200 w-full shadow-md focus-within:border-[#2563eb] dark:focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-[#2563eb]/10 dark:focus-within:ring-blue-500/10">
                                        <textarea
                                            ref={inputRef}
                                            className="flex-1 bg-transparent border-none outline-none text-[#1a1a2e] dark:text-white text-[0.9rem] resize-none leading-relaxed max-h-[120px] overflow-y-auto placeholder-[#c4cad4] dark:placeholder-white/30"
                                            placeholder="Lanjutkan percakapan..."
                                            value={input}
                                            onChange={(e) =>
                                                setInput(e.target.value)
                                            }
                                            onKeyDown={handleKeyDown}
                                            rows={1}
                                        />
                                        <button
                                            className={`w-8 h-8 rounded-lg border-none bg-[#e5e7eb] dark:bg-white/10 text-[#9ca3af] dark:text-white/40 text-[1.1rem] cursor-pointer flex items-center justify-center shrink-0 transition-all duration-200 ${input.trim() ? "bg-[#2563eb] dark:bg-blue-500 text-white dark:text-white hover:opacity-90" : ""}`}
                                            onClick={handleSend}
                                            disabled={
                                                !input.trim() || isLoading
                                            }
                                        >
                                            ↑
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default ChatPage;
