"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Gamepad2, Star } from "lucide-react";
import api from "@/lib/api";
import GameCard from "@/components/GameCard";
import type { Game } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/games", { params: { page: 1, limit: 8 } }),
      api.get("/games/featured").catch(() => ({ data: [] })),
    ])
      .then(([gamesRes, featuredRes]) => {
        setGames(gamesRes.data.games);
        setFeaturedGames(
          Array.isArray(featuredRes.data) ? featuredRes.data : []
        );
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Gamepad2 className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Web Games Platform
              </span>
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Play, share, and discover
              <br />
              HTML games online
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Upload your HTML and ZIP game files, share them with the
              community, and play directly in the browser. No installs
              needed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/games"
                className="inline-flex items-center gap-2 border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Browse Games
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
              >
                Upload a Game
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Games */}
      {featuredGames.length > 0 && (
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="mb-5 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold tracking-tight">
                Featured Games
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {featuredGames.map((game) => (
                <Link
                  key={game._id}
                  href={`/games/${game._id}`}
                  className="group flex-shrink-0 w-56 border border-border bg-card transition-colors hover:border-foreground/20"
                >
                  <div className="relative flex h-32 items-center justify-center bg-muted">
                    {game.thumbnailUrl ? (
                      <img
                        src={game.thumbnailUrl.startsWith('http') ? game.thumbnailUrl : `${API_BASE}${game.thumbnailUrl}`}
                        alt={game.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Gamepad2 className="h-8 w-8 text-muted-foreground/40" />
                    )}
                    <span className="absolute right-1.5 top-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    </span>
                  </div>
                  <div className="border-t border-border p-2.5">
                    <h3 className="text-sm font-semibold truncate group-hover:text-primary">
                      {game.title}
                    </h3>
                    {game.category && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {game.category}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Games */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            Recent Games
          </h2>
          <Link
            href="/games"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {games.map((game) => (
              <GameCard key={game._id} game={game} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed border-border py-16 text-center">
            <Gamepad2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No games uploaded yet. Be the first!
            </p>
            <Link
              href="/upload"
              className="mt-4 border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Upload a Game
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
