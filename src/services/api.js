import apiClient from "./axiosInstance";
import { useAuthStore } from "../store/auth-store";
import { useSourcesStore } from "../store/sources-store";

function guestParams(guestSessionId) {
    return guestSessionId ? { params: { guestSessionId } } : undefined;
}

/* =========================
   AUTH
========================= */
export function loginWithGoogle() {
    const BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        "https://edu-assist-be.onrender.com";
    window.location.href = `${BASE_URL}/api/v1/auth/google`;
}

export async function getMe() {
    return await apiClient.get("/api/v1/auth/me");
}

export async function signOut() {
    try {
        await apiClient.post("/api/v1/auth/logout");
    } catch (error) {
        console.warn("Logout request failed:", error);
    } finally {
        useAuthStore.getState().clearAuthState();
    }
}

export async function logout() {
    await signOut();
    window.location.href = "/login";
}

/* =========================
   CHAT SESSIONS
========================= */

export async function createChatSession(payload = {}) {
    try {
        const body = {
            title: payload.title || "New Chat",
            // attachmentPaths digunakan saat mengirim pesan ke LLM
            // attachmentIds digunakan saat membuat chat session
            linkedDocumentPaths: payload.linkedDocumentPaths || [],
            initialContext: payload.initialContext || "",
        };

        return await apiClient.post("/api/v1/chat/sessions", body);
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Gagal membuat sesi chat",
        );
    }
}

export async function listChatSessions() {
    try {
        return await apiClient.get("/api/v1/chat/sessions");
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Gagal mengambil sesi chat",
        );
    }
}

export async function resumeChatSession(sessionId) {
    try {
        return await apiClient.get(`/api/v1/chat/sessions/${sessionId}`);
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Gagal mengambil sesi chat",
        );
    }
}

export async function getChatHistory(sessionId, guestSessionId = null) {
    try {
        return await apiClient.get(
            `/api/v1/chat/sessions/${sessionId}/messages`,
            guestParams(guestSessionId),
        );
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Gagal mengambil history pesan",
        );
    }
}

const DEFAULT_SEND_MESSAGE_TIMEOUT = 75_000;

export async function sendMessage(
    sessionId,
    content = null,
    requestConfig = {},
) {
    const { timeout = DEFAULT_SEND_MESSAGE_TIMEOUT, ...restConfig } =
        requestConfig;

    try {
        return await apiClient.post(
            `/api/v1/chat/sessions/${sessionId}/messages`,
            {
                content,
                stream: false,
                attachmentPaths: useSourcesStore.getState().selectedPaths || [],
                locale: "en-US",
            },
            { timeout, ...restConfig },
        );
    } catch (error) {
        console.error("Error sending message:", error);
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Gagal mengirim pesan",
        );
    }
}

export async function streamMessage(
    sessionId,
    content = null,
    requestConfig = {},
) {
    const {
        timeout = DEFAULT_SEND_MESSAGE_TIMEOUT,
        onChunk,
        onDone,
        onError,
        signal: externalSignal,
        headers: extraHeaders = {},
    } = requestConfig;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("timeout"), timeout);
    let metadataTimeoutId = null;

    const signal = externalSignal
        ? AbortSignal.any([controller.signal, externalSignal])
        : controller.signal;

    try {
        const response = await fetch(
            `${apiClient.defaults.baseURL}/api/v1/chat/sessions/${sessionId}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
                    Accept: "text/event-stream",
                    ...extraHeaders,
                },
                body: JSON.stringify({
                    content,
                    stream: true,
                    // attachmentPaths digunakan saat mengirim pesan ke LLM
                    // attachmentIds digunakan saat membuat chat session
                    attachmentPaths:
                        useSourcesStore.getState().selectedPaths || [],
                    locale: "en-US",
                }),
                signal,
            },
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || errorData.error || "Gagal mengirim pesan",
            );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let isMetadataTimeout = false;
        let lastMessageType = null;

        const startMetadataTimeout = () => {
            if (metadataTimeoutId) clearTimeout(metadataTimeoutId);
            metadataTimeoutId = setTimeout(() => {
                isMetadataTimeout = true;
                reader.cancel().catch(() => {});
            }, 1000);
        };

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop(); // Hold the last incomplete line

            for (const line of lines) {
                if (!line.startsWith("data:")) continue;

                const raw = line.slice(5).trim();

                if (raw === "[DONE]") {
                    onDone?.();
                    return;
                }

                let parsed = null;
                try {
                    parsed = JSON.parse(raw);
                    onChunk?.(parsed);
                } catch {
                    onChunk?.(raw);
                }

                lastMessageType = parsed?.type || null;
            }

            if (lastMessageType === "courseRecommended") {
                startMetadataTimeout();
            } else if (metadataTimeoutId) {
                clearTimeout(metadataTimeoutId);
                metadataTimeoutId = null;
            }
        }

        onDone?.();
    } catch (error) {
        if (isMetadataTimeout) {
            onDone?.();
            return;
        }

        const isTimeout =
            error.name === "AbortError" || error.message === "timeout";

        const message = isTimeout
            ? "Permintaan habis waktu"
            : error.message || "Gagal mengirim pesan";

        console.error("Error streaming message:", error);
        onError?.(message);
        throw new Error(message);
    } finally {
        clearTimeout(timeoutId);
        if (metadataTimeoutId) clearTimeout(metadataTimeoutId);
    }
}

export async function removeSession(sessionId) {
    try {
        return await apiClient.delete(`/api/v1/chat/sessions/${sessionId}`);
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Gagal menghapus sesi chat",
        );
    }
}

/* =========================
   SOURCE (RAG)
========================= */
export async function uploadDocument(file) {
    try {
        const formData = new FormData();
        formData.append("file", file);
        return await apiClient.post("/api/v1/documents", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Upload file gagal",
        );
    }
}

export async function getListDocuments() {
    try {
        return await apiClient.get(`/api/v1/documents`);
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Gagal mengambil list documents",
        );
    }
}

export async function deleteSource(fileKeys = [""]) {
    if (
        !Array.isArray(fileKeys) ||
        !fileKeys.every((k) => typeof k === "string")
    ) {
        throw new Error(
            "Invalid request body: fileKeys must be an array of strings",
        );
    }

    try {
        return await apiClient.delete(`/api/v1/documents`, {
            data: { fileKeys },
        });
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Gagal menghapus source",
        );
    }
}

// ============ UNUSED ===============
export async function uploadURL(url, userId) {
    try {
        return await apiClient.post("/api/v1/upload/url", { url, userId });
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Upload URL gagal",
        );
    }
}

export async function uploadDrive(driveUrl, userId) {
    try {
        return await apiClient.post("/api/v1/upload/drive", {
            driveUrl,
            userId,
        });
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Upload Drive gagal",
        );
    }
}

export async function uploadText(text, userId) {
    try {
        return await apiClient.post("/api/v1/upload/text", { text, userId });
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Upload text gagal",
        );
    }
}

export async function getSources(userId) {
    try {
        return await apiClient.get(`/api/v1/sources/${userId}`);
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Gagal mengambil sources",
        );
    }
}

/* =========================
   USER PROFILE
========================= */

export async function updateUserProfile(userProfile) {
    try {
        return await apiClient.patch("/api/v1/profiles/me", userProfile);
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Gagal mengupdate profile",
        );
    }
}

export async function getUserProfile() {
    try {
        return await apiClient.get("/api/v1/profiles/me");
    } catch (error) {
        throw new Error(
            error.response?.data?.message ||
                error.response?.data?.error ||
                "Gagal mendapatkan profile",
        );
    }
}
