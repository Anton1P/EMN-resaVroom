// src/components/ui/Card.tsx
import React, { HTMLAttributes } from "react";
import "./ui.css";

export function Card({ className = "", hover = false, ...props }: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return <div className={`card ${hover ? "card-hover" : ""} ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`card-header ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`card-title ${className}`} {...props} />;
}

export function CardBody({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`card-body ${className}`} {...props} />;
}

export function CardFooter({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`card-footer ${className}`} {...props} />;
}
