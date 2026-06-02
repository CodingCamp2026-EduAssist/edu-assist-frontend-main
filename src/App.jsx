import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import OnboardingPage from "./pages/OnboardingPage";
import AuthCallback from "./pages/AuthCallback";
import ChatPage from "./pages/ChatPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useEffect } from "react";
import PersonalizationPage from "./pages/PersonalizationPage";
import { useAuthStore } from "./store/auth-store";

function App() {
    const accessToken = useAuthStore((state) => state.accessToken);

    useEffect(() => {
        const isAuthCallback = window.location.pathname.startsWith("/auth/callback");
        const isLogin = window.location.pathname === "/login";

        if (!accessToken && !isAuthCallback && !isLogin) {
            window.location.href = "/login";
        }
    }, [accessToken]);
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<ChatPage />} />
                <Route path="/login" element={<OnboardingPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                    path="/personalization"
                    element={<PersonalizationPage />}
                />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
