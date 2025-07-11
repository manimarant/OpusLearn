import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Bell, CheckCircle, Info, AlertTriangle, AlertCircle } from "lucide-react";

interface NotificationProps {
  notification: any;
  onDismiss: (id: number) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <Card className={`animate-slide-up ${getBgColor(notification.type)}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {getIcon(notification.type)}
          <div className="flex-1">
            <h4 className="font-medium text-slate-800">
              {notification.title}
            </h4>
            <p className="text-sm text-slate-600 mt-1">
              {notification.message}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(notification.id)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(true);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest("POST", `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleDismiss = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const unreadNotifications = notifications?.filter((n: any) => !n.read) || [];

  // Auto-show notifications when new ones arrive
  useEffect(() => {
    if (unreadNotifications.length > 0) {
      setShowNotifications(true);
    }
  }, [unreadNotifications.length]);

  if (!showNotifications || unreadNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="font-medium text-slate-800">Notifications</span>
          <Badge variant="secondary">{unreadNotifications.length}</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNotifications(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
        {unreadNotifications.slice(0, 5).map((notification: any) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={handleDismiss}
          />
        ))}
      </div>

      {/* View All Button */}
      {unreadNotifications.length > 5 && (
        <Card>
          <CardContent className="p-4 text-center">
            <Button variant="ghost" size="sm" className="w-full">
              View {unreadNotifications.length - 5} more notifications
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
