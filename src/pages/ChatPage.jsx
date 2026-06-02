import { useState, useRef, useEffect } from "react";
import {
    sendMessage,
    createChatSession,
    uploadFile,
    uploadURL,
    uploadDrive,
    uploadText,
    listChatSessions,
    getChatHistory,
    logout,
} from "../services/api";
import {
    clearGuestChatState,
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
    MessageCircle,
    History,
    Settings,
    Globe,
    ClipboardList,
    Plus,
    X,
    MessageSquare,
    Loader2,
    Menu,
    FolderOpen,
    LogOut,
    SquarePen,
    ChevronDown,
} from "lucide-react";

import { SiGoogledrive } from "react-icons/si";
import { useProfileStore } from "@/store/profile-store";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

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

const SOURCE_TYPES = [
    {
        id: "file",
        icon: <FileText size={18} />,
        label: "Upload File",
        desc: "PDF, DOCX, TXT",
    },

    {
        id: "drive",
        icon: <SiGoogledrive size={18} />,
        label: "Google Drive",
        desc: "Paste link Drive",
    },

    {
        id: "url",
        icon: <Globe size={18} />,
        label: "Website URL",
        desc: "Paste link website",
    },

    {
        id: "text",
        icon: <ClipboardList size={18} />,
        label: "Copied Text",
        desc: "Paste teks langsung",
    },
];

const SOURCE_ICONS = {
    file: <FileText size={20} className="text-blue-500" />,
    drive: <SiGoogledrive size={20} className="text-green-600" />,
    url: <Globe size={20} className="text-indigo-500" />,
    text: <ClipboardList size={20} className="text-orange-500" />,
};

