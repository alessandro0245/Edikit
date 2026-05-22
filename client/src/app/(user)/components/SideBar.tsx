"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  FileText,
  Settings,
  CreditCard,
  Zap,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import { logoutUser } from "@/lib/auth";
import { getInitialsAvatar } from "@/utils/getInitialsAvatar";
import type { AppDispatch, RootState } from "@/redux/store";
import Link from "next/link";

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const user = useSelector((state: RootState) => state.user.user);

  const username = user?.fullName || "User";
  const userAvatarValue =
    user?.avatar || getInitialsAvatar(user?.fullName || "");

  const tabs = [
    { id: "renders", label: "Renders", icon: FileText, href: "/dashboard" },
    { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
    { id: "plans", label: "Manage Plans", icon: CreditCard, href: "/dashboard/plans" },
    { id: "credits", label: "Credits", icon: Zap, href: "/dashboard/credits" },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    await logoutUser(dispatch);
    setIsUserMenuOpen(false);
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between border-b border-sidebar-border bg-primary/5 px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-border/70">
            <Image
              src="/logo.png"
              alt="Edikit"
              width={32}
              height={32}
              className="h-6 w-auto object-contain"
              priority
            />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            Edikit
          </span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-sidebar-border bg-primary/10 transition-transform duration-300 ease-in-out lg:static lg:w-full lg:max-w-sm lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-5 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-border/70">
              <Link href={"/"}>
                <Image
                  src="/logo.png"
                  alt="Edikit"
                  width={40}
                  height={40}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </Link>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-sidebar-foreground">
                Edikit
              </h1>
              <p className="text-xs text-sidebar-foreground/70">User dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-sidebar-border px-5 py-4">
          <p className="text-sm text-sidebar-foreground/80">
            Welcome, <span className="font-semibold text-sidebar-foreground">{username}</span>
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:bg-opacity-50"
                }`}
              >
                <Icon className="shrink-0 h-5 w-5" />
                <span className="text-sm font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="relative mt-auto border-t border-sidebar-border px-4 py-4" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((value) => !value)}
            className="flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-card px-3 py-2.5 transition-colors hover:bg-accent"
          >
            <div className="shrink-0 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-background ring-1 ring-border/60">
              {user?.avatar?.startsWith("http") ? (
                <Image
                  src={user.avatar}
                  alt={user.fullName}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white">
                  {userAvatarValue}
                </div>
              )}
            </div>
            <span className="flex-1 truncate text-left text-sm font-medium text-sidebar-foreground">
              {username}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/80" />
          </button>

          {isUserMenuOpen ? (
            <div className="absolute bottom-16 left-4 right-4 rounded-xl border border-sidebar-border bg-card p-2 shadow-lg">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg bg-red-500/80 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-red-500/60"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
