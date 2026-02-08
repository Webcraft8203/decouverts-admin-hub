import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== UNIFIED DECOUVERTES INVOICE TEMPLATE ====================
// This template matches the client hook (useUnifiedInvoicePdf.ts) exactly
// Both admin and user downloads will produce identical professional invoices

const COLORS = {
  primary: [33, 37, 41] as [number, number, number],
  accent: [198, 158, 47] as [number, number, number],
  orange: [230, 126, 34] as [number, number, number],
  secondary: [73, 80, 87] as [number, number, number],
  muted: [134, 142, 150] as [number, number, number],
  light: [248, 249, 250] as [number, number, number],
  border: [222, 226, 230] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  success: [25, 135, 84] as [number, number, number],
  warning: [255, 193, 7] as [number, number, number],
  tableHeader: [33, 37, 41] as [number, number, number],
  tableAlt: [248, 249, 250] as [number, number, number],
};

const COMPANY = {
  name: "DECOUVERTES",
  tagline: "Discovering Future Technologies",
  address: "Megapolis Springs, Phase 3, Hinjawadi Rajiv Gandhi Infotech Park",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411057",
  country: "India",
  phone: "+91 9561103435",
  email: "hello@decouvertes.com",
  gstin: "27AAKCD1492N1Z4",
  pan: "AAKCD1492N",
  website: "www.decouvertes.com",
  terms: [
    "1. Goods once sold will only be taken back or exchanged as per company policy.",
    "2. Payment is due within 30 days of invoice date unless otherwise specified.",
    "3. All disputes are subject to Pune jurisdiction.",
    "4. Warranty as per product terms and conditions.",
  ],
};

const PAGE = {
  width: 210,
  height: 297,
  margin: 15,
  footerHeight: 18,
};

const formatCurrency = (amount: number): string => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' And ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) result += ' And ' + convert(paise) + ' Paise';
  result += ' Only';
  
  return result;
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

interface InvoiceRequest {
  orderId: string;
  invoiceType?: "proforma" | "final" | "offline";
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
    const isOfflineInvoice = invoiceType === "offline";
    console.log(`Generating ${invoiceType.toUpperCase()} invoice for order:`, orderId);

