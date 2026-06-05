import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    BookOpen,
    FileText,
    Brain,
    Search,
    Paperclip,
    Loader2,
    Loader,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useProfileStore } from "@/store/profile-store";
import { useChatStore } from "@/store/chat-store";
import { useSourcesStore } from "@/store/sources-store";
import { createChatSession } from "../services/api";
import {
    getChatSessionStorageKey,
    getOrCreateGuestSessionId,
    isAuthenticatedUser,
} from "../services/chatSessionIdentity";
import { toast } from "sonner";

const SUGGESTIONS = [
    { icon: <BookOpen size={18} />, label: "Bantu belajar" },
    { icon: <FileText size={18} />, label: "Rangkumin materi" },
    { icon: <Brain size={18} />, label: "Latihan soal" },
    { icon: <Search size={18} />, label: "Jelaskan konsep" },
];

export default function InitialChatPage() {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const user = useAuthStore((state) => state.user);
    const userProfile = useProfileStore((state) => state.userProfiles) || {};
    const { loadSessions } = useChatStore();
    const { sources, handleFileUpload, deleteSource, selectedPaths } =
        useSourcesStore();

    async function handleSend() {
        if (!input.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const session = await createChatSession({
                title: input.trim(),
                initialContext: input.trim(),
                linkedDocumentPaths: selectedPaths || [],
            });

            // Fetch list in sidebar
            await loadSessions();

            // Set pending message so ChatPage can send & stream it after navigating
            sessionStorage.setItem(
                `pending_msg_${session.conversationId}`,
                input.trim(),
            );

            // Navigate to the conversation page
            navigate(`/chat/${session.conversationId}`);
        } catch (err) {
            console.error("Gagal memulai chat:", err);
            toast.error(`Gagal memulai chat: ${err.message}`);
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

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const pdfFiles = files.filter((file) =>
            file.name.toLowerCase().endsWith(".pdf"),
        );
        if (pdfFiles.length === 0) {
            toast.error("Hanya file PDF yang diperbolehkan!");
            return;
        }
        if (pdfFiles.length < files.length) {
            toast.warning("Beberapa file diabaikan karena bukan PDF.");
        }
        const validFiles = pdfFiles.filter((file) => {
            if (file.size > 2 * 1024 * 1024) {
                toast.error(`File "${file.name}" melebihi batas ukuran 2MB!`);
                return false;
            }
            return true;
        });
        validFiles.forEach((file) => {
            handleFileUpload(file);
        });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;
        const pdfFiles = files.filter((file) =>
            file.name.toLowerCase().endsWith(".pdf"),
        );
        if (pdfFiles.length === 0) {
            toast.error("Hanya file PDF yang diperbolehkan!");
            return;
        }
        if (pdfFiles.length < files.length) {
            toast.warning("Beberapa file diabaikan karena bukan PDF.");
        }
        const validFiles = pdfFiles.filter((file) => {
            if (file.size > 2 * 1024 * 1024) {
                toast.error(`File "${file.name}" melebihi batas ukuran 2MB!`);
                return false;
            }
            return true;
        });
        validFiles.forEach((file) => {
            handleFileUpload(file);
        });
    };

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

            <div className="flex flex-col gap-2 w-full max-w-[600px]">
                {/* Uploaded File Chips */}
                {sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1 w-full justify-start">
                        {sources.map((source) => (
                            <div
                                key={source.id}
                                className={`flex items-center gap-1.5 bg-white dark:bg-[#121218] border rounded-lg px-2.5 py-1 text-[0.75rem] shadow-sm transition-all duration-200 ${source.status === "uploading" ? "border-blue-400 dark:border-blue-500/50 text-blue-600 dark:text-blue-400" : "border-[#e5e7eb] dark:border-white/10 text-[#374151] dark:text-white/90"}`}
                            >
                                {source.status === "uploading" ? (
                                    <Loader2
                                        size={12}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <FileText
                                        size={12}
                                        className="text-blue-500"
                                    />
                                )}
                                <span className="max-w-[120px] truncate font-medium">
                                    {source.fileName}
                                </span>
                                {source.status === "uploading" ? (
                                    <span className="text-[0.62rem] font-bold animate-pulse">
                                        Uploading
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => deleteSource(source.id)}
                                        className="bg-transparent border-none text-[#ef4444] cursor-pointer hover:text-red-600 font-bold ml-1 text-[0.8rem] flex items-center justify-center"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Input Container */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex items-center gap-2 bg-white dark:bg-[#121218] border rounded-xl p-2.5 pl-4 transition-all duration-200 w-full shadow-md focus-within:border-[#2563eb] dark:focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-[#2563eb]/10 dark:focus-within:ring-blue-500/10 ${dragOver ? "border-[#2563eb] dark:border-blue-500 bg-[#eff6ff]/30 dark:bg-blue-950/10" : "border-[#e5e7eb] dark:border-white/10"}`}
                >
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-transparent border-none text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1 rounded-md transition-colors duration-200 flex items-center justify-center shrink-0 hover:bg-slate-100 dark:hover:bg-white/5"
                        title="Upload PDF (Maks 2MB)"
                    >
                        <Paperclip size={18} />
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    <textarea
                        ref={inputRef}
                        className="flex-1 bg-transparent border-none outline-none text-[#1a1a2e] dark:text-white text-[0.9rem] resize-none leading-relaxed max-h-[120px] overflow-y-auto placeholder-[#c4cad4] dark:placeholder-white/30"
                        placeholder={
                            dragOver
                                ? "Lepaskan PDF di sini..."
                                : "Tanya apa saja..."
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        className={`w-8 h-8 rounded-lg border-none dark:bg-white/10 text-white dark:text-white/40 text-[1.1rem] cursor-pointer flex items-center justify-center shrink-0 transition-all duration-200 ${input.trim() ? "bg-[#2563eb] dark:text-blue-400 hover:opacity-90" : "bg-gray-200"}`}
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                    >
                        {isLoading ? (
                            <Loader className="animate-spin"></Loader>
                        ) : (
                            "↑"
                        )}
                    </button>
                </div>
            </div>

            <div className="flex gap-2.5 flex-wrap justify-center">
                {SUGGESTIONS.map((s) => (
                    <button
                        key={s.label}
                        className="flex items-center gap-1.5 py-2 px-4 rounded-full border border-[#e5e7eb] dark:border-white/10 bg-white dark:bg-[#121218] text-[#6b7280] dark:text-white/60 text-[0.82rem] cursor-pointer transition-all duration-200 shadow-sm hover:bg-[#eff6ff] dark:hover:bg-white/5 hover:border-[#2563eb] hover:border-blue-500 hover:text-[#2563eb] dark:hover:text-blue-400"
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
