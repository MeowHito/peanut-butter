"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Gamepad2,
    Users,
    Trash2,
    ExternalLink,
    FileCode,
    Archive,
    Eye,
    EyeOff,
    Pencil,
    X,
    Loader2,
    ImagePlus,
    Save,
    Play,
    ShieldAlert,
    Star,
    HardDrive,
    UserCog,
    Layers,
    Plus,
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
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Extended Game type for admin
interface AdminGame extends Game {
    isVisible?: boolean;
    isFeatured?: boolean;
}

interface AdminUser {
    _id: string;
    username: string;
    email: string;
    role: string;
    createdAt?: string;
}

interface AdminStats {
    total: number;
    visible: number;
    featured: number;
    totalSize: number;
}

interface AdminCategory {
    _id: string;
    name: string;
    description: string;
    playCount: number;
    createdAt?: string;
}

// Edit Modal Component
function EditModal({
    game,
    onClose,
    onSaved,
}: {
    game: AdminGame;
    onClose: () => void;
    onSaved: (updated: AdminGame) => void;
}) {
    const [title, setTitle] = useState(game.title);
    const [description, setDescription] = useState(game.description || "");
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
        game.thumbnailUrl ? (game.thumbnailUrl.startsWith('http') ? game.thumbnailUrl : `${API_BASE}${game.thumbnailUrl}`) : null
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.startsWith("image/")) return;
        setThumbnail(f);
        setThumbnailPreview(URL.createObjectURL(f));
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("description", description.trim());
            if (thumbnail) {
                formData.append("thumbnail", thumbnail);
            }

            const res = await api.patch(`/games/${game._id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            onSaved({
                ...game,
                title: res.data.game.title,
                description: res.data.game.description,
                thumbnailUrl: res.data.game.thumbnailUrl,
            });
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || "Failed to update");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg border border-border bg-background shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 className="text-sm font-semibold">Edit Game</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4 p-4">
                    {/* Thumbnail */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Cover Image
                        </label>
                        {thumbnailPreview ? (
                            <div className="relative border border-border">
                                <img
                                    src={thumbnailPreview}
                                    alt="Thumbnail"
                                    className="h-32 w-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setThumbnail(null);
                                        setThumbnailPreview(null);
                                    }}
                                    className="absolute right-1 top-1 bg-background/80 p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-border py-4 text-center transition-colors hover:border-muted-foreground">
                                <ImagePlus className="mb-1 h-5 w-5 text-muted-foreground/50" />
                                <p className="text-xs text-muted-foreground">Upload image</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleThumbnailChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                            className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
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
                            className="w-full resize-none border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                    </div>

                    {error && (
                        <div className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { user, hydrate } = useAuthStore();
    const [games, setGames] = useState<AdminGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [featuringId, setFeaturingId] = useState<string | null>(null);
    const [editingGame, setEditingGame] = useState<AdminGame | null>(null);
    const [previewGameId, setPreviewGameId] = useState<string | null>(null);

    // Admin stats from API
    const [stats, setStats] = useState<AdminStats | null>(null);

    // User management
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    // Category management
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [newCatName, setNewCatName] = useState("");
    const [newCatDesc, setNewCatDesc] = useState("");
    const [addingCat, setAddingCat] = useState(false);
    const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editCatName, setEditCatName] = useState("");
    const [editCatDesc, setEditCatDesc] = useState("");
    const [savingCatId, setSavingCatId] = useState<string | null>(null);

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
    }, [router]);

    const fetchGames = async () => {
        setLoading(true);
        try {
            const res = await api.get("/games/admin/all", {
                params: { page: 1, limit: 100 },
            });
            setGames(res.data.games);
        } catch {
            // fail silently
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get("/games/admin/stats");
            setStats(res.data);
        } catch {
            // fail silently
        }
    };

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await api.get("/users");
            setUsers(res.data.users || res.data);
        } catch {
            // fail silently
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchCategories = async () => {
        setCategoriesLoading(true);
        try {
            const res = await api.get("/categories");
            setCategories(res.data);
        } catch {
            // fail silently
        } finally {
            setCategoriesLoading(false);
        }
    };

    useEffect(() => {
        fetchGames();
        fetchStats();
        fetchUsers();
        fetchCategories();
    }, []);

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        setAddingCat(true);
        try {
            const res = await api.post("/categories", {
                name: newCatName.trim(),
                description: newCatDesc.trim(),
            });
            setCategories((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
            setNewCatName("");
            setNewCatDesc("");
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            alert(axiosErr.response?.data?.message || "Failed to add category");
        } finally {
            setAddingCat(false);
        }
    };

    const handleUpdateCategory = async (id: string) => {
        setSavingCatId(id);
        try {
            const res = await api.patch(`/categories/${id}`, {
                name: editCatName.trim(),
                description: editCatDesc.trim(),
            });
            setCategories((prev) =>
                prev.map((c) => (c._id === id ? res.data : c))
            );
            setEditingCatId(null);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            alert(axiosErr.response?.data?.message || "Failed to update category");
        } finally {
            setSavingCatId(null);
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`Delete category "${name}"?`)) return;
        setDeletingCatId(id);
        try {
            await api.delete(`/categories/${id}`);
            setCategories((prev) => prev.filter((c) => c._id !== id));
        } catch {
            alert("Failed to delete category");
        } finally {
            setDeletingCatId(null);
        }
    };

    const handleToggleVisibility = async (id: string) => {
        setTogglingId(id);
        try {
            const res = await api.patch(`/games/${id}/visibility`);
            setGames((prev) =>
                prev.map((g) =>
                    g._id === id ? { ...g, isVisible: res.data.isVisible } : g
                )
            );
            fetchStats();
        } catch {
            alert("Failed to toggle visibility");
        } finally {
            setTogglingId(null);
        }
    };

    const handleToggleFeatured = async (id: string) => {
        setFeaturingId(id);
        try {
            const res = await api.patch(`/games/${id}/featured`);
            setGames((prev) =>
                prev.map((g) =>
                    g._id === id ? { ...g, isFeatured: res.data.isFeatured } : g
                )
            );
            fetchStats();
        } catch {
            alert("Failed to toggle featured");
        } finally {
            setFeaturingId(null);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;
        setDeletingId(id);
        try {
            await api.delete(`/games/${id}`);
            setGames((prev) => prev.filter((g) => g._id !== id));
            fetchStats();
        } catch {
            alert("Failed to delete game");
        } finally {
            setDeletingId(null);
        }
    };

    const handleGameUpdated = (updated: AdminGame) => {
        setGames((prev) =>
            prev.map((g) => (g._id === updated._id ? updated : g))
        );
        setEditingGame(null);
    };

    const handleChangeRole = async (userId: string, newRole: string) => {
        setChangingRoleId(userId);
        try {
            await api.patch(`/users/${userId}/role`, { role: newRole });
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
            );
        } catch {
            alert("Failed to change role");
        } finally {
            setChangingRoleId(null);
        }
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
        setDeletingUserId(userId);
        try {
            await api.delete(`/users/${userId}`);
            setUsers((prev) => prev.filter((u) => u._id !== userId));
        } catch {
            alert("Failed to delete user");
        } finally {
            setDeletingUserId(null);
        }
    };

    if (!user) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-16 text-center">
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (user.role !== "admin") {
        return (
            <div className="mx-auto max-w-xl px-4 py-24 text-center">
                <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-destructive/60" />
                <h1 className="text-xl font-bold">Access Denied</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    You do not have admin privileges to access this page.
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Manage games, users, toggle visibility, and edit details
            </p>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div className="border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Gamepad2 className="h-4 w-4" />
                        Total Games
                    </div>
                    <p className="mt-1 text-2xl font-bold">
                        {stats?.total ?? games.length}
                    </p>
                </div>
                <div className="border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        Visible
                    </div>
                    <p className="mt-1 text-2xl font-bold text-green-600">
                        {stats?.visible ?? games.filter((g) => g.isVisible).length}
                    </p>
                </div>
                <div className="border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <EyeOff className="h-4 w-4" />
                        Hidden
                    </div>
                    <p className="mt-1 text-2xl font-bold text-amber-600">
                        {stats
                            ? stats.total - stats.visible
                            : games.filter((g) => !g.isVisible).length}
                    </p>
                </div>
                <div className="border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4" />
                        Featured
                    </div>
                    <p className="mt-1 text-2xl font-bold text-amber-500">
                        {stats?.featured ?? 0}
                    </p>
                </div>
                <div className="border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <HardDrive className="h-4 w-4" />
                        Total Size
                    </div>
                    <p className="mt-1 text-2xl font-bold">
                        {formatSize(stats?.totalSize ?? 0)}
                    </p>
                </div>
            </div>

            {/* Games Table */}
            <div className="mt-8">
                <h2 className="mb-4 text-lg font-bold tracking-tight">All Games</h2>
                {loading ? (
                    <div className="border border-border">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
                            >
                                <div className="h-4 w-1/4 animate-pulse bg-muted" />
                                <div className="h-4 w-1/6 animate-pulse bg-muted" />
                                <div className="h-4 w-1/6 animate-pulse bg-muted" />
                            </div>
                        ))}
                    </div>
                ) : games.length > 0 ? (
                    <div className="border border-border overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className="px-4 py-2.5 text-left font-semibold">Game</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">
                                        Uploader
                                    </th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Type</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Size</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Date</th>
                                    <th className="px-4 py-2.5 text-center font-semibold">
                                        Visible
                                    </th>
                                    <th className="px-4 py-2.5 text-center font-semibold">
                                        Featured
                                    </th>
                                    <th className="px-4 py-2.5 text-right font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {games.map((game) => (
                                    <tr
                                        key={game._id}
                                        className={`border-b border-border last:border-b-0 transition-colors hover:bg-accent/50 ${!game.isVisible ? "opacity-60" : ""
                                            }`}
                                    >
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                {game.thumbnailUrl ? (
                                                    <img
                                                        src={game.thumbnailUrl.startsWith('http') ? game.thumbnailUrl : `${API_BASE}${game.thumbnailUrl}`}
                                                        alt=""
                                                        className="h-8 w-8 border border-border object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-8 w-8 items-center justify-center border border-border bg-muted">
                                                        <Gamepad2 className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <span className="font-medium truncate max-w-[200px]">
                                                    {game.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                            {typeof game.uploadedBy === "object" && game.uploadedBy
                                                ? game.uploadedBy.username
                                                : "Unknown"}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="inline-flex items-center gap-1 text-xs uppercase text-muted-foreground">
                                                {game.fileType === "zip" ? (
                                                    <Archive className="h-3 w-3" />
                                                ) : (
                                                    <FileCode className="h-3 w-3" />
                                                )}
                                                {game.fileType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                            {formatSize(game.fileSize)}
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                            {formatDate(game.createdAt)}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <button
                                                onClick={() =>
                                                    handleToggleVisibility(game._id)
                                                }
                                                disabled={togglingId === game._id}
                                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${game.isVisible
                                                    ? "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                                                    : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                                                    }`}
                                                title={
                                                    game.isVisible
                                                        ? "Click to hide"
                                                        : "Click to show"
                                                }
                                            >
                                                {togglingId === game._id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : game.isVisible ? (
                                                    <Eye className="h-3 w-3" />
                                                ) : (
                                                    <EyeOff className="h-3 w-3" />
                                                )}
                                                {game.isVisible ? "ON" : "OFF"}
                                            </button>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <button
                                                onClick={() =>
                                                    handleToggleFeatured(game._id)
                                                }
                                                disabled={featuringId === game._id}
                                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${game.isFeatured
                                                    ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                                                    : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                                                    }`}
                                                title={
                                                    game.isFeatured
                                                        ? "Click to unfeature"
                                                        : "Click to feature"
                                                }
                                            >
                                                {featuringId === game._id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Star
                                                        className={`h-3 w-3 ${game.isFeatured
                                                            ? "fill-amber-400"
                                                            : ""
                                                            }`}
                                                    />
                                                )}
                                                {game.isFeatured ? "YES" : "NO"}
                                            </button>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setEditingGame(game)}
                                                    className="p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <a
                                                    href={`/games/${game._id}`}
                                                    className="p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                                                    title="View"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                                <button
                                                    onClick={() =>
                                                        setPreviewGameId(game._id)
                                                    }
                                                    className="p-1.5 text-muted-foreground transition-colors hover:text-primary"
                                                    title="Preview game file"
                                                >
                                                    <Play className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(game._id, game.title)
                                                    }
                                                    disabled={deletingId === game._id}
                                                    className="p-1.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center border border-dashed border-border py-12 text-center">
                        <Gamepad2 className="mb-3 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No games yet.</p>
                    </div>
                )}
            </div>

            {/* User Management */}
            <div className="mt-10">
                <div className="mb-4 flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-bold tracking-tight">
                        User Management
                    </h2>
                </div>
                {usersLoading ? (
                    <div className="border border-border">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
                            >
                                <div className="h-4 w-1/4 animate-pulse bg-muted" />
                                <div className="h-4 w-1/4 animate-pulse bg-muted" />
                                <div className="h-4 w-1/6 animate-pulse bg-muted" />
                            </div>
                        ))}
                    </div>
                ) : users.length > 0 ? (
                    <div className="border border-border overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className="px-4 py-2.5 text-left font-semibold">
                                        Username
                                    </th>
                                    <th className="px-4 py-2.5 text-left font-semibold">
                                        Email
                                    </th>
                                    <th className="px-4 py-2.5 text-left font-semibold">
                                        Role
                                    </th>
                                    <th className="px-4 py-2.5 text-right font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr
                                        key={u._id}
                                        className="border-b border-border last:border-b-0 transition-colors hover:bg-accent/50"
                                    >
                                        <td className="px-4 py-2.5 font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center border border-border bg-muted text-xs font-bold uppercase text-muted-foreground">
                                                    {u.username.charAt(0)}
                                                </div>
                                                {u.username}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                            {u.email}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <select
                                                value={u.role}
                                                onChange={(e) =>
                                                    handleChangeRole(u._id, e.target.value)
                                                }
                                                disabled={changingRoleId === u._id}
                                                className={`border bg-background px-2 py-1 text-xs font-medium transition-colors focus:outline-none disabled:opacity-50 ${u.role === "admin"
                                                    ? "border-primary/30 text-primary"
                                                    : "border-border text-muted-foreground"
                                                    }`}
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <button
                                                onClick={() =>
                                                    handleDeleteUser(u._id, u.username)
                                                }
                                                disabled={deletingUserId === u._id}
                                                className="p-1.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                                                title="Delete user"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center border border-dashed border-border py-8 text-center">
                        <Users className="mb-3 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No users found.</p>
                    </div>
                )}
            </div>

            {/* Categories Management */}
            <div className="mt-10">
                <div className="mb-4 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-bold tracking-tight">
                        Category Management
                    </h2>
                </div>

                {/* Add Category Form */}
                <div className="mb-4 flex flex-col gap-2 border border-border bg-card p-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">Name</label>
                        <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="Category name"
                            maxLength={50}
                            className="w-full border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">Description</label>
                        <input
                            type="text"
                            value={newCatDesc}
                            onChange={(e) => setNewCatDesc(e.target.value)}
                            placeholder="Short description"
                            maxLength={200}
                            className="w-full border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={handleAddCategory}
                        disabled={addingCat || !newCatName.trim()}
                        className="inline-flex items-center gap-1.5 border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                        {addingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Add
                    </button>
                </div>

                {/* Categories Table */}
                {categoriesLoading ? (
                    <div className="border border-border">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
                                <div className="h-4 w-1/4 animate-pulse bg-muted" />
                                <div className="h-4 w-1/3 animate-pulse bg-muted" />
                                <div className="h-4 w-1/6 animate-pulse bg-muted" />
                            </div>
                        ))}
                    </div>
                ) : categories.length > 0 ? (
                    <div className="border border-border overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className="px-4 py-2.5 text-left font-semibold">Name</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Description</th>
                                    <th className="px-4 py-2.5 text-center font-semibold">Total Plays</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((cat) => (
                                    <tr key={cat._id} className="border-b border-border last:border-b-0 transition-colors hover:bg-accent/50">
                                        <td className="px-4 py-2.5 font-medium">
                                            {editingCatId === cat._id ? (
                                                <input
                                                    type="text"
                                                    value={editCatName}
                                                    onChange={(e) => setEditCatName(e.target.value)}
                                                    className="w-full border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                                                />
                                            ) : (
                                                cat.name
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground">
                                            {editingCatId === cat._id ? (
                                                <input
                                                    type="text"
                                                    value={editCatDesc}
                                                    onChange={(e) => setEditCatDesc(e.target.value)}
                                                    className="w-full border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                                                />
                                            ) : (
                                                cat.description || "—"
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className="inline-flex items-center gap-1 text-xs">
                                                <Play className="h-3 w-3" />
                                                {cat.playCount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {editingCatId === cat._id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateCategory(cat._id)}
                                                            disabled={savingCatId === cat._id}
                                                            className="p-1.5 text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
                                                            title="Save"
                                                        >
                                                            {savingCatId === cat._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingCatId(null)}
                                                            className="p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                                                            title="Cancel"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingCatId(cat._id);
                                                            setEditCatName(cat.name);
                                                            setEditCatDesc(cat.description || "");
                                                        }}
                                                        className="p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteCategory(cat._id, cat.name)}
                                                    disabled={deletingCatId === cat._id}
                                                    className="p-1.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center border border-dashed border-border py-8 text-center">
                        <Layers className="mb-3 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No categories yet.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingGame && (
                <EditModal
                    game={editingGame}
                    onClose={() => setEditingGame(null)}
                    onSaved={handleGameUpdated}
                />
            )}

            {/* Preview Iframe */}
            {previewGameId && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black/50">
                    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2">
                        <span className="text-sm font-semibold">Game Preview</span>
                        <button
                            onClick={() => setPreviewGameId(null)}
                            className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <iframe
                        src={`${API_BASE}/games/${previewGameId}/play`}
                        className="flex-1 bg-white"
                        title="Game preview"
                    />
                </div>
            )}
        </div>
    );
}
