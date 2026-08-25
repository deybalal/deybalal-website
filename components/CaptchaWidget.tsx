"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CaptchaWidgetProps {
  onTokenChange: (token: string) => void;
  onAnswerChange: (answer: string) => void;
  answer: string;
  disabled?: boolean;
}

export function CaptchaWidget({
  onTokenChange,
  onAnswerChange,
  answer,
  disabled,
}: CaptchaWidgetProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCaptcha = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/captcha", { cache: "no-store" });
      const svg = await res.text();
      const newToken = res.headers.get("X-Captcha-Token") || "";
      setSvgContent(svg);
      setToken(newToken);
      onTokenChange(newToken);
    } catch {
      // silently fail — user can retry via refresh
    } finally {
      setIsLoading(false);
    }
  }, [onTokenChange]);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  return (
    <div className="captcha-widget space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="text-sm font-medium text-foreground/80">تأیید امنیتی</span>
      </div>

      <div className="flex items-center gap-3">
        {/* SVG display box */}
        <div
          className="captcha-svg-box relative flex items-center justify-center rounded-xl overflow-hidden border border-white/10 bg-linear-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm"
          style={{ minWidth: 200, height: 60 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-full">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          ) : (
            <div
              className="captcha-svg-content"
              dangerouslySetInnerHTML={{ __html: svgContent }}
              style={{ lineHeight: 0 }}
            />
          )}
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={fetchCaptcha}
          disabled={isLoading || disabled}
          title="تغییر کپچا"
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/30 text-muted-foreground hover:text-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="تغییر کپچا"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Answer input */}
      <Input
        type="text"
        inputMode="numeric"
        placeholder="جواب عملیات ریاضی را وارد کنید"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={disabled || isLoading}
        required
        maxLength={4}
        autoComplete="off"
        className="text-center tracking-widest font-mono text-lg"
        aria-label="جواب کپچا"
      />

      {/* Hidden token input for form submission traceability */}
      <input type="hidden" value={token} readOnly />
    </div>
  );
}
