import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is super admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, content } = await req.json();

    if (!subject || !content) {
      return new Response(JSON.stringify({ error: "Subject and content are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all active subscribers
    const { data: subscribers, error: subError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", true);

    if (subError) {
      throw new Error(`Failed to fetch subscribers: ${subError.message}`);
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ error: "No active subscribers found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emails = subscribers.map((s) => s.email);

    // Send emails in batches of 50 via Resend
    const batchSize = 50;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:2px solid #0f766e;">
              <h1 style="margin:0;font-size:24px;color:#0f766e;letter-spacing:2px;">DECOUVERTES</h1>
              <p style="margin:4px 0 0;font-size:11px;color:#64748b;letter-spacing:1px;">Discovering Future Technologies</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="margin:0 0 20px;font-size:20px;color:#1e293b;">${subject}</h2>
              <div style="font-size:15px;line-height:1.7;color:#475569;">
                ${content}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f1f5f9;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} DECOUVERTES. All rights reserved.
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                A-414, Gera's Imperium Gateway, Kasarwadi, Pimpri-Chinchwad, Pune, Maharashtra – 411034, India
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">
                You received this email because you subscribed to our newsletter.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // Send to each recipient individually to avoid exposing emails
      for (const email of batch) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Decouvertes <newsletter@decouvertes.in>",
              to: [email],
              subject: subject,
              html: htmlContent,
            }),
          });

          if (res.ok) {
            successCount++;
          } else {
            console.error(`Failed to send to ${email}:`, await res.text());
            failCount++;
          }
        } catch (err) {
          console.error(`Error sending to ${email}:`, err);
          failCount++;
        }
      }
    }

    // Log the newsletter send
    await supabaseAdmin.from("newsletter_sends").insert({
      subject,
      content,
      sent_by: user.email || user.id,
      recipient_count: successCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        total: emails.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Newsletter send error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
