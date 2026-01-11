import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Indian states list for validation
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const formatCurrency = (amount: number): string => {
  return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;
  const ten = Math.floor(num / 10);
  const one = num % 10;
  
  let result = '';
  
  if (crore > 0) {
    result += (crore < 20 ? ones[crore] : tens[Math.floor(crore / 10)] + ' ' + ones[crore % 10]) + ' Crore ';
  }
  if (lakh > 0) {
    result += (lakh < 20 ? ones[lakh] : tens[Math.floor(lakh / 10)] + ' ' + ones[lakh % 10]) + ' Lakh ';
  }
  if (thousand > 0) {
    result += (thousand < 20 ? ones[thousand] : tens[Math.floor(thousand / 10)] + ' ' + ones[thousand % 10]) + ' Thousand ';
  }
  if (hundred > 0) {
    result += ones[hundred] + ' Hundred ';
  }
  if (ten > 0 || one > 0) {
    if (result !== '') result += 'and ';
    if (ten < 2) {
      result += ones[ten * 10 + one];
    } else {
      result += tens[ten] + ' ' + ones[one];
    }
  }
  
  return result.trim();
};

const amountInWords = (amount: number): string => {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let result = numberToWords(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + numberToWords(paise) + ' Paise';
  }
  result += ' Only';
  
  return result;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, buyerGstin, buyerState } = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    console.log("Generating GST-compliant PDF invoice for order:", orderId);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, images, description))")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      throw new Error("Order not found");
    }

    // Fetch invoice settings
    const { data: settings } = await supabase
      .from("invoice_settings")
      .select("*")
      .limit(1)
      .single();

    const COMPANY = settings || {
      business_name: "Decouverts",
      business_address: "123 Innovation Hub, Tech Park",
      business_city: "Pune",
      business_state: "Maharashtra",
      business_pincode: "411001",
      business_country: "India",
      business_phone: "+91 98765 43210",
      business_email: "info@decouverts.com",
      business_gstin: "27XXXXX1234X1ZX",
      platform_fee_percentage: 2,
      platform_fee_taxable: false,
      default_gst_rate: 18,
      terms_and_conditions: "Goods once sold are non-refundable. Payment due within 30 days.",
    };

    console.log("Order found:", order.order_number);

    const invoiceNumber = `${COMPANY.invoice_prefix || 'INV'}-${order.order_number.replace("DP-", "")}`;
    const invoiceDate = new Date(order.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const shippingAddress = order.shipping_address as any;
    const buyerStateResolved = buyerState || shippingAddress?.state || "Maharashtra";
    const sellerState = COMPANY.business_state || "Maharashtra";
    const isIGST = sellerState.toLowerCase() !== buyerStateResolved.toLowerCase();

    // Calculate GST for each item
    const items = order.order_items.map((item: any) => {
      const gstRate = 18; // Default GST rate
      const taxableValue = item.total_price;
      const gstAmount = (taxableValue * gstRate) / 100;
      
      return {
        name: item.product_name,
        description: item.products?.description?.substring(0, 50) || '',
        quantity: item.quantity,
        unitPrice: item.product_price,
        taxableValue: taxableValue,
        gstRate: gstRate,
        cgst: isIGST ? 0 : gstAmount / 2,
        sgst: isIGST ? 0 : gstAmount / 2,
        igst: isIGST ? gstAmount : 0,
        total: taxableValue + gstAmount,
      };
    });

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.taxableValue, 0);
    const totalCGST = items.reduce((sum: number, item: any) => sum + item.cgst, 0);
    const totalSGST = items.reduce((sum: number, item: any) => sum + item.sgst, 0);
    const totalIGST = items.reduce((sum: number, item: any) => sum + item.igst, 0);
    const totalTax = totalCGST + totalSGST + totalIGST;

    // Platform fee calculation
    const platformFeeRate = COMPANY.platform_fee_percentage || 2;
    const platformFee = (subtotal * platformFeeRate) / 100;
    const platformFeeTax = COMPANY.platform_fee_taxable ? (platformFee * 18) / 100 : 0;

    const grandTotal = subtotal + totalTax + platformFee + platformFeeTax + (order.shipping_amount || 0) - (order.discount_amount || 0);

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, phone_number")
      .eq("id", order.user_id)
      .single();

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        client_name: shippingAddress?.full_name || profile?.full_name || "Customer",
        client_email: profile?.email || null,
        client_address: shippingAddress ? 
          `${shippingAddress.address_line1}${shippingAddress.address_line2 ? ", " + shippingAddress.address_line2 : ""}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postal_code}` : "",
        items: items,
        subtotal: subtotal,
        tax_amount: totalTax,
        total_amount: grandTotal,
        created_by: order.user_id,
        notes: `Order: ${order.order_number}`,
        buyer_gstin: buyerGstin || null,
        buyer_state: buyerStateResolved,
        seller_state: sellerState,
        cgst_amount: totalCGST,
        sgst_amount: totalSGST,
        igst_amount: totalIGST,
        platform_fee: platformFee,
        platform_fee_tax: platformFeeTax,
        is_igst: isIGST,
        gst_breakdown: items.map((item: any) => ({
          name: item.name,
          taxableValue: item.taxableValue,
          gstRate: item.gstRate,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
        })),
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Invoice creation error:", invoiceError);
      throw new Error("Failed to create invoice");
    }

    console.log("Invoice record created:", invoice.invoice_number);

    // Generate PDF using jsPDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 15;

    // Colors
    const primaryColor: [number, number, number] = [234, 88, 12]; // Orange
    const textDark: [number, number, number] = [31, 41, 55];
    const textGray: [number, number, number] = [107, 114, 128];
    const borderColor: [number, number, number] = [229, 231, 235];
    const bgLight: [number, number, number] = [249, 250, 251];

    // Header background
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 0, pageWidth, 45, "F");

    // Company Name
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.business_name, margin, y + 8);

    // Tax Invoice label
    doc.setFontSize(20);
    doc.setTextColor(...textDark);
    doc.text("TAX INVOICE", pageWidth - margin, y + 8, { align: "right" });

    y += 15;

    // Company details
    doc.setFontSize(8);
    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY.business_address, margin, y);
    doc.text(`${COMPANY.business_city}, ${COMPANY.business_state} - ${COMPANY.business_pincode}`, margin, y + 4);
    doc.text(`Phone: ${COMPANY.business_phone} | Email: ${COMPANY.business_email}`, margin, y + 8);
    doc.text(`GSTIN: ${COMPANY.business_gstin}`, margin, y + 12);

    // Invoice details on right
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    doc.text(`Invoice No: ${invoiceNumber}`, pageWidth - margin, y, { align: "right" });
    doc.text(`Date: ${invoiceDate}`, pageWidth - margin, y + 5, { align: "right" });
    doc.text(`Order: ${order.order_number}`, pageWidth - margin, y + 10, { align: "right" });

    y += 25;

    // Separator line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    y += 10;

    // Bill To Section
    const colWidth = (pageWidth - 2 * margin) / 2 - 5;

    // Bill To box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, colWidth, 35, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", margin + 4, y + 6);

    doc.setFontSize(10);
    doc.setTextColor(...textDark);
    doc.text(shippingAddress?.full_name || "Customer", margin + 4, y + 13);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textGray);
    
    let addressY = y + 18;
    if (shippingAddress) {
      const lines = [
        shippingAddress.address_line1,
        shippingAddress.address_line2,
        `${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postal_code}`,
        `Phone: ${shippingAddress.phone || 'N/A'}`
      ].filter(Boolean);
      
      lines.forEach((line: string) => {
        doc.text(line.substring(0, 45), margin + 4, addressY);
        addressY += 4;
      });
    }

    // Ship To box
    doc.roundedRect(margin + colWidth + 10, y, colWidth, 35, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO", margin + colWidth + 14, y + 6);

    doc.setFontSize(10);
    doc.setTextColor(...textDark);
    doc.text(shippingAddress?.full_name || "Customer", margin + colWidth + 14, y + 13);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textGray);
    
    addressY = y + 18;
    if (shippingAddress) {
      const lines = [
        shippingAddress.address_line1,
        shippingAddress.address_line2,
        `${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postal_code}`,
      ].filter(Boolean);
      
      lines.forEach((line: string) => {
        doc.text(line.substring(0, 45), margin + colWidth + 14, addressY);
        addressY += 4;
      });
    }

    y += 40;

    // GST Info box (if buyer has GSTIN)
    if (buyerGstin) {
      doc.setFillColor(254, 243, 199); // Light amber
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
      doc.setFontSize(9);
      doc.setTextColor(...textDark);
      doc.setFont("helvetica", "bold");
      doc.text(`Buyer GSTIN: ${buyerGstin}`, margin + 4, y + 6);
      doc.text(`State: ${buyerStateResolved}`, pageWidth - margin - 4, y + 6, { align: "right" });
      y += 15;
    } else {
      y += 5;
    }

    // Items Table
    const tableTop = y;
    const colWidths = [8, 55, 15, 25, 15, 18, 18, 18, 18];
    let currentX = margin;

    // Table header
    doc.setFillColor(31, 41, 55);
    doc.rect(margin, tableTop, pageWidth - 2 * margin, 10, "F");

    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    const headers = ["#", "Description", "Qty", "Unit Price", "GST%", isIGST ? "IGST" : "CGST", isIGST ? "" : "SGST", "Taxable", "Total"];
    
    currentX = margin + 2;
    headers.forEach((header, i) => {
      if (header) {
        doc.text(header, currentX + (i > 1 ? colWidths[i] / 2 : 0), tableTop + 6, i > 1 ? { align: "center" } : undefined);
      }
      currentX += colWidths[i];
    });

    y = tableTop + 12;

    // Table rows
    doc.setFont("helvetica", "normal");
    
    items.forEach((item: any, index: number) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y - 2, pageWidth - 2 * margin, 10, "F");
      }

      doc.setTextColor(...textDark);
      doc.setFontSize(8);

      currentX = margin + 2;
      
      // Row number
      doc.text(String(index + 1), currentX + 2, y + 4);
      currentX += colWidths[0];

      // Description
      let itemName = item.name.substring(0, 30);
      doc.text(itemName, currentX, y + 4);
      currentX += colWidths[1];

      // Quantity
      doc.text(String(item.quantity), currentX + colWidths[2] / 2, y + 4, { align: "center" });
      currentX += colWidths[2];

      // Unit Price
      doc.text(formatCurrency(item.unitPrice), currentX + colWidths[3] / 2, y + 4, { align: "center" });
      currentX += colWidths[3];

      // GST %
      doc.text(`${item.gstRate}%`, currentX + colWidths[4] / 2, y + 4, { align: "center" });
      currentX += colWidths[4];

      // CGST/IGST
      doc.text(formatCurrency(isIGST ? item.igst : item.cgst), currentX + colWidths[5] / 2, y + 4, { align: "center" });
      currentX += colWidths[5];

      // SGST (only if not IGST)
      if (!isIGST) {
        doc.text(formatCurrency(item.sgst), currentX + colWidths[6] / 2, y + 4, { align: "center" });
      }
      currentX += colWidths[6];

      // Taxable Value
      doc.text(formatCurrency(item.taxableValue), currentX + colWidths[7] / 2, y + 4, { align: "center" });
      currentX += colWidths[7];

      // Total
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(item.total), currentX + colWidths[8] / 2, y + 4, { align: "center" });
      doc.setFont("helvetica", "normal");

      y += 10;
    });

    // Table bottom border
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;

    // Summary Section
    const summaryX = pageWidth - margin - 80;
    const summaryValueX = pageWidth - margin;

    doc.setFontSize(9);

    // Subtotal
    doc.setTextColor(...textGray);
    doc.text("Subtotal", summaryX, y);
    doc.setTextColor(...textDark);
    doc.text(formatCurrency(subtotal), summaryValueX, y, { align: "right" });
    y += 6;

    // Tax breakdown
    if (isIGST) {
      doc.setTextColor(...textGray);
      doc.text("IGST", summaryX, y);
      doc.setTextColor(...textDark);
      doc.text(formatCurrency(totalIGST), summaryValueX, y, { align: "right" });
      y += 6;
    } else {
      doc.setTextColor(...textGray);
      doc.text("CGST", summaryX, y);
      doc.setTextColor(...textDark);
      doc.text(formatCurrency(totalCGST), summaryValueX, y, { align: "right" });
      y += 5;

      doc.setTextColor(...textGray);
      doc.text("SGST", summaryX, y);
      doc.setTextColor(...textDark);
      doc.text(formatCurrency(totalSGST), summaryValueX, y, { align: "right" });
      y += 6;
    }

    // Platform Fee
    if (platformFee > 0) {
      doc.setTextColor(...textGray);
      doc.text(`Platform Fee (${platformFeeRate}%)`, summaryX, y);
      doc.setTextColor(...textDark);
      doc.text(formatCurrency(platformFee), summaryValueX, y, { align: "right" });
      y += 5;

      if (platformFeeTax > 0) {
        doc.setTextColor(...textGray);
        doc.text("Platform Fee Tax", summaryX, y);
        doc.setTextColor(...textDark);
        doc.text(formatCurrency(platformFeeTax), summaryValueX, y, { align: "right" });
        y += 6;
      } else {
        y += 1;
      }
    }

    // Shipping
    doc.setTextColor(...textGray);
    doc.text("Shipping", summaryX, y);
    doc.setTextColor(...textDark);
    doc.text(order.shipping_amount === 0 ? "FREE" : formatCurrency(order.shipping_amount), summaryValueX, y, { align: "right" });
    y += 6;

    // Discount
    if (order.discount_amount > 0) {
      doc.setTextColor(22, 163, 74); // Green
      doc.text("Discount", summaryX, y);
      doc.text(`-${formatCurrency(order.discount_amount)}`, summaryValueX, y, { align: "right" });
      y += 6;
    }

    // Total line
    y += 2;
    doc.setDrawColor(...textDark);
    doc.setLineWidth(0.5);
    doc.line(summaryX, y, pageWidth - margin, y);
    y += 6;

    // Grand Total
    doc.setFillColor(...primaryColor);
    doc.roundedRect(summaryX - 5, y - 4, pageWidth - margin - summaryX + 10, 12, 2, 2, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("GRAND TOTAL", summaryX, y + 4);
    doc.text(formatCurrency(grandTotal), summaryValueX - 2, y + 4, { align: "right" });

    y += 18;

    // Amount in words
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text("Amount in Words:", margin + 4, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(amountInWords(grandTotal), margin + 4, y + 9);

    y += 18;

    // Tax Summary box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("TAX SUMMARY", margin + 4, y + 5);

    doc.setTextColor(...textGray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    const taxY = y + 10;
    if (isIGST) {
      doc.text(`IGST @ 18%: ${formatCurrency(totalIGST)}`, margin + 4, taxY);
      doc.text(`(Interstate Supply - Seller: ${sellerState}, Buyer: ${buyerStateResolved})`, margin + 4, taxY + 4);
    } else {
      doc.text(`CGST @ 9%: ${formatCurrency(totalCGST)}`, margin + 4, taxY);
      doc.text(`SGST @ 9%: ${formatCurrency(totalSGST)}`, margin + 60, taxY);
      doc.text(`(Intrastate Supply - ${sellerState})`, margin + 4, taxY + 4);
    }
    doc.text(`Total Tax: ${formatCurrency(totalTax)}`, pageWidth - margin - 4, taxY, { align: "right" });

    y += 28;

    // Terms & Conditions
    if (COMPANY.terms_and_conditions && y < pageHeight - 40) {
      doc.setFontSize(7);
      doc.setTextColor(...textGray);
      doc.setFont("helvetica", "bold");
      doc.text("TERMS & CONDITIONS", margin, y);
      doc.setFont("helvetica", "normal");
      y += 4;
      
      const terms = COMPANY.terms_and_conditions.split('. ').slice(0, 3);
      terms.forEach((term: string) => {
        if (term.trim()) {
          doc.text(`• ${term.trim()}`, margin, y);
          y += 3;
        }
      });
    }

    // Footer
    const footerY = pageHeight - 15;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textDark);
    doc.text("Thank you for your business!", pageWidth / 2, footerY, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textGray);
    doc.text("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, footerY + 5, { align: "center" });

    // Generate PDF
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

    await supabase.from("orders").update({ invoice_url: invoicePath }).eq("id", orderId);
    await supabase.from("invoices").update({ pdf_url: invoicePath }).eq("id", invoice.id);

    console.log("GST-compliant PDF invoice generation complete:", invoicePath);

    return new Response(
      JSON.stringify({
        success: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        invoicePath,
        taxBreakdown: {
          isIGST,
          cgst: totalCGST,
          sgst: totalSGST,
          igst: totalIGST,
          platformFee,
          grandTotal,
        },
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
