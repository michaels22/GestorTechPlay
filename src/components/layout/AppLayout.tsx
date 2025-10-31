import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

export default function AppLayout() {
  const { user, signOut } = useAuth();

  // Get user initials for avatar
  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      const parts = email.split('@')[0].split('.');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Get display name from user metadata or email
  const getDisplayName = () => {
    const fullName = user?.user_metadata?.full_name;
    if (fullName) return fullName;
    
    if (user?.email) {
      const username = user.email.split('@')[0];
      return username
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    return 'Usuário';
  };

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-[radial-gradient(1200px_600px_at_-20%_-10%,hsl(var(--brand)/.15)_0%,transparent_60%)] overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-full min-w-0">
          <header className="h-12 sm:h-14 border-b flex items-center px-2 sm:px-3 gap-2 sm:gap-3 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 flex-shrink-0">
            <SidebarTrigger className="hover-scale touch-friendly" />
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 h-auto p-1.5 sm:p-2 hover:bg-accent touch-friendly">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground text-xs sm:text-sm font-medium">
                        {getUserInitials(user?.user_metadata?.full_name, user?.email)}
                      </span>
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-sm font-medium">
                        {getDisplayName()}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {user?.email || 'email@exemplo.com'}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {getDisplayName()}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user?.email || 'email@exemplo.com'}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 animate-enter min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
