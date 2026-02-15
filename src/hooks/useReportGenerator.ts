import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { toast } from "sonner";

// Unified DECOUVERTES Brand Palette — matches invoice template exactly
const colors = {
  primary: [28, 28, 28] as [number, number, number],        // Charcoal
  accent: [212, 175, 55] as [number, number, number],        // Brand Gold
  orange: [230, 126, 34] as [number, number, number],        // Tagline orange
  secondary: [68, 68, 68] as [number, number, number],
  muted: [130, 130, 130] as [number, number, number],
  light: [245, 245, 245] as [number, number, number],
  border: [218, 218, 218] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  tableHeader: [28, 28, 28] as [number, number, number],
  tableAlt: [250, 250, 250] as [number, number, number],
  darkBox: [38, 38, 38] as [number, number, number],
  success: [34, 139, 34] as [number, number, number],
  warning: [205, 133, 63] as [number, number, number],
  error: [178, 34, 34] as [number, number, number],
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
};

const formatCurrency = (amount: number): string => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fetchLogoAsBase64 = async (): Promise<string | null> => {
  try {
    const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/customer-partner-images/email-logo.png`;
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

interface ReportConfig {
  title: string;
  subtitle: string;
  dateRange: string;
  badgeText: string;
  badgeColor?: [number, number, number];
}

export function useReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  // Create standard enterprise report header — matches invoice template
  const createReportHeader = async (
    doc: jsPDF,
    config: ReportConfig
  ): Promise<number> => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const CW = pageWidth - 2 * margin;
    let y = margin;

    // Logo
    const logoBase64 = await fetchLogoAsBase64();
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, y, 24, 12);
      } catch (e) {
        console.error("Failed to add logo:", e);
      }
    }

    // Company name
    const logoTextX = logoBase64 ? margin + 28 : margin;
    doc.setFontSize(20);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, logoTextX, y + 8);

    // Tagline
    doc.setFontSize(8);
    doc.setTextColor(...colors.orange);
    doc.setFont("helvetica", "italic");
    doc.text(COMPANY.tagline, logoTextX, y + 13);

    // Report badge — top right
    const headerRight = pageWidth - margin;
    const badgeColor = config.badgeColor || colors.accent;
    doc.setFillColor(...badgeColor);
    const badgeWidth = 58;
    const badgeX = headerRight - badgeWidth;
    doc.roundedRect(badgeX, y, badgeWidth, 18, 2, 2, "F");

    doc.setFontSize(8);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(config.badgeText, badgeX + badgeWidth / 2, y + 7, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(config.dateRange, badgeX + badgeWidth / 2, y + 13, { align: "center" });

    y += 17;

    // Company details line
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`${COMPANY.address}, ${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`, margin, y);
    y += 3.5;
    doc.text(`Phone: ${COMPANY.phone}  |  Email: ${COMPANY.email}  |  GSTIN: ${COMPANY.gstin}  |  PAN: ${COMPANY.pan}`, margin, y);
    y += 5;

    // Gold divider
    doc.setFillColor(...colors.accent);
    doc.rect(margin, y, CW, 1.5, "F");
    y += 5;

    // Report title section
    doc.setFontSize(14);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(config.title, margin, y);

    y += 5;

    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text(config.subtitle, margin, y);

    y += 8;

    return y;
  };

  // Add standard footer — matches invoice template
  const addReportFooter = (doc: jsPDF, pageNum: number, totalPages?: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const fy = pageHeight - 10;

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.4);
    doc.line(margin, fy - 5, pageWidth - margin, fy - 5);

    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text("This is a computer-generated document and does not require a signature.", margin, fy - 1);

    const pageText = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
    doc.text(pageText, pageWidth - margin, fy - 1, { align: "right" });

    doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | ${COMPANY.website}`, pageWidth / 2, fy + 3, { align: "center" });
  };

  // Create summary stat cards with gold accents
  const createStatCards = (
    doc: jsPDF,
    stats: { label: string; value: string; color?: [number, number, number] }[],
    y: number
  ): number => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const cardWidth = (pageWidth - 2 * margin - (stats.length - 1) * 5) / stats.length;
    const cardHeight = 24;

    stats.forEach((stat, index) => {
      const x = margin + index * (cardWidth + 5);
      
      doc.setFillColor(...colors.light);
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, "FD");

      // Top accent line with gold
      const accentColor = stat.color || colors.accent;
      doc.setFillColor(...accentColor);
      doc.roundedRect(x, y, cardWidth, 3, 3, 3, "F");
      doc.setFillColor(...colors.light);
      doc.rect(x, y + 2, cardWidth, 2, "F");

      doc.setFontSize(7);
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.text(stat.label.toUpperCase(), x + cardWidth / 2, y + 11, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(...(stat.color || colors.primary));
      doc.setFont("helvetica", "bold");
      doc.text(stat.value, x + cardWidth / 2, y + 20, { align: "center" });
    });

    return y + cardHeight + 8;
  };

  // Create data table — matches invoice template table style
  const createDataTable = (
    doc: jsPDF,
    headers: string[],
    rows: string[][],
    y: number,
    colWidths: number[],
    options?: { 
      valueColumnIndices?: number[];
      statusColumnIndex?: number;
    }
  ): number => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const tableWidth = pageWidth - 2 * margin;
    const hdrH = 8;
    const rowH = 7;

    // Table header — charcoal background (matches invoice)
    doc.setFillColor(...colors.tableHeader);
    doc.rect(margin, y, tableWidth, hdrH, "F");

    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    let x = margin + 3;
    headers.forEach((h, i) => {
      const align = options?.valueColumnIndices?.includes(i) ? "right" : "left";
      if (align === "right") {
        doc.text(h, x + colWidths[i] - 2, y + 5.5, { align: "right" });
      } else {
        doc.text(h, x, y + 5.5);
      }
      x += colWidths[i];
    });

    y += hdrH;

    // Table rows
    rows.forEach((row, rowIndex) => {
      // Check for page break
      if (y > pageHeight - 30) {
        addReportFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        y = 20;
        
        // Re-add header on new page
        doc.setFillColor(...colors.tableHeader);
        doc.rect(margin, y, tableWidth, hdrH, "F");
        doc.setFontSize(6);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        
        x = margin + 3;
        headers.forEach((h, i) => {
          const align = options?.valueColumnIndices?.includes(i) ? "right" : "left";
          if (align === "right") {
            doc.text(h, x + colWidths[i] - 2, y + 5.5, { align: "right" });
          } else {
            doc.text(h, x, y + 5.5);
          }
          x += colWidths[i];
        });
        y += hdrH;
      }

      // Alternate row background (matches invoice)
      doc.setFillColor(...(rowIndex % 2 === 0 ? colors.white : colors.tableAlt));
      doc.rect(margin, y, tableWidth, rowH, "F");

      // Row border
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.08);
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");

      x = margin + 3;
      row.forEach((cell, cellIndex) => {
        // Handle status column coloring
        if (cellIndex === options?.statusColumnIndex) {
          const status = cell.toLowerCase();
          if (status.includes("paid") || status.includes("delivered") || status.includes("in stock") || status.includes("active")) {
            doc.setTextColor(...colors.success);
          } else if (status.includes("pending") || status.includes("processing") || status.includes("low")) {
            doc.setTextColor(...colors.warning);
          } else if (status.includes("cancelled") || status.includes("out") || status.includes("failed")) {
            doc.setTextColor(...colors.error);
          } else {
            doc.setTextColor(...colors.secondary);
          }
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(...colors.secondary);
          doc.setFont("helvetica", "normal");
        }

        const align = options?.valueColumnIndices?.includes(cellIndex) ? "right" : "left";
        if (align === "right") {
          doc.text(cell, x + colWidths[cellIndex] - 2, y + 5, { align: "right" });
        } else {
          doc.text(cell.substring(0, 38), x, y + 5);
        }
        x += colWidths[cellIndex];
      });

      y += rowH;
    });

    // Table bottom line (matches invoice)
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    return y + 5;
  };

  // Generate Today's Orders Report
  const generateTodayOrdersReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { data: orders, error } = await supabase
        .from("orders")
        .select("*, order_items(product_name, quantity, total_price)")
        .gte("created_at", startOfDay)
        .lt("created_at", endOfDay)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      let y = await createReportHeader(doc, {
        title: "Daily Orders Report",
        subtitle: `Orders received on ${format(today, "EEEE, dd MMMM yyyy")}`,
        dateRange: format(today, "dd MMM yyyy"),
        badgeText: "DAILY REPORT",
        badgeColor: colors.accent,
      });

      // Summary stats
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const paidOrders = orders?.filter((o) => o.payment_status === "paid").length || 0;
      const codOrders = orders?.filter((o) => o.order_type === "cod" || o.payment_id?.startsWith("COD")).length || 0;

      y = createStatCards(doc, [
        { label: "Total Orders", value: totalOrders.toString(), color: colors.primary },
        { label: "Total Value", value: formatCurrency(totalRevenue), color: colors.accent },
        { label: "Paid Orders", value: paidOrders.toString(), color: colors.success },
        { label: "COD Orders", value: codOrders.toString(), color: colors.warning },
      ], y);

      // Orders table
      if (orders && orders.length > 0) {
        const headers = ["Order #", "Customer", "Items", "Amount", "Payment", "Status"];
        const colWidths = [28, 46, 25, 32, 26, 25];
        
        const rows = orders.map((order) => {
          const shippingAddr = order.shipping_address as any;
          const customerName = shippingAddr?.full_name || "Customer";
          const itemCount = order.order_items?.length || 0;
          const isCod = order.order_type === "cod" || order.payment_id?.startsWith("COD");

          return [
            order.order_number,
            customerName.substring(0, 20),
            `${itemCount} item(s)`,
            formatCurrency(order.total_amount || 0),
            isCod ? "COD" : "Online",
            order.status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
          ];
        });

        y = createDataTable(doc, headers, rows, y, colWidths, {
          valueColumnIndices: [3],
          statusColumnIndex: 5,
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(...colors.muted);
        doc.text("No orders received today.", 14, y + 10);
      }

      // Add footers to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addReportFooter(doc, i, totalPages);
      }

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Daily-Orders-Report-${format(today, "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Daily orders report downloaded!");
    } catch (e: any) {
      console.error("Error generating report:", e);
      toast.error(e?.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate Sales Report
  const generateSalesReport = useCallback(async (startDate: Date, endDate: Date) => {
    setIsGenerating(true);
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*, order_items(product_id, product_name, quantity, total_price)")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: products } = await supabase.from("products").select("id, cost_price");
      const productCostMap: Record<string, number> = {};
      (products || []).forEach((p) => {
        productCostMap[p.id] = Number(p.cost_price || 0);
      });

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const dateRangeStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy")}`;

      let y = await createReportHeader(doc, {
        title: "Sales Performance Report",
        subtitle: `Revenue and profit analysis for ${dateRangeStr}`,
        dateRange: dateRangeStr,
        badgeText: "SALES REPORT",
        badgeColor: colors.accent,
      });

      // Calculate stats
      const paidOrders = orders?.filter((o) => o.payment_status === "paid") || [];
      const codSettledOrders = orders?.filter((o) => 
        (o.order_type === "cod" || o.payment_id?.startsWith("COD")) && 
        (o.cod_payment_status === "settled" || o.cod_payment_status === "received")
      ) || [];
      
      const totalRevenue = [...paidOrders, ...codSettledOrders].reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const subtotals = [...paidOrders, ...codSettledOrders].reduce((sum, o) => sum + (o.subtotal || 0), 0);
      const totalTax = [...paidOrders, ...codSettledOrders].reduce((sum, o) => sum + (o.tax_amount || 0), 0);

      let totalCost = 0;
      [...paidOrders, ...codSettledOrders].forEach((order) => {
        (order.order_items || []).forEach((item: any) => {
          if (item.product_id && productCostMap[item.product_id]) {
            totalCost += productCostMap[item.product_id] * item.quantity;
          }
        });
      });

      const profit = subtotals - totalCost;

      y = createStatCards(doc, [
        { label: "Total Revenue", value: formatCurrency(totalRevenue), color: colors.accent },
        { label: "Pre-Tax Subtotal", value: formatCurrency(subtotals), color: colors.primary },
        { label: "Total GST", value: formatCurrency(totalTax), color: colors.warning },
        { label: "Est. Profit", value: formatCurrency(profit), color: colors.success },
      ], y);

      // Order breakdown by status
      doc.setFontSize(10);
      doc.setTextColor(...colors.primary);
      doc.setFont("helvetica", "bold");
      doc.text("Order Status Breakdown", 14, y);
      y += 6;

      const statusCounts: Record<string, number> = {};
      orders?.forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });

      const statusHeaders = ["Status", "Count", "Percentage"];
      const statusColWidths = [72, 50, 60];
      const totalOrderCount = orders?.length || 1;
      
      const statusRows = Object.entries(statusCounts).map(([status, count]) => [
        status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        count.toString(),
        `${((count / totalOrderCount) * 100).toFixed(1)}%`,
      ]);

      y = createDataTable(doc, statusHeaders, statusRows, y, statusColWidths, {
        valueColumnIndices: [1, 2],
        statusColumnIndex: 0,
      });

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addReportFooter(doc, i, totalPages);
      }

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Sales-Report-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Sales report downloaded!");
    } catch (e: any) {
      console.error("Error generating report:", e);
      toast.error(e?.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate GST Report
  const generateGstReport = useCallback(async (startDate: Date, endDate: Date) => {
    setIsGenerating(true);
    try {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("is_final", true)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const dateRangeStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy")}`;

      let y = await createReportHeader(doc, {
        title: "GST Tax Report",
        subtitle: `Tax breakdown for final invoices from ${dateRangeStr}`,
        dateRange: dateRangeStr,
        badgeText: "GST REPORT",
        badgeColor: colors.accent,
      });

      // Calculate totals
      const totalCgst = invoices?.reduce((sum, inv) => sum + (Number(inv.cgst_amount) || 0), 0) || 0;
      const totalSgst = invoices?.reduce((sum, inv) => sum + (Number(inv.sgst_amount) || 0), 0) || 0;
      const totalIgst = invoices?.reduce((sum, inv) => sum + (Number(inv.igst_amount) || 0), 0) || 0;
      const totalTax = totalCgst + totalSgst + totalIgst;

      y = createStatCards(doc, [
        { label: "CGST Collected", value: formatCurrency(totalCgst), color: colors.primary },
        { label: "SGST Collected", value: formatCurrency(totalSgst), color: colors.primary },
        { label: "IGST Collected", value: formatCurrency(totalIgst), color: colors.warning },
        { label: "Total GST", value: formatCurrency(totalTax), color: colors.accent },
      ], y);

      // Invoice list
      if (invoices && invoices.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text("Invoice Details", 14, y);
        y += 6;

        const headers = ["Invoice #", "Date", "Subtotal", "CGST", "SGST", "IGST", "Total"];
        const colWidths = [30, 22, 28, 24, 24, 24, 30];
        
        const rows = invoices.map((inv) => [
          inv.invoice_number,
          format(new Date(inv.created_at), "dd/MM/yy"),
          formatCurrency(inv.subtotal || 0),
          formatCurrency(inv.cgst_amount || 0),
          formatCurrency(inv.sgst_amount || 0),
          formatCurrency(inv.igst_amount || 0),
          formatCurrency(inv.total_amount || 0),
        ]);

        y = createDataTable(doc, headers, rows, y, colWidths, {
          valueColumnIndices: [2, 3, 4, 5, 6],
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(...colors.muted);
        doc.text("No final invoices found for this period.", 14, y + 10);
      }

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addReportFooter(doc, i, totalPages);
      }

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GST-Report-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("GST report downloaded!");
    } catch (e: any) {
      console.error("Error generating report:", e);
      toast.error(e?.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate Inventory Report
  const generateProductInventoryReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      let y = await createReportHeader(doc, {
        title: "Product Inventory Report",
        subtitle: `Current stock levels and availability status`,
        dateRange: format(new Date(), "dd MMM yyyy"),
        badgeText: "INVENTORY",
        badgeColor: colors.accent,
      });

      // Summary stats
      const totalProducts = products?.length || 0;
      const inStock = products?.filter((p) => p.availability_status === "in_stock").length || 0;
      const lowStock = products?.filter((p) => p.availability_status === "low_stock").length || 0;
      const outOfStock = products?.filter((p) => p.availability_status === "out_of_stock").length || 0;

      y = createStatCards(doc, [
        { label: "Total Products", value: totalProducts.toString(), color: colors.primary },
        { label: "In Stock", value: inStock.toString(), color: colors.success },
        { label: "Low Stock", value: lowStock.toString(), color: colors.warning },
        { label: "Out of Stock", value: outOfStock.toString(), color: colors.error },
      ], y);

      // Products table
      if (products && products.length > 0) {
        const headers = ["Product Name", "Stock Qty", "Price", "Cost", "Status"];
        const colWidths = [62, 28, 30, 30, 32];
        
        const rows = products.map((p) => [
          (p.name || "").substring(0, 35),
          String(p.stock_quantity || 0),
          formatCurrency(p.price || 0),
          formatCurrency(p.cost_price || 0),
          (p.availability_status || "unknown").replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
        ]);

        y = createDataTable(doc, headers, rows, y, colWidths, {
          valueColumnIndices: [1, 2, 3],
          statusColumnIndex: 4,
        });
      }

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addReportFooter(doc, i, totalPages);
      }

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Inventory-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Inventory report downloaded!");
    } catch (e: any) {
      console.error("Error generating report:", e);
      toast.error(e?.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate Raw Materials Report
  const generateRawMaterialsReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { data: materials, error } = await supabase
        .from("raw_materials")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      let y = await createReportHeader(doc, {
        title: "Raw Materials Report",
        subtitle: `Current stock levels and reorder status`,
        dateRange: format(new Date(), "dd MMM yyyy"),
        badgeText: "MATERIALS",
        badgeColor: colors.accent,
      });

      // Summary stats
      const totalMaterials = materials?.length || 0;
      const lowStock = materials?.filter((m) => (m.quantity || 0) <= (m.min_quantity || 10)).length || 0;
      const totalValue = materials?.reduce((sum, m) => sum + ((m.quantity || 0) * (m.cost_per_unit || 0)), 0) || 0;

      y = createStatCards(doc, [
        { label: "Total Materials", value: totalMaterials.toString(), color: colors.primary },
        { label: "Low Stock Items", value: lowStock.toString(), color: colors.warning },
        { label: "Total Value", value: formatCurrency(totalValue), color: colors.accent },
      ], y);

      // Materials table
      if (materials && materials.length > 0) {
        const headers = ["Material Name", "Quantity", "Unit", "Cost/Unit", "Total Value"];
        const colWidths = [56, 28, 25, 36, 37];
        
        const rows = materials.map((m) => [
          (m.name || "").substring(0, 30),
          String(m.quantity || 0),
          m.unit || "pcs",
          formatCurrency(m.cost_per_unit || 0),
          formatCurrency((m.quantity || 0) * (m.cost_per_unit || 0)),
        ]);

        y = createDataTable(doc, headers, rows, y, colWidths, {
          valueColumnIndices: [1, 3, 4],
        });
      }

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addReportFooter(doc, i, totalPages);
      }

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Raw-Materials-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Raw materials report downloaded!");
    } catch (e: any) {
      console.error("Error generating report:", e);
      toast.error(e?.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate Customer Report
  const generateCustomerReport = useCallback(async (customerId?: string) => {
    setIsGenerating(true);
    try {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
      
      if (customerId) {
        query = query.eq("id", customerId);
      }
      
      const { data: profiles, error } = await query;

      if (error) throw error;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      let y = await createReportHeader(doc, {
        title: "Customer Database Report",
        subtitle: `Complete list of registered customers`,
        dateRange: format(new Date(), "dd MMM yyyy"),
        badgeText: "CUSTOMERS",
        badgeColor: colors.accent,
      });

      // Summary stats
      const totalCustomers = profiles?.length || 0;
      const activeCustomers = profiles?.filter((p) => !p.is_blocked).length || 0;
      const blockedCustomers = profiles?.filter((p) => p.is_blocked).length || 0;

      y = createStatCards(doc, [
        { label: "Total Customers", value: totalCustomers.toString(), color: colors.primary },
        { label: "Active", value: activeCustomers.toString(), color: colors.success },
        { label: "Blocked", value: blockedCustomers.toString(), color: colors.error },
      ], y);

      // Customers table
      if (profiles && profiles.length > 0) {
        const headers = ["Name", "Email", "Phone", "Joined", "Status"];
        const colWidths = [40, 55, 30, 30, 27];
        
        const rows = profiles.map((p) => [
          (p.full_name || "N/A").substring(0, 20),
          (p.email || "N/A").substring(0, 28),
          p.phone_number || "N/A",
          format(new Date(p.created_at), "dd/MM/yy"),
          p.is_blocked ? "Blocked" : "Active",
        ]);

        y = createDataTable(doc, headers, rows, y, colWidths, {
          statusColumnIndex: 4,
        });
      }

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addReportFooter(doc, i, totalPages);
      }

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Customer-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Customer report downloaded!");
    } catch (e: any) {
      console.error("Error generating report:", e);
      toast.error(e?.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    generateTodayOrdersReport,
    generateSalesReport,
    generateGSTReport: generateGstReport,
    generateProductInventoryReport,
    generateRawMaterialsReport,
    generateCustomerReport,
  };
}
