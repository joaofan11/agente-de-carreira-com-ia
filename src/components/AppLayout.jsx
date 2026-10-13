import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { navItems, adminNavItems } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { LogOut, Menu, GraduationCap, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-foreground">Agente de Carreira</p>
        <p className="text-[11px] text-secondary font-medium">com Inteligência Artificial</p>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate, isAdmin }) {
  const location = useLocation();
  const items = [...navItems, ...(isAdmin ? adminNavItems : [])];
  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="shrink-0" style={{ width: 18, height: 18 }} />
            <span className="flex-1">{item.label}</span>
            {item.path === "/admin" && <ShieldCheck className="h-3.5 w-3.5 opacity-70" />}
            {active && <ChevronRight className="h-4 w-4 opacity-70" />}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({ onLogout, user }) {
  return (
    <div className="border-t border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/15 text-secondary text-sm font-semibold uppercase">
          {(user?.full_name || user?.email || "U").charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{user?.full_name || "Estudante"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} title="Sair" aria-label="Sair da conta">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  const handleLogout = () => logout();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="px-5 py-5">
          <BrandMark />
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <NavLinks isAdmin={isAdmin} />
        </div>
        <UserFooter onLogout={handleLogout} user={user} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <BrandMark />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navegação</SheetTitle>
            <div className="flex h-full flex-col">
              <div className="px-5 py-5">
                <BrandMark />
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                <NavLinks isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
              </div>
              <UserFooter onLogout={handleLogout} user={user} />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}