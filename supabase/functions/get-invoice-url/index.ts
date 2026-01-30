import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization") || "";
    console.log("Auth header present:", !!authHeader);

    // Verify the caller (end-user) using the token from the header
    const token = authHeader.replace("Bearer ", "");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    console.log("User lookup result:", userError ? userError.message : "success", userData?.user?.id);
    
    if (userError || !userData?.user) {
      console.error("Auth failed:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;

    const body = await req.json();
    const { orderId, invoiceId } = body;
    
    if (!orderId && !invoiceId) {
      throw new Error("Order ID or Invoice ID is required");
    }

    let invoicePath: string | null = null;
    let orderUserId: string | null = null;

    if (invoiceId) {
      // Fetch invoice directly by ID
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("id, pdf_url, order_id")
        .eq("id", invoiceId)
        .single();

      if (invoiceError || !invoice) throw new Error("Invoice not found");
      if (!invoice.pdf_url) throw new Error("Invoice PDF not generated yet");

      invoicePath = invoice.pdf_url;

      // Get order to check ownership
      if (invoice.order_id) {
        const { data: order } = await supabase
          .from("orders")
          .select("user_id")
          .eq("id", invoice.order_id)
          .single();
        orderUserId = order?.user_id || null;
      }
    } else if (orderId) {
      // Fetch by order ID (legacy support)
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, user_id, invoice_url")
        .eq("id", orderId)
        .single();

      if (orderError || !order) throw new Error("Order not found");
      if (!order.invoice_url) throw new Error("Invoice not generated yet");

      invoicePath = order.invoice_url;
      orderUserId = order.user_id;
    }

    if (!invoicePath) throw new Error("Invoice path not found");

    // Check permissions
    const isOwner = orderUserId === user.id;

    if (!isOwner) {
      // Check if user is admin
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      // Check if user is employee with invoice permissions
      const { data: employeePermission } = await supabase
        .from("employees")
        .select("id, employee_permissions!inner(permission)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      const hasInvoicePermission = employeePermission?.employee_permissions?.some(
        (p: any) => ["view_invoices", "download_invoices", "generate_invoices"].includes(p.permission)
      );

      if (!roleRow && !hasInvoicePermission) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("invoices")
      .createSignedUrl(invoicePath, 60 * 15); // 15 minutes

    if (signError || !signed?.signedUrl) {
      console.error("Sign error:", signError);
      throw new Error("Failed to create invoice link");
    }

    return new Response(JSON.stringify({ signedUrl: signed.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error getting invoice URL:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
