// src/components/ui/Modal.tsx
import React, { useEffect } from "react";
import { X } from "lucide-react";
import "./ui.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Fixer le background-scrolling quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()} // Empêche de fermer quand on clique à l'intérieur
      >
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>
        <div className="card-header">
          <h2 className="card-title">{title}</h2>
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
}
