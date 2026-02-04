"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import toast from "react-hot-toast";

let deferredPrompt: unknown | null = null;

const InstallPWA = () => {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as unknown;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const installHandler = async () => {
    if (!deferredPrompt) return;

    // @ts-expect-error sdeawsed
    const result = await deferredPrompt.prompt();

    if (result.outcome === "accepted") {
      toast.success("PWA نصب شد!");
    } else {
      toast.error("PWA نصب نشد!");
    }

    deferredPrompt = null;
    setCanInstall(false);
  };

  if (!canInstall) return null;

  return (
    <Button variant="ghost" onClick={installHandler}>
      نصب PWA
    </Button>
  );
};

export default InstallPWA;
