import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Upload, 
  Database, 
  Search, 
  BarChart3, 
  Brain, 
  FileText, 
  Shield, 
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Upload Data", href: "/upload", icon: Upload },
  { name: "Data Viewer", href: "/data", icon: Database },
  { name: "Search & Filter", href: "/search", icon: Search },
  { name: "Analysis", href: "/analysis", icon: BarChart3 },
  { name: "ML Results", href: "/ml-results", icon: Brain },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Admin", href: "/admin", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border/50 bg-gradient-to-b from-sidebar-background to-vault-darker">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center border-b border-border/50">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary animate-glow" />
          <div>
            <h1 className="text-xl font-bold text-primary">IPDR ANALYSIS</h1>
            <p className="text-xs text-muted-foreground tracking-widest">SYSTEM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-primary border border-transparent"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-border/50 p-4">
        <Link
          to="/auth"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/30"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Link>
      </div>
    </div>
  );
};
