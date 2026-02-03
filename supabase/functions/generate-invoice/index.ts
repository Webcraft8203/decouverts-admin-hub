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

// DECOUVERTES Brand Color Palette
const colors = {
  primary: [28, 28, 28] as [number, number, number],        // Deep charcoal/black
  brand: [35, 35, 35] as [number, number, number],          // Charcoal for headers
  accent: [212, 175, 55] as [number, number, number],       // Gold/yellow accent
  secondary: [85, 85, 85] as [number, number, number],      // Dark gray for text
  muted: [130, 130, 130] as [number, number, number],       // Medium gray for metadata
  border: [220, 220, 220] as [number, number, number],      // Light gray border
  light: [248, 248, 248] as [number, number, number],       // Off-white background
  white: [255, 255, 255] as [number, number, number],
  success: [34, 139, 34] as [number, number, number],       // Forest green
  warning: [205, 133, 63] as [number, number, number],      // Peru/bronze
  error: [178, 34, 34] as [number, number, number],         // Firebrick
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

    if (isFinalInvoice && order.status !== "delivered") {
      throw new Error("Final invoice can only be generated for delivered orders");
    }

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

    const company = settings || {
      business_name: "Decouvertes",
      business_address: "Innovation Hub, Tech Park",
      business_city: "Pune",
      business_state: "Maharashtra",
      business_pincode: "411001",
      business_country: "India",
      business_phone: "+91 98765 43210",
      business_email: "info@decouvertes.com",
      business_gstin: "27XXXXX1234X1ZX",
      business_logo_url: null,
      invoice_prefix: "INV",
      default_gst_rate: 18,
      platform_fee_percentage: 2,
      platform_fee_taxable: false,
      terms_and_conditions: "1. Goods once sold are non-refundable.\n2. Payment due within 30 days.\n3. Warranty as per product terms.",
    };

    const orderSuffix = order.order_number.replace("DP-", "").replace(/-/g, "");
    const invoiceNumber = isFinalInvoice 
      ? `${company.invoice_prefix}-${orderSuffix}`
      : `PRO-${orderSuffix}`;
    
    const invoiceDate = isFinalInvoice 
      ? formatDate(order.delivered_at || new Date().toISOString())
      : formatDate(order.created_at);

    const shippingAddress = order.shipping_address as any;
    const buyerState = shippingAddress?.state || "";
    const sellerState = company.business_state || "Maharashtra";
    const isIgst = buyerState.toLowerCase() !== sellerState.toLowerCase();

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .single();

    // Calculate GST breakdown
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
    const platformFee = gstTotals.platform_fee || (Number(order.subtotal) * (company.platform_fee_percentage || 2)) / 100;
    const platformFeeTax = gstTotals.platform_fee_tax || (company.platform_fee_taxable ? (platformFee * 18) / 100 : 0);

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

    // ==================== GENERATE ENTERPRISE PDF ====================
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;
    let currentPage = 1;
    let totalPages = 1;

    // Fetch logo
    let logoBase64: string | null = null;
    const storedLogoUrl = `${supabaseUrl}/storage/v1/object/public/customer-partner-images/email-logo.png`;
    logoBase64 = await fetchImageAsBase64(storedLogoUrl);
    if (!logoBase64 && company.business_logo_url) {
      logoBase64 = await fetchImageAsBase64(company.business_logo_url);
    }

    // Helper function to add page footer
    const addPageFooter = (pageNum: number) => {
      const footerY = pageHeight - 12;
      
      // Gold accent line
      doc.setDrawColor(...colors.accent);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      // Footer text
      doc.setFontSize(7);
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.text("This is a computer-generated document and does not require a signature.", margin, footerY);
      doc.text(`Page ${pageNum}`, pageWidth - margin, footerY, { align: "right" });
      
      doc.setFontSize(6);
      doc.setTextColor(...colors.secondary);
      doc.text(`Generated on ${new Date().toLocaleString("en-IN")} | DECOUVERTES | www.decouvertes.com`, pageWidth / 2, footerY + 4, { align: "center" });
    };

    // Helper to check page break
    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 25) {
        addPageFooter(currentPage);
        doc.addPage();
        currentPage++;
        totalPages++;
        y = margin + 10;
        return true;
      }
      return false;
    };

    // ==================== HEADER SECTION ====================
    // Top accent bar with gold
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 4, "F");
    doc.setFillColor(...colors.accent);
    doc.rect(0, 4, pageWidth, 1, "F");

    y = 10;

    // Logo and company section
    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', margin, y, 30, 15); } catch {}
    }
    
    // Company name in BOLD CAPITALS
    doc.setFontSize(22);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    const companyNameX = margin + (logoBase64 ? 35 : 0);
    doc.text("DECOUVERTES", companyNameX, y + 9);
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Precision Engineering & Innovation", companyNameX, y + 14);

    // Invoice type badge (right side)
    const metaBoxWidth = 62;
    const metaBoxX = pageWidth - margin - metaBoxWidth;
    
    // Invoice type badge with gold accent for final, muted for proforma
    doc.setFillColor(...(isFinalInvoice ? colors.accent : colors.secondary));
    doc.roundedRect(metaBoxX, y - 2, metaBoxWidth, 10, 2, 2, "F");
    doc.setFontSize(11);
    doc.setTextColor(...(isFinalInvoice ? colors.primary : colors.white));
    doc.setFont("helvetica", "bold");
    doc.text(isFinalInvoice ? "TAX INVOICE" : "PROFORMA INVOICE", metaBoxX + metaBoxWidth / 2, y + 5, { align: "center" });

    // Meta details box
    y += 12;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(metaBoxX, y, metaBoxWidth, 20, 2, 2, "FD");

    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");

    const metaY = y + 5;
    doc.text("Invoice No:", metaBoxX + 4, metaY);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(invoiceNumber, metaBoxX + metaBoxWidth - 4, metaY, { align: "right" });

    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Date:", metaBoxX + 4, metaY + 5);
    doc.setTextColor(...colors.primary);
    doc.text(invoiceDate, metaBoxX + metaBoxWidth - 4, metaY + 5, { align: "right" });

    doc.setTextColor(...colors.muted);
    doc.text("Order No:", metaBoxX + 4, metaY + 10);
    doc.setTextColor(...colors.primary);
    doc.text(order.order_number, metaBoxX + metaBoxWidth - 4, metaY + 10, { align: "right" });

    y = 44;

    // Gold separator line
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);

    y += 7;

    // ==================== SELLER & BUYER SECTION ====================
    const boxWidth = (pageWidth - 2 * margin - 12) / 2;
    const boxHeight = 40;

    // SELLER BOX
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, "FD");

    // Gold accent bar on top
    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, y, boxWidth, 8, 3, 3, "F");
    doc.setFillColor(...colors.light);
    doc.rect(margin, y + 5, boxWidth, 3, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED FROM", margin + 5, y + 5.5);

    // Seller details
    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTES", margin + 5, y + 15);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(company.business_address, margin + 5, y + 20);
    doc.text(`${company.business_city}, ${company.business_state} - ${company.business_pincode}`, margin + 5, y + 24);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${company.business_gstin}`, margin + 5, y + 29);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`Ph: ${company.business_phone}`, margin + 5, y + 34);

    // BUYER BOX
    const buyerX = margin + boxWidth + 12;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(buyerX, y, boxWidth, boxHeight, 3, 3, "FD");

    // Gold accent bar on top
    doc.setFillColor(...colors.accent);
    doc.roundedRect(buyerX, y, boxWidth, 8, 3, 3, "F");
    doc.setFillColor(...colors.light);
    doc.rect(buyerX, y + 5, boxWidth, 3, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO", buyerX + 5, y + 5.5);

    // Buyer details
    const buyerName = shippingAddress?.full_name || profile?.full_name || "Customer";
    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(buyerName.toUpperCase(), buyerX + 5, y + 15);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    
    let addrY = y + 20;
    if (shippingAddress) {
      if (shippingAddress.address_line1) {
        doc.text(shippingAddress.address_line1, buyerX + 5, addrY);
        addrY += 4;
      }
      if (shippingAddress.address_line2) {
        doc.text(shippingAddress.address_line2, buyerX + 5, addrY);
        addrY += 4;
      }
      doc.text(`${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.postal_code || ""}`, buyerX + 5, addrY);
      addrY += 4;
      doc.text(`Phone: ${shippingAddress.phone || "N/A"}`, buyerX + 5, addrY);
    }
    
    if (order.buyer_gstin) {
      doc.setTextColor(...colors.accent);
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN: ${order.buyer_gstin}`, buyerX + 5, y + 36);
    }

    y += boxHeight + 8;

    // ==================== ITEMS TABLE ====================
    const tableWidth = pageWidth - 2 * margin;
    
    // Table header with charcoal background
    doc.setFillColor(...colors.primary);
    doc.rect(margin, y, tableWidth, 9, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    // Column positions
    const cols = isIgst 
      ? { sno: margin + 4, desc: margin + 14, hsn: margin + 78, qty: margin + 96, rate: margin + 112, taxable: margin + 132, igst: margin + 154, total: pageWidth - margin - 4 }
      : { sno: margin + 4, desc: margin + 12, hsn: margin + 58, qty: margin + 76, rate: margin + 92, taxable: margin + 112, cgst: margin + 132, sgst: margin + 152, total: pageWidth - margin - 4 };

    if (isIgst) {
      doc.text("#", cols.sno, y + 6);
      doc.text("PRODUCT DESCRIPTION", cols.desc, y + 6);
      doc.text("HSN", cols.hsn, y + 6);
      doc.text("QTY", cols.qty, y + 6);
      doc.text("RATE", cols.rate, y + 6);
      doc.text("TAXABLE", cols.taxable, y + 6);
      doc.text("IGST", cols.igst, y + 6);
      doc.text("TOTAL", cols.total, y + 6, { align: "right" });
    } else {
      doc.text("#", cols.sno, y + 6);
      doc.text("PRODUCT DESCRIPTION", cols.desc, y + 6);
      doc.text("HSN", cols.hsn, y + 6);
      doc.text("QTY", cols.qty, y + 6);
      doc.text("RATE", cols.rate, y + 6);
      doc.text("TAXABLE", cols.taxable, y + 6);
      doc.text("CGST", cols.cgst, y + 6);
      doc.text("SGST", cols.sgst, y + 6);
      doc.text("TOTAL", cols.total, y + 6, { align: "right" });
    }

    y += 9;

    // Table rows
    items.forEach((item: any, idx: number) => {
      checkPageBreak(9);
      
      const rowH = 8;
      
      // Alternating row background
      if (idx % 2 === 0) {
        doc.setFillColor(252, 252, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margin, y, tableWidth, rowH, "F");

      // Row bottom border
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.1);
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

      doc.setFontSize(7);
      doc.setTextColor(...colors.secondary);
      doc.setFont("helvetica", "normal");

      const name = (item.name || "").substring(0, isIgst ? 38 : 26);

      if (isIgst) {
        doc.text(String(idx + 1), cols.sno, y + 5.5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(name, cols.desc, y + 5.5);
        doc.setTextColor(...colors.secondary);
        doc.setFont("helvetica", "normal");
        doc.text(item.hsn || "8471", cols.hsn, y + 5.5);
        doc.text(String(item.quantity), cols.qty, y + 5.5);
        doc.text(formatCurrency(item.rate), cols.rate, y + 5.5);
        doc.text(formatCurrency(item.taxable_value), cols.taxable, y + 5.5);
        doc.setTextColor(...colors.accent);
        doc.text(`${item.gst_rate}%`, cols.igst, y + 5.5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.total), cols.total, y + 5.5, { align: "right" });
      } else {
        doc.text(String(idx + 1), cols.sno, y + 5.5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(name, cols.desc, y + 5.5);
        doc.setTextColor(...colors.secondary);
        doc.setFont("helvetica", "normal");
        doc.text(item.hsn || "8471", cols.hsn, y + 5.5);
        doc.text(String(item.quantity), cols.qty, y + 5.5);
        doc.text(formatCurrency(item.rate), cols.rate, y + 5.5);
        doc.text(formatCurrency(item.taxable_value), cols.taxable, y + 5.5);
        doc.setTextColor(...colors.accent);
        doc.text(`${item.cgst_rate}%`, cols.cgst, y + 5.5);
        doc.text(`${item.sgst_rate}%`, cols.sgst, y + 5.5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.total), cols.total, y + 5.5, { align: "right" });
      }

      y += rowH;
    });

    y += 8;
    checkPageBreak(70);

    // ==================== TOTALS & GST SUMMARY ====================
    const summaryHeight = 58;
    const totalsWidth = 85;
    const gstWidth = pageWidth - 2 * margin - totalsWidth - 12;
    
    // GST SUMMARY BOX (Left)
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, gstWidth, summaryHeight, 3, 3, "FD");

    doc.setFontSize(9);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("GST TAX SUMMARY", margin + 6, y + 8);

    let gstY = y + 14;

    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Supply Type:`, margin + 6, gstY);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(isIgst ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)", margin + 35, gstY);
    
    gstY += 5;
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Place of Supply:`, margin + 6, gstY);
    doc.setTextColor(...colors.primary);
    doc.text(`${sellerState}${isIgst ? ` → ${buyerState}` : ""}`, margin + 35, gstY);

    gstY += 8;
    
    // Tax header
    doc.setFillColor(...colors.primary);
    doc.rect(margin + 4, gstY, gstWidth - 8, 7, "F");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("TAX COMPONENT", margin + 8, gstY + 5);
    doc.text("AMOUNT", margin + gstWidth - 12, gstY + 5, { align: "right" });

    gstY += 8;

    if (isIgst) {
      doc.setFontSize(7);
      doc.setTextColor(...colors.secondary);
      doc.setFont("helvetica", "normal");
      doc.text("IGST @ Various Rates", margin + 8, gstY + 5);
      doc.text(formatCurrency(totalIgst), margin + gstWidth - 12, gstY + 5, { align: "right" });
      gstY += 8;
    } else {
      doc.setFontSize(7);
      doc.setTextColor(...colors.secondary);
      doc.setFont("helvetica", "normal");
      doc.text("CGST @ Various Rates", margin + 8, gstY + 5);
      doc.text(formatCurrency(totalCgst), margin + gstWidth - 12, gstY + 5, { align: "right" });
      gstY += 6;
      doc.text("SGST @ Various Rates", margin + 8, gstY + 5);
      doc.text(formatCurrency(totalSgst), margin + gstWidth - 12, gstY + 5, { align: "right" });
      gstY += 8;
    }

    // Total tax line with gold
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.5);
    doc.line(margin + 8, gstY + 2, margin + gstWidth - 8, gstY + 2);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("TOTAL TAX", margin + 8, gstY + 8);
    doc.setTextColor(...colors.accent);
    doc.text(formatCurrency(totalCgst + totalSgst + totalIgst), margin + gstWidth - 12, gstY + 8, { align: "right" });

    // TOTALS BOX (Right) - Gold highlighted
    const totalsX = pageWidth - margin - totalsWidth;
    doc.setFillColor(...colors.primary);
    doc.roundedRect(totalsX, y, totalsWidth, summaryHeight, 3, 3, "F");

    let totalsY = y + 10;
    const labelX = totalsX + 6;
    const valueX = totalsX + totalsWidth - 6;

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    
    doc.text("Subtotal:", labelX, totalsY);
    doc.text(formatCurrency(order.subtotal), valueX, totalsY, { align: "right" });
    totalsY += 6;

    doc.text("Platform Fee:", labelX, totalsY);
    doc.text(formatCurrency(platformFee), valueX, totalsY, { align: "right" });
    totalsY += 6;

    if (isIgst) {
      doc.text("IGST:", labelX, totalsY);
      doc.text(formatCurrency(totalIgst), valueX, totalsY, { align: "right" });
      totalsY += 6;
    } else {
      doc.text("CGST:", labelX, totalsY);
      doc.text(formatCurrency(totalCgst), valueX, totalsY, { align: "right" });
      totalsY += 5;
      doc.text("SGST:", labelX, totalsY);
      doc.text(formatCurrency(totalSgst), valueX, totalsY, { align: "right" });
      totalsY += 6;
    }

    doc.text("Shipping:", labelX, totalsY);
    doc.text(formatCurrency(order.shipping_amount || 0), valueX, totalsY, { align: "right" });
    totalsY += 8;

    // Grand Total with gold highlight
    doc.setFillColor(...colors.accent);
    doc.roundedRect(totalsX + 4, totalsY - 2, totalsWidth - 8, 12, 2, 2, "F");

    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", labelX + 2, totalsY + 6);
    doc.text(formatCurrency(order.total_amount), valueX - 2, totalsY + 6, { align: "right" });

    y += summaryHeight + 10;
    checkPageBreak(25);

    // ==================== PAYMENT INFO & TERMS ====================
    // Payment method badge
    const isCod = order.order_type === "cod" || order.payment_id?.startsWith("COD");
    
    doc.setFillColor(...(isCod ? colors.warning : colors.success));
    doc.roundedRect(margin, y, 50, 8, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(isCod ? "CASH ON DELIVERY" : "PAID ONLINE", margin + 25, y + 5.5, { align: "center" });

    if (order.payment_id && !isCod) {
      doc.setFontSize(7);
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.text(`Payment ID: ${order.payment_id}`, margin + 55, y + 5.5);
    }

    y += 12;

    // Terms section
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", margin, y);
    
    y += 5;
    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    const terms = company.terms_and_conditions.split("\n");
    terms.forEach((term: string) => {
      doc.text(term, margin, y);
      y += 3.5;
    });

    // Add footer
    addPageFooter(currentPage);

    // Generate and upload PDF
    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

    const prefix = isFinalInvoice ? "final-invoices" : "proforma-invoices";
    const fileName = `${prefix}/${invoiceNumber}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(fileName, pdfUint8Array, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload invoice PDF");
    }

    // Update invoice and order with PDF path
    await supabase.from("invoices").update({ pdf_url: fileName }).eq("id", invoice.id);
    
    if (isFinalInvoice) {
      await supabase.from("orders").update({ final_invoice_url: fileName }).eq("id", orderId);
    } else {
      await supabase.from("orders").update({ proforma_invoice_url: fileName, invoice_url: fileName }).eq("id", orderId);
    }

    console.log(`Invoice ${invoiceNumber} generated successfully at ${fileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${isFinalInvoice ? "Final Tax" : "Proforma"} Invoice generated successfully`,
        invoiceId: invoice.id,
        invoiceNumber: invoiceNumber,
        invoicePath: fileName,
        invoiceType: invoiceType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error generating invoice:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate invoice",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
