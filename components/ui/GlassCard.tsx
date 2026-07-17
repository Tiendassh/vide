import { cn } from "@/lib/utils";
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white/5 backdrop-blur-xl",
        "border border-white/10",
        "shadow-2xl shadow-black/20",
        hover && "transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
