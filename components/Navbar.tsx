"use client";
import { Home, Disc, Mic2, ListMusic, Heart, User, Search } from "lucide-react";
import Link from "next/link";
import DynamicDarkModeToggle from "@/components/DynamicDarkModeToggle";

const Navbar = () => {
  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Dashboard", href: "/panel", icon: User },
    { name: "Albums", href: "/album", icon: Disc },
    { name: "Artists", href: "/artist", icon: Mic2 },
    { name: "Playlists", href: "/playlists", icon: ListMusic },
    { name: "Favorites", href: "/favorites", icon: Heart },
  ];

  return (
    <nav className="fixed hover:bg-background/90 top-0 left-0 h-screen w-20 hidden md:flex flex-col items-center py-8 z-50 transition-all duration-300 hover:w-64 group overflow-hidden border-r border-white/5">
      <div className="mb-10 text-2xl font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Music Player
      </div>

      <div className="flex flex-col gap-6 w-full group-hover:bg-background/90 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center px-6 py-3 text-gray-400 hover:text-white hover:bg-foreground/10 transition-colors duration-200 relative"
          >
            <item.icon className="w-6 h-6 min-w-[24px]" />
            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-medium">
              {item.name}
            </span>
            {/* Active Indicator (Simplified for now, can be dynamic based on pathname) */}
            <div className="absolute left-0 top-0 h-full w-1 bg-accent opacity-0 hover:opacity-100 transition-opacity" />
          </Link>
        ))}

        {/* Theme Toggle */}
        <div className="flex items-center py-3 text-gray-400 hover:text-white hover:bg-foreground/10 transition-colors duration-200 relative">
          <DynamicDarkModeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
