// src/components/ui/Badge.tsx
import React, { HTMLAttributes } from "react";
import "./ui.css";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "default";
}

export function Badge({ children, variant = "default", className = "", ...props }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {children}
    </span>
  );
}
