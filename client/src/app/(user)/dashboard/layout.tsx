"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/SideBar";
import api from "@/lib/auth";
import { useRouter } from "next/navigation";
import Loader from "@/components/Overlay/Loader";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get("/auth/me", {
          withCredentials: true,
        });
        localStorage.setItem("user", JSON.stringify(data));
        setIsLoggedIn(true);
		setLoading(false);
      } catch {
        setIsLoggedIn(false);
		 router.replace("/login");
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

   if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    )
  }
  return (
    <main className="flex min-h-dvh flex-col bg-background lg:flex-row lg:overflow-hidden">
      <Sidebar />
      <div className="min-w-0 flex-1 lg:overflow-y-auto">{children}</div>
    </main>
  );
}
