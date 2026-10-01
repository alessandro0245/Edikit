"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { Loader2 } from "lucide-react";

export default function DashboardAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useSelector((state: RootState) => state.user);

  // If initial auth check is in flight, let children render with their internal skeletons
  if (isLoading) {
    return <>{children}</>;
  }

  // If user is null (auth check failed with 401 or token was invalidated),
  // hide child components to prevent showing red 401 error banners.
  // Display a smooth branded transition instead:
  if (!user) {
    return (
      <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Session expired. Redirecting to login...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
