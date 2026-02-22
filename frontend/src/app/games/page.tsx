"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Gamepad2,
    Search,
    SlidersHorizontal,
} from "lucide-react";
import api from "@/lib/api";
import GameCard from "@/components/GameCard";
import type { Game, PaginationMeta } from "@/types";

interface CategoryCount {
    _id: string;
    count: number;
}

const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "mostPlayed", label: "Most Played" },
    { value: "topRated", label: "Top Rated" },
];

export default function BrowseGamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const limit = 20;

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState<CategoryCount[]>([]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, sortBy, category]);

    // Fetch categories
    useEffect(() => {
        api
            .get("/games/categories/count")
            .then((res) => setCategories(res.data))
            .catch(() => { });
    }, []);

    // Fetch games
    const fetchGames = useCallback(
        async (p: number) => {
            setLoading(true);
            try {
                const params: Record<string, string | number> = {
                    page: p,
                    limit,
                };
                if (debouncedSearch) params.search = debouncedSearch;
                if (sortBy && sortBy !== "newest") params.sortBy = sortBy;
                if (category) params.category = category;

                const res = await api.get("/games", { params });
                setGames(res.data.games);
                setPagination(res.data.pagination);
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        },
        [debouncedSearch, sortBy, category]
    );

    useEffect(() => {
        fetchGames(page);
    }, [page, fetchGames]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Browse Games</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Discover and play HTML games from the community
                    {pagination && (
                        <span className="ml-1">
                            — {pagination.total} game
                            {pagination.total !== 1 ? "s" : ""}
                        </span>
                    )}
                </p>
            </div>

            {/* Search & Sort Toolbar */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search games..."
                        className="w-full border border-border bg-background py-2 pl-9 pr-3 text-sm transition-colors focus:border-primary focus:outline-none"
                    />
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border border-border bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Category Chips */}
            {categories.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                    <button
                        onClick={() => setCategory("")}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors border ${!category
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                            }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat._id}
                            onClick={() =>
                                setCategory(category === cat._id ? "" : cat._id)
                            }
                            className={`px-3 py-1.5 text-xs font-medium transition-colors border ${category === cat._id
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                                }`}
                        >
                            {cat._id}{" "}
                            <span className="opacity-60">({cat.count})</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Game Grid */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {games.map((game) => (
                        <GameCard key={game._id} game={game} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
                    <Gamepad2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                        {debouncedSearch || category
                            ? "No games match your filters."
                            : "No games found."}
                    </p>
                    {(debouncedSearch || category) && (
                        <button
                            onClick={() => {
                                setSearch("");
                                setCategory("");
                                setSortBy("newest");
                            }}
                            className="mt-3 border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
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
                        onClick={() =>
                            setPage((p) => Math.min(pagination.totalPages, p + 1))
                        }
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
