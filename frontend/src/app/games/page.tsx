"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";
import api from "@/lib/api";
import GameCard from "@/components/GameCard";
import type { Game, PaginationMeta } from "@/types";

export default function BrowseGamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [sortBy, setSortBy] = useState("");

    const limit = 20;

    const fetchGames = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await api.get("/games", {  params: {
        page: p,
        limit,
        search: search || undefined,
        category: category || undefined,
        sortBy: sortBy || undefined,
      }, });
            setGames(res.data.games);
            setPagination(res.data.pagination);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [search, category, sortBy]);

    useEffect(() => {
        fetchGames(page);
    }, [page, fetchGames]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Browse Games</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Discover and play HTML games from the community
                    {pagination && (
                        <span className="ml-1">
                            — {pagination.total} game{pagination.total !== 1 ? "s" : ""}
                        </span>
                    )}
                </p>
            </div>
            
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input
                value={search}
                onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
                }}
                placeholder="Search games..."
                className="w-full sm:w-auto border border-border px-3 py-2 text-sm"

            />

            <select
                value={category}
                onChange={(e) => {
                setPage(1);
                setCategory(e.target.value);
                }}
                className="w-full sm:w-auto border border-border px-3 py-2 text-sm"

            >
                <option value="">All Categories</option>
                <option value="Action">Action</option>
                <option value="Adventure">Adventure</option>
                <option value="Puzzle">Puzzle</option>
                <option value="Arcade">Arcade</option>
                <option value="RPG">RPG</option>
            </select>

            <select
                value={sortBy}
                onChange={(e) => {
                setPage(1);
                setSortBy(e.target.value);
                }}
                className="w-full sm:w-auto border border-border px-3 py-2 text-sm"

            >
                <option value="">Newest</option>
                <option value="mostPlayed">Most Played</option>
            </select>
            </div>
        

            {/* Game Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {Array.from({ length: limit }).map((_, i) => (
                        <div key={i} className="border border-border">
                            <div className="h-40 animate-pulse bg-muted" />
                            <div className="border-t border-border p-3">
                                <div className="h-4 w-2/3 animate-pulse bg-muted" />
                                <div className="mt-2 h-3 w-1/3 animate-pulse bg-muted" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : games.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">

                    {games.map((game) => (
                        <GameCard key={game._id} game={game} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
                    <Gamepad2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No games found.</p>
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">

                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="flex items-center gap-1 border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Previous
                    </button>
                    <span className="px-3 py-1.5 text-sm text-muted-foreground">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={page >= pagination.totalPages}
                        className="flex items-center gap-1 border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
