"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Map, LayoutDashboard, Settings, LogOut, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Ne pas afficher la navbar sur la page de login
  if (pathname === "/login") return null;

  const isAdmin = session?.user?.isAdmin;

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Réserver", href: "/trips/new", icon: Map },
    { name: "Véhicules", href: "/vehicles", icon: Car },
    ...(isAdmin ? [{ name: "Admin", href: "/admin", icon: Settings }] : []),
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container app-container">
          <div className="navbar-content">
            {/* Logo */}
            <Link href="/dashboard" className="navbar-logo">
              <span className="logo-icon">🚗</span>
              <span className="logo-text">ResaVroom</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="navbar-links desktop-only">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-link ${isActive ? "active" : ""}`}
                  >
                    <Icon size={18} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Profile & Logout Desktop */}
            <div className="navbar-actions desktop-only">
              {session?.user && (
                <div className="user-profile">
                  <span className="user-name">{session.user.name}</span>
                </div>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="btn btn-ghost btn-icon"
                title="Se déconnecter"
              >
                <LogOut size={20} />
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-links">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`mobile-nav-link ${isActive ? "active" : ""}`}
                >
                  <Icon size={20} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mobile-nav-link text-danger"
              style={{ color: "var(--color-danger)", background: "transparent", border: "none", width: "100%", textAlign: "left" }}
            >
              <LogOut size={20} />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
