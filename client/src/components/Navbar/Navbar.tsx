"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, Coins } from "lucide-react";
import ToogleTheme from "../Theme/theme-toogle";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { getInitialsAvatar } from "@/utils/getInitialsAvatar";
import CreditsDisplay from "./CreditsDisplay";
import ShimmerButton from "../ShimmerButton/ShimmerButton";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const user = useSelector((state: RootState) => state.user.user);
  const isLoading = useSelector((state: RootState) => state.user.isLoading);
  const isDashboardRoute = pathname.startsWith("/dashboard");

  const isFreePlan = user?.planType !== "FREE";

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (isDashboardRoute) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between relative">
          <Link href="/" className="flex items-center gap-2 ml-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={100}
              height={20}
              className="lg:w-20 w-16"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-6">
            <NavLink href="/templates">Templates</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <ToogleTheme />

            {/* Credits Display - Visible on all devices */}
            {!isLoading && !minLoadingTime && user  && (
              <CreditsDisplay />
            )}

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2 pr-2">
              {isLoading || minLoadingTime ? (
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
                  <div className="w-29 h-4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                </div>
              ) : user ? (
                <>
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      {user.avatar?.startsWith("http") ? (
                        <Image
                          src={user.avatar}
                          alt={user.fullName}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs">
                          {user.avatar || getInitialsAvatar(user.fullName)}
                        </div>
                      )}
                      <span>{user.fullName}</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          isUserMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* User Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg z-50">
                        <div className="py-2">
                          <div className="px-4 py-2 border-b border-border">
                            <p className="text-sm font-medium text-foreground">
                              {user.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>

                          <Link
                            href="/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                          >
                            Dashboard
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <Link
                    href="/login"
                    className="px-3 py-2 text-md font-medium rounded-lg hover:bg-accent transition-colors"
                  >
                    Log in
                  </Link>
                  <ShimmerButton  
                    href="/signup"
                    // className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-gradient text-primary-foreground"
                    size="sm"
                  >
                    Try for free
                  </ShimmerButton>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-accent"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <NavLink href="/templates" onClick={() => setIsOpen(false)}>
              Templates
            </NavLink>
            <NavLink href="/pricing" onClick={() => setIsOpen(false)}>
              Pricing
            </NavLink>
            {
              user && (
                <NavLink href="/dashboard/credits" onClick={() => setIsOpen(false)}>
              Credits
            </NavLink>
              )
            }
            <div className="flex flex-col gap-2 pt-2">
              {isLoading || minLoadingTime ? (
                // Loading skeleton for mobile
                <div className="flex items-center gap-2 px-4 py-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
                  <div className="flex flex-col gap-1">
                    <div className="w-24 h-4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                    <div className="w-16 h-3 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                  </div>
                </div>
              ) : user ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2">
                    {user.avatar?.startsWith("http") ? (
                      <Image
                        src={user.avatar}
                        alt={user.fullName}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs">
                        {user.avatar || getInitialsAvatar(user.fullName)}
                      </div>
                    )}
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-medium">{user.fullName}</span>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="mx-4 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-center"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Try for free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
};

const NavLink = ({ href, children, onClick }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`text-lg transition-colors ${
        isActive
          ? "font-semibold text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
};
