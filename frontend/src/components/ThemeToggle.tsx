import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
    const { setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-full shrink-0">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Changer le thème</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[140px] p-1.5 shadow-premium border-primary/10 rounded-xl">
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2.5 px-3 py-2 cursor-pointer transition-all hover:translate-x-1">
                    <Sun className="h-4 w-4 text-orange-500" />
                    <span>Clair</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2.5 px-3 py-2 cursor-pointer transition-all hover:translate-x-1">
                    <Moon className="h-4 w-4 text-blue-500" />
                    <span>Sombre</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2.5 px-3 py-2 cursor-pointer transition-all hover:translate-x-1 border-t mt-1 pt-2 rounded-none rounded-b-lg">
                    <Laptop className="h-4 w-4 text-muted-foreground" />
                    <span>Système</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
