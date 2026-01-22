import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FormType = "contact" | "printer_config" | "drone_config";

export function useFormRateLimit(formType: FormType) {
  const [isChecking, setIsChecking] = useState(false);

  const checkRateLimit = async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-form-rate-limit", {
        body: { form_type: formType },
      });

      if (error) {
        console.error("Rate limit check error:", error);
        // Fail open - allow submission if check fails
        return true;
      }

      if (data?.blocked) {
        const waitMinutes = Math.ceil((data.wait_seconds || 600) / 60);
        toast.error(`Too many submissions. Please wait ${waitMinutes} minutes before trying again.`);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Rate limit check error:", error);
      // Fail open
      return true;
    } finally {
      setIsChecking(false);
    }
  };

  const recordSubmission = async (success: boolean = true) => {
    try {
      await supabase.functions.invoke("record-form-submission", {
        body: { form_type: formType, success },
      });
    } catch (error) {
      console.error("Failed to record submission:", error);
    }
  };

  return {
    checkRateLimit,
    recordSubmission,
    isChecking,
  };
}
