"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
    Upload as UploadIcon,
    FileCode,
    Archive,
    X,
    Loader2,
    ImagePlus,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

export default function UploadPage() {
    const router = useRouter();
    const { user, hydrate } = useAuthStore();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const categories = ["Action", "Adventure", "Puzzle", "Arcade", "RPG"];

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
            }
        }
    }, [router]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const f = acceptedFiles[0];
            const ext = f.name.split(".").pop()?.toLowerCase();
            if (ext !== "html" && ext !== "zip") {
                setError("Only .html and .zip files are allowed");
                return;
            }
            if (f.size > 50 * 1024 * 1024) {
                setError("File size exceeds 50MB limit");
                return;
            }
            setFile(f);
            setError("");
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            "text/html": [".html"],
            "application/zip": [".zip"],
        },
    });

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            setError("Thumbnail must be an image file");
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            setError("Thumbnail must be under 5MB");
            return;
        }
        setThumbnail(f);
        setThumbnailPreview(URL.createObjectURL(f));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError("Please select a game file");
            return;
        }
        if (!title.trim()) {
            setError("Please enter a title");
            return;
        }
        if (!category) {
            setError("Please select a category");
            return;
        }

        setUploading(true);
        setError("");

        const formData = new FormData();
        formData.append("gameFile", file);
        formData.append("title", title.trim());
        formData.append("category", category);
        if (description.trim()) {
            formData.append("description", description.trim());
        }
        if (thumbnail) {
            formData.append("thumbnail", thumbnail);
        }

        try {
            const res = await api.post("/games/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            router.push(`/games/${res.data.game.id}`);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(
                axiosErr.response?.data?.message || "Upload failed. Please try again."
            );
            setUploading(false);
        }
    };

    if (!user) {
        return (
            <div className="mx-auto max-w-xl px-4 py-16 text-center">
                <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
            <h1 className="text-2xl font-bold tracking-tight">Upload a Game</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Share your HTML game with the community. Supports .html and .zip files
                up to 50MB.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-1.5">
                        Title <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        placeholder="Enter game title"
                        className="w-full border border-border bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium mb-1.5">
                        Category <span className="text-destructive">*</span>
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border border-border bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
                    >
                        <option value="">Select a category</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-1.5">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="Optional description of your game"
                        className="w-full resize-none border border-border bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-muted-foreground text-right">
                        {description.length}/500
                    </p>
                </div>

                {/* Thumbnail */}
                <div>
                    <label className="block text-sm font-medium mb-1.5">
                        Cover Image
                    </label>
                    {thumbnailPreview ? (
                        <div className="relative border border-border">
                            <img
                                src={thumbnailPreview}
                                alt="Thumbnail preview"
                                className="h-40 w-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setThumbnail(null);
                                    setThumbnailPreview(null);
                                }}
                                className="absolute right-2 top-2 bg-background/80 p-1 text-muted-foreground transition-colors hover:text-destructive"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-border px-6 py-6 text-center transition-colors hover:border-muted-foreground">
                            <ImagePlus className="mb-2 h-6 w-6 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                                Click to upload a cover image
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground/70">
                                PNG, JPG, WebP — Max 5MB
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailChange}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>

                {/* File dropzone */}
                <div>
                    <label className="block text-sm font-medium mb-1.5">
                        Game File <span className="text-destructive">*</span>
                    </label>
                    {file ? (
                        <div className="flex items-center justify-between border border-border bg-muted px-4 py-3">
                            <div className="flex items-center gap-2 text-sm">
                                {file.name.endsWith(".zip") ? (
                                    <Archive className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <FileCode className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="font-medium">{file.name}</span>
                                <span className="text-muted-foreground">
                                    ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFile(null)}
                                className="text-muted-foreground transition-colors hover:text-destructive"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div
                            {...getRootProps()}
                            className={`flex cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-10 text-center transition-colors ${isDragActive
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-muted-foreground"
                                }`}
                        >
                            <input {...getInputProps()} />
                            <UploadIcon className="mb-3 h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                                {isDragActive
                                    ? "Drop the file here"
                                    : "Drag & drop a file here, or click to select"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground/70">
                                .html or .zip — Max 50MB
                            </p>
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={uploading}
                    className="inline-flex w-full items-center justify-center gap-2 border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <UploadIcon className="h-4 w-4" />
                            Upload Game
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
