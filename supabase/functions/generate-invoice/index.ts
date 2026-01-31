import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatCurrency = (amount: number): string => {
  return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Function to fetch and convert image to base64
const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { headers: { 'Accept': 'image/*' } });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Error fetching logo:", error);
    return null;
  }
};

interface InvoiceRequest {
  orderId: string;
  invoiceType?: "proforma" | "final";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, invoiceType = "proforma" }: InvoiceRequest = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const isFinalInvoice = invoiceType === "final";
    console.log(`Generating ${isFinalInvoice ? "FINAL TAX" : "PROFORMA"} invoice for order:`, orderId);

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, images, gst_percentage))")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      throw new Error("Order not found");
    }

    // For final invoice, order must be delivered
    if (isFinalInvoice && order.status !== "delivered") {
      throw new Error("Final invoice can only be generated for delivered orders");
    }

    // Check if final invoice already exists
    if (isFinalInvoice && order.final_invoice_url) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Final invoice already exists",
          invoicePath: order.final_invoice_url,
          invoiceType: "final",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Fetch invoice settings
    const { data: settings } = await supabase.from("invoice_settings").select("*").single();

    const companySettings = settings || {
      business_name: "Decouverts",
      business_address: "Innovation Hub, Tech Park",
      business_city: "Pune",
      business_state: "Maharashtra",
      business_pincode: "411001",
      business_country: "India",
      business_phone: "+91 98765 43210",
      business_email: "info@decouverts.com",
      business_gstin: "27XXXXX1234X1ZX",
      business_logo_url: null,
      invoice_prefix: "INV",
      default_gst_rate: 18,
      platform_fee_percentage: 2,
      platform_fee_taxable: false,
      terms_and_conditions: "1. Goods once sold are non-refundable.\n2. Payment due within 30 days.\n3. Warranty as per product terms.",
    };

    // Generate invoice number based on type
    const orderSuffix = order.order_number.replace("DP-", "").replace(/-/g, "");
    const invoiceNumber = isFinalInvoice 
      ? `${companySettings.invoice_prefix}-${orderSuffix}`
      : `PRO-${orderSuffix}`;
    
    const invoiceDate = isFinalInvoice 
      ? formatDate(order.delivered_at || new Date().toISOString())
      : formatDate(order.created_at);

    const shippingAddress = order.shipping_address as any;
    const buyerState = shippingAddress?.state || "";
    const sellerState = companySettings.business_state || "Maharashtra";
    const isIgst = buyerState.toLowerCase() !== sellerState.toLowerCase();

    // Fetch profile for buyer details
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .single();

    // Calculate GST breakdown from order items
    const gstBreakdown = order.gst_breakdown as any;
    const gstItems = gstBreakdown?.items || [];
    
    let items: any[] = [];
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    if (gstItems.length > 0) {
      items = order.order_items.map((item: any, index: number) => {
        const gst = gstItems.find((g: any) => g.product_id === item.product_id) || gstItems[index] || {};
        totalCgst += Number(gst.cgst_amount || 0);
        totalSgst += Number(gst.sgst_amount || 0);
        totalIgst += Number(gst.igst_amount || 0);
        
        return {
          name: item.product_name,
          hsn: item.products?.hsn_code || "8471",
          quantity: item.quantity,
          rate: item.product_price,
          taxable_value: item.total_price,
          gst_rate: gst.gst_rate || 18,
          cgst_rate: gst.cgst_rate || (isIgst ? 0 : 9),
          sgst_rate: gst.sgst_rate || (isIgst ? 0 : 9),
          igst_rate: gst.igst_rate || (isIgst ? 18 : 0),
          cgst_amount: gst.cgst_amount || 0,
          sgst_amount: gst.sgst_amount || 0,
          igst_amount: gst.igst_amount || 0,
          total: item.total_price + (gst.total_gst || 0),
        };
      });
    } else {
      items = order.order_items.map((item: any) => {
        const gstRate = item.products?.gst_percentage || 18;
        const taxableValue = Number(item.total_price);
        const gstAmount = (taxableValue * gstRate) / 100;
        
        const cgstAmount = isIgst ? 0 : gstAmount / 2;
        const sgstAmount = isIgst ? 0 : gstAmount / 2;
        const igstAmount = isIgst ? gstAmount : 0;
        
        totalCgst += cgstAmount;
        totalSgst += sgstAmount;
        totalIgst += igstAmount;
        
        return {
          name: item.product_name,
          hsn: "8471",
          quantity: item.quantity,
          rate: item.product_price,
          taxable_value: taxableValue,
          gst_rate: gstRate,
          cgst_rate: isIgst ? 0 : gstRate / 2,
          sgst_rate: isIgst ? 0 : gstRate / 2,
          igst_rate: isIgst ? gstRate : 0,
          cgst_amount: cgstAmount,
          sgst_amount: sgstAmount,
          igst_amount: igstAmount,
          total: taxableValue + gstAmount,
        };
      });
    }

    const gstTotals = gstBreakdown?.totals || {};
    const platformFee = gstTotals.platform_fee || (Number(order.subtotal) * (companySettings.platform_fee_percentage || 2)) / 100;
    const platformFeeTax = gstTotals.platform_fee_tax || (companySettings.platform_fee_taxable ? (platformFee * 18) / 100 : 0);

    const clientAddress = shippingAddress
      ? `${shippingAddress.address_line1}${shippingAddress.address_line2 ? ", " + shippingAddress.address_line2 : ""}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postal_code}`
      : "";

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        invoice_type: invoiceType,
        is_final: isFinalInvoice,
        order_id: orderId,
        delivery_date: isFinalInvoice ? order.delivered_at : null,
        client_name: shippingAddress?.full_name || profile?.full_name || "Customer",
        client_email: profile?.email || null,
        client_address: clientAddress,
        items: items,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        total_amount: order.total_amount,
        cgst_amount: totalCgst,
        sgst_amount: totalSgst,
        igst_amount: totalIgst,
        is_igst: isIgst,
        platform_fee: platformFee,
        platform_fee_tax: platformFeeTax,
        buyer_gstin: order.buyer_gstin || null,
        buyer_state: buyerState,
        seller_state: sellerState,
        gst_breakdown: items,
        created_by: order.user_id,
        notes: `Order: ${order.order_number}\nPayment ID: ${order.payment_id || "N/A"}\nInvoice Type: ${isFinalInvoice ? "Final Tax Invoice" : "Proforma Invoice"}`,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Invoice creation error:", invoiceError);
      throw new Error("Failed to create invoice");
    }

    // ==================== GENERATE ENTERPRISE-GRADE PDF ====================
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    let y = margin;

    // Professional color palette
    const colors = {
      primary: [45, 55, 72] as [number, number, number],      // Slate 700
      secondary: [71, 85, 105] as [number, number, number],   // Slate 500
      accent: [16, 185, 129] as [number, number, number],     // Emerald 500
      muted: [148, 163, 184] as [number, number, number],     // Slate 400
      border: [226, 232, 240] as [number, number, number],    // Slate 200
      light: [248, 250, 252] as [number, number, number],     // Slate 50
      dark: [30, 41, 59] as [number, number, number],         // Slate 800
      warning: [245, 158, 11] as [number, number, number],    // Amber 500
      success: [34, 197, 94] as [number, number, number],     // Green 500
    };

    // Fetch logo
    let logoBase64: string | null = null;
    const storedLogoUrl = `${supabaseUrl}/storage/v1/object/public/customer-partner-images/email-logo.png`;
    logoBase64 = await fetchImageAsBase64(storedLogoUrl);
    if (!logoBase64 && companySettings.business_logo_url) {
      logoBase64 = await fetchImageAsBase64(companySettings.business_logo_url);
    }

    // ==================== HEADER ====================
    // Left: Logo and company info
    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', margin, y, 32, 16); } catch {}
    }
    
    // Company name next to logo
    doc.setFontSize(16);
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "bold");
    doc.text(companySettings.business_name, margin + (logoBase64 ? 36 : 0), y + 8);
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Discovering Future Technologies", margin + (logoBase64 ? 36 : 0), y + 13);

    // Right: Invoice title and details
    const rightX = pageWidth - margin;
    
    // Invoice type badge
    doc.setFillColor(...(isFinalInvoice ? colors.success : colors.warning));
    doc.roundedRect(rightX - 50, y, 50, 8, 1, 1, "F");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(isFinalInvoice ? "TAX INVOICE" : "PROFORMA", rightX - 25, y + 5.5, { align: "center" });

    // Invoice number and date
    y += 12;
    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice #: ${invoiceNumber}`, rightX, y, { align: "right" });
    doc.text(`Date: ${invoiceDate}`, rightX, y + 4, { align: "right" });
    doc.text(`Order: ${order.order_number}`, rightX, y + 8, { align: "right" });

    y = 35;

    // Thin separator line
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    y += 6;

    // ==================== SELLER & BUYER INFO ====================
    const halfWidth = (pageWidth - 2 * margin - 8) / 2;

    // Seller box
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, y, halfWidth, 32, 2, 2, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "bold");
    doc.text("FROM", margin + 4, y + 5);
    
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.text(companySettings.business_name, margin + 4, y + 10);
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(companySettings.business_address, margin + 4, y + 15);
    doc.text(`${companySettings.business_city}, ${companySettings.business_state} - ${companySettings.business_pincode}`, margin + 4, y + 19);
    doc.text(`GSTIN: ${companySettings.business_gstin}`, margin + 4, y + 23);
    doc.text(`Phone: ${companySettings.business_phone}`, margin + 4, y + 27);

    // Buyer box
    const buyerX = margin + halfWidth + 8;
    doc.setFillColor(...colors.light);
    doc.roundedRect(buyerX, y, halfWidth, 32, 2, 2, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", buyerX + 4, y + 5);
    
    const buyerName = shippingAddress?.full_name || profile?.full_name || "Customer";
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.text(buyerName, buyerX + 4, y + 10);
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    
    if (shippingAddress) {
      doc.text(shippingAddress.address_line1 || "", buyerX + 4, y + 15);
      doc.text(`${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.postal_code || ""}`, buyerX + 4, y + 19);
      doc.text(`Phone: ${shippingAddress.phone || "N/A"}`, buyerX + 4, y + 23);
    }
    if (order.buyer_gstin) {
      doc.setTextColor(...colors.accent);
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN: ${order.buyer_gstin}`, buyerX + 4, y + 27);
    }

    y += 38;

    // ==================== ITEMS TABLE ====================
    const tableWidth = pageWidth - 2 * margin;
    
    // Table header
    doc.setFillColor(...colors.primary);
    doc.rect(margin, y, tableWidth, 7, "F");
    
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    // Column positions for cleaner alignment
    const cols = isIgst 
      ? { sno: margin + 2, desc: margin + 12, hsn: margin + 80, qty: margin + 100, rate: margin + 115, taxable: margin + 135, igst: margin + 155, total: pageWidth - margin - 2 }
      : { sno: margin + 2, desc: margin + 10, hsn: margin + 60, qty: margin + 78, rate: margin + 92, taxable: margin + 108, cgst: margin + 128, sgst: margin + 148, total: pageWidth - margin - 2 };

    if (isIgst) {
      doc.text("#", cols.sno, y + 4.5);
      doc.text("Description", cols.desc, y + 4.5);
      doc.text("HSN", cols.hsn, y + 4.5);
      doc.text("Qty", cols.qty, y + 4.5);
      doc.text("Rate", cols.rate, y + 4.5);
      doc.text("Taxable", cols.taxable, y + 4.5);
      doc.text("IGST", cols.igst, y + 4.5);
      doc.text("Total", cols.total, y + 4.5, { align: "right" });
    } else {
      doc.text("#", cols.sno, y + 4.5);
      doc.text("Description", cols.desc, y + 4.5);
      doc.text("HSN", cols.hsn, y + 4.5);
      doc.text("Qty", cols.qty, y + 4.5);
      doc.text("Rate", cols.rate, y + 4.5);
      doc.text("Taxable", cols.taxable, y + 4.5);
      doc.text("CGST", cols.cgst, y + 4.5);
      doc.text("SGST", cols.sgst, y + 4.5);
      doc.text("Total", cols.total, y + 4.5, { align: "right" });
    }

    y += 7;

    // Table rows
    items.forEach((item: any, idx: number) => {
      const rowH = 6;
      
      // Alternate row background
      if (idx % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, y, tableWidth, rowH, "F");
      }

      doc.setFontSize(6.5);
      doc.setTextColor(...colors.dark);
      doc.setFont("helvetica", "normal");

      const productName = item.name.length > 35 ? item.name.substring(0, 32) + "..." : item.name;

      if (isIgst) {
        doc.text(String(idx + 1), cols.sno, y + 4);
        doc.text(productName, cols.desc, y + 4);
        doc.text(item.hsn || "8471", cols.hsn, y + 4);
        doc.text(String(item.quantity), cols.qty, y + 4);
        doc.text(formatCurrency(item.rate), cols.rate, y + 4);
        doc.text(formatCurrency(item.taxable_value), cols.taxable, y + 4);
        doc.text(`${item.igst_rate}%`, cols.igst, y + 4);
        doc.text(formatCurrency(item.total), cols.total, y + 4, { align: "right" });
      } else {
        doc.text(String(idx + 1), cols.sno, y + 4);
        doc.text(productName, cols.desc, y + 4);
        doc.text(item.hsn || "8471", cols.hsn, y + 4);
        doc.text(String(item.quantity), cols.qty, y + 4);
        doc.text(formatCurrency(item.rate), cols.rate, y + 4);
        doc.text(formatCurrency(item.taxable_value), cols.taxable, y + 4);
        doc.text(`${item.cgst_rate}%`, cols.cgst, y + 4);
        doc.text(`${item.sgst_rate}%`, cols.sgst, y + 4);
        doc.text(formatCurrency(item.total), cols.total, y + 4, { align: "right" });
      }

      y += rowH;
    });

    // Table bottom border
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;

    // ==================== TOTALS SECTION (Right aligned) ====================
    const totalsWidth = 75;
    const totalsX = pageWidth - margin - totalsWidth;
    
    doc.setFillColor(...colors.light);
    doc.roundedRect(totalsX, y, totalsWidth, isIgst ? 38 : 44, 2, 2, "F");

    let totalsY = y + 6;
    const labelX = totalsX + 4;
    const valueX = totalsX + totalsWidth - 4;

    doc.setFontSize(7);

    // Subtotal
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal", labelX, totalsY);
    doc.setTextColor(...colors.dark);
    doc.text(formatCurrency(order.subtotal), valueX, totalsY, { align: "right" });
    totalsY += 5;

    // Discount
    if (Number(order.discount_amount) > 0) {
      doc.setTextColor(...colors.success);
      doc.text("Discount", labelX, totalsY);
      doc.text(`-${formatCurrency(order.discount_amount)}`, valueX, totalsY, { align: "right" });
      totalsY += 5;
    }

    // GST
    if (isIgst) {
      doc.setTextColor(...colors.secondary);
      doc.text("IGST", labelX, totalsY);
      doc.setTextColor(...colors.dark);
      doc.text(formatCurrency(totalIgst), valueX, totalsY, { align: "right" });
      totalsY += 5;
    } else {
      doc.setTextColor(...colors.secondary);
      doc.text("CGST", labelX, totalsY);
      doc.setTextColor(...colors.dark);
      doc.text(formatCurrency(totalCgst), valueX, totalsY, { align: "right" });
      totalsY += 5;
      
      doc.setTextColor(...colors.secondary);
      doc.text("SGST", labelX, totalsY);
      doc.setTextColor(...colors.dark);
      doc.text(formatCurrency(totalSgst), valueX, totalsY, { align: "right" });
      totalsY += 5;
    }

    // Shipping
    doc.setTextColor(...colors.secondary);
    doc.text("Shipping", labelX, totalsY);
    doc.setTextColor(...colors.success);
    doc.text(Number(order.shipping_amount) === 0 ? "FREE" : formatCurrency(order.shipping_amount), valueX, totalsY, { align: "right" });
    totalsY += 6;

    // Grand total separator
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.5);
    doc.line(labelX, totalsY - 2, valueX, totalsY - 2);

    // Grand Total
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", labelX, totalsY + 3);
    doc.setTextColor(...colors.accent);
    doc.text(formatCurrency(order.total_amount), valueX, totalsY + 3, { align: "right" });

    y += isIgst ? 46 : 52;

    // ==================== GST SUMMARY (Left side) ====================
    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, y - (isIgst ? 38 : 44), totalsX - margin - 6, isIgst ? 38 : 44, 2, 2, "FD");

    let gstY = y - (isIgst ? 32 : 38);
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("TAX SUMMARY", margin + 4, gstY);
    gstY += 6;

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`Supply Type: ${isIgst ? "Inter-State" : "Intra-State"} (${sellerState}${isIgst ? ` → ${buyerState}` : ""})`, margin + 4, gstY);
    gstY += 5;
    
    if (isIgst) {
      doc.text(`IGST @ Various Rates: ${formatCurrency(totalIgst)}`, margin + 4, gstY);
    } else {
      doc.text(`CGST @ Various Rates: ${formatCurrency(totalCgst)}`, margin + 4, gstY);
      gstY += 5;
      doc.text(`SGST @ Various Rates: ${formatCurrency(totalSgst)}`, margin + 4, gstY);
    }
    gstY += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Tax: ${formatCurrency(totalCgst + totalSgst + totalIgst)}`, margin + 4, gstY);

    y += 6;

    // ==================== PROFORMA NOTICE ====================
    if (!isFinalInvoice) {
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(...colors.warning);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "FD");
      
      doc.setFontSize(7);
      doc.setTextColor(...colors.warning);
      doc.setFont("helvetica", "bold");
      doc.text("⚠ PROFORMA INVOICE", margin + 4, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.secondary);
      doc.text("This is not a tax document. Final GST Tax Invoice will be issued upon delivery.", margin + 4, y + 7.5);
      y += 14;
    }

    // ==================== TERMS & CONDITIONS ====================
    doc.setFontSize(7);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", margin, y);
    y += 4;

    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    const terms = companySettings.terms_and_conditions.split("\n");
    terms.forEach((term: string) => {
      if (y < pageHeight - 20) {
        doc.text(term, margin, y);
        y += 3;
      }
    });

    // ==================== FOOTER ====================
    y = pageHeight - 14;
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);

    doc.setFontSize(8);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for your business!", pageWidth / 2, y, { align: "center" });

    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    const footerText = isFinalInvoice 
      ? "This is a computer-generated Tax Invoice and does not require a signature."
      : "This is a computer-generated Proforma Invoice. Not valid for tax purposes.";
    doc.text(footerText, pageWidth / 2, y + 4, { align: "center" });
    doc.text(`Generated on ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, y + 7, { align: "center" });

    // Generate and upload PDF
    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

    const fileName = `${invoiceNumber}.pdf`;
    const invoicePath = `${order.user_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(invoicePath, pdfUint8Array, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload invoice PDF");
    }

    // Update order with invoice URL
    const orderUpdateData: any = {};
    if (isFinalInvoice) {
      orderUpdateData.final_invoice_url = invoicePath;
      orderUpdateData.invoice_url = invoicePath;
    } else {
      orderUpdateData.proforma_invoice_url = invoicePath;
      if (!order.final_invoice_url) {
        orderUpdateData.invoice_url = invoicePath;
      }
    }

    await supabase.from("orders").update(orderUpdateData).eq("id", orderId);
    await supabase.from("invoices").update({ pdf_url: invoicePath }).eq("id", invoice.id);

    console.log(`${isFinalInvoice ? "Final Tax" : "Proforma"} invoice generation complete:`, invoicePath);

    return new Response(
      JSON.stringify({
        success: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        invoicePath,
        invoiceType: invoiceType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
