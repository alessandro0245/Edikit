import Sidebar from "../components/SideBar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-dvh flex-col bg-background lg:flex-row lg:overflow-hidden">
      <Sidebar />
      <div className="min-w-0 flex-1 lg:overflow-y-auto">{children}</div>
    </main>
  );
}
