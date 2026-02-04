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

// Enterprise Color Palette - DECOUVERTES Branding
const colors = {
  primary: [28, 28, 28] as [number, number, number],        // Deep charcoal/black
  accent: [212, 175, 55] as [number, number, number],       // Gold/yellow from logo
  secondary: [85, 85, 85] as [number, number, number],      // Dark gray for text
  muted: [120, 120, 120] as [number, number, number],       // Medium gray for metadata
  light: [248, 248, 248] as [number, number, number],       // Off-white background
  border: [230, 230, 230] as [number, number, number],      // Light gray border
  white: [255, 255, 255] as [number, number, number],
  success: [34, 139, 34] as [number, number, number],       // Forest green
  warning: [205, 133, 63] as [number, number, number],      // Bronze
  tableHeader: [45, 45, 45] as [number, number, number],    // Dark header
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
    const margin = 12;
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
      const footerY = pageHeight - 10;
      
      doc.setDrawColor(...colors.accent);
      doc.setLineWidth(0.8);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
      
      doc.setFontSize(7);
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.text("This is a computer-generated invoice and does not require a signature.", margin, footerY);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
      
      doc.setFontSize(6);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | DECOUVERTES | www.decouvertes.com`, pageWidth / 2, footerY + 3.5, { align: "center" });
    };

    // Helper to check page break
    const checkPageBreak = (neededHeight: number): boolean => {
      if (y + neededHeight > pageHeight - 20) {
        addPageFooter(currentPage, 1);
        doc.addPage();
        currentPage++;
        y = margin + 5;
        return true;
      }
      return false;
    };

    // ==================== HEADER SECTION ====================
    // Invoice title with accent color
    doc.setFontSize(28);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice", margin, y + 10);

    // Invoice metadata (right side)
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    
    const metaX = pageWidth - margin - 60;
    doc.text("Invoice#", metaX, y + 2);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(invoiceNumber, metaX + 25, y + 2);
    
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice Date", metaX, y + 7);
    doc.setTextColor(...colors.primary);
    doc.text(invoiceDate, metaX + 25, y + 7);
    
    doc.setTextColor(...colors.muted);
    doc.text("Order No", metaX, y + 12);
    doc.setTextColor(...colors.primary);
    doc.text(order.order_number, metaX + 25, y + 12);

    // Logo on top right
    if (logoBase64) {
      try { 
        doc.addImage(logoBase64, 'PNG', pageWidth - margin - 35, y - 2, 35, 18); 
      } catch {}
    } else {
      // Fallback brand name
      doc.setFontSize(14);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "bold");
      doc.text("DECOUVERTES", pageWidth - margin, y + 8, { align: "right" });
    }

    y += 22;

    // ==================== BILLED BY / BILLED TO SECTION ====================
    const boxWidth = (pageWidth - 2 * margin - 8) / 2;
    const boxHeight = 38;

    // Billed By Box
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, "FD");

    // Gold accent bar at top
    doc.setFillColor(...colors.accent);
    doc.rect(margin, y, boxWidth, 6, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Billed by", margin + 4, y + 4);

    // Company details
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTES", margin + 4, y + 12);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(company.business_address, margin + 4, y + 17);
    doc.text(`${company.business_city}, ${company.business_state} - ${company.business_pincode}`, margin + 4, y + 21);
    
    doc.setTextColor(...colors.muted);
    doc.text("GSTIN", margin + 4, y + 27);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(company.business_gstin, margin + 20, y + 27);
    
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("PAN", margin + 4, y + 31);
    doc.setTextColor(...colors.primary);
    doc.text(company.business_gstin.substring(2, 12) || "XXXXX1234X", margin + 20, y + 31);

    // Billed To Box
    const billedToX = margin + boxWidth + 8;
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(billedToX, y, boxWidth, boxHeight, 2, 2, "FD");

    // Accent bar
    doc.setFillColor(...colors.accent);
    doc.rect(billedToX, y, boxWidth, 6, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Billed to", billedToX + 4, y + 4);

    // Customer details
    const buyerName = shippingAddress?.full_name || profile?.full_name || "Customer";
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(buyerName, billedToX + 4, y + 12);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    
    let addrY = y + 17;
    if (shippingAddress) {
      if (shippingAddress.address_line1) {
        doc.text(shippingAddress.address_line1.substring(0, 50), billedToX + 4, addrY);
        addrY += 4;
      }
      doc.text(`${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.postal_code || ""}`, billedToX + 4, addrY);
    }
    
    if (order.buyer_gstin) {
      doc.setTextColor(...colors.muted);
      doc.text("GSTIN", billedToX + 4, y + 27);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "bold");
      doc.text(order.buyer_gstin, billedToX + 20, y + 27);
      
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.text("PAN", billedToX + 4, y + 31);
      doc.setTextColor(...colors.primary);
      doc.text(order.buyer_gstin.substring(2, 12), billedToX + 20, y + 31);
    }

    y += boxHeight + 6;

    // ==================== PLACE OF SUPPLY ROW ====================
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 8, 1, 1, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Place of Supply", margin + 4, y + 5.5);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(sellerState, margin + 35, y + 5.5);
    
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Country of Supply", pageWidth / 2 + 10, y + 5.5);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("India", pageWidth / 2 + 45, y + 5.5);

    y += 12;

    // ==================== ITEMS TABLE ====================
    const tableWidth = pageWidth - 2 * margin;
    
    // Table header with accent color
    doc.setFillColor(...colors.accent);
    doc.rect(margin, y, tableWidth, 8, "F");
    
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");

    // Column positions for IGST vs CGST/SGST
    let cols: any;
    if (isIgst) {
      cols = {
        sno: margin + 3,
        desc: margin + 10,
        hsn: margin + 70,
        qty: margin + 88,
        gst: margin + 100,
        taxable: margin + 118,
        igst: margin + 142,
        amount: pageWidth - margin - 3
      };
      doc.text("S. No", cols.sno, y + 5.5);
      doc.text("Item & Description", cols.desc, y + 5.5);
      doc.text("HSN", cols.hsn, y + 5.5);
      doc.text("Qty", cols.qty, y + 5.5);
      doc.text("GST", cols.gst, y + 5.5);
      doc.text("Taxable Amount", cols.taxable, y + 5.5);
      doc.text("IGST", cols.igst, y + 5.5);
      doc.text("Amount", cols.amount, y + 5.5, { align: "right" });
    } else {
      cols = {
        sno: margin + 3,
        desc: margin + 10,
        hsn: margin + 60,
        qty: margin + 76,
        gst: margin + 88,
        taxable: margin + 104,
        sgst: margin + 130,
        cgst: margin + 150,
        amount: pageWidth - margin - 3
      };
      doc.text("S. No", cols.sno, y + 5.5);
      doc.text("Item & Description", cols.desc, y + 5.5);
      doc.text("HSN", cols.hsn, y + 5.5);
      doc.text("Qty", cols.qty, y + 5.5);
      doc.text("GST", cols.gst, y + 5.5);
      doc.text("Taxable Amt", cols.taxable, y + 5.5);
      doc.text("SGST", cols.sgst, y + 5.5);
      doc.text("CGST", cols.cgst, y + 5.5);
      doc.text("Amount", cols.amount, y + 5.5, { align: "right" });
    }

    y += 8;

    // Table rows
    items.forEach((item: any, idx: number) => {
      checkPageBreak(10);
      
      const rowH = 9;
      
      // Alternating row background
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(252, 252, 252);
      }
      doc.rect(margin, y, tableWidth, rowH, "F");

      // Row bottom border
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.1);
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");

      // S.No
      doc.setTextColor(...colors.secondary);
      doc.text(`${idx + 1}.`, cols.sno, y + 6);

      // Product name (bold)
      const name = (item.name || "").substring(0, 30);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "bold");
      doc.text(name, cols.desc, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.secondary);

      if (isIgst) {
        doc.text(item.hsn || "8471", cols.hsn, y + 6);
        doc.text(String(item.quantity), cols.qty, y + 6);
        doc.text(`${item.gst_rate}%`, cols.gst, y + 6);
        doc.text(formatCurrency(item.taxable_value), cols.taxable, y + 6);
        doc.setTextColor(...colors.accent);
        doc.text(formatCurrency(item.igst_amount), cols.igst, y + 6);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.total), cols.amount, y + 6, { align: "right" });
      } else {
        doc.text(item.hsn || "8471", cols.hsn, y + 6);
        doc.text(String(item.quantity), cols.qty, y + 6);
        doc.text(`${item.gst_rate}%`, cols.gst, y + 6);
        doc.text(formatCurrency(item.taxable_value), cols.taxable, y + 6);
        doc.setTextColor(...colors.accent);
        doc.text(formatCurrency(item.sgst_amount), cols.sgst, y + 6);
        doc.text(formatCurrency(item.cgst_amount), cols.cgst, y + 6);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text(formatCurrency(item.total), cols.amount, y + 6, { align: "right" });
      }

      y += rowH;
    });

    y += 8;
    checkPageBreak(85);

    // ==================== SUMMARY SECTION (2-column layout) ====================
    const leftColWidth = (pageWidth - 2 * margin) * 0.55;
    const rightColWidth = (pageWidth - 2 * margin) * 0.42;
    const rightColX = margin + leftColWidth + 6;

    // LEFT COLUMN - Bank Details / QR Code placeholder
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, y, leftColWidth, 55, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text("Bank & Payment Details", margin + 4, y + 8);

    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    
    let bankY = y + 14;
    doc.text("Account Holder Name", margin + 4, bankY);
    doc.setTextColor(...colors.primary);
    doc.text("DECOUVERTES", margin + 45, bankY);
    
    bankY += 5;
    doc.setTextColor(...colors.muted);
    doc.text("Account Number", margin + 4, bankY);
    doc.setTextColor(...colors.primary);
    doc.text("XXXXXXXX1234", margin + 45, bankY);
    
    bankY += 5;
    doc.setTextColor(...colors.muted);
    doc.text("IFSC", margin + 4, bankY);
    doc.setTextColor(...colors.primary);
    doc.text("HDFC0001234", margin + 45, bankY);
    
    bankY += 5;
    doc.setTextColor(...colors.muted);
    doc.text("Account Type", margin + 4, bankY);
    doc.setTextColor(...colors.primary);
    doc.text("Current", margin + 45, bankY);
    
    bankY += 5;
    doc.setTextColor(...colors.muted);
    doc.text("Bank", margin + 4, bankY);
    doc.setTextColor(...colors.primary);
    doc.text("HDFC Bank", margin + 45, bankY);

    // QR Code placeholder box
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin + leftColWidth - 45, y + 8, 40, 40, 2, 2, "S");
    
    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.text("UPI - Scan to Pay", margin + leftColWidth - 25, y + 52, { align: "center" });

    // RIGHT COLUMN - Totals
    doc.setFillColor(...colors.white);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(rightColX, y, rightColWidth, 55, 2, 2, "FD");

    let totalsY = y + 8;
    const labelX = rightColX + 4;
    const valueX = rightColX + rightColWidth - 4;

    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    
    doc.text("Sub Total", labelX, totalsY);
    doc.text(formatCurrency(order.subtotal), valueX, totalsY, { align: "right" });
    totalsY += 6;

    if (order.discount_amount && order.discount_amount > 0) {
      doc.setTextColor(...colors.success);
      doc.text("Discount", labelX, totalsY);
      doc.text(`- ${formatCurrency(order.discount_amount)}`, valueX, totalsY, { align: "right" });
      totalsY += 6;
    }

    doc.setTextColor(...colors.secondary);
    doc.text("Taxable Amount", labelX, totalsY);
    doc.text(formatCurrency(order.subtotal - (order.discount_amount || 0)), valueX, totalsY, { align: "right" });
    totalsY += 6;

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

    if (platformFee > 0) {
      doc.text("Platform Fee", labelX, totalsY);
      doc.text(formatCurrency(platformFee), valueX, totalsY, { align: "right" });
      totalsY += 6;
    }

    if (order.shipping_amount > 0) {
      doc.text("Shipping", labelX, totalsY);
      doc.text(formatCurrency(order.shipping_amount), valueX, totalsY, { align: "right" });
      totalsY += 6;
    }

    // Grand Total with accent highlight
    doc.setFillColor(...colors.accent);
    doc.roundedRect(rightColX + 2, totalsY, rightColWidth - 4, 10, 1, 1, "F");
    
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Total", labelX + 2, totalsY + 7);
    doc.text(formatCurrency(order.total_amount), valueX - 2, totalsY + 7, { align: "right" });

    y += 60;

    // ==================== AMOUNT IN WORDS ====================
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 1, 1, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice Total (in words)", margin + 4, y + 5);
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(numberToWords(order.total_amount), margin + 4, y + 10);

    y += 16;

    // ==================== PAYMENT STATUS BADGE ====================
    const badgeWidth = 50;
    let badgeColor = colors.success;
    if (paymentStatus.includes("COD") || paymentStatus.includes("AWAITING")) {
      badgeColor = colors.warning;
    } else if (paymentStatus.includes("OFFLINE")) {
      badgeColor = colors.secondary;
    }
    
    doc.setFillColor(...badgeColor);
    doc.roundedRect(margin, y, badgeWidth, 7, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(...colors.white);
    doc.setFont("helvetica", "bold");
    doc.text(paymentStatus, margin + badgeWidth / 2, y + 5, { align: "center" });

    y += 12;

    // ==================== TERMS & CONDITIONS ====================
    checkPageBreak(30);
    
    doc.setFontSize(9);
    doc.setTextColor(...colors.accent);
    doc.setFont("helvetica", "bold");
    doc.text("Terms and Conditions", margin, y);
    
    y += 5;
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    
    const terms = company.terms_and_conditions.split("\n");
    terms.forEach((term: string, idx: number) => {
      doc.text(`${idx + 1}. ${term.replace(/^\d+\.\s*/, '')}`, margin, y);
      y += 3.5;
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
