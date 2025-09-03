import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LayoutDashboard, 
  BookOpen, 
  Plus, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings,
  FileText,
  Award,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronRight,
  Layers
} from "lucide-react";

type Role = 'instructional-designer';

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<Role>(user?.role || "instructional-designer");
  const [isCreateContentExpanded, setIsCreateContentExpanded] = useState(false);

  

  // Check if any of the create content pages are active
  const isCreateContentActive = location.startsWith("/course-builder") || 
    location === "/discussions" || 
    location === "/assignments" || 
    location === "/quizzes";

  const navigationItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      active: location === "/dashboard",
    },
    {
      href: "/courses",
      icon: BookOpen,
      label: "My Courses",
      active: location === "/courses",
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
      active: location === "/settings",
    },
  ];

  // Create Content sub-items for instructors
  const createContentItems = [
    {
      href: "/discussions",
      icon: MessageSquare,
      label: "Discussions",
      active: location === "/discussions",
    },
    {
      href: "/assignments",
      icon: FileText,
      label: "Assignments", 
      active: location === "/assignments",
    },
    {
      href: "/quizzes",
      icon: Award,
      label: "Quizzes",
      active: location === "/quizzes",
    },
    {
      href: "/course-builder/",
      icon: Layers,
      label: "Modules",
      active: location.startsWith("/course-builder"),
    },
  ];

  const quickActions = [
    {
      href: "/courses",
      icon: Sparkles,
      label: "AI Course Generator",
      badge: "AI-Powered",
    },
    {
      href: "/courses",
      icon: BookOpen,
      label: "Browse Courses",
    },
    {
      href: "/assignments",
      icon: FileText,
      label: "View Assignments",
    },
    {
      href: "/discussions",
      icon: MessageSquare,
      label: "Join Discussion",
    },
  ];

  return (
    <aside className="w-64 saas-sidebar min-h-screen">
      <div className="p-6">
        
        
        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  item.active
                    ? "saas-sidebar-active bg-primary/5 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </Link>
          ))}
          
          {/* Create Content Section for Instructional Designers */}
          {userRole === "instructional-designer" && (
            <div className="space-y-1">
              <button
                onClick={() => setIsCreateContentExpanded(!isCreateContentExpanded)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isCreateContentActive
                    ? "bg-primary/5 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Plus className="w-5 h-5" />
                  <span>Create Content</span>
                </div>
                {isCreateContentExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {/* Collapsible sub-items */}
              {isCreateContentExpanded && (
                <div className="ml-6 space-y-1 border-l border-border/30 pl-4">
                  {createContentItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <button
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          item.active
                            ? "bg-primary/5 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
        
        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Actions
            </h3>
          </div>
          <div className="space-y-1">
            {quickActions.map((action) => (
              <Link key={`${action.href}-${action.label}`} href={action.href}>
                <button className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-all duration-200 group">
                  <div className="flex items-center space-x-3">
                    <action.icon className="w-4 h-4" />
                    <span>{action.label}</span>
                  </div>
                  {action.badge && (
                    <div className="flex items-center space-x-1 px-2 py-0.5 bg-primary/10 rounded-full">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">{action.badge}</span>
                    </div>
                  )}
                </button>
              </Link>
            ))}
          </div>
        </div>
        

      </div>
    </aside>
  );
}
