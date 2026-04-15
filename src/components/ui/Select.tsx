// src/components/ui/Select.tsx
import React, { SelectHTMLAttributes, forwardRef } from "react";
import "./ui.css";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, ...props }, ref) => {
    return (
      <div className="form-field">
        {label && <label className="form-label">{label}</label>}
        <select ref={ref} className={`form-select ${className}`} {...props}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
