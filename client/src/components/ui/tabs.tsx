"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    data-slot="tabs"
    className={cn("flex flex-col gap-4 w-full", className)}
    {...props}
  />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: "default" | "line";
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    data-slot="tabs-list"
    data-variant={variant}
    className={cn(
      variant === "line"
        ? "flex items-center gap-6 border-b border-border bg-transparent w-full overflow-x-auto no-scrollbar p-0"
        : "inline-flex h-10 items-center justify-center rounded-xl bg-muted/60 p-1 text-muted-foreground backdrop-blur-sm border border-border/50",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    data-slot="tabs-trigger"
    className={cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground",
      // Line variant styles when inside [data-variant=line]
      "[[data-variant=line]_&]:rounded-none [[data-variant=line]_&]:border-b-2 [[data-variant=line]_&]:border-transparent [[data-variant=line]_&]:bg-transparent [[data-variant=line]_&]:px-1 [[data-variant=line]_&]:pb-3 [[data-variant=line]_&]:pt-2 [[data-variant=line]_&]:shadow-none [[data-variant=line]_&]:text-muted-foreground [[data-variant=line]_&]:hover:text-foreground [[data-variant=line]_&[data-state=active]]:border-primary [[data-variant=line]_&[data-state=active]]:text-foreground [[data-variant=line]_&[data-state=active]]:font-semibold [[data-variant=line]_&[data-state=active]]:bg-transparent",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    data-slot="tabs-content"
    className={cn(
      "outline-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-in fade-in-50 duration-200",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
