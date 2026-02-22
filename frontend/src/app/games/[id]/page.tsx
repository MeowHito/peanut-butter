"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Play,
    Trash2,
    FileCode,
    Archive,
    Calendar,
    User,
    HardDrive,
    X,
    Tag,
    Layers,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { Game } from "@/types";

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export default function GameDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const id = params.id as string;

    useEffect(() => {
        api
            .get(`/games/${id}`)
            .then((res) => setGame(res.data))
            .catch(() => router.push("/games"))
            .finally(() => setLoading(false));
    }, [id, router]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this game?")) return;
        setDeleting(true);
        try {
            await api.delete(`/games/${id}`);
            router.push("/games");
        } catch {
            alert("Failed to delete game");
            setDeleting(false);
        }
    };

    const isOwner =
        user &&
        game &&
        (typeof game.uploadedBy === "object" && game.uploadedBy
            ? game.uploadedBy._id === user.id
            : game.uploadedBy === user.id);

    const uploaderName =
        game && typeof game.uploadedBy === "object" && game.uploadedBy
            ? game.uploadedBy.username
            : "Unknown";

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
                <div className="h-6 w-32 animate-pulse bg-muted mb-6" />
                <div className="border border-border p-6">
                    <div className="h-8 w-2/3 animate-pulse bg-muted mb-4" />
                    <div className="h-4 w-full animate-pulse bg-muted mb-2" />
                    <div className="h-4 w-1/2 animate-pulse bg-muted" />
                </div>
            </div>
        );
    }

    if (!game) return null;

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            {/* Back link */}
            <Link
                href="/games"
                className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to games
            </Link>

            {/* Game info card */}
            <div className="border border-border bg-card">
                <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {game.title}
                            </h1>
                            {game.description && (
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    {game.description}
                                </p>
                            )}
                        </div>
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex items-center gap-1.5 border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        )}
                    </div>

                    {/* Meta info */}
                    <div className="mt-6 flex flex-wrap gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            {uploaderName}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(game.createdAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            {game.fileType === "zip" ? (
                                <Archive className="h-3.5 w-3.5" />
                            ) : (
                                <FileCode className="h-3.5 w-3.5" />
                            )}
                            {game.fileType.toUpperCase()} · {formatSize(game.fileSize)}
                        </span>
                        {game.category && (
                            <span className="flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5" />
                                {game.category}
                            </span>
                        )}
                        {game.genre && (
                            <span className="flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5" />
                                {game.genre}
                            </span>
                        )}
                        {game.playCount != null && (
                            <span className="flex items-center gap-1.5">
                                <Play className="h-3.5 w-3.5" />
                                {game.playCount} play{game.playCount !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    {/* Play button */}
                    <div className="mt-6">
                        <button
                            onClick={() => setPlaying(!playing)}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors ${playing
                                ? "border border-border hover:bg-accent"
                                : "border border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                                }`}
                        >
                            {playing ? (
                                <>
                                    <X className="h-4 w-4" />
                                    Close Game
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4" />
                                    Play Game
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Game iframe */}
            {playing && (
                <div className="mt-4 border border-border">
                    <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Now Playing
                        </span>
                        <button
                            onClick={() => setPlaying(false)}
                            className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <iframe
                        src={`${API_BASE}/games/${id}/play`}
                        className="h-[600px] w-full bg-white"
                        title={game.title}
                        sandbox="allow-scripts allow-same-origin"
                    />
                </div>
            )}
        </div>
    );
}
