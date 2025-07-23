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
  Award
} from "lucide-react";

type Role = 'student' | 'instructor' | 'admin';

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<Role>(user?.role || "student");

  const isInstructor = userRole === "instructor";

  const navigationItems = [
    {
      href: "/",
      icon: LayoutDashboard,
      label: "Dashboard",
      active: location === "/",
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
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen">
      <div className="p-6">
        {/* Role Switcher */}
        <div className="mb-6">
          <Select value={userRole} onValueChange={(value: Role) => setUserRole(value)}>
            <SelectTrigger className="w-full bg-slate-50 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instructor">Instructor Dashboard</SelectItem>
              <SelectItem value="student">Student View</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Navigation Menu */}
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-smooth ${
                  item.active
                    ? "sidebar-active text-primary"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </Link>
          ))}
        </nav>
        
        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link key={`${action.href}-${action.label}`} href={action.href}>
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-smooth">
                  <action.icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
