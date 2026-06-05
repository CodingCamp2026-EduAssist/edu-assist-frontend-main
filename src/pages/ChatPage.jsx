import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sendMessage, getChatHistory, streamMessage } from "../services/api";
import {
    getChatSessionStorageKey,
    getGuestSessionIdForChatRequest,
} from "../services/chatSessionIdentity";
import { useProfileStore } from "@/store/profile-store";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { useSSE } from "@/hooks/useSSE";
import { Brain, ChevronDown, ChevronRight, Loader, Sparkles } from "lucide-react";

// Collapsible thinking block shown while AI is reasoning
function ThinkingBlock({ content, isActive }) {
    const [expanded, setExpanded] = useState(false);
    const contentRef = useRef(null);

    // Auto-scroll the thinking content to the bottom while streaming
    useEffect(() => {
        if (expanded && contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [content, expanded]);

    if (!content && !isActive) return null;

    return (
        <div
            className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-60"}`}
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0 mb-1 group"
            >
                <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.75rem] font-medium transition-all duration-200 ${isActive ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" : "bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/40"}`}
                >
                    {isActive ? (
                        <Sparkles size={12} className="animate-pulse" />
                    ) : (
                        <Brain size={12} />
                    )}
                    <span>{isActive ? "Thinking..." : "Thought process"}</span>
                    {expanded ? (
                        <ChevronDown size={12} />
                    ) : (
                        <ChevronRight size={12} />
                    )}
                </div>
            </button>
            {expanded && content && (
                <div
                    ref={contentRef}
                    className="ml-1 pl-3 border-l-2 border-amber-200 dark:border-amber-800/40 max-h-[200px] overflow-y-auto scrollbar-thin"
                >
                    <p className="text-[0.78rem] leading-relaxed text-slate-400 dark:text-white/35 italic whitespace-pre-wrap">
                        {content}
                    </p>
                </div>
            )}
        </div>
    );
}

// Helper components for custom Markdown rendering
function Markdown({ content }) {
    if (!content) return null;

    // Split content by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="prose dark:prose-invert max-w-none text-[0.875rem] leading-relaxed space-y-2">
            {parts.map((part, index) => {
                if (part.startsWith("```") && part.endsWith("```")) {
                    // Code block
                    const lines = part.slice(3, -3).trim().split("\n");
                    let language = "";
                    if (
                        lines.length > 0 &&
                        !lines[0].includes(" ") &&
                        lines[0].length < 15
                    ) {
                        language = lines.shift();
                    }
                    const code = lines.join("\n");
                    return (
                        <div
                            key={index}
                            className="my-3 rounded-lg overflow-hidden border border-[#e5e7eb] dark:border-white/10 shadow-sm"
                        >
                            {language && (
                                <div className="bg-[#f3f4f6] dark:bg-[#1e1e2a] px-4 py-1.5 text-[0.7rem] font-semibold text-slate-500 dark:text-slate-400 border-b border-[#e5e7eb] dark:border-white/10 uppercase">
                                    {language}
                                </div>
                            )}
                            <pre className="bg-[#f9fafb] dark:bg-[#1a1a24] p-4 overflow-x-auto text-[0.8rem] font-mono text-[#374151] dark:text-white/90">
                                <code>{code}</code>
                            </pre>
                        </div>
                    );
                } else {
                    // Inline elements & blocks
                    const lines = part.split("\n");
                    return lines.map((line, lineIdx) => {
                        let trimmed = line.trim();

                        // Headings
                        if (trimmed.startsWith("### ")) {
                            return (
                                <h3
                                    key={`${index}-${lineIdx}`}
                                    className="text-sm font-bold text-[#1a1a2e] dark:text-white mt-3 mb-1"
                                >
                                    {trimmed.slice(4)}
                                </h3>
                            );
                        }
                        if (trimmed.startsWith("## ")) {
                            return (
                                <h2
                                    key={`${index}-${lineIdx}`}
                                    className="text-base font-bold text-[#1a1a2e] dark:text-white mt-4 mb-2"
                                >
                                    {trimmed.slice(3)}
                                </h2>
                            );
                        }
                        if (trimmed.startsWith("# ")) {
                            return (
                                <h1
                                    key={`${index}-${lineIdx}`}
                                    className="text-lg font-bold text-[#1a1a2e] dark:text-white mt-4 mb-2"
                                >
                                    {trimmed.slice(2)}
                                </h1>
                            );
                        }

                        // Lists
                        if (
                            trimmed.startsWith("- ") ||
                            trimmed.startsWith("* ")
                        ) {
                            return (
                                <ul
                                    key={`${index}-${lineIdx}`}
                                    className="list-disc pl-5 my-1 text-[#374151] dark:text-white/90"
                                >
                                    <li>{renderInline(trimmed.slice(2))}</li>
                                </ul>
                            );
                        }

                        const matchNumbered = trimmed.match(/^(\d+)\.\s(.*)/);
                        if (matchNumbered) {
                            return (
                                <ol
                                    key={`${index}-${lineIdx}`}
                                    className="list-decimal pl-5 my-1 text-[#374151] dark:text-white/90"
                                >
                                    <li value={parseInt(matchNumbered[1], 10)}>
                                        {renderInline(matchNumbered[2])}
                                    </li>
                                </ol>
                            );
                        }

                        // Empty line
                        if (!trimmed) {
                            return (
                                <div
                                    key={`${index}-${lineIdx}`}
                                    className="h-2"
                                />
                            );
                        }

                        // Regular paragraph
                        return (
                            <p
                                key={`${index}-${lineIdx}`}
                                className="my-1 text-[#374151] dark:text-white/90"
                            >
                                {renderInline(line)}
                            </p>
                        );
                    });
                }
            })}
        </div>
    );
}

function renderInline(text) {
    if (!text) return "";

    // Split by inline code first
    const parts = text.split(/(`[^`]+`)/g);

    return parts.map((part, idx) => {
        if (part.startsWith("`") && part.endsWith("`")) {
            return (
                <code
                    key={idx}
                    className="bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded text-[0.8rem] font-mono text-[#e06c75]"
                >
                    {part.slice(1, -1)}
                </code>
            );
        }

        // Handle bold (**text**)
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith("**") && bPart.endsWith("**")) {
                return (
                    <strong
                        key={bIdx}
                        className="font-bold text-[#1a1a2e] dark:text-white"
                    >
                        {bPart.slice(2, -2)}
                    </strong>
                );
            }
            return bPart;
        });
    });
}

export default function ChatPage() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);
    const [thinkingContent, setThinkingContent] = useState("");
    const [isThinking, setIsThinking] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const userProfile = useProfileStore((state) => state.userProfiles) || {};
    const { saveChatToHistory, loadSessions } = useChatStore();

    const { isConnected, error, data, connect } = useSSE(
        `/api/v1/chat/sessions/${sessionId}/messages`,
    );

    useEffect(() => {
        if (isConnected && data) {
            setMessages(data.messages);
        }
    }, [isConnected, data]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Send message and handle SSE response stream
    async function sendAndStreamMessage(content) {
        setIsLoading(true);
        setThinkingContent("");
        setIsThinking(false);

        let assistantResponse = "";
        let thinkingBuffer = "";
        let hasStartedText = false;

        const handleChunk = (parsed) => {
            const eventType = parsed.type || "text";
            const text = parsed.content || parsed.text || "";

            if (eventType === "thinking") {
                if (!hasStartedText) {
                    thinkingBuffer += text;
                    setIsThinking(true);
                    setThinkingContent(thinkingBuffer);
                }
                return;
            }

            // type === "text"
            if (!hasStartedText) {
                hasStartedText = true;
                setIsThinking(false);
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "" },
                ]);
            }

            assistantResponse += text;

            setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                        ...last,
                        content: assistantResponse,
                    };
                }
                return updated;
            });
        };

        const handleDone = () => {
            if (!hasStartedText) setIsThinking(false);
            setThinkingContent("");
            setMessages((prev) => {
                saveChatToHistory(prev);
                return prev;
            });
        };

        const handleError = (message) => {
            setIsThinking(false);
            setThinkingContent("");
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `Error: ${message}` },
            ]);
        };

        try {
            await streamMessage(sessionId, content, {
                onChunk: handleChunk,
                onDone: handleDone,
                onError: handleError,
            });
        } catch (err) {
            console.error("Gagal mengirim pesan:", err);
            handleError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    const fetchedSessionId = useRef(null);

    // Load Chat History
    useEffect(() => {
        if (!sessionId) return;
        if (fetchedSessionId.current === sessionId) return;
        fetchedSessionId.current = sessionId;

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
                const pendingMsg = sessionStorage.getItem(
                    `pending_msg_${sessionId}`,
                );

                if (pendingMsg) {
                    sessionStorage.removeItem(`pending_msg_${sessionId}`);

                    // Add user pending message
                    const userMsg = { role: "user", content: pendingMsg };

                    // We check if formattedMessages already has it to avoid duplicates,
                    // but we ensure the UI updates with the user message immediately.
                    const isDuplicate =
                        formattedMessages.length > 0 &&
                        formattedMessages[formattedMessages.length - 1]
                            .content === pendingMsg;
                    if (!isDuplicate) {
                        setMessages([...formattedMessages, userMsg]);
                    } else {
                        setMessages(formattedMessages);
                    }

                    // Stop the loading indicator so the user message can render immediately
                    setIsFetchingHistory(false);

                    // Start streaming without blocking the UI
                    sendAndStreamMessage(pendingMsg).catch(console.error);
                } else {
                    setMessages(formattedMessages);
                    setIsFetchingHistory(false);
                }
            } catch (err) {
                console.error("Gagal memuat history chat:", err);
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

        await sendAndStreamMessage(userMsg.content);
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
                    <div className="flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <p className="text-[0.875rem] font-semibold text-[#6b7280] dark:text-white/60 mt-2">
                        Memuat percakapan...
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto py-8 px-6 flex flex-col gap-6 scrollbar-thin">
                        {/* Thinking indicator */}
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={
                                        msg.role === "user"
                                            ? "max-w-[70%] py-3 px-4 rounded-2xl text-[0.875rem] leading-relaxed bg-[#2563eb] text-white rounded-br-[4px] shadow-sm"
                                            : "flex-1 max-w-[85%] text-[0.875rem] leading-relaxed dark:text-white/95"
                                    }
                                >
                                    {msg.role === "user" ? (
                                        msg.content
                                    ) : (
                                        <Markdown content={msg.content} />
                                    )}
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex gap-3 w-full justify-start">
                                <div className="flex-1 max-w-[85%]">
                                    <ThinkingBlock
                                        content={thinkingContent}
                                        isActive={isThinking}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Loading dots shown before any response starts */}
                        {isLoading &&
                            !isThinking &&
                            !thinkingContent &&
                            messages.length > 0 &&
                            messages[messages.length - 1].role === "user" && (
                                <div className="flex gap-3 w-full justify-start">
                                    <div className="flex-1 max-w-[85%] text-[0.875rem] leading-relaxed flex items-center gap-1.5 py-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] dark:bg-white/40 animate-bounce" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] dark:bg-white/40 animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] dark:bg-white/40 animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="py-4 px-6 pb-5 border-t border-[#e5e7eb] dark:border-white/10 bg-[#f8f7f4] dark:bg-[#0a0a0f]">
                        <div className="flex items-center gap-2 bg-white dark:bg-[#121218] border border-[#e5e7eb] dark:border-white/10 rounded-xl p-2.5 pl-4 transition-all duration-200 w-full shadow-md focus-within:border-[#2563eb] dark:focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-[#2563eb]/10 dark:focus-within:ring-blue-500/10">
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
                                className={`w-8 h-8 rounded-lg border-none text-[#9ca3af] dark:text-white/40 text-[1.1rem] cursor-pointer flex items-center justify-center shrink-0 transition-all duration-200 ${input.trim() ? "bg-[#2563eb] dark:bg-blue-500 text-white dark:text-white hover:opacity-90" : "bg-gray-200 dark:bg-white/10"}`}
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
                </>
            )}
        </div>
    );
}
