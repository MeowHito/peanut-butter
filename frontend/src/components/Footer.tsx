import Link from "next/link";
import { Gamepad2 } from "lucide-react";

export default function Footer() {
    return (
        <footer className="border-t border-border bg-background">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Gamepad2 className="h-4 w-4" />
                    <span>&copy; {new Date().getFullYear()} Peanut Butter</span>
                </div>
                <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Link href="/games" className="transition-colors hover:text-foreground">
                        Browse Games
                    </Link>
                    <Link href="/upload" className="transition-colors hover:text-foreground">
                        Upload
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
