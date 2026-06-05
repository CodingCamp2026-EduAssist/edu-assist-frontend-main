import { BrowserRouter, Routes, Route } from "react-router-dom";
import OnboardingPage from "./pages/OnboardingPage";
import AuthCallback from "./pages/AuthCallback";
import InitialChatPage from "./pages/InitialChatPage";
import ChatPage from "./pages/ChatPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useEffect } from "react";
import PersonalizationPage from "./pages/PersonalizationPage";
import { useAuthStore } from "./store/auth-store";
import ChatLayout from "./layouts/ChatLayout";
import { Toaster } from "sonner";

function App() {
    const accessToken = useAuthStore((state) => state.accessToken);

    useEffect(() => {
        const isAuthCallback =
            window.location.pathname.startsWith("/auth/callback");
        const isLogin = window.location.pathname === "/login";

        if (!accessToken && !isAuthCallback && !isLogin) {
            window.location.href = "/login";
        }
    }, [accessToken]);
    return (
        <>
            <Toaster position="top-center" richColors />
            <BrowserRouter>
            <Routes>
                {/* Chat layout route */}
                <Route element={<ChatLayout />}>
                    <Route path="/" element={<InitialChatPage />} />
                    <Route path="/chat/:sessionId" element={<ChatPage />} />
                </Route>

                <Route path="/login" element={<OnboardingPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                    path="/personalization"
                    element={<PersonalizationPage />}
                />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
        </>
    );
}

export default App;
