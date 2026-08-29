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
  ChevronLeft,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
    },
    {
      id: "plans",
      label: "Manage Plans",
      icon: CreditCard,
      href: "/dashboard/plans",
    },
    { id: "credits", label: "Credits", icon: Zap, href: "/dashboard/credits" },
  ];

  useEffect(() => {
    const t = setTimeout(() => setIsMobileMenuOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      )
        setIsUserMenuOpen(false);
    };
    if (isUserMenuOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    await logoutUser(dispatch);
    setIsUserMenuOpen(false);
    router.push("/login");
  };

  return (
    <>
      {/* ── Mobile Top Bar ── */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0d1117] px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
            <Image
              src="/logo.png"
              alt="Edikit"
              width={28}
              height={28}
              className="h-5 w-auto object-contain"
              priority
            />
          </div>
          <span className="text-base font-semibold text-white">Edikit</span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* ── Mobile Overlay ── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar Panel ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-x-hidden border-r border-white/[0.07] bg-linear-to-b from-[#0d1117] to-[#090d13] transition-[width,transform] duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-16" : "lg:w-52"} w-64`}
      >
        {/* ── Header ── */}
        <div className="flex h-14 shrink-0 items-center border-b border-white/[0.07] px-3">
          {/* Logo — desktop */}
          <div className="hidden shrink-0 lg:block">
            {isCollapsed ? (
              <button
                onClick={() => setIsCollapsed((v) => !v)}
                title="Expand sidebar"
                className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-white/12 bg-white/5 text-white/40 transition-all duration-200 hover:border-primary/50 hover:bg-primary/15 hover:text-primary active:scale-95"
              >
                <ChevronLeft className="size-4 rotate-180" />
              </button>
            ) : (
              <Link href="/">
                <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 transition-all duration-200 hover:ring-white/20">
                  <Image
                    src="/logo.png"
                    alt="Edikit"
                    width={32}
                    height={32}
                    className="h-6 w-auto object-contain"
                    priority
                  />
                </div>
              </Link>
            )}
          </div>

          {/* Logo — mobile only */}
          <Link href="/" className="shrink-0 lg:hidden">
            <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 cursor-pointer">
              <Image
                src="/logo.png"
                alt="Edikit"
                width={32}
                height={32}
                className="h-6 w-auto object-contain"
                priority
              />
            </div>
          </Link>

          {/* Wordmark */}
          <span
            className={`ml-2.5 flex-1 overflow-hidden whitespace-nowrap text-[15px] font-semibold text-white transition-opacity duration-200 ${
              isCollapsed ? "lg:opacity-0 lg:hidden" : "opacity-100 delay-100"
            }`}
          >
            Edikit
          </span>

          {/* Collapse toggle — right side, desktop only */}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed((v) => !v)}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden size-6 shrink-0 items-center justify-center rounded-md text-white/30 transition-all duration-200 hover:bg-white/5 hover:text-white/60 lg:flex cursor-pointer"
            >
              <ChevronLeft
                className={`size-3.5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
              />
            </button>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex size-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ── Welcome ── */}
        <div className="shrink-0 border-b border-white/[0.07]">
          {/* Collapsed desktop — hand icon + hover tooltip */}
          <div
            className={`group relative items-center justify-center py-3 ${
              isCollapsed ? "hidden lg:flex" : "hidden"
            }`}
          >
            <Image
              src="/hand.svg"
              alt="wave"
              width={20}
              height={20}
              className="animate-wave cursor-default"
              unoptimized
            />
            {/* Tooltip */}
            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 translate-x-1 scale-95 whitespace-nowrap rounded-xl border border-white/10 bg-[#111827] px-3.5 py-2.5 opacity-0 shadow-2xl transition-all duration-200 group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100">
              <p className="text-[10px] uppercase tracking-widest text-white/40">
                Welcome back
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {username}
              </p>
              <span className="absolute left-0 top-1/2 size-2.5 -translate-x-1.25 -translate-y-1/2 rotate-45 border-b border-l border-white/10 bg-[#111827]" />
            </div>
          </div>

          {/* Expanded — full welcome row */}
          <div
            className={`flex items-center gap-2 px-4 py-3 transition-opacity duration-150 ${
              isCollapsed ? "lg:hidden" : "opacity-100"
            }`}
          >
            <Image
              src="/hand.svg"
              alt="wave"
              width={17}
              height={17}
              className="animate-wave shrink-0"
              unoptimized
            />
            <p className="overflow-hidden whitespace-nowrap text-xs text-white/50">
              Welcome,{" "}
              <span className="font-semibold text-white/80">{username}</span>
            </p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                title={isCollapsed ? tab.label : undefined}
                className={`group relative flex w-full items-center rounded-lg py-2.5 transition-all duration-200 ${
                  isCollapsed ? "lg:justify-center lg:px-0" : "gap-3 px-3"
                } ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-white/50 hover:bg-white/5 hover:text-white/90"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                )}

                <Icon
                  className={`size-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                />

                <span
                  className={`whitespace-nowrap text-sm font-medium transition-opacity duration-150 ${
                    isCollapsed
                      ? "lg:opacity-0 lg:hidden"
                      : "opacity-100 delay-100"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ── Divider ── */}
        <div className="mx-3 h-px shrink-0 bg-white/[0.07]" />

        {/* ── User Profile ── */}
        <div className="relative shrink-0 px-2 py-3" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((v) => !v)}
            title={isCollapsed ? username : undefined}
            className={`flex w-full items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/3 px-2.5 py-2 transition-all duration-200 hover:border-white/10 hover:bg-white/6 ${
              isCollapsed ? "lg:justify-center lg:px-2" : ""
            }`}
          >
            <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/20">
              {user?.avatar?.startsWith("http") ? (
                <Image
                  src={user.avatar}
                  alt={user.fullName}
                  width={28}
                  height={28}
                  className="size-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-medium text-primary">
                  {userAvatarValue}
                </div>
              )}
            </div>

            <span
              className={`flex-1 overflow-hidden whitespace-nowrap text-left text-xs font-medium text-white/60 transition-opacity duration-150 ${
                isCollapsed ? "lg:hidden lg:opacity-0" : "opacity-100 delay-100"
              }`}
            >
              {username}
            </span>

            <ChevronDown
              className={`size-3.5 shrink-0 text-white/30 transition-all duration-200 ${
                isCollapsed ? "lg:hidden lg:opacity-0" : "opacity-100 delay-100"
              } ${isUserMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isUserMenuOpen && (
            <div
              className={`absolute z-10 rounded-xl border border-white/[0.07] bg-[#111827] p-1.5 shadow-2xl ${
                isCollapsed
                  ? "bottom-14 left-full ml-2 w-40"
                  : "bottom-14 left-2 right-2"
              }`}
            >
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
