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

// Professional Enterprise Color Palette - DECOUVERTES Branding
const colors = {
  primary: [33, 37, 41] as [number, number, number],        // Rich dark gray
  accent: [198, 158, 47] as [number, number, number],       // Professional gold
  secondary: [73, 80, 87] as [number, number, number],      // Slate gray for text
  muted: [134, 142, 150] as [number, number, number],       // Medium gray for metadata
  light: [248, 249, 250] as [number, number, number],       // Soft off-white
  border: [222, 226, 230] as [number, number, number],      // Subtle border
  white: [255, 255, 255] as [number, number, number],
  success: [25, 135, 84] as [number, number, number],       // Bootstrap green
  warning: [255, 193, 7] as [number, number, number],       // Amber warning
  tableHeader: [33, 37, 41] as [number, number, number],    // Dark header
  tableAlt: [248, 249, 250] as [number, number, number],    // Alternating row
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
          sku: item.products?.sku || `DEC-PRD-${String(index + 1).padStart(5, '0')}`,
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
          name: item.product_name,
          sku: item.products?.sku || `DEC-PRD-${String(index + 1).padStart(5, '0')}`,
          hsn: item.products?.hsn_code || "8471",
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

    // Determine payment status display
    const isCod = order.order_type === "cod" || order.payment_id?.startsWith("COD");
    let paymentStatus = "PAID";
    if (isOfflineInvoice) {
      paymentStatus = "OFFLINE PAYMENT";
    } else if (isCod) {
      if (order.status === "delivered" && order.cod_payment_status === "received") {
        paymentStatus = "COD RECEIVED";
      } else {
        paymentStatus = "COD - AWAITING";
      }
    }

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

    // ==================== GENERATE ENTERPRISE PDF ====================
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;
    let currentPage = 1;

    // Fetch logo
    let logoBase64: string | null = null;
    const storedLogoUrl = `${supabaseUrl}/storage/v1/object/public/customer-partner-images/email-logo.png`;
    logoBase64 = await fetchImageAsBase64(storedLogoUrl);
    if (!logoBase64 && company.business_logo_url) {
      logoBase64 = await fetchImageAsBase64(company.business_logo_url);
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      inv: invoiceNumber,
      ord: order.order_number,
      cust: shippingAddress?.full_name || profile?.full_name || "Customer",
      amt: order.total_amount,
      gst: totalCgst + totalSgst + totalIgst,
      date: invoiceDate,
    });

    // Helper function to add page footer
    const addPageFooter = (pageNum: number, totalPages: number) => {
      const footerY = pageHeight - 12;
      
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);
      
      doc.setFontSize(6.5);
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.text("This is a computer-generated document and does not require a signature.", margin, footerY - 2);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
      
      doc.setFontSize(6);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | www.decouvertes.com`, pageWidth / 2, footerY + 3, { align: "center" });
    };

    // Helper to check page break
    const checkPageBreak = (neededHeight: number): boolean => {
      if (y + neededHeight > pageHeight - 25) {
        addPageFooter(currentPage, 1);
        doc.addPage();
        currentPage++;
        y = margin + 8;
        return true;
      }
      return false;
    };

    // ==================== HEADER SECTION ====================
    // Company Logo and Name - Left Side
    if (logoBase64) {
      try { 
        doc.addImage(logoBase64, 'PNG', margin, y, 40, 20); 
      } catch {}
      y += 24;
    } else {
      // Fallback: Company name as branding
      doc.setFontSize(24);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "bold");
      doc.text("DECOUVERTES", margin, y + 10);
      
      doc.setFontSize(8);
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.text("Excellence in Innovation", margin, y + 16);
      y += 22;
    }
    
    // Company Details Row
    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`${company.business_address}, ${company.business_city}, ${company.business_state} - ${company.business_pincode}`, margin, y);
    y += 4;
    doc.text(`Phone: ${company.business_phone} | Email: ${company.business_email} | GSTIN: ${company.business_gstin}`, margin, y);
    
    y += 8;
    
    // Gold accent divider
    doc.setFillColor(...colors.accent);
    doc.rect(margin, y, pageWidth - 2 * margin, 2, "F");
    y += 6;

    // Invoice Type Badge - Centered
    let invoiceTypeLabel = "TAX INVOICE";
    let badgeBgColor = colors.primary;
    if (!isFinalInvoice && !isOfflineInvoice) {
      invoiceTypeLabel = "PROFORMA INVOICE";
      badgeBgColor = colors.secondary;
    } else if (isOfflineInvoice) {
      invoiceTypeLabel = "OFFLINE INVOICE";
      badgeBgColor = colors.muted;
    }
    
    const badgeWidth = 55;
    const badgeX = (pageWidth - badgeWidth) / 2;
    doc.setFillColor(...badgeBgColor);
    doc.roundedRect(badgeX, y, badgeWidth, 8, 2, 2, "F");
    doc.setFontSize(9);
    doc.setTextColor(...colors.white);
    doc.setFont("helvetica", "bold");
    doc.text(invoiceTypeLabel, pageWidth / 2, y + 5.5, { align: "center" });
    
    y += 14;

    // Invoice Details Row
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 2, 2, "F");
    
    const detailY = y + 6;
    const col1 = margin + 8;
    const col2 = margin + 55;
    const col3 = margin + 105;
    const col4 = pageWidth - margin - 50;
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice Number", col1, detailY);
    doc.text("Invoice Date", col2, detailY);
    doc.text("Order Number", col3, detailY);
    doc.text("Payment Status", col4, detailY);
    
    doc.setFontSize(9);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(invoiceNumber, col1, detailY + 6);
    doc.text(invoiceDate, col2, detailY + 6);
    doc.text(order.order_number, col3, detailY + 6);
    
    // Payment status badge in the details row
    let statusColor = colors.success;
    if (paymentStatus.includes("AWAITING") || paymentStatus.includes("COD")) {
      statusColor = colors.warning;
    } else if (paymentStatus.includes("OFFLINE")) {
      statusColor = colors.muted;
    }
    doc.setFillColor(...statusColor);
    doc.roundedRect(col4 - 2, detailY + 1, 42, 6, 1, 1, "F");
    doc.setFontSize(7);
    if (paymentStatus.includes("AWAITING") || paymentStatus.includes("OFFLINE")) {
      doc.setTextColor(...colors.primary);
    } else {
      doc.setTextColor(...colors.white);
    }
    doc.setFont("helvetica", "bold");
    doc.text(paymentStatus, col4 + 19, detailY + 5.5, { align: "center" });

    y += 24;

    // ==================== BILLED BY / BILLED TO SECTION ====================
    const boxWidth = (pageWidth - 2 * margin - 10) / 2;
    const boxHeight = 42;

    // Billed By Box
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, "FD");

    // Header bar
    doc.setFillColor(...colors.accent);
    doc.rect(margin, y, boxWidth, 7, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED BY (Seller)", margin + 4, y + 5);

    // Seller details
    let sellerY = y + 13;
    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTES", margin + 4, sellerY);

    sellerY += 5;
    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(company.business_address, margin + 4, sellerY);
    sellerY += 4;
    doc.text(`${company.business_city}, ${company.business_state} - ${company.business_pincode}`, margin + 4, sellerY);
    
    sellerY += 6;
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("GSTIN:", margin + 4, sellerY);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(company.business_gstin, margin + 18, sellerY);
    
    sellerY += 4;
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Phone: ${company.business_phone}`, margin + 4, sellerY);

    // Billed To Box
    const billedToX = margin + boxWidth + 10;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(billedToX, y, boxWidth, boxHeight, 2, 2, "FD");

    // Header bar
    doc.setFillColor(...colors.primary);
    doc.rect(billedToX, y, boxWidth, 7, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.white);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO (Buyer)", billedToX + 4, y + 5);

    // Customer details
    const buyerName = shippingAddress?.full_name || profile?.full_name || "Customer";
    let buyerY = y + 13;
    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(buyerName.substring(0, 30), billedToX + 4, buyerY);

    buyerY += 5;
    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    
    if (shippingAddress) {
      if (shippingAddress.address_line1) {
        doc.text(shippingAddress.address_line1.substring(0, 45), billedToX + 4, buyerY);
        buyerY += 4;
      }
      doc.text(`${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.postal_code || ""}`, billedToX + 4, buyerY);
    }
    
    buyerY += 6;
    if (order.buyer_gstin) {
      doc.setTextColor(...colors.muted);
      doc.text("GSTIN:", billedToX + 4, buyerY);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "bold");
      doc.text(order.buyer_gstin, billedToX + 18, buyerY);
    }
    
    if (shippingAddress?.phone) {
      buyerY += 4;
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.text(`Phone: ${shippingAddress.phone}`, billedToX + 4, buyerY);
    }

    y += boxHeight + 8;

    // ==================== ITEMS TABLE ====================
    const tableWidth = pageWidth - 2 * margin;
    
    // Table header
    doc.setFillColor(...colors.tableHeader);
    doc.rect(margin, y, tableWidth, 9, "F");
    
    doc.setFontSize(6);
    doc.setTextColor(...colors.white);
    doc.setFont("helvetica", "bold");

    // Column positions for IGST vs CGST/SGST
    let cols: any;
    if (isIgst) {
      cols = {
        sno: margin + 4,
        sku: margin + 12,
        desc: margin + 38,
        hsn: margin + 82,
        qty: margin + 98,
        rate: margin + 112,
        taxable: margin + 132,
        igst: margin + 154,
        amount: pageWidth - margin - 4
      };
      doc.text("#", cols.sno, y + 6);
      doc.text("SKU", cols.sku, y + 6);
      doc.text("DESCRIPTION", cols.desc, y + 6);
      doc.text("HSN", cols.hsn, y + 6);
      doc.text("QTY", cols.qty, y + 6);
      doc.text("RATE", cols.rate, y + 6);
      doc.text("TAXABLE", cols.taxable, y + 6);
      doc.text("IGST", cols.igst, y + 6);
      doc.text("AMOUNT", cols.amount, y + 6, { align: "right" });
    } else {
      cols = {
        sno: margin + 4,
        sku: margin + 12,
        desc: margin + 36,
        hsn: margin + 72,
        qty: margin + 86,
        rate: margin + 98,
        taxable: margin + 116,
        cgst: margin + 136,
        sgst: margin + 154,
        amount: pageWidth - margin - 4
      };
      doc.text("#", cols.sno, y + 6);
      doc.text("SKU", cols.sku, y + 6);
      doc.text("DESCRIPTION", cols.desc, y + 6);
      doc.text("HSN", cols.hsn, y + 6);
      doc.text("QTY", cols.qty, y + 6);
      doc.text("RATE", cols.rate, y + 6);
      doc.text("TAXABLE", cols.taxable, y + 6);
      doc.text("CGST", cols.cgst, y + 6);
      doc.text("SGST", cols.sgst, y + 6);
      doc.text("AMOUNT", cols.amount, y + 6, { align: "right" });
    }

    y += 9;

    // Table rows
    items.forEach((item: any, idx: number) => {
      checkPageBreak(12);
      
      const rowH = 10;
      
      // Alternating row background
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(...colors.tableAlt);
      }
      doc.rect(margin, y, tableWidth, rowH, "F");

      // Row bottom border
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.1);
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");

      // S.No
      doc.setTextColor(...colors.muted);
      doc.text(String(idx + 1), cols.sno, y + 6.5);
      
      // SKU
      doc.setTextColor(...colors.accent);
      doc.setFont("helvetica", "bold");
      doc.text((item.sku || "").substring(0, 14), cols.sku, y + 6.5);

      // Product name
      const name = (item.name || "").substring(0, 22);
      doc.setTextColor(...colors.primary);
      doc.text(name, cols.desc, y + 6.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.secondary);

      if (isIgst) {
        doc.text(item.hsn || "8471", cols.hsn, y + 6.5);
        doc.text(String(item.quantity), cols.qty, y + 6.5);
        doc.text(formatCurrency(item.rate), cols.rate, y + 6.5);
        doc.text(formatCurrency(item.taxable_value), cols.taxable, y + 6.5);
        doc.setTextColor(...colors.muted);
        doc.text(formatCurrency(item.igst_amount), cols.igst, y + 6.5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.total), cols.amount, y + 6.5, { align: "right" });
      } else {
        doc.text(item.hsn || "8471", cols.hsn, y + 6.5);
        doc.text(String(item.quantity), cols.qty, y + 6.5);
        doc.text(formatCurrency(item.rate), cols.rate, y + 6.5);
        doc.text(formatCurrency(item.taxable_value), cols.taxable, y + 6.5);
        doc.setTextColor(...colors.muted);
        doc.text(formatCurrency(item.cgst_amount), cols.cgst, y + 6.5);
        doc.text(formatCurrency(item.sgst_amount), cols.sgst, y + 6.5);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.total), cols.amount, y + 6.5, { align: "right" });
      }

      y += rowH;
    });

    y += 10;
    checkPageBreak(75);

    // ==================== TOTALS SECTION ====================
    const totalsWidth = 75;
    const totalsX = pageWidth - margin - totalsWidth;
    
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(totalsX, y, totalsWidth, 55, 2, 2, "FD");

    let totalsY = y + 8;
    const labelX = totalsX + 5;
    const valueX = totalsX + totalsWidth - 5;

    doc.setFontSize(7.5);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    
    doc.text("Sub Total", labelX, totalsY);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(order.subtotal), valueX, totalsY, { align: "right" });
    totalsY += 7;

    if (order.discount_amount && order.discount_amount > 0) {
      doc.setTextColor(...colors.success);
      doc.setFont("helvetica", "normal");
      doc.text("Discount", labelX, totalsY);
      doc.text(`- ${formatCurrency(order.discount_amount)}`, valueX, totalsY, { align: "right" });
      totalsY += 7;
    }

    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    if (isIgst) {
      doc.text("IGST", labelX, totalsY);
      doc.setTextColor(...colors.primary);
      doc.text(formatCurrency(totalIgst), valueX, totalsY, { align: "right" });
      totalsY += 7;
    } else {
      doc.text("CGST", labelX, totalsY);
      doc.setTextColor(...colors.primary);
      doc.text(formatCurrency(totalCgst), valueX, totalsY, { align: "right" });
      totalsY += 6;
      doc.setTextColor(...colors.secondary);
      doc.text("SGST", labelX, totalsY);
      doc.setTextColor(...colors.primary);
      doc.text(formatCurrency(totalSgst), valueX, totalsY, { align: "right" });
      totalsY += 7;
    }

    if (order.shipping_amount > 0) {
      doc.setTextColor(...colors.secondary);
      doc.setFont("helvetica", "normal");
      doc.text("Shipping", labelX, totalsY);
      doc.setTextColor(...colors.primary);
      doc.text(formatCurrency(order.shipping_amount), valueX, totalsY, { align: "right" });
      totalsY += 7;
    }

    // Grand Total with accent background
    doc.setFillColor(...colors.accent);
    doc.roundedRect(totalsX + 3, totalsY - 1, totalsWidth - 6, 11, 1, 1, "F");
    
    doc.setFontSize(9);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", labelX + 2, totalsY + 6);
    doc.text(formatCurrency(order.total_amount), valueX - 2, totalsY + 6, { align: "right" });

    // Amount in Words - Left side
    const wordsBoxWidth = totalsX - margin - 10;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, y, wordsBoxWidth, 25, 2, 2, "FD");

    doc.setFontSize(7);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text("Amount in Words", margin + 5, y + 8);
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "normal");
    const amountWords = numberToWords(order.total_amount);
    const wrappedWords = doc.splitTextToSize(amountWords, wordsBoxWidth - 10);
    doc.text(wrappedWords, margin + 5, y + 15);

    y += 60;

    // ==================== TERMS & CONDITIONS ====================
    checkPageBreak(25);
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Terms and Conditions", margin, y);
    
    y += 4;
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    
    const terms = company.terms_and_conditions.split("\n");
    terms.slice(0, 4).forEach((term: string, idx: number) => {
      doc.text(`${idx + 1}. ${term.replace(/^\d+\.\s*/, '')}`, margin, y);
      y += 3.2;
    });

    // Add footer
    addPageFooter(currentPage, currentPage);

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
