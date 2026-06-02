import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BookOpen,
    GraduationCap,
    Sparkles,
    Zap,
    Gauge,
    CheckCircle2,
} from "lucide-react";
import { useProfileStore } from "@/store/profile-store";

const EDUCATION_LEVELS = [
    {
        id: "high_school",
        label: "Sekolah Menengah (SMA)",
        desc: "Penjelasan yang ringkas, mudah dipahami, sesuai level sekolah.",
    },
    {
        id: "undergraduate",
        label: "Diploma / Sarjana (S1)",
        desc: "Analisis akademis standar, referensi materi perkuliahan.",
    },
    {
        id: "graduate",
        label: "Pascasarjana (S2/S3)",
        desc: "Penelitian mendalam, pendekatan teoretis tinggi.",
    },
];

const DIFFICULTY_PREFERENCES = [
    {
        id: "easy",
        label: "Santai / Pemula",
        desc: "Penjelasan dasar dengan istilah-istilah sederhana.",
    },
    {
        id: "medium",
        label: "Standar / Menengah",
        desc: "Kombinasi teori dan latihan soal yang seimbang.",
    },
    {
        id: "hard",
        label: "Tantangan / Lanjut",
        desc: "Eksplorasi rumus kompleks dan studi kasus analitis.",
    },
    {
        id: "adaptive",
        label: "Adaptif (AI-Powered)",
        desc: "Tingkat kesulitan otomatis menyesuaikan pemahamanmu.",
    },
];

const EXPLANATION_STYLES = [
    {
        id: "concise",
        label: "Ringkas & To-the-point",
        desc: "Langsung ke inti sari materi tanpa basa-basi.",
    },
    {
        id: "detailed",
        label: "Lengkap & Komprehensif",
        desc: "Penjelasan menyeluruh disertai dengan latar belakang.",
    },
    {
        id: "step_by_step",
        label: "Step by Step (Tahapan)",
        desc: "Metode terstruktur, cocok untuk perhitungan & algoritma.",
    },
    {
        id: "analogy",
        label: "Analogi & Cerita",
        desc: "Membantu memahami konsep abstrak dengan contoh sehari-hari.",
    },
];

const PACING_OPTIONS = [
    {
        id: "slow",
        label: "Perlahan (Slow)",
        desc: "Penjelasan bertahap untuk pemahaman super detail.",
    },
    {
        id: "medium",
        label: "Sedang (Medium)",
        desc: "Tempo belajar normal yang nyaman.",
    },
    {
        id: "fast",
        label: "Cepat (Fast)",
        desc: "Kilat dan efisien untuk review materi menjelang ujian.",
    },
];

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