function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeMenu, setActiveMenu] = useState("chat");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sources, setSources] = useState([]);
    const [showAddSource, setShowAddSource] = useState(false);
    const [activeSourceType, setActiveSourceType] = useState("file");
    const [sourceInput, setSourceInput] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [theme, setTheme] = useState("light");
    const [focusedField, setFocusedField] = useState(null);
    const [sessionsList, setSessionsList] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [chatHistory, setChatHistory] = useState(() => {
        const saved = localStorage.getItem("eduAssistHistory");
        return saved ? JSON.parse(saved) : [];
    });

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    const navigate = useNavigate();

    const accessToken = useAuthStore((state) => state.accessToken);

    useEffect(() => {
        if (!accessToken) {
            navigate("/login");
        }
    }, [accessToken]);

    const user = useAuthStore((state) => state.user);
    const userProfile = useProfileStore((state) => state.userProfiles);
    const updateUserProfile = useProfileStore((state) => state.updateUserProfile);

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
        // async function loadSessions() {
        //   try {
        //     const guestSessionId = getGuestSessionIdForChatRequest()
        //     const data = await listChatSessions(guestSessionId)
        //     setSessionsList(data.sessions || [])
        //   } catch (err) {
        //     console.log('Gagal load sessions:', err.message)
        //   }
        // }
        // loadSessions()
    }, []);

    function saveChatToHistory(currentMessages) {
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
        const updatedHistory = [
            newHistoryItem,
            ...chatHistory.filter((h) => h.title !== title),
        ];
        setChatHistory(updatedHistory);
        localStorage.setItem(
            "eduAssistHistory",
            JSON.stringify(updatedHistory),
        );
    }

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

            console.log("Authenticated user ID:", user.id);
            console.log("Guest Session ID for Chat Request:", guestSessionId);

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

                const data = await listChatSessions(guestSessionId);
                setSessionsList(data.sessions || []);
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

    function addSource(source) {
        setSources((prev) => [...prev, source]);
        setShowAddSource(false);
        setSourceInput("");
    }

    async function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
        const tempId = Date.now();
        setSources((prev) => [
            ...prev,
            {
                id: tempId,
                type: "file",
                name: file.name,
                meta: "Uploading...",
            },
        ]);
        setShowAddSource(false);
        try {
            await uploadFile(file, profile.userId || "guest");
            setSources((prev) =>
                prev.map((s) =>
                    s.id === tempId
                        ? { ...s, meta: `${(file.size / 1024).toFixed(1)} KB` }
                        : s,
                ),
            );
        } catch (err) {
            setSources((prev) => prev.filter((s) => s.id !== tempId));
            alert(`Upload gagal: ${err.message}`);
        }
    }

    async function handleAddSourceInput() {
        if (!sourceInput.trim()) return;
        const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
        const userId = profile.userId || "guest";
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
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const tempId = Date.now();
        setSources((prev) => [
            ...prev,
            {
                id: tempId,
                type: "file",
                name: file.name,
                meta: "Uploading...",
            },
        ]);
        setShowAddSource(false);
        const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
        uploadFile(file, profile.userId || "guest")
            .then(() =>
                setSources((prev) =>
                    prev.map((s) =>
                        s.id === tempId
                            ? {
                                  ...s,
                                  meta: `${(file.size / 1024).toFixed(1)} KB`,
                              }
                            : s,
                    ),
                ),
            )
            .catch((err) => {
                setSources((prev) => prev.filter((s) => s.id !== tempId));
                alert(`Upload gagal: ${err.message}`);
            });
    }

    function deleteSource(id) {
        setSources((prev) => prev.filter((s) => s.id !== id));
    }

    return (
        <div
            className={`flex h-screen bg-[#f8f7f4] text-[#1a1a2e] font-sans overflow-hidden transition-colors duration-250 ${theme === "dark" ? "dark bg-[#0a0a0f] text-white" : ""}`}
        >
            <aside
                className={`bg-white dark:bg-[#121218] border-r border-[#e5e7eb] dark:border-white/10 flex flex-col py-5 gap-1 transition-all duration-250 overflow-hidden relative z-20 ${sidebarOpen ? "w-[220px] min-w-[220px] px-4 max-[768px]:absolute max-[768px]:h-full" : "w-14 min-w-14 px-0 flex flex-col items-center max-[768px]:w-0 max-[768px]:min-w-0 max-[768px]:p-0"}`}
            >
                <div
                    className={`flex items-center mb-4 ${sidebarOpen ? "justify-between px-2 w-full" : "justify-center w-auto"}`}
                >
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
                <nav
                    className={`flex flex-col gap-0.5 ${sidebarOpen ? "w-full" : "items-center w-auto"}`}
                >
                    {[
                        {
                            id: "chat",
                            icon: <MessageCircle size={18} />,
                            label: "Chat",
                        },
                        {
                            id: "history",
                            icon: <History size={18} />,
                            label: "History",
                        },
                        {
                            id: "settings",
                            icon: <Settings size={18} />,
                            label: "Settings",
                        },
                    ].map((item) => (
                        <button
                            key={item.id}
                            className={`flex items-center rounded-lg border-none bg-transparent text-slate-600 dark:text-white/60 text-[0.85rem] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white ${sidebarOpen ? "gap-3 py-2.5 px-3 text-left w-full" : "w-10 h-10 p-0 justify-center shrink-0"} ${activeMenu === item.id ? "bg-slate-100 dark:bg-white/10 text-[#2563eb] dark:text-blue-400 font-semibold shadow-sm" : ""}`}
                            onClick={() => setActiveMenu(item.id)}
                        >
                            <span className="text-base shrink-0">
                                {item.icon}
                            </span>
                            <span
                                className={`text-[0.85rem] whitespace-nowrap ${sidebarOpen ? "block" : "hidden"}`}
                            >
                                {item.label}
                            </span>
                        </button>
                    ))}
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
                                    onClick={() => loadHistory(session)}
                                >
                                    <MessageSquare
                                        size={14}
                                        className="shrink-0 text-slate-400 dark:text-white/40"
                                    />
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
                                    onClick={() => loadHistory(item)}
                                >
                                    <MessageSquare
                                        size={14}
                                        className="shrink-0 text-slate-400 dark:text-white/40"
                                    />
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
                <div
                    className={`flex items-center border-t border-slate-200 dark:border-white/10 mt-auto cursor-pointer transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/5 ${sidebarOpen ? "gap-3 py-3 px-2 rounded-lg w-full" : "w-10 h-10 p-0 rounded-full justify-center shrink-0 border-t-0"}`}
                >
                    <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[0.75rem] font-bold shrink-0">
                        {initials}
                    </div>
                    <div
                        className={`transition-all duration-200 ${sidebarOpen ? "block" : "hidden"} min-w-0`}
                    >
                        <p className="text-[0.82rem] font-semibold text-slate-800 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
                            {user.name || "User"}
                        </p>
                        <p className="text-[0.72rem] text-slate-500 dark:text-white/45 whitespace-nowrap overflow-hidden text-ellipsis">
                            {userProfile.educationLevel} ·{" "}
                            {userProfile.explanationStyle}
                        </p>
                    </div>
                </div>
            </aside>

            {activeMenu === "chat" && (
                <div className="w-[280px] min-w-[280px] bg-white dark:bg-[#121218] border-r border-[#e5e7eb] dark:border-white/10 flex flex-col py-5 px-4 gap-3 overflow-y-auto max-[900px]:hidden scrollbar-thin">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-[#1a1a2e] dark:text-white">
                            Sources
                        </h2>
                        <span className="bg-[#eff6ff] dark:bg-white/10 text-[#2563eb] dark:text-blue-400 text-[0.72rem] font-semibold py-0.5 px-2 rounded-full">
                            {sources.length}
                        </span>
                        <button
                            className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-[#d1d5db] dark:border-white/20 bg-transparent text-[#6b7280] dark:text-white/60 text-[0.85rem] cursor-pointer transition-all duration-200 w-full hover:border-[#2563eb] hover:text-[#2563eb] hover:bg-[#eff6ff] dark:hover:bg-white/5"
                            onClick={() => setShowAddSource(!showAddSource)}
                        >
                            <Plus size={16} className="shrink-0" />
                            <span>Tambah Sumber</span>
                        </button>
                    </div>
                    {showAddSource && (
                        <div className="flex flex-col gap-2.5 bg-[#f9fafb] dark:bg-[#1a1a24] border border-[#e5e7eb] dark:border-white/10 rounded-xl p-3">
                            <div className="flex gap-1.5">
                                {SOURCE_TYPES.map((t) => (
                                    <button
                                        key={t.id}
                                        className={`flex-1 p-1.5 rounded-lg border border-[#e5e7eb] dark:border-white/10 bg-white dark:bg-[#121218] text-[#6b7280] dark:text-white/60 text-[1rem] cursor-pointer transition-all duration-200 flex items-center justify-center hover:bg-[#f3f4f6] dark:hover:bg-white/5 hover:text-[#1a1a2e] dark:hover:text-white ${activeSourceType === t.id ? "bg-[#eff6ff] dark:bg-blue-900/30 border-[#2563eb] dark:border-blue-500 text-[#2563eb] dark:text-blue-400" : ""}`}
                                        onClick={() =>
                                            setActiveSourceType(t.id)
                                        }
                                    >
                                        {t.icon}
                                    </button>
                                ))}
                            </div>
                            {activeSourceType === "file" && (
                                <div
                                    className={`border border-dashed border-[#d1d5db] dark:border-white/20 rounded-lg p-5 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 text-center bg-white dark:bg-[#121218] hover:border-[#2563eb] hover:bg-[#eff6ff] dark:hover:bg-white/5 ${dragOver ? "border-[#2563eb] bg-[#eff6ff] dark:bg-white/5" : ""}`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOver(true);
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    <FileText
                                        size={32}
                                        className="text-slate-400 mb-1"
                                    />
                                    <p className="text-[0.8rem] text-[#6b7280] dark:text-white/60">
                                        Drop file atau klik untuk upload
                                    </p>
                                    <p className="text-[0.72rem] text-[#9ca3af]">
                                        PDF, DOCX, TXT
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.docx,.txt"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            )}
                            {activeSourceType !== "file" && (
                                <div className="flex flex-col gap-1.5">
                                    <input
                                        className="bg-white dark:bg-[#121218] border border-[#e5e7eb] dark:border-white/10 rounded-lg py-2 px-3 text-[#1a1a2e] dark:text-white text-[0.82rem] outline-none transition-all duration-200 w-full placeholder-[#c4cad4] dark:placeholder-white/30 focus:border-[#2563eb] dark:focus:border-blue-500 focus:ring-3 focus:ring-[#2563eb]/10 dark:focus:ring-blue-500/10"
                                        placeholder={
                                            activeSourceType === "drive"
                                                ? "Paste link Google Drive..."
                                                : activeSourceType === "url"
                                                  ? "Paste URL website..."
                                                  : "Paste teks di sini..."
                                        }
                                        value={sourceInput}
                                        onChange={(e) =>
                                            setSourceInput(e.target.value)
                                        }
                                    />
                                    <button
                                        className="py-2 rounded-lg border-none bg-[#2563eb] text-white text-[0.82rem] font-semibold cursor-pointer transition-all duration-200 hover:opacity-90"
                                        onClick={handleAddSourceInput}
                                    >
                                        Tambah
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {sources.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-center py-8 px-2">
                            <FolderOpen
                                size={40}
                                className="text-slate-300 dark:text-white/20 mb-1"
                            />
                            <p className="text-[0.875rem] font-semibold text-[#6b7280] dark:text-white/60">
                                Belum ada sumber
                            </p>
                            <p className="text-[0.78rem] text-[#9ca3af] dark:text-white/40 leading-relaxed">
                                Tambah file, link, atau teks sebagai konteks RAG
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {sources.map((source) => (
                                <div
                                    key={source.id}
                                    className="bg-[#f9fafb] dark:bg-[#1a1a24] border border-[#e5e7eb] dark:border-white/10 rounded-lg p-3 flex flex-col gap-1.5 relative transition-all duration-200 hover:border-[#2563eb] hover:bg-[#eff6ff] dark:hover:bg-white/5 group"
                                >
                                    <div className="shrink-0">
                                        {SOURCE_ICONS[source.type] || (
                                            <FileText size={20} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[0.75rem] font-medium text-[#1a1a2e] dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">
                                            {source.name}
                                        </p>
                                        <p className="text-[0.68rem] text-[#9ca3af] overflow-hidden text-ellipsis whitespace-nowrap">
                                            {source.meta}
                                        </p>
                                    </div>
                                    <button
                                        className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full border-none bg-[#fee2e2] dark:bg-red-950/50 text-[#ef4444] text-[0.85rem] cursor-pointer hidden group-hover:flex items-center justify-center transition-colors duration-200 hover:bg-[#fecaca] dark:hover:bg-red-900"
                                        onClick={() => deleteSource(source.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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