    // Fetch order with items and product SKU/HSN
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, images, gst_percentage, sku, hsn_code))")
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
      business_name: COMPANY.name,
      business_address: COMPANY.address,
      business_city: COMPANY.city,
      business_state: COMPANY.state,
      business_pincode: COMPANY.pincode,
      business_country: COMPANY.country,
      business_phone: COMPANY.phone,
      business_email: COMPANY.email,
      business_gstin: COMPANY.gstin,
      business_pan: COMPANY.pan,
      business_logo_url: null,
      invoice_prefix: "INV",
      default_gst_rate: 18,
      platform_fee_percentage: 2,
      platform_fee_taxable: false,
      terms_and_conditions: COMPANY.terms.join("\n"),
    };

    const orderSuffix = order.order_number.replace("DP-", "").replace(/-/g, "");
    let invoiceNumber: string;
    if (isFinalInvoice) {
      invoiceNumber = `${company.invoice_prefix}-${orderSuffix}`;
    } else if (isOfflineInvoice) {
      invoiceNumber = `OFF-${orderSuffix}`;
    } else {
      invoiceNumber = `PRO-${orderSuffix}`;
    }
    
    const invoiceDate = isFinalInvoice 
      ? formatDate(order.delivered_at || new Date().toISOString())
      : formatDate(order.created_at);

    const shippingAddress = order.shipping_address as any;
    const buyerState = shippingAddress?.state || "";
    const sellerState = company.business_state || COMPANY.state;
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
          sno: index + 1,
          name: item.product_name,
          sku: item.products?.sku || `DEC-PRD-${String(index + 1).padStart(5, '0')}`,
          hsn: item.products?.hsn_code || "8471",
          quantity: item.quantity,
          rate: item.product_price,
          taxable_value: item.total_price,
          gst_rate: gst.gst_rate || 18,
          cgst_amount: gst.cgst_amount || 0,
          sgst_amount: gst.sgst_amount || 0,
          igst_amount: gst.igst_amount || 0,
          total: item.total_price + (gst.total_gst || 0),
        };
      });
    } else {
      items = order.order_items.map((item: any, index: number) => {
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
          sno: index + 1,
          name: item.product_name,
          sku: item.products?.sku || `DEC-PRD-${String(index + 1).padStart(5, '0')}`,
          hsn: item.products?.hsn_code || "8471",
          quantity: item.quantity,
          rate: item.product_price,
          taxable_value: taxableValue,
          gst_rate: gstRate,
          cgst_amount: cgstAmount,
          sgst_amount: sgstAmount,
          igst_amount: igstAmount,
          total: taxableValue + (cgstAmount + sgstAmount + igstAmount),
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
        notes: `Order: ${order.order_number}\nPayment ID: ${order.payment_id || "N/A"}\nInvoice Type: ${invoiceType.toUpperCase()}`,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Invoice creation error:", invoiceError);
      throw new Error("Failed to create invoice");
    }

    // ==================== GENERATE PROFESSIONAL PDF ====================
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = PAGE.width;
    const pageHeight = PAGE.height;
    const margin = PAGE.margin;
    const contentWidth = pageWidth - 2 * margin;
    let y = margin;
    let currentPage = 1;
    const safeZone = pageHeight - PAGE.footerHeight - 5;

    // Fetch logo
    let logoBase64: string | null = null;
    const storedLogoUrl = `${supabaseUrl}/storage/v1/object/public/customer-partner-images/email-logo.png`;
    logoBase64 = await fetchImageAsBase64(storedLogoUrl);
    if (!logoBase64 && company.business_logo_url) {
      logoBase64 = await fetchImageAsBase64(company.business_logo_url);
    }

    // Helper function to add page footer
    const addPageFooter = (pageNum: number, totalPages: number) => {
      const footerY = pageHeight - 12;
      
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);
      
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text("This is a computer-generated document and does not require a signature.", margin, footerY - 2);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
      
      doc.setFontSize(6);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | ${COMPANY.website}`, pageWidth / 2, footerY + 3, { align: "center" });
    };

    // Helper to check page break
    const checkPageBreak = (neededHeight: number): boolean => {
      if (y + neededHeight > safeZone) {
        doc.addPage();
        currentPage++;
        y = margin + 8;
        return true;
      }
      return false;
    };

    // ==================== HEADER SECTION ====================
    // Logo on left, Company name + tagline on right of logo
    if (logoBase64) {
      try { 
        doc.addImage(logoBase64, 'PNG', margin, y, 28, 14); 
      } catch {}
      
      // Company name in bold
      doc.setFontSize(18);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(COMPANY.name, margin + 32, y + 7);
      
      // Tagline in orange
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.orange);
      doc.setFont("helvetica", "italic");
      doc.text(COMPANY.tagline, margin + 32, y + 12);
      
      y += 18;
    } else {
      // Fallback: Text-based header
      doc.setFontSize(22);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(COMPANY.name, margin, y + 8);
      
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.orange);
      doc.setFont("helvetica", "italic");
      doc.text(COMPANY.tagline, margin, y + 14);
      y += 18;
    }
    
    // Company Details Row
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`${company.business_address || COMPANY.address}, ${company.business_city || COMPANY.city}, ${company.business_state || COMPANY.state} - ${company.business_pincode || COMPANY.pincode}, ${COMPANY.country}`, margin, y);
    y += 4;
    doc.text(`Phone: ${company.business_phone || COMPANY.phone} | Email: ${company.business_email || COMPANY.email}`, margin, y);
    y += 4;
    doc.text(`GSTIN: ${company.business_gstin || COMPANY.gstin} | PAN: ${company.business_pan || COMPANY.pan}`, margin, y);
    
    y += 8;
    
    // Gold accent divider
    doc.setFillColor(...COLORS.accent);
    doc.rect(margin, y, contentWidth, 2, "F");
    y += 6;

    // Invoice Type Badge - Centered
    let invoiceTypeLabel = "TAX INVOICE";
    let badgeBgColor = COLORS.primary;
    if (!isFinalInvoice && !isOfflineInvoice) {
      invoiceTypeLabel = "PROFORMA INVOICE";
      badgeBgColor = COLORS.secondary;
    } else if (isOfflineInvoice) {
      invoiceTypeLabel = "OFFLINE INVOICE";
      badgeBgColor = COLORS.muted;
    }
    
    const badgeWidth = 55;
    const badgeX = (pageWidth - badgeWidth) / 2;
    doc.setFillColor(...badgeBgColor);
    doc.roundedRect(badgeX, y, badgeWidth, 8, 2, 2, "F");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text(invoiceTypeLabel, pageWidth / 2, y + 5.5, { align: "center" });
    
    y += 14;

    // ==================== INVOICE DETAILS ROW (3 columns, no payment status) ====================
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, "F");
    
    const detailY = y + 5;
    const colSpacing = contentWidth / 3;
    const col1 = margin + 8;
    const col2 = margin + colSpacing + 8;
    const col3 = margin + colSpacing * 2 + 8;
    
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice Number", col1, detailY);
    doc.text("Invoice Date", col2, detailY);
    doc.text("Order Number", col3, detailY);
    
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(invoiceNumber, col1, detailY + 6);
    doc.text(invoiceDate, col2, detailY + 6);
    doc.text(order.order_number, col3, detailY + 6);

    y += 22;

    // ==================== BILLED BY / BILLED TO SECTION ====================
    const boxWidth = (contentWidth - 10) / 2;
    const boxHeight = 42;

    // Billed By Box
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, "FD");

    // Header bar
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(margin, y, boxWidth, 8, 2, 2, "F");
    doc.rect(margin, y + 4, boxWidth, 4, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED BY", margin + 4, y + 5.5);

    let fromY = y + 13;
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, margin + 4, fromY);
    
    fromY += 5;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(company.business_address || COMPANY.address, margin + 4, fromY, { maxWidth: boxWidth - 8 });
    fromY += 4;
    doc.text(`${company.business_city || COMPANY.city}, ${company.business_state || COMPANY.state} - ${company.business_pincode || COMPANY.pincode}`, margin + 4, fromY);
    fromY += 4;
    doc.text(`Phone: ${company.business_phone || COMPANY.phone}`, margin + 4, fromY);
    fromY += 4;
    doc.text(`Email: ${company.business_email || COMPANY.email}`, margin + 4, fromY);
    fromY += 5;
    doc.setTextColor(...COLORS.accent);
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${company.business_gstin || COMPANY.gstin}`, margin + 4, fromY);
    fromY += 4;
    doc.text(`PAN: ${company.business_pan || COMPANY.pan}`, margin + 4, fromY);

    // Billed To Box
    const toX = margin + boxWidth + 10;
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(toX, y, boxWidth, boxHeight, 2, 2, "FD");

    // Header bar
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(toX, y, boxWidth, 8, 2, 2, "F");
    doc.rect(toX, y + 4, boxWidth, 4, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO", toX + 4, y + 5.5);

    let toY = y + 13;
    const buyerName = shippingAddress?.full_name || profile?.full_name || "Customer";
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    const truncatedName = buyerName.length > 30 ? buyerName.substring(0, 30) + "..." : buyerName;
    doc.text(truncatedName.toUpperCase(), toX + 4, toY);

    toY += 5;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont("helvetica", "normal");
    
    if (shippingAddress) {
      if (shippingAddress.address_line1) {
        const addr = shippingAddress.address_line1.length > 40 
          ? shippingAddress.address_line1.substring(0, 40) + "..."
          : shippingAddress.address_line1;
        doc.text(addr, toX + 4, toY);
        toY += 4;
      }
      doc.text(`${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.postal_code || ""}`, toX + 4, toY);
      toY += 4;
    }
    
    if (shippingAddress?.phone) {
      doc.text(`Phone: ${shippingAddress.phone}`, toX + 4, toY);
      toY += 4;
    }
    
    if (order.buyer_gstin) {
      doc.setTextColor(...COLORS.accent);
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN: ${order.buyer_gstin}`, toX + 4, y + boxHeight - 5);
    }

    y += boxHeight + 8;

    // ==================== ITEMS TABLE ====================
    const tableX = margin;
    const tableW = contentWidth;
    const rowHeight = 12; // Increased for 2-line item rows
    const headerHeight = 9;

    // Column widths - Item Name + SKU combined, no separate description
    const colWidths = {
      sno: 10,
      item: 55,      // Combined Item Name + SKU column
      hsn: 20,
      qty: 14,
      rate: 24,
      taxable: 24,
      tax: 16,
      total: 27,
    };

    // Table Header
    doc.setFillColor(...COLORS.tableHeader);
    doc.rect(tableX, y, tableW, headerHeight, "F");

    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");

    let colX = tableX + 2;
    doc.text("S.No", colX, y + 6);
    colX += colWidths.sno;
    doc.text("Item Description", colX, y + 6);
    colX += colWidths.item;
    doc.text("HSN", colX, y + 6);
    colX += colWidths.hsn;
    doc.text("Qty", colX + 4, y + 6);
    colX += colWidths.qty;
    doc.text("Rate", colX + colWidths.rate - 2, y + 6, { align: "right" });
    colX += colWidths.rate;
    doc.text("Taxable", colX + colWidths.taxable - 2, y + 6, { align: "right" });
    colX += colWidths.taxable;
    doc.text(isIgst ? "IGST" : "GST", colX + 2, y + 6);
    colX += colWidths.tax;
    doc.text("Total", colX + colWidths.total - 2, y + 6, { align: "right" });

    y += headerHeight;

    // Table Rows
    items.forEach((item: any, idx: number) => {
      checkPageBreak(rowHeight + 2);

      // Alternating row background
      doc.setFillColor(...(idx % 2 === 0 ? COLORS.white : COLORS.tableAlt));
      doc.rect(tableX, y, tableW, rowHeight, "F");

      // Row border
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.1);
      doc.line(tableX, y + rowHeight, tableX + tableW, y + rowHeight);

      const textY1 = y + 5; // First line (Item name)
      const textY2 = y + 9.5; // Second line (SKU)
      
      doc.setFontSize(6.5);

      colX = tableX + 2;
      
      // S.No - centered vertically
      doc.setTextColor(...COLORS.secondary);
      doc.setFont("helvetica", "normal");
      doc.text(String(item.sno), colX + 3, y + 7);
      colX += colWidths.sno;
      
      // Item Name (line 1) + SKU (line 2)
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      const truncatedItemName = item.name.length > 35 ? item.name.substring(0, 35) + "..." : item.name;
      doc.text(truncatedItemName, colX, textY1);
      
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text(`SKU: ${item.sku}`, colX, textY2);
      doc.setFontSize(6.5);
      colX += colWidths.item;
      
      // HSN
      doc.setTextColor(...COLORS.secondary);
      doc.text(item.hsn, colX, y + 7);
      colX += colWidths.hsn;
      
      // Qty
      doc.text(String(item.quantity), colX + 6, y + 7, { align: "center" });
      colX += colWidths.qty;
      
      // Rate - right aligned
      doc.text(formatCurrency(item.rate), colX + colWidths.rate - 2, y + 7, { align: "right" });
      colX += colWidths.rate;
      
      // Taxable - right aligned
      doc.text(formatCurrency(item.taxable_value), colX + colWidths.taxable - 2, y + 7, { align: "right" });
      colX += colWidths.taxable;
      
      // Tax %
      doc.setTextColor(...COLORS.accent);
      doc.setFont("helvetica", "bold");
      doc.text(`${item.gst_rate}%`, colX + 6, y + 7, { align: "center" });
      colX += colWidths.tax;
      
      // Total - right aligned
      doc.setTextColor(...COLORS.primary);
      doc.text(formatCurrency(item.total), colX + colWidths.total - 2, y + 7, { align: "right" });

      y += rowHeight;
    });

    // Table bottom border
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(tableX, y, tableX + tableW, y);

    y += 10;
    checkPageBreak(65);

    // ==================== AMOUNT IN WORDS ====================
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Amount in Words:", margin + 4, y + 5);
    
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(numberToWords(order.total_amount), margin + 4, y + 9.5);

    y += 16;

    // ==================== SUMMARY SECTION ====================
    const summaryWidth = 80;
    const gstBoxWidth = contentWidth - summaryWidth - 10;
    const summaryHeight = isIgst ? 50 : 55;

    // GST Summary Box (Left)
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, gstBoxWidth, summaryHeight, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("TAX SUMMARY", margin + 4, y + 8);

    let gstY = y + 14;
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    
    doc.text("Supply Type:", margin + 4, gstY);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(isIgst ? "Inter-State" : "Intra-State", margin + 32, gstY);

    gstY += 5;
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Place of Supply:", margin + 4, gstY);
    doc.setTextColor(...COLORS.primary);
    doc.text(buyerState || sellerState, margin + 32, gstY);

    gstY += 7;
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(margin + 4, gstY, margin + gstBoxWidth - 4, gstY);

    gstY += 6;
    if (isIgst) {
      doc.setTextColor(...COLORS.secondary);
      doc.setFont("helvetica", "normal");
      doc.text("IGST:", margin + 4, gstY);
      doc.text(formatCurrency(totalIgst), margin + gstBoxWidth - 4, gstY, { align: "right" });
    } else {
      doc.setTextColor(...COLORS.secondary);
      doc.text("CGST:", margin + 4, gstY);
      doc.text(formatCurrency(totalCgst), margin + gstBoxWidth - 4, gstY, { align: "right" });
      gstY += 5;
      doc.text("SGST:", margin + 4, gstY);
      doc.text(formatCurrency(totalSgst), margin + gstBoxWidth - 4, gstY, { align: "right" });
    }

    gstY += 7;
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.5);
    doc.line(margin + 4, gstY, margin + gstBoxWidth - 4, gstY);
    
    gstY += 5;
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Total Tax:", margin + 4, gstY);
    doc.setTextColor(...COLORS.accent);
    doc.text(formatCurrency(totalCgst + totalSgst + totalIgst), margin + gstBoxWidth - 4, gstY, { align: "right" });

    // Totals Box (Right)
    const totalsX = pageWidth - margin - summaryWidth;
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(totalsX, y, summaryWidth, summaryHeight, 2, 2, "F");

    let totY = y + 10;
    const labelX = totalsX + 6;
    const valueX = totalsX + summaryWidth - 6;

    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "normal");

    doc.text("Subtotal:", labelX, totY);
    doc.text(formatCurrency(order.subtotal), valueX, totY, { align: "right" });
    
    totY += 6;
    if (isIgst) {
      doc.text("IGST:", labelX, totY);
      doc.text(formatCurrency(totalIgst), valueX, totY, { align: "right" });
    } else {
      doc.text("CGST:", labelX, totY);
      doc.text(formatCurrency(totalCgst), valueX, totY, { align: "right" });
      totY += 5;
      doc.text("SGST:", labelX, totY);
      doc.text(formatCurrency(totalSgst), valueX, totY, { align: "right" });
    }

    if (order.shipping_amount > 0) {
      totY += 5;
      doc.text("Shipping:", labelX, totY);
      doc.text(formatCurrency(order.shipping_amount), valueX, totY, { align: "right" });
    }

    totY += 10;

    // Grand Total highlight
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(totalsX + 4, totY - 3, summaryWidth - 8, 14, 2, 2, "F");

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", labelX + 2, totY + 5);
    doc.setFontSize(11);
    doc.text(formatCurrency(order.total_amount), valueX - 2, totY + 5, { align: "right" });

    y += summaryHeight + 10;

    // ==================== TERMS SECTION ====================
    if (y + 25 < safeZone) {
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text("Terms & Conditions", margin, y);
      
      y += 5;
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      COMPANY.terms.forEach((term) => {
        doc.text(term, margin, y);
        y += 3.5;
      });
    }

    // Add footers to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addPageFooter(i, pageCount);
    }

    // Generate and upload PDF
    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

    let prefix = "proforma-invoices";
    if (isFinalInvoice) prefix = "final-invoices";
    else if (isOfflineInvoice) prefix = "offline-invoices";
    
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
        message: `${invoiceType.toUpperCase()} Invoice generated successfully`,
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