const PersonalizationPage = () => {
    const navigate = useNavigate();

    // Step navigation: 1, 2, 3
    const [step, setStep] = useState(1);

    const setUserProfile = useProfileStore((state) => state.updateUserProfile);
    const getUserProfile = useProfileStore((state) => state.getUserProfile);

    // Get current user profile if any
    const currentProfile = getUserProfile();

    // Personalization State
    const [educationLevel, setEducationLevel] = useState(
        currentProfile.educationLevel || "undergraduate",
    );
    const [difficultyPreference, setDifficultyPreference] = useState(
        currentProfile.difficultyPreference || "medium",
    );
    const [explanationStyle, setExplanationStyle] = useState(
        currentProfile.explanationStyle || "concise",
    );
    const [pace, setPace] = useState(currentProfile.pace || "medium");
    const [favouriteSubjects, setFavouriteSubjects] = useState(
        currentProfile.favouriteSubjects || [],
    );

    const handleSubjectToggle = (subject) => {
        setFavouriteSubjects((prev) =>
            prev.includes(subject)
                ? prev.filter((s) => s !== subject)
                : [...prev, subject],
        );
    };

    const handleSave = () => {
        setUserProfile({
            educationLevel,
            difficultyPreference,
            explanationStyle,
            pace,
            favouriteSubjects,
        });
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-[#f8f7f4] text-[#1a1a2e] flex flex-col justify-between font-sans relative overflow-hidden">
            {/* Background patterns */}
            <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                }}
            />

            {/* Header */}
            <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img
                        src="/icons/image.png"
                        alt="EduAssist"
                        className="h-8 object-contain"
                    />
                </div>
                <div className="flex items-center gap-1.5 bg-white shadow-sm border border-[#e5e7eb] px-4 py-1.5 rounded-full text-xs font-semibold text-[#6b7280]">
                    <span>Langkah {step} dari 3</span>
                    <div className="w-16 h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden ml-1">
                        <div
                            className="bg-[#2563eb] h-full transition-all duration-300"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-6 flex flex-col justify-center py-6">
                {step === 1 && (
                    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                        <div className="text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a1a2e] tracking-tight flex items-center justify-center md:justify-start gap-2.5">
                                <GraduationCap className="text-[#2563eb] w-7 h-7 md:w-8 md:h-8" />
                                Pilih Jenjang Pendidikan & Kecepatan Belajar
                            </h1>
                            <p className="text-[#6b7280] text-sm mt-1.5">
                                EduAssist menyesuaikan kedalaman penjelasan
                                sesuai dengan tingkat studi dan kecepatan
                                penyerapan materimu.
                            </p>
                        </div>

                        {/* Education Level Section */}
                        <div className="flex flex-col gap-3">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9ca3af]">
                                Tingkat Pendidikan (Education Level)
                            </h2>
                            <div className="flex flex-col gap-2.5">
                                {EDUCATION_LEVELS.map((level) => (
                                    <button
                                        key={level.id}
                                        className={`flex items-start gap-4 p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 bg-white ${
                                            educationLevel === level.id
                                                ? "border-[#2563eb] ring-2 ring-[#2563eb]/10 bg-blue-50/20"
                                                : "border-[#e5e7eb] hover:border-[#2563eb]/50 hover:bg-[#fcfbfa]"
                                        }`}
                                        onClick={() =>
                                            setEducationLevel(level.id)
                                        }
                                    >
                                        <div
                                            className={`mt-0.5 rounded-full p-1.5 ${educationLevel === level.id ? "bg-[#2563eb] text-white" : "bg-[#f3f4f6] text-[#6b7280]"}`}
                                        >
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-[#1a1a2e]">
                                                {level.label}
                                            </p>
                                            <p className="text-xs text-[#6b7280] mt-0.5">
                                                {level.desc}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pacing Section */}
                        <div className="flex flex-col gap-3">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9ca3af]">
                                Kecepatan Belajar (Pace)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {PACING_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        className={`flex flex-col items-center p-4 rounded-xl border text-center cursor-pointer transition-all duration-200 bg-white ${
                                            pace === opt.id
                                                ? "border-[#2563eb] ring-2 ring-[#2563eb]/10 bg-blue-50/20"
                                                : "border-[#e5e7eb] hover:border-[#2563eb]/50 hover:bg-[#fcfbfa]"
                                        }`}
                                        onClick={() => setPace(opt.id)}
                                    >
                                        <Gauge
                                            className={`w-5 h-5 mb-2 ${pace === opt.id ? "text-[#2563eb]" : "text-[#6b7280]"}`}
                                        />
                                        <p className="font-semibold text-sm text-[#1a1a2e]">
                                            {opt.label}
                                        </p>
                                        <p className="text-[10px] text-[#6b7280] mt-1 leading-normal">
                                            {opt.desc}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                        <div className="text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a1a2e] tracking-tight flex items-center justify-center md:justify-start gap-2.5">
                                <Sparkles className="text-[#2563eb] w-7 h-7 md:w-8 md:h-8" />
                                Gaya Penjelasan & Preferensi Kesulitan
                            </h1>
                            <p className="text-[#6b7280] text-sm mt-1.5">
                                Atur model bahasa agar menjelaskan materi dengan
                                gaya serta tingkat kesulitan yang paling nyaman
                                bagimu.
                            </p>
                        </div>

                        {/* Difficulty Section */}
                        <div className="flex flex-col gap-3">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9ca3af]">
                                Preferensi Kesulitan (Difficulty Preference)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {DIFFICULTY_PREFERENCES.map((level) => (
                                    <button
                                        key={level.id}
                                        className={`flex items-start gap-3.5 p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 bg-white ${
                                            difficultyPreference === level.id
                                                ? "border-[#2563eb] ring-2 ring-[#2563eb]/10 bg-blue-50/20"
                                                : "border-[#e5e7eb] hover:border-[#2563eb]/50 hover:bg-[#fcfbfa]"
                                        }`}
                                        onClick={() =>
                                            setDifficultyPreference(level.id)
                                        }
                                    >
                                        <Zap
                                            className={`w-5 h-5 shrink-0 mt-0.5 ${difficultyPreference === level.id ? "text-[#2563eb]" : "text-[#6b7280]"}`}
                                        />
                                        <div>
                                            <p className="font-semibold text-sm text-[#1a1a2e]">
                                                {level.label}
                                            </p>
                                            <p className="text-xs text-[#6b7280] mt-0.5 leading-normal">
                                                {level.desc}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Explanation Style Section */}
                        <div className="flex flex-col gap-3">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9ca3af]">
                                Gaya Penjelasan (Explanation Style)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {EXPLANATION_STYLES.map((style) => (
                                    <button
                                        key={style.id}
                                        className={`flex items-start gap-3.5 p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 bg-white ${
                                            explanationStyle === style.id
                                                ? "border-[#2563eb] ring-2 ring-[#2563eb]/10 bg-blue-50/20"
                                                : "border-[#e5e7eb] hover:border-[#2563eb]/50 hover:bg-[#fcfbfa]"
                                        }`}
                                        onClick={() =>
                                            setExplanationStyle(style.id)
                                        }
                                    >
                                        <BookOpen
                                            className={`w-5 h-5 shrink-0 mt-0.5 ${explanationStyle === style.id ? "text-[#2563eb]" : "text-[#6b7280]"}`}
                                        />
                                        <div>
                                            <p className="font-semibold text-sm text-[#1a1a2e]">
                                                {style.label}
                                            </p>
                                            <p className="text-xs text-[#6b7280] mt-0.5 leading-normal">
                                                {style.desc}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                        <div className="text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a1a2e] tracking-tight flex items-center justify-center md:justify-start gap-2.5">
                                <Sparkles className="text-[#2563eb] w-7 h-7 md:w-8 md:h-8" />
                                Mata Pelajaran Terfavorit
                            </h1>
                            <p className="text-[#6b7280] text-sm mt-1.5">
                                Pilih mata pelajaran atau topik yang paling kamu
                                minati. EduAssist akan memberikan contoh relevan
                                berdasarkan preferensimu.
                            </p>
                        </div>

                        {/* Favorite Subjects Chips */}
                        <div className="flex flex-col gap-3">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9ca3af]">
                                Mata Pelajaran (Favourite Subjects)
                            </h2>
                            <div className="flex flex-wrap gap-2.5 justify-center md:justify-start">
                                {SUBJECTS.map((sub) => {
                                    const isSelected =
                                        favouriteSubjects.includes(sub);
                                    return (
                                        <button
                                            key={sub}
                                            onClick={() =>
                                                handleSubjectToggle(sub)
                                            }
                                            className={`flex items-center gap-1.5 py-2 px-4 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                                                isSelected
                                                    ? "bg-[#2563eb] border-[#2563eb] text-white shadow-sm"
                                                    : "bg-white border-[#e5e7eb] text-[#6b7280] hover:border-[#2563eb] hover:text-[#2563eb]"
                                            }`}
                                        >
                                            {isSelected && (
                                                <span className="text-xs">
                                                    ✓
                                                </span>
                                            )}
                                            <span>{sub}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Visual preview summary card */}
                        <div className="mt-4 p-5 bg-white border border-[#e5e7eb] rounded-xl flex flex-col gap-2">
                            <h3 className="text-xs font-bold text-[#1a1a2e] uppercase tracking-wider">
                                Ringkasan Profil Belajarmu
                            </h3>
                            <div className="grid grid-cols-2 gap-3 mt-1.5 text-xs text-[#6b7280]">
                                <div>
                                    <span className="font-semibold text-[#1a1a2e]">
                                        Jenjang Studi:
                                    </span>{" "}
                                    {
                                        EDUCATION_LEVELS.find(
                                            (l) => l.id === educationLevel,
                                        )?.label
                                    }
                                </div>
                                <div>
                                    <span className="font-semibold text-[#1a1a2e]">
                                        Kecepatan:
                                    </span>{" "}
                                    {
                                        PACING_OPTIONS.find(
                                            (p) => p.id === pace,
                                        )?.label
                                    }
                                </div>
                                <div>
                                    <span className="font-semibold text-[#1a1a2e]">
                                        Tingkat Kesulitan:
                                    </span>{" "}
                                    {
                                        DIFFICULTY_PREFERENCES.find(
                                            (d) =>
                                                d.id === difficultyPreference,
                                        )?.label
                                    }
                                </div>
                                <div>
                                    <span className="font-semibold text-[#1a1a2e]">
                                        Gaya Penjelasan:
                                    </span>{" "}
                                    {
                                        EXPLANATION_STYLES.find(
                                            (e) => e.id === explanationStyle,
                                        )?.label
                                    }
                                </div>
                            </div>
                            {favouriteSubjects.length > 0 && (
                                <div className="text-xs text-[#6b7280] border-t border-[#e5e7eb]/80 pt-2.5 mt-1">
                                    <span className="font-semibold text-[#1a1a2e]">
                                        Topik Terfavorit:
                                    </span>{" "}
                                    {favouriteSubjects.join(", ")}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer Navigation */}
            <footer className="relative z-10 w-full max-w-3xl mx-auto px-6 py-6 border-t border-[#e5e7eb]/60 flex items-center justify-between bg-[#f8f7f4]/80 backdrop-blur-md">
                <button
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    className={`py-2.5 px-6 rounded-lg text-xs font-bold transition-all duration-200 border border-[#e5e7eb] bg-white cursor-pointer hover:bg-[#fcfbfa] ${
                        step === 1
                            ? "opacity-0 pointer-events-none"
                            : "opacity-100"
                    }`}
                >
                    Sebelumnya
                </button>

                {step < 3 ? (
                    <button
                        onClick={() => setStep((s) => Math.min(3, s + 1))}
                        className="py-2.5 px-6 rounded-lg text-xs font-bold bg-[#2563eb] text-white cursor-pointer shadow-sm transition-all duration-200 hover:opacity-90"
                    >
                        Lanjutkan
                    </button>
                ) : (
                    <button
                        onClick={handleSave}
                        className="py-2.5 px-6 rounded-lg text-xs font-bold bg-[#2563eb] text-white cursor-pointer shadow-sm transition-all duration-200 hover:opacity-90 flex items-center gap-1.5"
                    >
                        <span>Mulai Belajar</span>
                        <span>→</span>
                    </button>
                )}
            </footer>
        </div>
    );
};

export default PersonalizationPage;
