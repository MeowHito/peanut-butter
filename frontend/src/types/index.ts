export interface User {
    id: string;
    username: string;
    email: string;
    role?: 'user' | 'admin';
    createdAt?: string;
}

export interface Game {
    _id: string;
    title: string;
    description: string;
    slug: string;
    uploadedBy: { _id: string; username: string } | string;
    fileType: 'html' | 'zip';
    fileSize: number;
    thumbnailUrl: string;
    isVisible?: boolean;
    isFeatured?: boolean;
    playUrl: string;
    category?: string;
    genre?: string;
    playCount?: number;
    rating?: number;
    createdAt: string;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface GamesResponse {
    games: Game[];
    pagination: PaginationMeta;
}

export interface AuthResponse {
    message: string;
    user: User;
    access_token: string;
}
