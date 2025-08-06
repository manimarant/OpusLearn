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
  Zap
} from "lucide-react";

type Role = 'student' | 'instructor' | 'admin';

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<Role>(user?.role || "student");

  const isInstructor = userRole === "instructor";

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
    ...(isInstructor ? [{
      href: "/course-builder/",
      icon: Plus,
      label: "Create Content",
      active: location.startsWith("/course-builder"),
    }] : []),
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
      href: "/settings",
      icon: Settings,
      label: "Settings",
      active: location === "/settings",
    },
  ];

  const quickActions = [
    ...(isInstructor ? [
      {
        href: "/course-builder/",
        icon: Plus,
        label: "New Course",
        badge: "AI-Powered",
      },
      {
        href: "/assignments",
        icon: FileText,
        label: "Assignments",
      },
      {
        href: "/quizzes",
        icon: Award,
        label: "Quizzes",
      },
    ] : [
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
    ]),
  ];

  return (
    <aside className="w-64 saas-sidebar min-h-screen">
      <div className="p-6">
        {/* Role Switcher */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Current Role
            </span>
          </div>
          <Select value={userRole} onValueChange={(value: Role) => setUserRole(value)}>
            <SelectTrigger className="w-full saas-input bg-muted/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="saas-card">
              <SelectItem value="instructor" className="saas-button-ghost">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Instructor Dashboard</span>
                </div>
              </SelectItem>
              <SelectItem value="student" className="saas-button-ghost">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Student View</span>
                </div>
              </SelectItem>
              <SelectItem value="admin" className="saas-button-ghost">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span>Administrator</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
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
        
        {/* Pro Features Banner */}
        <div className="mt-8 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Pro Features</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Unlock advanced AI-powered course creation tools and analytics.
          </p>
          <Button size="sm" className="w-full saas-button-primary text-xs">
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </aside>
  );
}
