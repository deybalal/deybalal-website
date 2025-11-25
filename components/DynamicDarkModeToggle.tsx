"use client";

import dynamic from "next/dynamic";

const DarkModeToggle = dynamic(() => import("@/components/DarkModeToggle"), {
  ssr: false,
});

export default DarkModeToggle;
