import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const NotificationMarquee = () => {
  const [isDismissed, setIsDismissed] = useState(false);

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

  if (!notification || isDismissed) return null;

  return (
    <div className="fixed top-[76px] md:top-[84px] left-0 right-0 z-40 bg-[hsl(217,45%,9%)] border-b border-white/10 py-2.5 overflow-hidden">
      <div className="marquee-container">
        <div className="marquee-content animate-marquee hover:pause-animation">
          {[1, 2, 3].map((i) => (
            <span key={i} className="inline-flex items-center mx-8 text-sm font-medium text-white/85">
              <Megaphone className="w-4 h-4 mr-2 text-primary" />
              {notification.message}
            </span>
          ))}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
