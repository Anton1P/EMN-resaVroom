// src/components/ui/Input.tsx
import React, { InputHTMLAttributes, forwardRef } from "react";
import "./ui.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, ...props }, ref) => {
    return (
      <div className="form-field">
        {label && <label className="form-label">{label}</label>}
        <input
          ref={ref}
          className={`form-input ${className}`}
          {...props}
        />
        {error && <span style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
