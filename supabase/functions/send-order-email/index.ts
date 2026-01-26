import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOrderEmailRequest {
  orderId: string;
  emailType: "order_placed" | "status_update";
  newStatus?: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pending Confirmation",
  confirmed: "Confirmed",
  packing: "Packing",
  "waiting-for-pickup": "Ready for Pickup",
  shipped: "Shipped",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const formatCurrency = (amount: number): string => {
  return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, emailType, newStatus }: SendOrderEmailRequest = await req.json();

    if (!orderId || !emailType) {
      throw new Error("Order ID and email type are required");
    }

    console.log(`Sending ${emailType} email for order:`, orderId);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(product_name, quantity, product_price, total_price)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      throw new Error("Order not found");
    }

    // Fetch customer profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error("Profile fetch error:", profileError);
      throw new Error("Customer email not found");
    }

    const customerEmail = profile.email;
    const customerName = profile.full_name || "Valued Customer";
    const shippingAddress = order.shipping_address as any;

    // Fetch invoice settings for company info
    const { data: settings } = await supabase
      .from("invoice_settings")
      .select("business_name, business_email, business_phone, business_logo_url")
      .single();

    const companyName = settings?.business_name || "Decouverts";
    const companyEmail = settings?.business_email || "info@decouverts.com";
    const companyPhone = settings?.business_phone || "+91 98765 43210";
    const logoUrl = settings?.business_logo_url || "";

    // Get invoice PDF if available
    let invoiceAttachment: { filename: string; content: string } | null = null;
    const invoicePath = order.proforma_invoice_url || order.invoice_url;
    
    if (invoicePath && emailType === "order_placed") {
      try {
        console.log("Fetching invoice for attachment:", invoicePath);
        const { data: invoiceData, error: downloadError } = await supabase.storage
          .from("invoices")
          .download(invoicePath);

        if (!downloadError && invoiceData) {
          const arrayBuffer = await invoiceData.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = "";
          for (let i = 0; i < uint8Array.byteLength; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64Content = btoa(binary);
          
          invoiceAttachment = {
            filename: `Invoice-${order.order_number}.pdf`,
            content: base64Content,
          };
          console.log("Invoice attached successfully");
        } else {
          console.error("Failed to download invoice:", downloadError);
        }
      } catch (invError) {
        console.error("Error fetching invoice for attachment:", invError);
      }
    }

    // Build order items HTML
    const itemsHtml = order.order_items
      .map((item: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.product_price)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.total_price)}</td>
        </tr>
      `)
      .join("");

    // Determine payment method
    const isCod = order.payment_id?.startsWith("COD") || order.order_type === "cod";
    const paymentMethod = isCod ? "Cash on Delivery" : "Paid Online";

    // Build email content based on type
    let subject: string;
    let headerText: string;
    let headerColor: string;
    let messageText: string;

    if (emailType === "order_placed") {
      subject = `Order Confirmed - ${order.order_number} | ${companyName}`;
      headerText = "Order Confirmed! 🎉";
      headerColor = "#22c55e";
      messageText = `Thank you for your order! We have received your order and are processing it. ${isCod ? "Payment will be collected upon delivery." : "Your payment has been confirmed."}`;
    } else {
      const statusLabel = statusLabels[newStatus || order.status] || order.status;
      subject = `Order Update: ${statusLabel} - ${order.order_number} | ${companyName}`;
      headerText = `Order Status: ${statusLabel}`;
      headerColor = newStatus === "delivered" ? "#22c55e" : newStatus === "cancelled" ? "#ef4444" : "#3b82f6";
      
      if (newStatus === "confirmed") {
        messageText = "Great news! Your order has been confirmed and is being prepared.";
      } else if (newStatus === "packing") {
        messageText = "Your order is now being packed with care.";
      } else if (newStatus === "shipped") {
        messageText = `Your order has been shipped! ${order.courier_name ? `Courier: ${order.courier_name}` : ""} ${order.tracking_id ? `Tracking ID: ${order.tracking_id}` : ""}`;
      } else if (newStatus === "out-for-delivery") {
        messageText = "Your order is out for delivery and will arrive soon!";
      } else if (newStatus === "delivered") {
        messageText = "Your order has been delivered! We hope you love your purchase.";
      } else if (newStatus === "cancelled") {
        messageText = "Your order has been cancelled. If you have any questions, please contact us.";
      } else {
        messageText = `Your order status has been updated to: ${statusLabel}`;
      }
    }

    // Build full email HTML
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%); padding: 30px; text-align: center;">
          ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="height: 50px; margin-bottom: 15px;">` : ""}
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${headerText}</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Hi ${customerName},
          </p>
          <p style="color: #374151; font-size: 16px; margin-bottom: 25px;">
            ${messageText}
          </p>

          <!-- Order Info Box -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Order Number:</td>
                <td style="color: #111827; font-weight: bold; text-align: right;">${order.order_number}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Order Date:</td>
                <td style="color: #111827; text-align: right;">${formatDate(order.created_at)}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Payment Method:</td>
                <td style="color: #111827; text-align: right;">${paymentMethod}</td>
              </tr>
            </table>
          </div>

          <!-- Order Items Table -->
          <h3 style="color: #111827; font-size: 18px; margin-bottom: 15px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151;">Product</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #374151;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151;">Price</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Subtotal:</td>
                <td style="color: #111827; text-align: right;">${formatCurrency(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Tax:</td>
                <td style="color: #111827; text-align: right;">${formatCurrency(order.tax_amount)}</td>
              </tr>
              ${order.shipping_amount > 0 ? `
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Shipping:</td>
                <td style="color: #111827; text-align: right;">${formatCurrency(order.shipping_amount)}</td>
              </tr>
              ` : ""}
              ${order.discount_amount > 0 ? `
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Discount:</td>
                <td style="color: #22c55e; text-align: right;">-${formatCurrency(order.discount_amount)}</td>
              </tr>
              ` : ""}
              <tr style="border-top: 2px solid #e5e7eb;">
                <td style="color: #111827; font-weight: bold; font-size: 18px; padding-top: 10px;">Total:</td>
                <td style="color: #111827; font-weight: bold; font-size: 18px; text-align: right; padding-top: 10px;">${formatCurrency(order.total_amount)}</td>
              </tr>
            </table>
          </div>

          ${shippingAddress ? `
          <!-- Shipping Address -->
          <h3 style="color: #111827; font-size: 18px; margin-top: 25px; margin-bottom: 15px;">Shipping Address</h3>
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; color: #374151;">
            <strong>${shippingAddress.full_name}</strong><br>
            ${shippingAddress.address_line1}<br>
            ${shippingAddress.address_line2 ? `${shippingAddress.address_line2}<br>` : ""}
            ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postal_code}<br>
            Phone: ${shippingAddress.phone}
          </div>
          ` : ""}

          <!-- Tracking Info (for shipped orders) -->
          ${(newStatus === "shipped" || newStatus === "out-for-delivery") && order.tracking_url ? `
          <div style="margin-top: 25px; text-align: center;">
            <a href="${order.tracking_url}" target="_blank" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Track Your Package →
            </a>
          </div>
          ` : ""}

        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
            If you have any questions, please contact us at:
          </p>
          <p style="color: #374151; font-size: 14px; margin: 0;">
            <a href="mailto:${companyEmail}" style="color: #3b82f6;">${companyEmail}</a> | ${companyPhone}
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
    `;

    // Send email via Resend API
    const emailPayload: any = {
      from: `${companyName} <onboarding@resend.dev>`,
      to: [customerEmail],
      subject: subject,
      html: emailHtml,
    };

    // Add invoice attachment if available
    if (invoiceAttachment) {
      emailPayload.attachments = [
        {
          filename: invoiceAttachment.filename,
          content: invoiceAttachment.content,
        },
      ];
    }

    console.log("Sending email to:", customerEmail);
    
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      throw new Error(resendData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", resendData.id);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        recipient: customerEmail,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending order email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
