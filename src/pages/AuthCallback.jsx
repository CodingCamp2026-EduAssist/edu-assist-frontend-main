import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../services/api";
import { clearGuestChatState } from "../services/chatSessionIdentity";
import { useAuthStore } from "../store/auth-store";

function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        async function handleCallback() {
            const params = new URLSearchParams(window.location.search);
            const token = params.get("token");

            if (!token) {
                navigate("/login");
                return;
            }

            useAuthStore.getState().setAccessToken(token);
            clearGuestChatState();

            try {
                const data = await getMe();
                const user = data.user || data;
                useAuthStore.getState().setUser({
                    name: user.name || user.nama || user.displayName || "User",
                    email: user.email || "",
                    foto: user.picture || user.foto || "",
                    id: user.id || user.userId || "",
                    levelPendidikan: user.levelPendidikan || "",
                    preferensiTone: user.preferensiTone || "",
                });
            } catch (err) {
                console.error("Gagal fetch user profile:", err);
            }

            navigate("/personalization");
        }

        handleCallback();
    }, []);

    return (
        <div className="min-h-screen bg-[#f0efed] flex items-center justify-center relative overflow-hidden font-sans">
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />
            <div className="relative z-10 bg-white rounded-[20px] py-12 px-10 w-full max-w-[420px] flex flex-col items-center gap-3 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
                <div className="w-10 h-10 border-[3px] border-[#e5e7eb] border-t-[#2563eb] rounded-full animate-spin mb-2" />
                <p className="text-[1rem] font-semibold text-[#1a1a2e]">
                    Sedang masuk...
                </p>
                <p className="text-[0.85rem] text-[#9ca3af]">
                    Mohon tunggu sebentar
                </p>
            </div>
        </div>
    );
}

export default AuthCallback;
