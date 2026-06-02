import React, { useRef } from "react";
import { Plus, FolderOpen, FileText, Globe, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { SiGoogledrive } from "react-icons/si";
import { useSourcesStore } from "@/store/sources-store";
import { useAuthStore } from "@/store/auth-store";

const SOURCE_ICONS = {
    file: <FileText size={20} className="text-blue-500" />,
    drive: <SiGoogledrive size={20} className="text-green-600" />,
    url: <Globe size={20} className="text-indigo-500" />,
    text: <ClipboardList size={20} className="text-orange-500" />,
};

const SOURCE_TYPES_LIST = [
    {
        id: "file",
        icon: <FileText size={18} />,
        label: "Upload File",
        desc: "PDF",
    },
    {
        id: "drive",
        icon: <SiGoogledrive size={18} />,
        label: "Google Drive",
        desc: "Paste link Drive",
    },
    {
        id: "url",
        icon: <Globe size={18} />,
        label: "Website URL",
        desc: "Paste link website",
    },
    {
        id: "text",
        icon: <ClipboardList size={18} />,
        label: "Copied Text",
        desc: "Paste teks langsung",
    },
];

export default function SourcesSidebar() {
    const fileInputRef = useRef(null);
    const user = useAuthStore((s) => s.user);

    const {
        sources,
        sourcesOpen,
        showAddSource,
        activeSourceType,
        sourceInput,
        dragOver,
        setSourcesOpen,
        setShowAddSource,
        setActiveSourceType,
        setSourceInput,
        setDragOver,
        deleteSource,
        handleFileUpload,
        handleAddSourceInput,
    } = useSourcesStore();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".pdf")) {
            alert("Hanya file PDF yang diperbolehkan!");
            return;
        }
        handleFileUpload(file, user?.id || "guest");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".pdf")) {
            alert("Hanya file PDF yang diperbolehkan!");
            return;
        }
        handleFileUpload(file, user?.id || "guest");
    };

    const onAddSourceInputClick = () => {
        handleAddSourceInput(user?.id || "guest");
    };

    return (
        <div className={`bg-white dark:bg-[#121218] border-r border-[#e5e7eb] dark:border-white/10 flex flex-col py-5 transition-all duration-250 overflow-y-auto max-[900px]:hidden scrollbar-thin ${sourcesOpen ? "w-[280px] min-w-[280px] px-4 gap-3" : "w-14 min-w-14 px-0 gap-4 flex flex-col items-center"}`}>
            {/* Header */}
            <div className={`flex items-center w-full ${sourcesOpen ? "justify-between" : "flex-col gap-2 justify-center"}`}>
                <div className={`flex items-center gap-2 ${sourcesOpen ? "" : "flex-col"}`}>
                    {sourcesOpen ? (
                        <h2 className="text-base font-bold text-[#1a1a2e] dark:text-white">
                            Sources
                        </h2>
                    ) : (
                        <FolderOpen size={20} className="text-slate-400 dark:text-white/40" />
                    )}
                    <span className="bg-[#eff6ff] dark:bg-white/10 text-[#2563eb] dark:text-blue-400 text-[0.72rem] font-semibold py-0.5 px-2 rounded-full shrink-0">
                        {sources.length}
                    </span>
                </div>
                <button
                    onClick={() => setSourcesOpen(!sourcesOpen)}
                    className="bg-transparent border-none text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1 rounded-md transition-colors duration-200 flex items-center justify-center shrink-0 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                    {sourcesOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
            </div>

            {/* Tambah Sumber Button */}
            <button
                className={`flex items-center justify-center border-dashed border-[#d1d5db] dark:border-white/20 bg-transparent text-[#6b7280] dark:text-white/60 cursor-pointer transition-all duration-200 hover:border-[#2563eb] hover:text-[#2563eb] hover:bg-[#eff6ff] dark:hover:bg-white/5 shrink-0 ${sourcesOpen ? "gap-2 p-2.5 rounded-lg border w-full text-[0.85rem]" : "w-10 h-10 border-2 rounded-full"}`}
                onClick={() => {
                    if (!sourcesOpen) setSourcesOpen(true);
                    setShowAddSource(!showAddSource);
                }}
            >
                <Plus size={16} className="shrink-0" />
                {sourcesOpen && <span>Tambah Sumber</span>}
            </button>

            {/* Add Source Input Panels */}
            {sourcesOpen && showAddSource && (
                <div className="flex flex-col gap-2.5 bg-[#f9fafb] dark:bg-[#1a1a24] border border-[#e5e7eb] dark:border-white/10 rounded-xl p-3 shrink-0">
                    <div className="flex gap-1.5">
                        {SOURCE_TYPES_LIST.map((t) => (
                            <button
                                key={t.id}
                                className={`flex-1 p-1.5 rounded-lg border border-[#e5e7eb] dark:border-white/10 bg-white dark:bg-[#121218] text-[#6b7280] dark:text-white/60 text-[1rem] cursor-pointer transition-all duration-200 flex items-center justify-center hover:bg-[#f3f4f6] dark:hover:bg-white/5 hover:text-[#1a1a2e] dark:hover:text-white ${activeSourceType === t.id ? "bg-[#eff6ff] dark:bg-blue-900/30 border-[#2563eb] dark:border-blue-500 text-[#2563eb] dark:text-blue-400" : ""}`}
                                onClick={() => setActiveSourceType(t.id)}
                            >
                                {t.icon}
                            </button>
                        ))}
                    </div>
                    {activeSourceType === "file" && (
                        <div
                            className={`border border-dashed rounded-lg p-5 flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 transform text-center bg-white dark:bg-[#121218] ${
                                dragOver
                                    ? "border-[#2563eb] bg-[#eff6ff]/80 dark:bg-blue-900/10 scale-[1.03] shadow-[0_0_15px_rgba(37,99,235,0.25)] animate-pulse"
                                    : "border-[#d1d5db] dark:border-white/20 hover:border-[#2563eb] hover:bg-[#eff6ff]/30 dark:hover:bg-white/5"
                            }`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FileText
                                size={32}
                                className={`transition-transform duration-300 ${
                                    dragOver ? "text-[#2563eb] scale-110" : "text-slate-400"
                                } mb-1`}
                            />
                            <p className="text-[0.8rem] font-medium text-[#6b7280] dark:text-white/60">
                                {dragOver ? "Lepaskan file PDF di sini!" : "Drop file atau klik untuk upload"}
                            </p>
                            <p className="text-[0.72rem] text-[#9ca3af]">
                                Hanya PDF
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    )}
                    {activeSourceType !== "file" && (
                        <div className="flex flex-col gap-1.5">
                            <input
                                className="bg-white dark:bg-[#121218] border border-[#e5e7eb] dark:border-white/10 rounded-lg py-2 px-3 text-[#1a1a2e] dark:text-white text-[0.82rem] outline-none transition-all duration-200 w-full placeholder-[#c4cad4] dark:placeholder-white/30 focus:border-[#2563eb] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#2563eb]/10"
                                placeholder={
                                    activeSourceType === "drive"
                                        ? "Paste link Google Drive..."
                                        : activeSourceType === "url"
                                            ? "Paste URL website..."
                                            : "Paste teks di sini..."
                                }
                                value={sourceInput}
                                onChange={(e) => setSourceInput(e.target.value)}
                            />
                            <button
                                className="py-2 rounded-lg border-none bg-[#2563eb] text-white text-[0.82rem] font-semibold cursor-pointer transition-all duration-200 hover:opacity-90"
                                onClick={onAddSourceInputClick}
                            >
                                Tambah
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Sources List */}
            {sources.length === 0 ? (
                sourcesOpen ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-center py-8 px-2">
                        <FolderOpen size={40} className="text-slate-300 dark:text-white/20 mb-1" />
                        <p className="text-[0.875rem] font-semibold text-[#6b7280] dark:text-white/60">
                            Belum ada sumber
                        </p>
                        <p className="text-[0.78rem] text-[#9ca3af] dark:text-white/40 leading-relaxed">
                            Tambah file, link, atau teks sebagai RAG
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-300 dark:text-white/10">
                        <FolderOpen size={20} />
                    </div>
                )
            ) : sourcesOpen ? (
                <div className="grid grid-cols-2 gap-2 overflow-y-auto">
                    {sources.map((source) => (
                        <div
                            key={source.id}
                            className="bg-[#f9fafb] dark:bg-[#1a1a24] border border-[#e5e7eb] dark:border-white/10 rounded-lg p-3 flex flex-col gap-1.5 relative transition-all duration-200 hover:border-[#2563eb] hover:bg-[#eff6ff] dark:hover:bg-white/5 group"
                        >
                            <div className="shrink-0">
                                {SOURCE_ICONS[source.type] || <FileText size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[0.75rem] font-medium text-[#1a1a2e] dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">
                                    {source.name}
                                </p>
                                <p className="text-[0.68rem] text-[#9ca3af] overflow-hidden text-ellipsis whitespace-nowrap">
                                    {source.meta}
                                </p>
                            </div>
                            <button
                                className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full border-none bg-[#fee2e2] dark:bg-red-950/50 text-[#ef4444] text-[0.85rem] cursor-pointer hidden group-hover:flex items-center justify-center transition-colors duration-200 hover:bg-[#fecaca] dark:hover:bg-red-900"
                                onClick={() => deleteSource(source.id)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-3 items-center w-full overflow-y-auto pb-4">
                    {sources.map((source) => (
                        <div
                            key={source.id}
                            title={source.name}
                            className="w-10 h-10 rounded-lg bg-white dark:bg-[#1a1a24] border border-[#e5e7eb] dark:border-white/10 flex items-center justify-center hover:border-[#2563eb] dark:hover:border-blue-500 cursor-pointer shrink-0 transition-colors duration-200"
                            onClick={() => setSourcesOpen(true)}
                        >
                            {SOURCE_ICONS[source.type] || <FileText size={18} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
