import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sendMessage, getChatHistory } from "../services/api";
import {
    getChatSessionStorageKey,
    getGuestSessionIdForChatRequest,
} from "../services/chatSessionIdentity";
import { useProfileStore } from "@/store/profile-store";
import { useChatStore } from "@/store/chat-store";

export default function ChatPage() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const userProfile = useProfileStore((state) => state.userProfiles) || {};
    const { saveChatToHistory, loadSessions } = useChatStore();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Load Chat History
    useEffect(() => {
        if (!sessionId) return;

        async function fetchHistory() {
            setIsFetchingHistory(true);
            try {
                const guestSessionId = getGuestSessionIdForChatRequest();
                const data = await getChatHistory(sessionId, guestSessionId);
                const formattedMessages = (data.messages || []).map((msg) => ({
                    role: msg.role === "user" ? "user" : "assistant",
                    content: msg.content,
                }));
                
                // If there's an initial message stored from InitialChatPage, send it first
                const pendingMsg = sessionStorage.getItem(`pending_msg_${sessionId}`);
                if (pendingMsg) {
                    sessionStorage.removeItem(`pending_msg_${sessionId}`);
                    
                    // Add user pending message
                    const userMsg = { role: "user", content: pendingMsg };
                    setMessages([...formattedMessages, userMsg]);
                    setIsLoading(true);

                    // Send the message to RAG api
                    const result = await sendMessage(sessionId, pendingMsg);
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
                    setIsLoading(false);
                } else {
                    setMessages(formattedMessages);
                }
            } catch (err) {
                console.error("Gagal memuat history chat:", err);
            } finally {
                setIsFetchingHistory(false);
            }
        }

        fetchHistory();
    }, [sessionId]);

    async function handleSend() {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: "user", content: input.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
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

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            {isFetchingHistory ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-bounce [animation-delay:0.4s]" />
                    <p className="text-[0.875rem] font-semibold text-[#6b7280] dark:text-white/60 mt-2">
                        Memuat percakapan...
                    </p>
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
                                onChange={(e) => setInput(e.target.value)}
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
                    </div>
                </>
            )}
        </div>
    );
}
