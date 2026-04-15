// src/components/ui/Button.tsx
import React, { ButtonHTMLAttributes, forwardRef } from "react";
import "./ui.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`btn btn-${variant} ${size !== "md" ? `btn-${size}` : ""} ${className}`}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <span className="spinner">⏳</span>}
        {!isLoading && children}
      </button>
    );
  }
);
Button.displayName = "Button";
