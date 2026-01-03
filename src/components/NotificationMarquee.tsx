import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const NotificationMarquee = () => {
  const { data: notification } = useQuery({
    queryKey: ["active-notification"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_notifications")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (!notification) return null;

  return (
    <div className="fixed top-16 md:top-20 left-0 right-0 z-40 bg-primary text-primary-foreground py-2 overflow-hidden">
      <div className="marquee-container">
        <div className="marquee-content animate-marquee hover:pause-animation">
          <span className="mx-8">{notification.message}</span>
          <span className="mx-8">{notification.message}</span>
          <span className="mx-8">{notification.message}</span>
        </div>
      </div>
    </div>
  );
};
