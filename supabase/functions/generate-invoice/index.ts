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
    console.log("Fetching logo from:", url);
    const response = await fetch(url, {
      headers: {
        'Accept': 'image/*',
      },
    });
    if (!response.ok) {
      console.error("Failed to fetch logo:", response.status, response.statusText);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    const contentType = response.headers.get('content-type') || 'image/png';
    console.log("Logo fetched successfully, size:", uint8Array.byteLength, "bytes, content type:", contentType);
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
      console.log("Final invoice already exists:", order.final_invoice_url);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Final invoice already exists",
          invoicePath: order.final_invoice_url,
          invoiceType: "final",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Fetch invoice settings
    const { data: settings } = await supabase
      .from("invoice_settings")
      .select("*")
      .single();

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

    console.log("Order found:", order.order_number);

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
      // Fallback calculation
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

    // Get totals from GST breakdown if available
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

    console.log("Invoice record created:", invoice.invoice_number);

    // ==================== GENERATE PROFESSIONAL PDF ====================
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 12;

    // Colors
    const primaryColor: [number, number, number] = [234, 171, 28]; // Brand gold #EAAB1C
    const textDark: [number, number, number] = [33, 33, 33];
    const textGray: [number, number, number] = [102, 102, 102];
    const textLight: [number, number, number] = [140, 140, 140];
    const borderColor: [number, number, number] = [220, 220, 220];
    const warningColor: [number, number, number] = [255, 152, 0]; // Orange for proforma
    const successColor: [number, number, number] = [76, 175, 80]; // Green for final

    // ==================== HEADER SECTION ====================
    // Try to fetch logo from Supabase storage (reliable URL)
    let logoBase64: string | null = null;
    const storedLogoUrl = `${supabaseUrl}/storage/v1/object/public/customer-partner-images/email-logo.png`;
    
    // Try storage logo first, then fallback to settings
    logoBase64 = await fetchImageAsBase64(storedLogoUrl);
    if (!logoBase64 && companySettings.business_logo_url) {
      logoBase64 = await fetchImageAsBase64(companySettings.business_logo_url);
    }

    // Header background band
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, pageWidth, 45, "F");

    // Add logo on the left
    const logoWidth = 35;
    const logoHeight = 18;
    const logoX = margin;
    const logoY = y;
    
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
        console.log("Logo added to invoice at position:", logoX, logoY);
      } catch (logoError) {
        console.error("Failed to add logo to PDF:", logoError);
      }
    }

    // Invoice Type Badge - Top Right
    const badgeWidth = 55;
    const badgeHeight = 20;
    const badgeX = pageWidth - margin - badgeWidth;
    const badgeY = y;
    
    if (isFinalInvoice) {
      doc.setFillColor(successColor[0], successColor[1], successColor[2]);
    } else {
      doc.setFillColor(warningColor[0], warningColor[1], warningColor[2]);
    }
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const invoiceTypeText = isFinalInvoice ? "TAX INVOICE" : "PROFORMA INVOICE";
    doc.text(invoiceTypeText, badgeX + badgeWidth / 2, badgeY + 8, { align: "center" });
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    if (!isFinalInvoice) {
      doc.text("Not a Tax Document", badgeX + badgeWidth / 2, badgeY + 14, { align: "center" });
    } else {
      doc.text("GST Compliant", badgeX + badgeWidth / 2, badgeY + 14, { align: "center" });
    }

    // Company Name - Centered below logo height
    const companyNameY = y + logoHeight + 4;
    doc.setFontSize(18);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(companySettings.business_name, margin, companyNameY);

    // Tagline
    doc.setFontSize(8);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "italic");
    doc.text("Discovering Future Technologies", margin, companyNameY + 5);

    y = 50;

    // ==================== COMPANY & INVOICE DETAILS ROW ====================
    // Left side - Company Address
    doc.setFontSize(8);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "normal");
    
    const companyDetails = [
      companySettings.business_address,
      `${companySettings.business_city}, ${companySettings.business_state} - ${companySettings.business_pincode}`,
      `Phone: ${companySettings.business_phone}`,
      `Email: ${companySettings.business_email}`,
      `GSTIN: ${companySettings.business_gstin}`,
    ];
    
    let leftY = y;
    companyDetails.forEach((line) => {
      doc.text(line, margin, leftY);
      leftY += 4;
    });

    // Right side - Invoice Details Box
    const detailsBoxWidth = 70;
    const detailsBoxX = pageWidth - margin - detailsBoxWidth;
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(detailsBoxX, y - 2, detailsBoxWidth, 22, 2, 2, "FD");
    
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    const detailsLabelX = detailsBoxX + 4;
    const detailsValueX = detailsBoxX + detailsBoxWidth - 4;
    
    doc.setFont("helvetica", "bold");
    doc.text(isFinalInvoice ? "Invoice No:" : "Proforma No:", detailsLabelX, y + 3);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceNumber, detailsValueX, y + 3, { align: "right" });
    
    doc.setFont("helvetica", "bold");
    doc.text("Date:", detailsLabelX, y + 9);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceDate, detailsValueX, y + 9, { align: "right" });
    
    doc.setFont("helvetica", "bold");
    doc.text("Order No:", detailsLabelX, y + 15);
    doc.setFont("helvetica", "normal");
    doc.text(order.order_number, detailsValueX, y + 15, { align: "right" });

    y = leftY + 6;

    // Separator line
    const lineColor = isFinalInvoice ? successColor : primaryColor;
    doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;

    // ==================== BUYER DETAILS (BILL TO / SHIP TO) ====================
    const colWidth = (pageWidth - 2 * margin - 15) / 2;

    // Bill To Header
    doc.setFillColor(248, 248, 248);
    doc.rect(margin, y, colWidth, 6, "F");
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", margin + 3, y + 4);

    // Ship To Header
    doc.rect(margin + colWidth + 15, y, colWidth, 6, "F");
    doc.text("SHIP TO", margin + colWidth + 18, y + 4);

    y += 10;

    // Buyer/Ship name
    doc.setFontSize(10);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    const buyerName = shippingAddress?.full_name || profile?.full_name || "Customer";
    doc.text(buyerName, margin, y);
    doc.text(buyerName, margin + colWidth + 15, y);

    y += 5;

    // Address details
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textGray);

    if (shippingAddress) {
      const addressLines = [
        shippingAddress.address_line1 || "",
        shippingAddress.address_line2 || "",
        `${shippingAddress.city || ""}, ${shippingAddress.state || ""}`,
        `PIN: ${shippingAddress.postal_code || ""}`,
        `Phone: ${shippingAddress.phone || "N/A"}`,
      ].filter(line => line && line.trim());

      addressLines.forEach((line) => {
        doc.text(line, margin, y);
        doc.text(line, margin + colWidth + 15, y);
        y += 4;
      });
    }

    // Buyer GSTIN if provided
    if (order.buyer_gstin) {
      y += 1;
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN: ${order.buyer_gstin}`, margin, y);
      y += 4;
    }

    y += 6;

    // ==================== PRODUCT TABLE ====================
    const tableStartY = y;

    // Table headers
    const headers = isIgst
      ? ["#", "Product Description", "Qty", "Rate", "Taxable", "IGST %", "IGST", "Total"]
      : ["#", "Product Description", "Qty", "Rate", "Taxable", "CGST %", "CGST", "SGST %", "SGST", "Total"];

    const colWidths = isIgst
      ? [8, 52, 12, 22, 25, 14, 18, 25]
      : [8, 38, 10, 18, 20, 11, 14, 11, 14, 22];

    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const tableX = margin;

    // Header background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(tableX, y, tableWidth, 8, "F");

    // Header text
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    let colX = tableX;
    headers.forEach((header, i) => {
      const align = i > 1 ? "center" : "left";
      const textX = align === "center" ? colX + colWidths[i] / 2 : colX + 2;
      doc.text(header, textX, y + 5.5, { align: align === "center" ? "center" : undefined });
      colX += colWidths[i];
    });

    y += 10;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textDark);
    doc.setFontSize(7);

    items.forEach((item: any, index: number) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(tableX, y - 2.5, tableWidth, 7, "F");
      }

      colX = tableX;

      // Truncate product name if too long
      let productName = item.name;
      const maxChars = isIgst ? 30 : 22;
      if (productName.length > maxChars) {
        productName = productName.substring(0, maxChars - 2) + "...";
      }

      const rowData = isIgst
        ? [
            String(index + 1),
            productName,
            String(item.quantity),
            Number(item.rate).toFixed(2),
            Number(item.taxable_value).toFixed(2),
            `${item.igst_rate}%`,
            Number(item.igst_amount).toFixed(2),
            Number(item.total).toFixed(2),
          ]
        : [
            String(index + 1),
            productName,
            String(item.quantity),
            Number(item.rate).toFixed(2),
            Number(item.taxable_value).toFixed(2),
            `${item.cgst_rate}%`,
            Number(item.cgst_amount).toFixed(2),
            `${item.sgst_rate}%`,
            Number(item.sgst_amount).toFixed(2),
            Number(item.total).toFixed(2),
          ];

      rowData.forEach((cell, i) => {
        const align = i > 1 ? "right" : "left";
        const textX = align === "right" ? colX + colWidths[i] - 2 : colX + 2;
        doc.text(cell, textX, y, { align: align === "right" ? "right" : undefined });
        colX += colWidths[i];
      });

      // Row separator
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.1);
      doc.line(tableX, y + 3, tableX + tableWidth, y + 3);

      y += 7;
    });

    y += 5;

    // ==================== SUMMARY SECTION ====================
    const summaryWidth = 85;
    const summaryX = pageWidth - margin - summaryWidth;
    const summaryValueX = pageWidth - margin - 3;

    // Summary box
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(...borderColor);
    const summaryHeight = (Number(order.discount_amount) > 0 ? 40 : 35) + (platformFee > 0 ? 6 : 0) + (isIgst ? 6 : 12);
    doc.roundedRect(summaryX - 3, y - 2, summaryWidth + 3, summaryHeight, 2, 2, "FD");

    doc.setFontSize(8);

    // Subtotal
    doc.setTextColor(...textGray);
    doc.text("Subtotal", summaryX, y + 3);
    doc.setTextColor(...textDark);
    doc.text(formatCurrency(order.subtotal), summaryValueX, y + 3, { align: "right" });
    y += 6;

    // Discount (if any)
    if (Number(order.discount_amount) > 0) {
      doc.setTextColor(0, 150, 0);
      doc.text("Discount", summaryX, y + 3);
      doc.text(`-${formatCurrency(order.discount_amount)}`, summaryValueX, y + 3, { align: "right" });
      y += 6;
    }

    // GST breakdown
    if (isIgst) {
      doc.setTextColor(...textGray);
      doc.text("IGST Total", summaryX, y + 3);
      doc.setTextColor(...textDark);
      doc.text(formatCurrency(totalIgst), summaryValueX, y + 3, { align: "right" });
      y += 6;
    } else {
      doc.setTextColor(...textGray);
      doc.text("CGST Total", summaryX, y + 3);
      doc.setTextColor(...textDark);
      doc.text(formatCurrency(totalCgst), summaryValueX, y + 3, { align: "right" });
      y += 6;

      doc.setTextColor(...textGray);
      doc.text("SGST Total", summaryX, y + 3);
      doc.setTextColor(...textDark);
      doc.text(formatCurrency(totalSgst), summaryValueX, y + 3, { align: "right" });
      y += 6;
    }

    // Platform fee
    if (platformFee > 0) {
      doc.setTextColor(...textGray);
      doc.text(`Platform Fee (${companySettings.platform_fee_percentage || 2}%)`, summaryX, y + 3);
      doc.setTextColor(...textDark);
      doc.text(formatCurrency(platformFee), summaryValueX, y + 3, { align: "right" });
      y += 6;
    }

    // Shipping
    doc.setTextColor(...textGray);
    doc.text("Shipping", summaryX, y + 3);
    doc.setTextColor(0, 150, 0);
    doc.text(Number(order.shipping_amount) === 0 ? "FREE" : formatCurrency(order.shipping_amount), summaryValueX, y + 3, { align: "right" });
    y += 7;

    // Total separator line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(summaryX, y, summaryValueX, y);
    y += 5;

    // Grand Total
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text("GRAND TOTAL", summaryX, y + 3);
    doc.setTextColor(...primaryColor);
    doc.text(formatCurrency(order.total_amount), summaryValueX, y + 3, { align: "right" });

    y += 15;

    // ==================== GST SUMMARY BOX ====================
    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("GST SUMMARY", margin + 5, y + 5);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textGray);

    if (isIgst) {
      doc.text(`Supply Type: Inter-State (${sellerState} → ${buyerState})`, margin + 5, y + 10);
      doc.text(`Total IGST: ${formatCurrency(totalIgst)}`, margin + 5, y + 14);
    } else {
      doc.text(`Supply Type: Intra-State (${sellerState})`, margin + 5, y + 10);
      doc.text(`CGST: ${formatCurrency(totalCgst)}  |  SGST: ${formatCurrency(totalSgst)}`, margin + 5, y + 14);
    }

    // Seller & Buyer GSTIN on right
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text(`Seller GSTIN: ${companySettings.business_gstin}`, pageWidth - margin - 5, y + 10, { align: "right" });
    if (order.buyer_gstin) {
      doc.text(`Buyer GSTIN: ${order.buyer_gstin}`, pageWidth - margin - 5, y + 14, { align: "right" });
    }

    y += 24;

    // ==================== PROFORMA NOTICE (only for temporary invoices) ====================
    if (!isFinalInvoice) {
      doc.setFillColor(255, 248, 225);
      doc.setDrawColor(warningColor[0], warningColor[1], warningColor[2]);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 2, 2, "FD");
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...warningColor);
      doc.text("IMPORTANT NOTICE", margin + 5, y + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("This is a Proforma/Temporary Invoice. Final GST Tax Invoice will be issued after successful delivery of goods.", margin + 5, y + 9);
      
      y += 16;
    }

    // ==================== TERMS & CONDITIONS ====================
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text("Terms & Conditions:", margin, y);

    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...textLight);

    const terms = companySettings.terms_and_conditions.split("\n");
    terms.forEach((term: string) => {
      if (y < pageHeight - 25) {
        doc.text(term, margin, y);
        y += 3.5;
      }
    });

    // ==================== FOOTER ====================
    y = pageHeight - 18;

    // Footer separator
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);

    // Thank you message
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("Thank you for your business!", pageWidth / 2, y, { align: "center" });

    y += 5;

    // Footer note
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textLight);
    
    if (isFinalInvoice) {
      doc.text("This is a computer-generated Tax Invoice and does not require a signature.", pageWidth / 2, y, { align: "center" });
    } else {
      doc.text("This is a computer-generated Proforma Invoice. Not valid for tax purposes.", pageWidth / 2, y, { align: "center" });
    }

    y += 4;
    doc.text(`Generated on ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, y, { align: "center" });

    // Generate PDF as ArrayBuffer
    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

    const fileName = `${invoiceNumber}.pdf`;
    const invoicePath = `${order.user_id}/${fileName}`;

    console.log("Uploading PDF to storage:", invoicePath);

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(invoicePath, pdfUint8Array, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload invoice PDF");
    }

    // Update order with invoice URL based on type
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
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
