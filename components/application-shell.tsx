"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog, Tooltip, DropdownMenu } from "radix-ui";
import { LayoutDashboard, ArrowLeftRight, ScanLine, Users, ChartNoAxesCombined, Target, Settings, LogOut, PanelLeftClose, PanelLeftOpen, Menu, X, WalletCards, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/receipts/new", label: "Receipt Scanner", icon: ScanLine },
  { href: "/groups", label: "Groups & Splitting", icon: Users },
  { href: "/dashboard#analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/budgets", label: "Budgets", icon: Target },
];

export function ApplicationShell({ user, children }: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  function sidebar(compact: boolean, mobile = false) {
    return <div className="flex h-full min-h-0 flex-col gap-6 p-4">
      <Link href="/dashboard" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-lg font-semibold focus-visible:outline-2 focus-visible:outline-ring" aria-label={compact ? "Smart Expense dashboard" : undefined}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><WalletCards className="size-5" aria-hidden="true" /></span>
        {!compact && <span>Smart Expense<span className="mt-0.5 block text-[11px] font-normal tracking-wide text-muted-foreground">PERSONAL FINANCE · MMK</span></span>}
      </Link>
      <nav aria-label={mobile ? "Mobile application" : "Application"} className="space-y-1">
        {!compact && <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Workspace</p>}
        {navigation.map((item) => {
          const active = !item.href.includes("#") && (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)));
          const href = item.label === "Analytics" && pathname === "/dashboard" ? "#analytics" : item.href;
          const link = <Link href={href} aria-label={compact ? item.label : undefined} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={`sidebar-link flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring ${active ? "bg-sidebar-accent font-medium text-primary" : "text-sidebar-foreground"}`}>
            <item.icon className="size-[18px] shrink-0" aria-hidden="true" />{!compact && item.label}
          </Link>;
          return compact ? <Tooltip.Root key={item.label}><Tooltip.Trigger asChild>{link}</Tooltip.Trigger><Tooltip.Portal><Tooltip.Content side="right" sideOffset={12} className="z-50 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg">{item.label}<Tooltip.Arrow className="fill-popover" /></Tooltip.Content></Tooltip.Portal></Tooltip.Root> : <div key={item.label}>{link}</div>;
        })}
      </nav>
      <div className="mt-auto space-y-4 border-t border-sidebar-border pt-4">
        <Link href="/app" title={compact ? "Settings" : undefined} aria-label="Settings" aria-current={pathname === "/app" ? "page" : undefined} onClick={() => setOpen(false)} className="sidebar-link flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring"><Settings className="size-[18px] shrink-0" aria-hidden="true" />{!compact && "Settings"}</Link>
        {!compact && <Link href="/app" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-medium">{user.name}</span><span className="block truncate text-xs text-muted-foreground">Your personal workspace</span></span></Link>}
        <form action={logoutAction}><Button variant="ghost" className="w-full justify-start" aria-label="Log out" title={compact ? "Log out" : undefined}><LogOut aria-hidden="true" />{!compact && "Log out"}</Button></form>
      </div>
    </div>;
  }
  return <Tooltip.Provider delayDuration={150}>
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <div className="app-shell" data-collapsed={collapsed}>
      <aside className="desktop-sidebar" aria-label="Workspace sidebar">{sidebar(collapsed)}
        <Button variant="ghost" size="icon" className="absolute -right-4 top-24 rounded-full border bg-sidebar shadow-md" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}</Button>
      </aside>
      <div className="min-w-0">
        <header className="workspace-header flex min-h-20 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu aria-hidden="true" /></Button></Dialog.Trigger>
              <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" /><Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 max-w-[calc(100%-2rem)] overflow-y-auto border-r bg-sidebar text-sidebar-foreground shadow-xl">
                <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title><Dialog.Description className="sr-only">Navigate your personal finance workspace.</Dialog.Description>
                <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute right-2 top-2" aria-label="Close navigation"><X aria-hidden="true" /></Button></Dialog.Close>
                {sidebar(false, true)}
              </Dialog.Content></Dialog.Portal>
            </Dialog.Root>
            <span className="text-sm font-medium text-muted-foreground">Personal workspace</span>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button variant="ghost">
              <span className="sr-only">Open profile menu for </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
              <span className="sr-only sm:not-sr-only sm:block sm:max-w-32 sm:truncate">{user.name}</span>
              <ChevronDown aria-hidden="true" />
            </Button></DropdownMenu.Trigger>
              <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-56 max-w-[calc(100vw-2rem)] rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl"><DropdownMenu.Label className="max-w-64 break-words px-3 py-2 text-xs text-muted-foreground">{user.email}</DropdownMenu.Label><DropdownMenu.Item asChild><Link href="/app" className="block rounded-lg px-3 py-2 text-sm outline-none focus:bg-accent">Account settings</Link></DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>
        <div id="main-content" tabIndex={-1} className="min-w-0 outline-none">{children}</div>
      </div>
    </div>
  </Tooltip.Provider>;
}
