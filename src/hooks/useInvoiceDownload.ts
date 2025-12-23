import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useInvoiceDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadInvoice = useCallback(async (orderId: string) => {
    setIsDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-invoice-url", {
        body: { orderId },
      });

      if (error) throw error;

      const signedUrl = (data as any)?.signedUrl as string | undefined;
      if (!signedUrl) throw new Error("Invoice link not available");

      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return { downloadInvoice, isDownloading };
}
