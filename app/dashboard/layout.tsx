import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getCurrentSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-6 pb-8 pt-20 md:px-10 md:pt-8">
        {children}
      </main>
    </div>
  );
}
