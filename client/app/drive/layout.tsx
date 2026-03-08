import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

export default function DriveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar className="hidden lg:block w-64 shrink-0" />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
