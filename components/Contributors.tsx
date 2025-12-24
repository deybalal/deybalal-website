"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Music, FileText, Timer } from "lucide-react";
import { Contributor } from "@/types/types";

interface ContributorsProps {
  contributors: Contributor[];
}

export const Contributors = ({ contributors }: ContributorsProps) => {
  if (!contributors || contributors.length === 0) return null;

  const grouped = contributors.reduce((acc, curr) => {
    if (!acc[curr.type]) acc[curr.type] = [];
    acc[curr.type].push(curr);
    return acc;
  }, {} as Record<string, Contributor[]>);

  const typeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    add: { label: "Added by", icon: <Music className="size-4" /> },
    lyrics: { label: "Lyrics by", icon: <FileText className="size-4" /> },
    sync: { label: "Synced by", icon: <Timer className="size-4" /> },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {Object.entries(grouped).map(([type, users]) => (
        <div
          key={type}
          className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all group"
        >
          <div className="flex items-center gap-2 mb-4 text-gray-400 group-hover:text-white transition-colors">
            {typeLabels[type]?.icon}
            <span className="text-sm font-medium uppercase tracking-wider">
              {typeLabels[type]?.label || type}
            </span>
          </div>

          <div className="space-y-4">
            {users.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3"
              >
                <Link
                  href={`/u/${c.user.userSlug}`}
                  className="flex items-center gap-3 group/user"
                >
                  <div className="relative size-10 rounded-full overflow-hidden border-2 border-white/10 group-hover/user:border-indigo-500 transition-colors">
                    {c.user.image ? (
                      <Image
                        src={c.user.image}
                        alt={c.user.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="size-full bg-indigo-500/20 flex items-center justify-center">
                        <User className="size-5 text-indigo-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white group-hover/user:text-indigo-400 transition-colors line-clamp-1">
                      {c.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      @{c.user.userSlug}
                    </span>
                  </div>
                </Link>

                {c.type !== "add" && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      {c.percentage}%
                    </span>
                    <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
