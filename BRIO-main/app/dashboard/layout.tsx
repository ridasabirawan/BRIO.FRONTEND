import { ReactNode } from "react";
import DashboardSideBar from "./_components/dashboard-side-bar";
import DashboardTopNav from "./_components/dashbord-top-nav";
import { auth } from "@/utils/auth";
import { redirect } from "next/navigation";
import WelcomePopup from "@/components/welcome-popup";
import AnimatedBackground from "@/components/animations/animated-background";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (session?.user.banned) {
    redirect("/banned");
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Dashboard image sab se peeche */}
      <div className="dashboard-bg fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat" />

      {/* Bubbles image ke upar */}
      <AnimatedBackground />

      {/* Dashboard content sab se upar */}
      <div className="relative z-10 grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <WelcomePopup />
        <DashboardSideBar />

        <DashboardTopNav>
          <main className="flex flex-col gap-4 p-4 lg:gap-6">
            {children}
          </main>
        </DashboardTopNav>
      </div>
    </div>
  );
}