import { auth } from "@/utils/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { userDetails } from "@/drizzle/queries/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bot,
  BookOpen,
  Coins,
  Mail,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import UserIcon from "@/public/user-icon.webp";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [details] = await userDetails(session.user.id);
  const role = session.user.role || "user";
  const isAdmin = role === "admin";
  const plan = details?.planName || "Free";

  const stats = [
    {
      label: "Chatbots",
      value: details?.noOfChatbots ?? 0,
      icon: Bot,
    },
    {
      label: "Knowledge Sources",
      value: details?.noOfKnowledgeSources ?? 0,
      icon: BookOpen,
    },
    {
      label: "Tokens Used",
      value: (details?.noOfTokens ?? 0).toLocaleString(),
      icon: Coins,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 pb-20 pt-5">
      <h2 className="mb-6 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
        My Profile
      </h2>

      {/* Identity card */}
      <Card className="relative overflow-hidden">
        {/* Branded gradient banner */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_70%)]" />

        <CardContent className="relative pt-16">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-background shadow-lg">
              <Image
                src={session.user.image || UserIcon}
                alt={session.user.name || "User"}
                width={96}
                height={96}
                className="h-full w-full object-cover"
                priority
              />
            </div>

            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-bold leading-tight">
                  {session.user.name || "BRIO User"}
                </h3>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                    <ShieldCheck className="h-3 w-3" />
                    Admin
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Sparkles className="h-3 w-3" />
                  {plan} plan
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {session.user.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm">
                  <Settings className="mr-1.5 h-4 w-4" />
                  Settings
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <Button
                    size="sm"
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <ShieldCheck className="mr-1.5 h-4 w-4" />
                    Admin Panel
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage stats */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Account details */}
      <Card className="mt-5">
        <CardContent className="divide-y pt-6">
          <Row label="Full name" value={session.user.name || "—"} />
          <Row label="Email address" value={session.user.email || "—"} />
          <Row
            label="Role"
            value={
              <span className="capitalize">{role}</span>
            }
          />
          <Row label="Current plan" value={`${plan} plan`} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
