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

// Enterprise color palette
const colors = {
  brand: [45, 62, 80] as [number, number, number],       // Deep navy
  primary: [30, 41, 59] as [number, number, number],     // Slate 800
  secondary: [71, 85, 105] as [number, number, number],  // Slate 500
  accent: [16, 185, 129] as [number, number, number],    // Emerald 500
  muted: [148, 163, 184] as [number, number, number],    // Slate 400
  border: [226, 232, 240] as [number, number, number],   // Slate 200
  light: [248, 250, 252] as [number, number, number],    // Slate 50
  white: [255, 255, 255] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],   // Amber 500
  success: [34, 197, 94] as [number, number, number],    // Green 500
  error: [239, 68, 68] as [number, number, number],      // Red 500
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
      
      // Footer line
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
      
      // Footer text
      doc.setFontSize(7);
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.text("This is a computer-generated document and does not require a signature.", margin, footerY);
      doc.text(`Page ${pageNum}`, pageWidth - margin, footerY, { align: "right" });
      
      doc.setFontSize(6);
      doc.text(`Generated on ${new Date().toLocaleString("en-IN")} | DECOUVERTS`, pageWidth / 2, footerY + 4, { align: "center" });
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
    // Top accent bar
    doc.setFillColor(...colors.brand);
    doc.rect(0, 0, pageWidth, 3, "F");

    y = 8;

    // Logo and company section
    const headerHeight = 22;
    
    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', margin, y, 28, 14); } catch {}
    }
    
    // Company name in CAPITALS
    doc.setFontSize(18);
    doc.setTextColor(...colors.brand);
    doc.setFont("helvetica", "bold");
    const companyNameX = margin + (logoBase64 ? 32 : 0);
    doc.text("DECOUVERTS", companyNameX, y + 7);
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "italic");
    doc.text("Discovering Future Technologies", companyNameX, y + 12);

    // Invoice title and metadata box (right side)
    const metaBoxWidth = 60;
    const metaBoxX = pageWidth - margin - metaBoxWidth;
    
    // Invoice type badge
    doc.setFillColor(...(isFinalInvoice ? colors.success : colors.warning));
    doc.roundedRect(metaBoxX, y - 2, metaBoxWidth, 9, 2, 2, "F");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(isFinalInvoice ? "TAX INVOICE" : "PROFORMA INVOICE", metaBoxX + metaBoxWidth / 2, y + 4, { align: "center" });

    // Meta details box
    y += 10;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(metaBoxX, y, metaBoxWidth, 18, 2, 2, "FD");

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");

    const metaY = y + 4;
    doc.text("Invoice No:", metaBoxX + 3, metaY);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(invoiceNumber, metaBoxX + metaBoxWidth - 3, metaY, { align: "right" });

    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text("Date:", metaBoxX + 3, metaY + 5);
    doc.setTextColor(...colors.primary);
    doc.text(invoiceDate, metaBoxX + metaBoxWidth - 3, metaY + 5, { align: "right" });

    doc.setTextColor(...colors.secondary);
    doc.text("Order No:", metaBoxX + 3, metaY + 10);
    doc.setTextColor(...colors.primary);
    doc.text(order.order_number, metaBoxX + metaBoxWidth - 3, metaY + 10, { align: "right" });

    y = 40;

    // Separator line
    doc.setDrawColor(...colors.brand);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    y += 6;

    // ==================== SELLER & BUYER SECTION ====================
    const boxWidth = (pageWidth - 2 * margin - 10) / 2;
    const boxHeight = 38;

    // SELLER BOX
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, "FD");

    // Label badge
    doc.setFillColor(...colors.brand);
    doc.roundedRect(margin + 4, y + 3, 22, 6, 1, 1, "F");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("FROM", margin + 15, y + 7, { align: "center" });

    // Seller details
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTS", margin + 6, y + 15);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(company.business_address, margin + 6, y + 20);
    doc.text(`${company.business_city}, ${company.business_state} - ${company.business_pincode}`, margin + 6, y + 24);
    doc.text(`GSTIN: ${company.business_gstin}`, margin + 6, y + 28);
    doc.text(`Phone: ${company.business_phone} | Email: ${company.business_email}`, margin + 6, y + 32);

    // BUYER BOX
    const buyerX = margin + boxWidth + 10;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(buyerX, y, boxWidth, boxHeight, 3, 3, "FD");

    // Label badge
    doc.setFillColor(...colors.accent);
    doc.roundedRect(buyerX + 4, y + 3, 22, 6, 1, 1, "F");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", buyerX + 15, y + 7, { align: "center" });

    // Buyer details
    const buyerName = shippingAddress?.full_name || profile?.full_name || "Customer";
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(buyerName.toUpperCase(), buyerX + 6, y + 15);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    
    if (shippingAddress) {
      doc.text(shippingAddress.address_line1 || "", buyerX + 6, y + 20);
      if (shippingAddress.address_line2) {
        doc.text(shippingAddress.address_line2, buyerX + 6, y + 24);
        doc.text(`${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.postal_code || ""}`, buyerX + 6, y + 28);
        doc.text(`Phone: ${shippingAddress.phone || "N/A"}`, buyerX + 6, y + 32);
      } else {
        doc.text(`${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.postal_code || ""}`, buyerX + 6, y + 24);
        doc.text(`Phone: ${shippingAddress.phone || "N/A"}`, buyerX + 6, y + 28);
      }
    }
    
    if (order.buyer_gstin) {
      doc.setTextColor(...colors.accent);
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN: ${order.buyer_gstin}`, buyerX + 6, y + 36);
    }

    y += boxHeight + 8;

    // ==================== ITEMS TABLE ====================
    const tableWidth = pageWidth - 2 * margin;
    
    // Table header
    doc.setFillColor(...colors.brand);
    doc.rect(margin, y, tableWidth, 9, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    // Column positions
    const cols = isIgst 
      ? { sno: margin + 3, desc: margin + 12, hsn: margin + 75, qty: margin + 95, rate: margin + 110, taxable: margin + 130, igst: margin + 152, total: pageWidth - margin - 3 }
      : { sno: margin + 3, desc: margin + 10, hsn: margin + 55, qty: margin + 72, rate: margin + 87, taxable: margin + 105, cgst: margin + 125, sgst: margin + 145, total: pageWidth - margin - 3 };

    if (isIgst) {
      doc.text("#", cols.sno, y + 6);
      doc.text("DESCRIPTION", cols.desc, y + 6);
      doc.text("HSN", cols.hsn, y + 6);
      doc.text("QTY", cols.qty, y + 6);
      doc.text("RATE", cols.rate, y + 6);
      doc.text("TAXABLE", cols.taxable, y + 6);
      doc.text("IGST", cols.igst, y + 6);
      doc.text("TOTAL", cols.total, y + 6, { align: "right" });
    } else {
      doc.text("#", cols.sno, y + 6);
      doc.text("DESCRIPTION", cols.desc, y + 6);
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
      checkPageBreak(8);
      
      const rowH = 8;
      
      // Alternate row background
      if (idx % 2 === 0) {
        doc.setFillColor(250, 251, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margin, y, tableWidth, rowH, "F");

      // Row border
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.1);
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

      doc.setFontSize(7);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "normal");

      const productName = item.name.length > (isIgst ? 35 : 25) ? item.name.substring(0, isIgst ? 32 : 22) + "..." : item.name;

      if (isIgst) {
        doc.text(String(idx + 1), cols.sno, y + 5);
        doc.text(productName, cols.desc, y + 5);
        doc.setTextColor(...colors.secondary);
        doc.text(item.hsn || "8471", cols.hsn, y + 5);
        doc.setTextColor(...colors.primary);
        doc.text(String(item.quantity), cols.qty, y + 5);
        doc.text(formatCurrency(item.rate), cols.rate, y + 5);
        doc.text(formatCurrency(item.taxable_value), cols.taxable, y + 5);
        doc.setTextColor(...colors.accent);
        doc.text(`${item.igst_rate}%`, cols.igst, y + 5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.total), cols.total, y + 5, { align: "right" });
      } else {
        doc.text(String(idx + 1), cols.sno, y + 5);
        doc.text(productName, cols.desc, y + 5);
        doc.setTextColor(...colors.secondary);
        doc.text(item.hsn || "8471", cols.hsn, y + 5);
        doc.setTextColor(...colors.primary);
        doc.text(String(item.quantity), cols.qty, y + 5);
        doc.text(formatCurrency(item.rate), cols.rate, y + 5);
        doc.text(formatCurrency(item.taxable_value), cols.taxable, y + 5);
        doc.setTextColor(...colors.accent);
        doc.text(`${item.cgst_rate}%`, cols.cgst, y + 5);
        doc.text(`${item.sgst_rate}%`, cols.sgst, y + 5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.total), cols.total, y + 5, { align: "right" });
      }

      y += rowH;
    });

    y += 6;
    checkPageBreak(60);

    // ==================== TOTALS & GST SUMMARY ====================
    const summaryHeight = isIgst ? 48 : 56;
    const totalsWidth = 80;
    const gstWidth = pageWidth - 2 * margin - totalsWidth - 10;
    
    // GST SUMMARY BOX (Left)
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, y, gstWidth, summaryHeight, 3, 3, "FD");

    doc.setFontSize(8);
    doc.setTextColor(...colors.brand);
    doc.setFont("helvetica", "bold");
    doc.text("TAX SUMMARY", margin + 6, y + 8);

    let gstY = y + 14;
    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Supply Type:`, margin + 6, gstY);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(isIgst ? "Inter-State" : "Intra-State", margin + 35, gstY);
    
    gstY += 5;
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`Place of Supply:`, margin + 6, gstY);
    doc.setTextColor(...colors.primary);
    doc.text(`${sellerState}${isIgst ? ` → ${buyerState}` : ""}`, margin + 35, gstY);

    gstY += 8;
    
    // Tax table header
    doc.setFillColor(...colors.brand);
    doc.rect(margin + 4, gstY, gstWidth - 8, 6, "F");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("TAX TYPE", margin + 8, gstY + 4);
    doc.text("AMOUNT", margin + gstWidth - 12, gstY + 4, { align: "right" });

    gstY += 6;

    if (isIgst) {
      doc.setFontSize(7);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "normal");
      doc.text("IGST @ Various Rates", margin + 8, gstY + 5);
      doc.text(formatCurrency(totalIgst), margin + gstWidth - 12, gstY + 5, { align: "right" });
      gstY += 7;
    } else {
      doc.setFontSize(7);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "normal");
      doc.text("CGST @ Various Rates", margin + 8, gstY + 5);
      doc.text(formatCurrency(totalCgst), margin + gstWidth - 12, gstY + 5, { align: "right" });
      gstY += 6;
      doc.text("SGST @ Various Rates", margin + 8, gstY + 5);
      doc.text(formatCurrency(totalSgst), margin + gstWidth - 12, gstY + 5, { align: "right" });
      gstY += 7;
    }

    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.5);
    doc.line(margin + 8, gstY + 2, margin + gstWidth - 8, gstY + 2);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.brand);
    doc.text("TOTAL TAX", margin + 8, gstY + 8);
    doc.setTextColor(...colors.accent);
    doc.text(formatCurrency(totalCgst + totalSgst + totalIgst), margin + gstWidth - 12, gstY + 8, { align: "right" });

    // TOTALS BOX (Right)
    const totalsX = pageWidth - margin - totalsWidth;
    doc.setFillColor(...colors.brand);
    doc.roundedRect(totalsX, y, totalsWidth, summaryHeight, 3, 3, "F");

    let totalsY = y + 8;
    const labelX = totalsX + 6;
    const valueX = totalsX + totalsWidth - 6;

    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");

    doc.text("Subtotal", labelX, totalsY);
    doc.text(formatCurrency(order.subtotal), valueX, totalsY, { align: "right" });
    totalsY += 6;

    if (Number(order.discount_amount) > 0) {
      doc.text("Discount", labelX, totalsY);
      doc.text(`-${formatCurrency(order.discount_amount)}`, valueX, totalsY, { align: "right" });
      totalsY += 6;
    }

    if (isIgst) {
      doc.text("IGST", labelX, totalsY);
      doc.text(formatCurrency(totalIgst), valueX, totalsY, { align: "right" });
      totalsY += 6;
    } else {
      doc.text("CGST", labelX, totalsY);
      doc.text(formatCurrency(totalCgst), valueX, totalsY, { align: "right" });
      totalsY += 5;
      doc.text("SGST", labelX, totalsY);
      doc.text(formatCurrency(totalSgst), valueX, totalsY, { align: "right" });
      totalsY += 6;
    }

    doc.text("Shipping", labelX, totalsY);
    doc.text(Number(order.shipping_amount) === 0 ? "FREE" : formatCurrency(order.shipping_amount), valueX, totalsY, { align: "right" });
    totalsY += 8;

    // Grand total highlight
    doc.setFillColor(...colors.accent);
    doc.roundedRect(totalsX + 4, totalsY - 2, totalsWidth - 8, 12, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", labelX + 2, totalsY + 5);
    doc.text(formatCurrency(order.total_amount), valueX - 2, totalsY + 5, { align: "right" });

    y += summaryHeight + 8;

    // ==================== PROFORMA NOTICE ====================
    if (!isFinalInvoice) {
      checkPageBreak(16);
      
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(...colors.warning);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 2, 2, "FD");
      
      doc.setFontSize(8);
      doc.setTextColor(...colors.warning);
      doc.setFont("helvetica", "bold");
      doc.text("⚠ PROFORMA INVOICE - NOT A TAX DOCUMENT", margin + 6, y + 5);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.secondary);
      doc.text("This document is for reference only. Final GST Tax Invoice will be issued upon successful delivery of goods.", margin + 6, y + 9);
      y += 16;
    }

    // ==================== TERMS & CONDITIONS ====================
    checkPageBreak(25);

    doc.setFontSize(8);
    doc.setTextColor(...colors.brand);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", margin, y);
    y += 5;

    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    const terms = company.terms_and_conditions.split("\n");
    terms.forEach((term: string) => {
      if (y < pageHeight - 25) {
        doc.text(term, margin, y);
        y += 3.5;
      }
    });

    y += 4;

    // Thank you message
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
    doc.setFontSize(9);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for your business!", pageWidth / 2, y + 6.5, { align: "center" });

    // Add footer to current page
    addPageFooter(currentPage);

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
