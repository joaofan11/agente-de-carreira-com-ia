import {
  LayoutDashboard,
  User,
  FileText,
  SlidersHorizontal,
  Briefcase,
  Files,
  Send,
  Settings,
  ShieldCheck,
  Presentation,
} from "lucide-react";

export const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Meu Perfil", path: "/perfil", icon: User },
  { label: "Documentos", path: "/documentos", icon: FileText },
  { label: "Preferências de Vagas", path: "/preferencias", icon: SlidersHorizontal },
  { label: "Oportunidades", path: "/oportunidades", icon: Briefcase },
  { label: "Meus Currículos", path: "/curriculos", icon: Files },
  { label: "Candidaturas", path: "/candidaturas", icon: Send },
  { label: "Configurações", path: "/configuracoes", icon: Settings },
];

export const adminNavItems = [
  { label: "Administração", path: "/admin", icon: ShieldCheck },
  { label: "Demonstração", path: "/demo", icon: Presentation },
];