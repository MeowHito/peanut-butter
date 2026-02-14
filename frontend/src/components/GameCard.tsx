import Link from "next/link";
import { Gamepad2, FileCode, Archive } from "lucide-react";
import type { Game } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GameCard({ game }: { game: Game }) {
    const uploader =
        typeof game.uploadedBy === "object"
            ? game.uploadedBy.username
            : "Unknown";

    return (
        <Link
            href={`/games/${game._id}`}
            className="group block border border-border bg-card transition-colors hover:border-foreground/20"
        >
            {/* Thumbnail area */}
            <div className="relative flex h-40 items-center justify-center bg-muted">
                {game.thumbnailUrl ? (
                    <img
                        src={`${API_BASE}${game.thumbnailUrl}`}
                        alt={game.title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <Gamepad2 className="h-10 w-10 text-muted-foreground/40" />
                )}
                {/* File type badge */}
                <span className="absolute right-2 top-2 flex items-center gap-1 border border-border bg-background/90 px-1.5 py-0.5 text-xs font-medium uppercase text-muted-foreground">
                    {game.fileType === "zip" ? (
                        <Archive className="h-3 w-3" />
                    ) : (
                        <FileCode className="h-3 w-3" />
                    )}
                    {game.fileType}
                </span>
            </div>

            {/* Content */}
            <div className="border-t border-border p-3">
                <h3 className="text-sm font-semibold leading-snug group-hover:text-primary truncate">
                    {game.title}
                </h3>
                <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{uploader}</span>
                    <span>{formatSize(game.fileSize)}</span>
                </div>
            </div>
        </Link>
    );
}
