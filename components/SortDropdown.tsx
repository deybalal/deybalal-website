"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SortOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface SortDropdownProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SortDropdown({
  options,
  value,
  onChange,
  placeholder = "مرتب‌سازی",
  className,
}: SortDropdownProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`w-[180px] bg-card/50 border-white/10 hover:bg-card/80 transition-colors rtl ${className}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-card border-white/10 rtl">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="hover:bg-white/5 focus:bg-white/5 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {option.icon}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
