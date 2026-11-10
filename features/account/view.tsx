import Link from "next/link";
import { CalendarDays, Check, CircleUserRound, Globe2, LockKeyhole, LogOut, ShieldCheck, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import { REPORTING_TIMEZONE } from "@/lib/money";
import { ProfileForm, PasswordForm } from "./forms";

const sections = [
  { id: "profile", label: "Profile", Icon: CircleUserRound },
  { id: "preferences", label: "Preferences", Icon: Wallet },
  { id: "security", label: "Security", Icon: ShieldCheck },
];

export function AccountView({ profile }: { profile: { name: string; email: string; createdAt: Date } }) {
  const initials = profile.name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();
  const joined = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: REPORTING_TIMEZONE }).format(profile.createdAt);
  return <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
    <header className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Your workspace</p>
      <h1 className="text-3xl font-semibold tracking-tight">Account settings</h1>
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">Manage your profile, reporting preferences and account security.</p>
    </header>
    <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-5" aria-label="Your account overview">
        <Card className="overflow-hidden">
          <div className="h-2 bg-primary/40" />
          <CardContent className="space-y-5 pt-6">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-xl font-semibold text-primary" aria-hidden="true">{initials}</div>
            <div className="min-w-0 space-y-1">
              <h2 className="break-words text-lg font-semibold">{profile.name}</h2>
              <p className="break-all text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-positive/25 bg-positive/10 px-2.5 py-1 text-xs font-medium text-positive"><Check className="size-3.5" aria-hidden="true" />Signed in</span>
            <div className="flex items-start gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
              <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Member since <time dateTime={profile.createdAt.toISOString()} className="block text-foreground">{joined}</time></span>
            </div>
          </CardContent>
        </Card>
        <Card><CardContent className="space-y-4 pt-6">
          <h2 className="text-sm font-medium">On this page</h2>
          <nav aria-label="Settings sections" className="grid gap-1 text-sm">
            {sections.map(({ id, label, Icon }) => <a key={id} href={`#${id}`} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
              <Icon className="size-4" aria-hidden="true" />{label}
            </a>)}
          </nav>
          <Button asChild variant="outline" className="w-full"><Link href="/dashboard">Back to dashboard</Link></Button>
        </CardContent></Card>
      </aside>
      <div className="min-w-0 space-y-6">
        <section id="profile" aria-labelledby="profile-heading" className="scroll-mt-24"><Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3"><CircleUserRound className="size-5 text-primary" aria-hidden="true" /><h2 id="profile-heading" className="text-lg font-semibold">Personal profile</h2></div>
            <p className="text-sm text-muted-foreground">Keep your workspace identity up to date.</p>
          </CardHeader>
          <CardContent className="pt-6"><ProfileForm name={profile.name} email={profile.email} /></CardContent>
        </Card></section>
        <section id="preferences" aria-labelledby="preferences-heading" className="scroll-mt-24"><Card>
          <CardHeader>
            <div className="flex items-center gap-3"><Wallet className="size-5 text-primary" aria-hidden="true" /><h2 id="preferences-heading" className="text-lg font-semibold">Workspace preferences</h2></div>
            <p className="text-sm text-muted-foreground">Consistent reporting settings across your workspace.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <Wallet className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" /><div><p className="text-xs text-muted-foreground">Currency</p><p className="text-sm font-medium">MMK (Ks) · Whole kyat</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <Globe2 className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" /><div><p className="text-xs text-muted-foreground">Reporting timezone</p><p className="text-sm font-medium">Asia/Yangon · UTC+06:30</p></div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Currency and reporting timezone are fixed for this workspace.</p>
          </CardContent>
        </Card></section>
        <section id="security" aria-labelledby="security-heading" className="scroll-mt-24"><Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3"><LockKeyhole className="size-5 text-primary" aria-hidden="true" /><h2 id="security-heading" className="text-lg font-semibold">Password &amp; security</h2></div>
            <p className="text-sm text-muted-foreground">Confirm your current password to choose a new one.</p>
          </CardHeader>
          <CardContent className="pt-6"><PasswordForm /></CardContent>
        </Card></section>
        <Card><CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1"><h2 className="font-medium">Done for now?</h2><p className="text-sm text-muted-foreground">Sign out of this device. Your records stay safe in your account.</p></div>
          <form action={logoutAction}><Button type="submit" variant="outline"><LogOut aria-hidden="true" />Sign out</Button></form>
        </CardContent></Card>
      </div>
    </div>
  </main>;
}
