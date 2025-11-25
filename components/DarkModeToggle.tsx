"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

function DarkModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-full px-6 mt-auto">
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex items-center text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer"
      >
        {theme === "light" ? (
          <Moon className="w-6 h-6 min-w-[24px]" />
        ) : (
          <Sun className="w-6 h-6 min-w-[24px]" />
        )}
        <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-medium">
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </span>
      </button>
    </div>
  );
}

export default DarkModeToggle;
