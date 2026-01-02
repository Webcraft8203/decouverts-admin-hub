import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShoppingBag, Cog, Factory, Bell, Save, Eye, EyeOff } from "lucide-react";

const sectionIcons = {
  ecommerce: ShoppingBag,
  engineering: Cog,
  manufacturing: Factory,
};

const HomepageSettings = () => {
  const queryClient = useQueryClient();

  // Fetch sections
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ["homepage-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["homepage-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [newNotification, setNewNotification] = useState("");

  // Toggle section visibility
  const toggleSectionMutation = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase
        .from("homepage_sections")
        .update({ is_visible })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-sections"] });
      toast.success("Section visibility updated");
    },
    onError: () => {
      toast.error("Failed to update section");
    },
  });

  // Toggle notification active status
  const toggleNotificationMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      // If activating, deactivate all others first
      if (is_active) {
        await supabase
          .from("homepage_notifications")
          .update({ is_active: false })
          .neq("id", id);
      }
      const { error } = await supabase
        .from("homepage_notifications")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["active-notification"] });
      toast.success("Notification updated");
    },
    onError: () => {
      toast.error("Failed to update notification");
    },
  });

  // Update notification message
  const updateNotificationMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const { error } = await supabase
        .from("homepage_notifications")
        .update({ message })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["active-notification"] });
      toast.success("Notification message updated");
    },
    onError: () => {
      toast.error("Failed to update notification");
    },
  });

  // Add new notification
  const addNotificationMutation = useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase
        .from("homepage_notifications")
        .insert({ message, is_active: false });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-notifications"] });
      setNewNotification("");
      toast.success("Notification added");
    },
    onError: () => {
      toast.error("Failed to add notification");
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("homepage_notifications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["active-notification"] });
      toast.success("Notification deleted");
    },
    onError: () => {
      toast.error("Failed to delete notification");
    },
  });

  const visibleCount = sections?.filter((s) => s.is_visible).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Homepage Settings</h1>
          <p className="text-muted-foreground mt-1">
            Control which sections are visible on the homepage
          </p>
        </div>

        {/* Section Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Section Visibility
            </CardTitle>
            <CardDescription>
              Toggle sections on/off. Layout auto-adjusts: {visibleCount} visible = {visibleCount === 3 ? "3-column" : visibleCount === 2 ? "2-column" : visibleCount === 1 ? "full-width" : "hero only"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectionsLoading ? (
              <p>Loading...</p>
            ) : (
              sections?.map((section) => {
                const Icon = sectionIcons[section.section_key as keyof typeof sectionIcons] || ShoppingBag;
                return (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${section.is_visible ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className={`w-5 h-5 ${section.is_visible ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{section.section_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {section.is_visible ? "Visible on homepage" : "Hidden from homepage"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {section.is_visible ? (
                        <Eye className="w-4 h-4 text-primary" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={section.is_visible}
                        onCheckedChange={(checked) =>
                          toggleSectionMutation.mutate({ id: section.id, is_visible: checked })
                        }
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Notification Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Marquee
            </CardTitle>
            <CardDescription>
              Manage scrolling notifications shown below the navigation bar. Only one can be active at a time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Notification */}
            <div className="space-y-3">
              <Label>Add New Notification</Label>
              <div className="flex gap-2">
                <Input
                  value={newNotification}
                  onChange={(e) => setNewNotification(e.target.value)}
                  placeholder="Enter notification message..."
                  className="flex-1"
                />
                <Button
                  onClick={() => addNotificationMutation.mutate(newNotification)}
                  disabled={!newNotification.trim() || addNotificationMutation.isPending}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Existing Notifications */}
            <div className="space-y-4">
              <Label>Existing Notifications</Label>
              {notificationsLoading ? (
                <p>Loading...</p>
              ) : notifications?.length === 0 ? (
                <p className="text-muted-foreground text-sm">No notifications yet</p>
              ) : (
                notifications?.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onToggle={(is_active) =>
                      toggleNotificationMutation.mutate({ id: notification.id, is_active })
                    }
                    onUpdate={(message) =>
                      updateNotificationMutation.mutate({ id: notification.id, message })
                    }
                    onDelete={() => deleteNotificationMutation.mutate(notification.id)}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

interface NotificationItemProps {
  notification: {
    id: string;
    message: string;
    is_active: boolean;
  };
  onToggle: (is_active: boolean) => void;
  onUpdate: (message: string) => void;
  onDelete: () => void;
}

const NotificationItem = ({ notification, onToggle, onUpdate, onDelete }: NotificationItemProps) => {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(notification.message);

  const handleSave = () => {
    onUpdate(message);
    setEditing(false);
  };

  return (
    <div className={`p-4 rounded-lg border ${notification.is_active ? 'border-primary bg-primary/5' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          {notification.is_active && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded">
              ACTIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={notification.is_active}
            onCheckedChange={onToggle}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <p
          className="text-sm text-muted-foreground cursor-pointer hover:text-foreground"
          onClick={() => setEditing(true)}
        >
          {notification.message}
        </p>
      )}
    </div>
  );
};

export default HomepageSettings;
