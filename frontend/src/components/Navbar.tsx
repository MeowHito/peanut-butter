"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/lib/auth";
import {
    Gamepad2,
    Upload,
    User,
    LogOut,
    Shield,
    ChevronDown,
    Menu,
    X,
} from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, hydrate } = useAuthStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        router.push("/");
    };

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/games", label: "Browse" },
    ];

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                    <span>Peanut Butter</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden items-center gap-1 md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-3 py-1.5 text-sm font-medium transition-colors ${isActive(link.href)
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {user && (
                        <Link
                            href="/upload"
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${isActive("/upload")
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Upload
                        </Link>
                    )}
                </nav>

                {/* Desktop Auth */}
                <div className="hidden items-center gap-2 md:flex">
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                            >
                                <User className="h-3.5 w-3.5" />
                                {user.username}
                                <ChevronDown className="h-3 w-3" />
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-1 w-48 border border-border bg-card shadow-lg">
                                    <Link
                                        href="/profile"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent"
                                    >
                                        <User className="h-3.5 w-3.5" />
                                        Profile
                                    </Link>
                                    {user.role === 'admin' && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent"
                                        >
                                            <Shield className="h-3.5 w-3.5" />
                                            Admin
                                        </Link>
                                    )}
                                    <hr className="border-border" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive transition-colors hover:bg-accent"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/register"
                                className="border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile menu button */}
                <button
                    className="md:hidden p-1.5"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile Nav */}
            {mobileOpen && (
                <div className="border-t border-border bg-background px-4 py-3 md:hidden">
                    <nav className="flex flex-col gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${isActive(link.href)
                                    ? "bg-accent text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {user && (
                            <Link
                                href="/upload"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <Upload className="h-3.5 w-3.5" />
                                Upload
                            </Link>
                        )}
                        <hr className="my-1 border-border" />
                        {user ? (
                            <>
                                <Link
                                    href="/profile"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <User className="h-3.5 w-3.5" />
                                    Profile
                                </Link>
                                {user.role === 'admin' && (
                                    <Link
                                        href="/admin"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <Shield className="h-3.5 w-3.5" />
                                        Admin
                                    </Link>
                                )}
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setMobileOpen(false);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-accent"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Log out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setMobileOpen(false)}
                                    className="px-3 py-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
