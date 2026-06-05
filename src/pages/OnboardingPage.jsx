import { useNavigate } from "react-router-dom";
import { loginWithGoogle, signOut } from "../services/api";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

function OnboardingPage() {
    const navigate = useNavigate();

    const accessToken = useAuthStore((state) => state.accessToken);

    useEffect(() => {
        if (accessToken) {
            navigate("/");
        }
    }, [accessToken]);

    function handleGoogleLogin() {
        loginWithGoogle();
    }

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
            <div className="relative z-10 bg-white rounded-[20px] py-12 px-10 w-full max-w-[520px] flex flex-col items-center gap-3 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
                <img
                    src="/icons/image.png"
                    alt="EduAssist"
                    className="h-10 object-contain mb-2"
                />
                <h1 className="text-[1.1rem] font-bold text-[#1a1a2e] text-center">
                    Selamat datang di EduAssist
                </h1>
                <p className="text-[0.85rem] text-[#9ca3af] text-center mb-3">
                    Silahkan log in untuk dapat mengakses EduAssist
                </p>
                <button
                    className="flex items-center justify-center gap-3 w-full py-3 px-6 rounded-full border border-[#e5e7eb] bg-white text-[#1a1a2e] text-[0.95rem] font-medium cursor-pointer transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] mt-2 hover:bg-[#f9fafb] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                    onClick={handleGoogleLogin}
                >
                    <svg width="20" height="20" viewBox="0 0 48 48">
                        <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                        <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    Continue with Google
                </button>
            </div>
        </div>
    );
}

export default OnboardingPage;
