import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Users,
  DollarSign,
  Wallet,
  MessageSquare,
  Megaphone,
  BookOpen,
  Settings,
  ChevronDown,
  Circle,
  Bell,
} from "lucide-react";
import { useState } from "react";
import type { LucideProps } from "lucide-react";
import { LogoutButton } from "./auth/LogoutButton";
// Custom WhatsApp icon to match sidebar icon API
const WhatsAppIcon = (props: LucideProps) => (
  <svg
    viewBox="0 0 24 24"
    width={props.size ?? 24}
    height={props.size ?? 24}
    stroke="none"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <path d="M20.52 3.48A11.8 11.8 0 0012 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 5.98L0 24l6.2-1.62A11.94 11.94 0 0012 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.18-3.48-8.52zM12 22a9.94 9.94 0 01-5.45-1.5l-.39-.23-3.67.96.98-3.58-.25-.41A9.9 9.9 0 012 12C2 6.48 6.48 2 12 2c2.67 0 5.18 1.04 7.07 2.93A9.96 9.96 0 0122 12c0 5.52-4.48 10-10 10zm5.38-7.62c-.29-.14-1.71-.84-1.97-.93-.26-.1-.45-.14-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.2-.62.07-.29-.14-1.21-.45-2.3-1.43-.85-.76-1.43-1.7-1.6-1.98-.17-.29-.02-.45.12-.59.12-.12.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.56-.88-2.14-.23-.55-.47-.48-.64-.48h-.55c-.17 0-.45.07-.69.36-.24.29-.9.88-.9 2.14s.93 2.48 1.06 2.65c.14.19 1.83 2.8 4.43 3.92.62.27 1.1.43 1.48.55.62.2 1.19.17 1.64.1.5-.07 1.71-.7 1.95-1.37.24-.67.24-1.24.17-1.37-.07-.12-.26-.2-.55-.33z" />
  </svg>
);

const itemsMain = [
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
];

const itemsConfig = [
  { title: "Mensagens de Cobrança", url: "/configuracoes/mensagens-cobranca", icon: MessageSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  // Estado do submenu Clientes
  const clientesActive =
    currentPath === "/clientes" || currentPath.startsWith("/clientes/");
  const [clientesOpen, setClientesOpen] = useState(clientesActive);

  // Estado do submenu Pagamentos
  const pagamentosActive =
    currentPath === "/financeiro-extra" || currentPath.startsWith("/financeiro-extra/");
  const [pagamentosOpen, setPagamentosOpen] = useState(pagamentosActive);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className="w-64" collapsible="icon">
      <SidebarContent>
        <div className="h-14 px-4 border-b flex items-center justify-center">
          <h2 className="text-lg font-bold text-foreground">
            {state === "collapsed" ? "TP" : "GESTOR TP"}
          </h2>
        </div>

        {/* Dashboard section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    end
                    className={getNavCls}
                    aria-current={isActive("/") ? "page" : undefined}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-4 my-2">
          <Separator />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Gerenciamento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Grupo Clientes com submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setClientesOpen((o) => !o)}
                  isActive={clientesActive}
                  aria-expanded={clientesOpen}
                  aria-controls="submenu-clientes"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Clientes</span>
                  <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${clientesOpen ? "rotate-180" : ""}`} />
                </SidebarMenuButton>
                {clientesOpen && (
                  <SidebarMenuSub id="submenu-clientes">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive("/clientes")}>
                        <NavLink to="/clientes" end>
                          <Circle className="h-3 w-3" />
                          <span>Listar/Criar</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive("/clientes/planos")}>
                        <NavLink to="/clientes/planos" end>
                          <Circle className="h-3 w-3" />
                          <span>Planos</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive("/clientes/produtos")}>
                        <NavLink to="/clientes/produtos" end>
                          <Circle className="h-3 w-3" />
                          <span>Produtos</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive("/clientes/aplicativos")}>
                        <NavLink to="/clientes/aplicativos" end>
                          <Circle className="h-3 w-3" />
                          <span>Aplicativos</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive("/clientes/metricas")}>
                        <NavLink to="/clientes/metricas" end>
                          <Circle className="h-3 w-3" />
                          <span>Métricas</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {itemsMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={getNavCls}
                      aria-current={isActive(item.url) ? "page" : undefined}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-4 my-2">
          <Separator />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Pagamentos com submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setPagamentosOpen((o) => !o)}
                  isActive={pagamentosActive}
                  aria-expanded={pagamentosOpen}
                  aria-controls="submenu-pagamentos"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>Pagamentos</span>
                  <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${pagamentosOpen ? "rotate-180" : ""}`} />
                </SidebarMenuButton>
                {pagamentosOpen && (
                  <SidebarMenuSub id="submenu-pagamentos">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive("/financeiro-extra/assas")}>
                        <NavLink to="/financeiro-extra/assas" end>
                          <Circle className="h-3 w-3" />
                          <span>Assas</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive("/financeiro-extra/checkout")}>
                        <NavLink to="/financeiro-extra/checkout" end>
                          <Circle className="h-3 w-3" />
                          <span>Checkout</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {itemsConfig.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={getNavCls}
                      aria-current={isActive(item.url) ? "page" : undefined}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {/* Footer com logout */}
      <div className="p-4 border-t">
        <LogoutButton />
      </div>
    </Sidebar>
  );
}
