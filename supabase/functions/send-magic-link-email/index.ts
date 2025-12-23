import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MagicLinkRequest {
  email: string;
  magicLink: string;
  type: "admin" | "customer";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, magicLink, type }: MagicLinkRequest = await req.json();

    if (!email || !magicLink) {
      throw new Error("Email and magic link are required");
    }

    const isAdmin = type === "admin";
    const portalType = isAdmin ? "Admin Portal" : "Customer Account";

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login to Decouverts Plus</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 40px 30px; text-align: center;">
              <div style="display: inline-block; background-color: #EAAB1C; padding: 15px 25px; border-radius: 8px; margin-bottom: 20px;">
                <span style="font-size: 28px; font-weight: bold; color: #1a1a1a; letter-spacing: 2px;">D+</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Decouverts Plus</h1>
              <p style="margin: 8px 0 0; color: #EAAB1C; font-size: 14px; font-weight: 500; letter-spacing: 1px;">${portalType}</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 22px; font-weight: 600;">Login to Your Account</h2>
              <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 24px;">
                Click the button below to securely sign in to your Decouverts Plus ${isAdmin ? 'admin dashboard' : 'account'}. This link will expire in 1 hour.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${magicLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #EAAB1C 0%, #d49a18 100%); color: #1a1a1a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(234, 171, 28, 0.3);">
                      Sign In Now
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #888888; font-size: 14px; line-height: 20px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; word-break: break-all;">
                <a href="${magicLink}" style="color: #EAAB1C; text-decoration: none; font-size: 13px;">${magicLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Security Warning -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef3cd; border-radius: 8px; border-left: 4px solid #EAAB1C;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; color: #856404; font-size: 14px; font-weight: 600;">
                      🔒 Security Notice
                    </p>
                    <p style="margin: 8px 0 0; color: #856404; font-size: 13px; line-height: 20px;">
                      This login link was requested for <strong>${email}</strong>. If you didn't request this link, please ignore this email. Never share this link with anyone.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 24px 40px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #888888; font-size: 12px; line-height: 18px; text-align: center;">
                This email was sent by Decouverts Plus.<br>
                If you have any questions, contact us at <a href="mailto:support@decouvertsplus.com" style="color: #EAAB1C; text-decoration: none;">support@decouvertsplus.com</a>
              </p>
              <p style="margin: 16px 0 0; color: #aaaaaa; font-size: 11px; text-align: center;">
                © ${new Date().getFullYear()} Decouverts Plus. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Decouverts Plus <onboarding@resend.dev>",
        to: [email],
        subject: `Your Decouverts Plus ${portalType} Login Link`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send email");
    }

    const result = await emailResponse.json();
    console.log("Magic link email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending magic link email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
