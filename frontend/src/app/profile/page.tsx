"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, Gamepad2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import GameCard from "@/components/GameCard";
import type { Game } from "@/types";

export default function ProfilePage() {
    const router = useRouter();
    const { user, hydrate, fetchProfile } = useAuthStore();
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }
        }
        fetchProfile();
    }, [router, fetchProfile]);

    useEffect(() => {
        // Fetch user's games
        api
            .get("/games", { params: { page: 1, limit: 100 } })
            .then((res) => {
                if (user) {
                    const myGames = res.data.games.filter((g: Game) => {
                        const uploaderId =
                            typeof g.uploadedBy === "object" && g.uploadedBy ? g.uploadedBy._id : g.uploadedBy;
                        return uploaderId === user.id;
                    });
                    setGames(myGames);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [user]);

    if (!user) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-16 text-center">
                <p className="text-sm text-muted-foreground">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
            {/* Profile Card */}
            <div className="border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center border border-border bg-muted text-xl font-bold uppercase text-muted-foreground">
                        {user.username.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold tracking-tight">{user.username}</h1>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                {user.email}
                            </span>
                            {user.createdAt && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Joined{" "}
                                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                    })}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Gamepad2 className="h-3.5 w-3.5" />
                                {games.length} game{games.length !== 1 ? "s" : ""} uploaded
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* User's Games */}
            <div className="mt-8">
                <h2 className="mb-4 text-lg font-bold tracking-tight">Your Games</h2>
                {loading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {games.map((game) => (
                            <GameCard key={game._id} game={game} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center border border-dashed border-border py-12 text-center">
                        <Gamepad2 className="mb-3 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            You haven&apos;t uploaded any games yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
