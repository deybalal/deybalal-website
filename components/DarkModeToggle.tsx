"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

function DarkModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="md:w-full px-6 mt-auto flex">
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex items-center text-gray-400 hover:text-foreground transition-colors duration-200 cursor-pointer gap-x-2 md:gap-x-3"
      >
        {theme === "light" ? (
          <Moon className="w-6 h-6 min-w-[24px]" />
        ) : (
          <Sun className="w-6 h-6 min-w-[24px]" />
        )}
        <span className="ml-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-medium">
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </span>
      </button>
    </div>
  );
}

export default DarkModeToggle;
