"use client";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react'

function DarkModeToggle() {
      const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
          <div className="w-full px-6 mt-auto">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer"
        >
          {mounted && theme === 'light' ? (
            <Moon className="w-6 h-6 min-w-[24px]" />
          ) : (
            <Sun className="w-6 h-6 min-w-[24px]" />
          )}
          <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-medium">
            {mounted && theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
      </div>
  )
}

export default DarkModeToggle