import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useInvoiceDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvoice = useCallback(async (orderId: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice", {
        body: { orderId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error("Failed to generate invoice");

      toast.success("Invoice generated successfully!");
      return true;
    } catch (e: any) {
      console.error("Generate invoice error:", e);
      toast.error(e?.message || "Failed to generate invoice");
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const downloadInvoice = useCallback(async (orderId: string) => {
    setIsDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-invoice-url", {
        body: { orderId },
      });

      if (error) throw error;

      const signedUrl = (data as any)?.signedUrl as string | undefined;
      if (!signedUrl) throw new Error("Invoice link not available");

      // Fetch the HTML content and trigger download
      const response = await fetch(signedUrl);
      const htmlContent = await response.text();
      
      // Create a blob and download it
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${orderId.slice(0, 8)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Invoice downloaded!");
    } catch (e: any) {
      console.error("Download invoice error:", e);
      toast.error(e?.message || "Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return { downloadInvoice, isDownloading, generateInvoice, isGenerating };
}
