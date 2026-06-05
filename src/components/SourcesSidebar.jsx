import React, { useEffect, useRef } from "react";
import {
    Plus,
    FolderOpen,
    FileText,
    Globe,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { SiGoogledrive } from "react-icons/si";
import { useSourcesStore } from "@/store/sources-store";
import { useAuthStore } from "@/store/auth-store";
import { getListDocuments } from "@/services/api";
import { toast } from "sonner";
const SOURCE_ICONS = {
    file: <FileText size={20} className="text-blue-500" />,
};

export default function SourcesSidebar() {
    const fileInputRef = useRef(null);
    const user = useAuthStore((s) => s.user);

    const {
        sources,
        sourcesOpen,
        showAddSource,
        dragOver,
        loading,
        uploading,
        setSourcesOpen,
        setShowAddSource,
        setDragOver,
        handleDeleteSource,
        handleFileUpload,
        getListDocuments,
        selectedPaths,
        toggleSelectDocument,
    } = useSourcesStore();

    const dragCounter = useRef(0);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const pdfFiles = files.filter((file) =>
            file.name.toLowerCase().endsWith(".pdf"),
        );
        if (pdfFiles.length === 0) {
            toast.error("Hanya file PDF yang diperbolehkan!");
            return;
        }
        if (pdfFiles.length < files.length) {
            toast.warning("Beberapa file diabaikan karena bukan PDF.");
        }
        const validFiles = pdfFiles.filter((file) => {
            if (file.size > 2 * 1024 * 1024) {
                toast.error(`File "${file.name}" melebihi batas ukuran 2MB!`);
                return false;
            }
            return true;
        });
        validFiles.forEach((file) => {
            handleFileUpload(file, user?.id || "guest");
        });
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        dragCounter.current++;
        if (dragCounter.current === 1) {
            setDragOver(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDragOver(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        dragCounter.current = 0;
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;
        const pdfFiles = files.filter((file) =>
            file.name.toLowerCase().endsWith(".pdf"),
        );
        if (pdfFiles.length === 0) {
            toast.error("Hanya file PDF yang diperbolehkan!");
            return;
        }
        if (pdfFiles.length < files.length) {
            toast.warning("Beberapa file diabaikan karena bukan PDF.");
        }
        const validFiles = pdfFiles.filter((file) => {
            if (file.size > 2 * 1024 * 1024) {
                toast.error(`File "${file.name}" melebihi batas ukuran 2MB!`);
                return false;
            }
            return true;
        });
        validFiles.forEach((file) => {
            handleFileUpload(file, user?.id || "guest");
        });
    };

    useEffect(() => {
        getListDocuments();
    }, []);

    return (
        <div
            className={`bg-white dark:bg-[#121218] border-r border-[#e5e7eb] dark:border-white/10 flex flex-col py-5 transition-all duration-250 overflow-y-auto max-[900px]:hidden scrollbar-thin ${sourcesOpen ? "w-[280px] min-w-[280px] px-4 gap-3" : "w-14 min-w-14 px-0 gap-4 flex flex-col items-center"}`}
        >
            {/* Header */}
            <div
                className={`flex items-center w-full ${sourcesOpen ? "justify-between" : "flex-col gap-2 justify-center"}`}
            >
                <div
                    className={`flex items-center gap-2 ${sourcesOpen ? "" : "flex-col"}`}
                >
                    {sourcesOpen ? (
                        <h2 className="text-base font-bold text-[#1a1a2e] dark:text-white">
                            Sources
                        </h2>
                    ) : (
                        <FolderOpen
                            size={20}
                            className="text-slate-400 dark:text-white/40"
                        />
                    )}
                    <span className="bg-[#eff6ff] dark:bg-white/10 text-[#2563eb] dark:text-blue-400 text-[0.72rem] font-semibold py-0.5 px-2 rounded-full shrink-0">
                        {sources.length}
                    </span>
                </div>
                <button
                    onClick={() => setSourcesOpen(!sourcesOpen)}
                    className="bg-transparent border-none text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1 rounded-md transition-colors duration-200 flex items-center justify-center shrink-0 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                    {sourcesOpen ? (
                        <ChevronLeft size={18} />
                    ) : (
                        <ChevronRight size={18} />
                    )}
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

            {/* Scoped Drag-Active Zone (Excluding Header & Button) */}
            <div
                className="grow flex flex-col relative min-h-0 gap-3"
                onDragEnter={handleDragEnter}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drag-Over Overlay */}
                {dragOver && (
                    <div className="absolute inset-0 bg-[#eff6ff]/95 dark:bg-blue-950/90 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center border-2 border-dashed border-[#2563eb] rounded-xl pointer-events-none p-4 text-center">
                        <FileText
                            size={44}
                            className="text-[#2563eb] animate-bounce mb-2"
                        />
                        <p className="text-[0.875rem] font-bold text-[#2563eb] dark:text-blue-400">
                            Lepaskan PDF untuk Upload!
                        </p>
                    </div>
                )}

                {/* Add Source Input Panels */}
                {sourcesOpen && showAddSource && (
                    <div className="flex flex-col gap-2.5 bg-[#f9fafb] dark:bg-[#1a1a24] border border-[#e5e7eb] dark:border-white/10 rounded-xl p-3 shrink-0">
                        <div
                            className="border border-dashed border-[#d1d5db] dark:border-white/20 rounded-lg h-36 p-5 flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 transform text-center bg-white dark:bg-[#121218] hover:border-[#2563eb] hover:bg-[#eff6ff]/30 dark:hover:bg-white/5"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FileText
                                size={32}
                                className="text-slate-400 mb-1"
                            />
                            <p className="text-[0.8rem] font-medium text-[#6b7280] dark:text-white/60">
                                Drop file atau klik untuk upload
                            </p>
                            <p className="text-[0.72rem] text-[#9ca3af]">
                                Hanya PDF
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                )}

                {/* Sources List */}
                {loading && sources.length === 0 ? (
                    sourcesOpen ? (
                        <div className="grow flex flex-col gap-2 overflow-y-auto">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="animate-pulse bg-[#f9fafb] dark:bg-[#1a1a24] border border-[#e5e7eb] dark:border-white/10 rounded-lg p-3 flex flex-col gap-2"
                                >
                                    <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-2/3"></div>
                                    <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grow flex flex-col gap-3 items-center w-full overflow-y-auto">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-[#1a1a24] animate-pulse shrink-0"
                                ></div>
                            ))}
                        </div>
                    )
                ) : sources.length === 0 ? (
                    sourcesOpen ? (
                        <div className="grow flex flex-col items-center justify-center gap-1.5 text-center py-8 px-2">
                            <FolderOpen
                                size={40}
                                className="text-slate-300 dark:text-white/20 mb-1"
                            />
                            <p className="text-[0.875rem] font-semibold text-[#6b7280] dark:text-white/60">
                                Belum ada sumber
                            </p>
                            <p className="text-[0.78rem] text-[#9ca3af] dark:text-white/40 leading-relaxed">
                                Tambah file, link, atau teks sebagai RAG
                            </p>
                        </div>
                    ) : (
                        <div className="grow flex items-center justify-center text-slate-300 dark:text-white/10">
                            <FolderOpen size={20} />
                        </div>
                    )
                ) : sourcesOpen ? (
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto">
                        {sources.map((source) => {
                            const isSelected =
                                source.originalPath &&
                                selectedPaths.includes(source.originalPath);

                            return (
                                <div
                                    key={source.id}
                                    onClick={() => {
                                        if (
                                            source.status !== "uploading" &&
                                            source.originalPath
                                        ) {
                                            toggleSelectDocument(
                                                source.originalPath,
                                            );
                                        }
                                    }}
                                    className={`bg-[#f9fafb] dark:bg-[#1a1a24] border rounded-lg p-3 flex flex-col gap-1.5 relative transition-all duration-200 group cursor-pointer ${
                                        source.status === "uploading"
                                            ? "border-blue-400 dark:border-blue-500/50 bg-blue-50/10 dark:bg-blue-950/10"
                                            : isSelected
                                              ? "border-[#2563eb] dark:border-blue-500 bg-[#eff6ff] dark:bg-blue-950/30 shadow-sm"
                                              : "border-[#e5e7eb] dark:border-white/10 hover:border-[#2563eb] hover:bg-[#eff6ff] dark:hover:bg-white/5"
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="shrink-0 flex items-center gap-2">
                                            {source.status !== "uploading" &&
                                                source.originalPath && (
                                                    <input
                                                        type="checkbox"
                                                        checked={!!isSelected}
                                                        onChange={() => {}}
                                                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-white/20 text-[#2563eb] focus:ring-0 cursor-pointer"
                                                    />
                                                )}
                                            {source.status === "uploading" ? (
                                                <Loader2
                                                    size={20}
                                                    className="text-blue-500 animate-spin"
                                                />
                                            ) : (
                                                SOURCE_ICONS["file"] || (
                                                    <FileText size={20} />
                                                )
                                            )}
                                        </div>
                                        {source.status === "uploading" && (
                                            <span className="text-[0.62rem] font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded animate-pulse shrink-0">
                                                UPLOADING
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-[0.75rem] font-medium overflow-hidden text-ellipsis whitespace-nowrap ${source.status === "uploading" ? "text-blue-600 dark:text-blue-400" : "text-[#1a1a2e] dark:text-white"}`}
                                        >
                                            {source.fileName}
                                        </p>
                                        {source.status === "uploading" ? (
                                            <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1 mt-1.5 overflow-hidden">
                                                <div className="bg-blue-500 h-full rounded-full animate-pulse w-full"></div>
                                            </div>
                                        ) : (
                                            <p className="text-[0.68rem] text-[#9ca3af] overflow-hidden text-ellipsis whitespace-nowrap">
                                                {source.fileSize}
                                            </p>
                                        )}
                                    </div>
                                    {source.status !== "uploading" && (
                                        <button
                                            className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full border-none bg-[#fee2e2] dark:bg-red-950/50 text-[#ef4444] text-[0.85rem] cursor-pointer hidden group-hover:flex items-center justify-center transition-colors duration-200 hover:bg-[#fecaca] dark:hover:bg-red-900"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSource(
                                                    source.originalPath,
                                                );
                                            }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grow flex flex-col gap-3 items-center w-full overflow-y-auto pb-4">
                        {sources.map((source) => (
                            <div
                                key={source.id}
                                title={source.fileName}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer shrink-0 transition-all duration-200 ${source.status === "uploading" ? "bg-blue-50/50 dark:bg-blue-950/20 border border-blue-400 animate-pulse" : "bg-white dark:bg-[#1a1a24] border border-[#e5e7eb] dark:border-white/10 hover:border-[#2563eb] dark:hover:border-blue-500"}`}
                                onClick={() => setSourcesOpen(true)}
                            >
                                {source.status === "uploading" ? (
                                    <Loader2
                                        size={18}
                                        className="text-blue-500 animate-spin"
                                    />
                                ) : (
                                    SOURCE_ICONS["file"] || (
                                        <FileText size={18} />
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
