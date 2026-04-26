// Send Invoice Email via Resend with PDF attachment
// deno-lint-ignore-file no-explicit-any

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const COMPANY_NAME = "DECOUVERTES FUTURE TECH PRIVATE LIMITED";
const FROM_EMAIL = "Decouvertes <onboarding@resend.dev>"; // change to verified domain when available

interface SendInvoicePayload {
  to: string;
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  pdfBase64: string; // raw base64 (no data: prefix)
  message?: string;
  cc?: string[];
  bcc?: string[];
}

function buildHtml(p: SendInvoicePayload): string {
  const amount = `₹${Number(p.totalAmount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const safeMsg = (p.message || "").replace(/</g, "&lt;").replace(/\n/g, "<br/>");
  return `<!doctype html>
<html><body style="font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#1c1c1c">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#1c1c1c;color:#ffffff;padding:20px 28px">
      <div style="font-size:18px;font-weight:700;letter-spacing:0.5px">DECOUVERTES</div>
      <div style="font-size:11px;color:#D4AF37;margin-top:2px">Discovering Future Technologies</div>
    </div>
    <div style="padding:28px">
      <h2 style="margin:0 0 12px;font-size:20px;color:#1c1c1c">Invoice ${p.invoiceNumber}</h2>
      <p style="margin:0 0 8px;color:#374151;font-size:14px">Dear ${p.clientName || "Customer"},</p>
      <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.5">
        Please find attached your invoice <strong>${p.invoiceNumber}</strong> for a total amount of
        <strong style="color:#1c1c1c">${amount}</strong>.
      </p>
      ${safeMsg ? `<div style="background:#f9fafb;border-left:3px solid #D4AF37;padding:12px 14px;margin:16px 0;font-size:13px;color:#374151">${safeMsg}</div>` : ""}
      <p style="margin:16px 0 0;color:#374151;font-size:14px">If you have any questions, simply reply to this email.</p>
      <p style="margin:18px 0 0;color:#374151;font-size:14px">Thank you for your business.</p>
      <p style="margin:4px 0 0;color:#1c1c1c;font-size:14px;font-weight:600">${COMPANY_NAME}</p>
    </div>
    <div style="background:#fafafa;padding:14px 28px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:11px;text-align:center">
      This is a computer-generated email. The attached PDF is the official invoice.
    </div>
  </div>
</body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as SendInvoicePayload;

    // Basic validation
    const errors: string[] = [];
    if (!body?.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)) errors.push("Valid 'to' email is required");
    if (!body?.invoiceNumber) errors.push("invoiceNumber is required");
    if (!body?.pdfBase64 || body.pdfBase64.length < 100) errors.push("pdfBase64 is required");
    if (errors.length) {
      return new Response(JSON.stringify({ error: errors.join("; ") }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildHtml(body);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [body.to],
        cc: body.cc,
        bcc: body.bcc,
        subject: `Invoice ${body.invoiceNumber} from Decouvertes`,
        html,
        attachments: [
          {
            filename: `${body.invoiceNumber}.pdf`,
            content: body.pdfBase64, // base64 string
          },
        ],
      }),
    });

    const data = await resendRes.json();
    if (!resendRes.ok) {
      console.error("Resend error:", resendRes.status, data);
      return new Response(
        JSON.stringify({ error: data?.message || "Failed to send email", details: data }),
        { status: resendRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("send-invoice-email error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
