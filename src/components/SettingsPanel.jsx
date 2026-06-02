import React, { useState } from "react";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useProfileStore } from "@/store/profile-store";
import { useChatStore } from "@/store/chat-store";
import { logout } from "../services/api";

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

export default function SettingsPanel() {
    const user = useAuthStore((state) => state.user);
    const userProfile = useProfileStore((state) => state.userProfiles) || {};
    const updateUserProfile = useProfileStore((state) => state.updateUserProfile);
    const { theme, setTheme } = useChatStore();
    const [focusedField, setFocusedField] = useState(null);

    const initials = user.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "U";

    function handleProfileUpdate(key, value) {
        updateUserProfile({
            ...userProfile,
            [key]: value,
        });
    }

    return (
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
    );
}
