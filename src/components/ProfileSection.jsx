import React, { useState, useRef, useEffect } from "react";
import { Settings, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useProfileStore } from "@/store/profile-store";
import { useChatStore } from "@/store/chat-store";
import { logout } from "../services/api";

export default function ProfileSection() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const sidebarOpen = useChatStore((s) => s.sidebarOpen);
    const setActiveMenu = useChatStore((s) => s.setActiveMenu);

    const user = useAuthStore((s) => s.user);
    const userProfile = useProfileStore((s) => s.userProfiles) || {};

    const initials = user.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "U";

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error("Logout error:", err);
        }
        setIsOpen(false);
    };

    return (
        <div
            className="relative w-full flex justify-center mt-auto"
            ref={dropdownRef}
        >
            {/* Popover Dropdown */}
            {isOpen && (
                <div
                    className={`absolute bottom-12 bg-white dark:bg-[#121218] border border-[#e5e7eb] dark:border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] py-1.5 z-50 flex flex-col gap-0.5 ${sidebarOpen ? "w-full left-0 px-1" : "w-36 left-full ml-2"}`}
                >
                    <button
                        onClick={() => {
                            setActiveMenu("settings");
                            setIsOpen(false);
                        }}
                        className="flex items-center gap-2.5 py-2 px-3 rounded-lg border-none bg-transparent text-slate-600 dark:text-white/60 text-[0.82rem] cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white text-left w-full"
                    >
                        <Settings size={16} />
                        <span>Settings</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 py-2 px-3 rounded-lg border-none bg-transparent text-red-500 text-[0.82rem] cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 text-left w-full"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            )}

            {/* Profile trigger button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center border-t border-slate-200 dark:border-white/10 mt-auto cursor-pointer transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/5 w-full ${sidebarOpen ? "gap-3 py-3 px-2 rounded-lg" : "w-10 h-10 p-0 rounded-full justify-center shrink-0 border-t-0"}`}
            >
                <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[0.75rem] font-bold shrink-0 overflow-hidden">
                    {user.foto ? (
                        <img
                            src={user.foto}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        initials
                    )}
                </div>
                <div
                    className={`transition-all duration-200 ${sidebarOpen ? "block" : "hidden"} min-w-0`}
                >
                    <p className="text-[0.82rem] font-semibold text-slate-800 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
                        {user.name || "User"}
                    </p>
                    <p className="text-[0.72rem] text-slate-500 dark:text-white/45 whitespace-nowrap overflow-hidden text-ellipsis">
                        {user.email || "user@gmail.com"}
                    </p>
                </div>
            </div>
        </div>
    );
}
