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
  fullName: "DECOUVERTES FUTURE TECH PRIVATE LIMITED",
  tagline: "Discovering Future Technologies",
  address: "A-414, Gera's Imperium Gateway, Near Nashik Phata Flyover, Opp. Bhosari Metro Station, Kasarwadi, Pimpri-Chinchwad",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411034",
  country: "India",
  phone: "+91 9561103435",
  email: "hello@decouvertes.in",
  gstin: "27AAKCD1492N1Z4",
  pan: "AAKCD1492N",
  website: "www.decouvertes.in",
};

const formatCurrency = (amount: number): string => {
  return `Rs. ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Use the same /invoice-logo.png that the unified invoice template uses
// so all reports + invoices share identical branding.
const fetchLogoAsBase64 = async (): Promise<string | null> => {
  try {
    const response = await fetch('/invoice-logo.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.size < 100) return null;
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
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
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;

    // Logo & Header text Grid Alignment
    const logoBase64 = await fetchLogoAsBase64();
    const logoWidth = 60;
    const spacing = 6;
    const textX = logoBase64 ? margin + logoWidth + spacing : margin;

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, y, logoWidth, 0);
      } catch (e) {
        console.error("Failed to add logo:", e);
      }
    }

    // Company Name & Tagline aligned strictly after logo
    doc.setFontSize(16);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, textX, y + 6);

    doc.setFontSize(8);
    doc.setTextColor(...colors.orange);
    doc.setFont("helvetica", "italic");
    doc.text(COMPANY.tagline, textX, y + 10);

    // Company details line
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(`${COMPANY.address}, ${COMPANY.city}, ${COMPANY.state} - ${COMPANY.pincode}`, textX, y + 15);
    doc.text(`Phone: ${COMPANY.phone}  |  Email: ${COMPANY.email}  |  GSTIN: ${COMPANY.gstin}  |  PAN: ${COMPANY.pan}`, textX, y + 19);

    // Right Badge aligned exactly to the right margin
    const badgeWidth = 64;
    const badgeX = pageWidth - margin - badgeWidth;
    const badgeColor = config.badgeColor || colors.accent;
    doc.setFillColor(...badgeColor);
    doc.roundedRect(badgeX, y, badgeWidth, 18, 2, 2, "F");

    doc.setFontSize(8.5);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(config.badgeText, badgeX + (badgeWidth / 2), y + 7, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(config.dateRange, badgeX + (badgeWidth / 2), y + 13, { align: "center" });

    y += 26;

    // Gold divider
    doc.setFillColor(...colors.accent);
    doc.rect(margin, y, contentWidth, 1.5, "F");
    y += 5;

    // Report title section
    doc.setFontSize(14);
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text(config.title, margin, y + 4);

    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text(config.subtitle, margin, y + 9);

    return y + 14;
  };

  const addReportFooter = (doc: jsPDF, pageNum: number, totalPages?: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const fy = pageHeight - 12; // Base Y for footer

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.4);
    doc.line(margin, fy - 3, pageWidth - margin, fy - 3);

    doc.setFontSize(6);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    
    // Grid aligned Footer parts
    doc.text("This is a system-generated report and does not require a signature.", margin, fy + 1);
    doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")} | ${COMPANY.website}`, pageWidth / 2, fy + 1, { align: "center" });

    const pageText = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
    doc.text(pageText, pageWidth - margin, fy + 1, { align: "right" });
  };

  const createStatCards = (
    doc: jsPDF,
    stats: { label: string; value: string; color?: [number, number, number] }[],
    startY: number
  ): number => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    const columns = 4;
    const gap = 5;
    const cardWidth = (contentWidth - (gap * (columns - 1))) / columns;
    const cardHeight = 24;

    let currentY = startY;

    stats.forEach((stat, index) => {
      const colIndex = index % columns;
      const rowIndex = Math.floor(index / columns);

      const x = margin + (colIndex * (cardWidth + gap));
      const y = currentY + (rowIndex * (cardHeight + gap));
      
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
      doc.text(stat.label.toUpperCase(), x + (cardWidth / 2), y + 10, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(...(stat.color || colors.primary));
      doc.setFont("helvetica", "bold");
      doc.text(stat.value, x + (cardWidth / 2), y + 18, { align: "center" });
    });

    const totalRows = Math.ceil(stats.length / columns);
    return currentY + (totalRows * (cardHeight + gap)) + 3;
  };

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
  ): { nextY: number; normalizedColWidths: number[] } => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    const hdrH = 8;
    const rowH = 7;
    const paddingX = 3;

    // Normalize column widths to ensure exact match with contentWidth
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const normalizedColWidths = colWidths.map((w) => (w / totalWidth) * contentWidth);

    const drawHeader = (startY: number) => {
      doc.setFillColor(...colors.tableHeader);
      doc.rect(margin, startY, contentWidth, hdrH, "F");
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");

      let x = margin;
      headers.forEach((h, i) => {
        const align = options?.valueColumnIndices?.includes(i) ? "right" : "left";
        const colW = normalizedColWidths[i];
        if (align === "right") {
          doc.text(h, x + colW - paddingX, startY + 5.5, { align: "right" });
        } else {
          doc.text(h, x + paddingX, startY + 5.5);
        }
        x += colW;
      });
    };

    drawHeader(y);
    y += hdrH;

    rows.forEach((row, rowIndex) => {
      if (y > pageHeight - 30) {
        addReportFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        y = margin;
        drawHeader(y);
        y += hdrH;
      }

      doc.setFillColor(...(rowIndex % 2 === 0 ? colors.white : colors.tableAlt));
      doc.rect(margin, y, contentWidth, rowH, "F");

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.08);
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");

      let x = margin;
      row.forEach((cell, cellIndex) => {
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
        const colW = normalizedColWidths[cellIndex];
        if (align === "right") {
          doc.text(cell, x + colW - paddingX, y + 5, { align: "right" });
        } else {
          doc.text(cell.substring(0, 38), x + paddingX, y + 5);
        }
        x += colW;
      });

      y += rowH;
    });

    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    return { nextY: y + 5, normalizedColWidths };
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

        const tableResult = createDataTable(doc, headers, rows, y, colWidths, {
          valueColumnIndices: [3],
          statusColumnIndex: 5,
        });
        y = tableResult.nextY;
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

      const tableResult = createDataTable(doc, statusHeaders, statusRows, y, statusColWidths, {
        valueColumnIndices: [1, 2],
        statusColumnIndex: 0,
      });
      y = tableResult.nextY;

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

        const tableResult = createDataTable(doc, headers, rows, y, colWidths, {
          valueColumnIndices: [2, 3, 4, 5, 6],
        });
        y = tableResult.nextY;
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

        const tableResult = createDataTable(doc, headers, rows, y, colWidths, {
          valueColumnIndices: [1, 2, 3],
          statusColumnIndex: 4,
        });
        y = tableResult.nextY;
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

        const tableResult = createDataTable(doc, headers, rows, y, colWidths, {
          valueColumnIndices: [1, 3, 4],
        });
        y = tableResult.nextY;
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

        const tableResult = createDataTable(doc, headers, rows, y, colWidths, {
          statusColumnIndex: 4,
        });
        y = tableResult.nextY;
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

  // Generate Invoice Collection Report (filtered by category / date / type)
  const generateInvoiceCollectionReport = useCallback(async (opts: {
    categoryCode?: string;       // e.g. "PRD-DM" or undefined for all
    categoryLabel?: string;      // human-readable category
    dateFrom?: string;           // ISO yyyy-mm-dd
    dateTo?: string;
    invoiceType?: "all" | "manual" | "auto" | "final" | "proforma";
  }) => {
    setIsGenerating(true);
    try {
      let q = supabase.from("invoices").select("*").order("created_at", { ascending: false });
      if (opts.categoryCode) q = q.eq("category_code", opts.categoryCode);
      if (opts.dateFrom) q = q.gte("created_at", opts.dateFrom);
      if (opts.dateTo)   q = q.lte("created_at", opts.dateTo + "T23:59:59");
      if (opts.invoiceType === "final")    q = q.eq("is_final", true);
      if (opts.invoiceType === "proforma") q = q.eq("is_final", false);

      const { data, error } = await q;
      if (error) throw error;

      let invoices = data || [];
      if (opts.invoiceType === "manual") invoices = invoices.filter((i: any) => !i.order_id);
      if (opts.invoiceType === "auto")   invoices = invoices.filter((i: any) =>  i.order_id);

      // Fetch payment status for invoices linked to orders
      const orderIds = invoices.map((i: any) => i.order_id).filter(Boolean);
      const orderPaymentMap: Record<string, string> = {};
      if (orderIds.length > 0) {
        const { data: ordersData } = await supabase
          .from("orders")
          .select("id, payment_status, cod_payment_status, order_type, payment_id")
          .in("id", orderIds);
        (ordersData || []).forEach((o: any) => {
          const isCod = o.order_type === "cod" || o.payment_id?.startsWith("COD") || o.cod_payment_status != null;
          if (isCod) {
            orderPaymentMap[o.id] = (o.cod_payment_status === "settled" || o.cod_payment_status === "received")
              ? "Paid" : "Pending";
          } else {
            orderPaymentMap[o.id] = o.payment_status === "paid" ? "Paid" : "Pending";
          }
        });
      }
      
      const getStatus = (inv: any) => {
        if (inv.order_id) {
          return orderPaymentMap[inv.order_id] || "Pending";
        }
        if (!inv.is_final) {
          return "Pending";
        }
        return "Paid";
      };

      const dateRangeStr =
        opts.dateFrom && opts.dateTo
          ? `${format(new Date(opts.dateFrom), "dd MMM")} - ${format(new Date(opts.dateTo), "dd MMM yyyy")}`
          : "All Time";

      // Landscape for richer table
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const subtitle = opts.categoryLabel
        ? `Category: ${opts.categoryLabel}  |  Period: ${dateRangeStr}`
        : `All invoice categories  |  Period: ${dateRangeStr}`;

      let y = await createReportHeader(doc, {
        title: "Invoice Collection Report",
        subtitle,
        dateRange: dateRangeStr,
        badgeText: "INVOICES",
        badgeColor: colors.accent,
      });

      // Aggregations
      let subtotal = 0;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let paidAmount = 0;

      invoices.forEach((inv: any) => {
        subtotal += Number(inv.subtotal || 0);
        cgst += Number(inv.cgst_amount || 0);
        sgst += Number(inv.sgst_amount || 0);
        igst += Number(inv.igst_amount || 0);
        if (getStatus(inv) === "Paid") {
          paidAmount += Number(inv.total_amount || 0);
        }
      });

      const tax = cgst + sgst + igst;
      const grandTotal = subtotal + tax;
      const pendingAmount = grandTotal - paidAmount;

      const manualCount = invoices.filter((i: any) => !i.order_id).length;
      const autoCount   = invoices.length - manualCount;

      // First row of cards: counts + subtotal + tax breakup
      y = createStatCards(doc, [
        { label: "Total Invoices",  value: String(invoices.length), color: colors.primary },
        { label: "Manual / Auto",   value: `${manualCount} / ${autoCount}`, color: colors.warning },
        { label: "Subtotal",        value: formatCurrency(subtotal), color: colors.primary },
        { label: "Total GST",       value: formatCurrency(tax),      color: colors.warning },
        { label: "Grand Total",     value: formatCurrency(grandTotal), color: colors.accent  },
      ], y);

      // Second row of cards: totals + payment split
      y = createStatCards(doc, [
        { label: "CGST",          value: formatCurrency(cgst),          color: colors.muted },
        { label: "SGST",          value: formatCurrency(sgst),          color: colors.muted },
        { label: "IGST",          value: formatCurrency(igst),          color: colors.muted },
        { label: "Paid Amount",   value: formatCurrency(paidAmount),    color: colors.success },
        { label: "Pending Amount",value: formatCurrency(pendingAmount), color: colors.error   },
      ], y);

      if (invoices.length > 0) {
        const headers = ["Invoice #", "Date", "Client", "Category", "Source", "Subtotal", "CGST", "SGST", "IGST", "Total", "Status"];
        const colWidths = [35, 24, 40, 20, 16, 24, 22, 22, 22, 26, 18];
        const rows = invoices.map((inv: any) => [
          inv.invoice_number,
          format(new Date(inv.created_at), "dd MMM yyyy"),
          (inv.client_name || "Customer").substring(0, 24),
          inv.category_code || "-",
          inv.order_id ? "Auto" : "Manual",
          formatCurrency(inv.subtotal || 0),
          formatCurrency(inv.cgst_amount || 0),
          formatCurrency(inv.sgst_amount || 0),
          formatCurrency(inv.igst_amount || 0),
          formatCurrency(inv.total_amount || 0),
          getStatus(inv),
        ]);
        // Highlight high-value (> Rs. 50,000) by tagging client name with marker
        rows.forEach((r, idx) => {
          const inv = invoices[idx];
          if (Number(inv.total_amount || 0) > 50000) {
            r[2] = "* " + r[2];
          }
        });

        const tableResult = createDataTable(doc, headers, rows, y, colWidths, {
          valueColumnIndices: [5, 6, 7, 8, 9],
          statusColumnIndex: 10,
        });
        y = tableResult.nextY;
        const normalizedColWidths = tableResult.normalizedColWidths;

        // Grid-Aligned Grand Total Row
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        const contentWidth = pageWidth - (margin * 2);
        doc.setFillColor(...colors.darkBox);
        doc.rect(margin, y, contentWidth, 9, "F");
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        const paddingX = 3;
        doc.text("GRAND TOTAL", margin + paddingX, y + 6);

        // Right-aligned totals using normalized column widths matching the table EXACTLY
        const valueIndices = [5, 6, 7, 8, 9];
        const values = [subtotal, cgst, sgst, igst, grandTotal];
        valueIndices.forEach((colIndex, i) => {
          let colX = margin;
          for (let k = 0; k < colIndex; k++) colX += normalizedColWidths[k];
          const colW = normalizedColWidths[colIndex];
          doc.text(formatCurrency(values[i]), colX + colW - paddingX, y + 6, { align: "right" });
        });
        y += 13;

        // Notes / GST split clarity
        doc.setFontSize(7);
        doc.setTextColor(...colors.muted);
        doc.setFont("helvetica", "italic");
        const intra = formatCurrency(cgst + sgst);
        doc.text(
          `Intra-state GST (CGST + SGST): ${intra}   |   Inter-state GST (IGST): ${formatCurrency(igst)}   |   * marks high-value invoices (> ${formatCurrency(50000)})`,
          margin, y
        );
        y += 6;

        // Authorized signature grid alignment
        const sigWidth = 40;
        const sigX = pageWidth - margin - sigWidth;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.secondary);
        doc.setFontSize(8);
        doc.text("Authorized Signatory", sigX + (sigWidth / 2), y + 12, { align: "center" });
        doc.setDrawColor(...colors.border);
        doc.line(sigX, y + 8, pageWidth - margin, y + 8);
        
        doc.setFontSize(7);
        doc.setTextColor(...colors.muted);
        doc.text("This is a system-generated report.", margin, y + 12);
      } else {
        doc.setFontSize(10);
        doc.setTextColor(...colors.muted);
        doc.text("No invoices found for the selected filters.", 14, y + 10);
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
      const tag = opts.categoryCode ? `_${opts.categoryCode}` : "";
      link.download = `Invoice-Report${tag}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Report generated with ${invoices.length} invoice(s)`);
    } catch (e: any) {
      console.error("Error generating invoice report:", e);
      toast.error(e?.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // ============ Pending Payments / Receivables Aging ============
  const generatePendingPaymentsReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const [{ data: manualUnpaid }, { data: codPending }] = await Promise.all([
        supabase.from("invoices").select("*").is("order_id", null).eq("is_final", true).neq("payment_status", "paid").order("created_at", { ascending: true }),
        supabase.from("orders").select("id, order_number, total_amount, created_at, shipping_address, cod_payment_status, status, order_type, payment_id, payment_status").or("order_type.eq.cod,payment_id.like.COD%").order("created_at", { ascending: true }),
      ]);
      const codOutstanding = (codPending || []).filter((o: any) =>
        o.cod_payment_status !== "settled" && o.cod_payment_status !== "received" && o.payment_status !== "paid" && o.status !== "cancelled"
      );
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      let y = await createReportHeader(doc, {
        title: "Pending Payments & Receivables",
        subtitle: "All outstanding amounts with aging analysis",
        dateRange: format(new Date(), "dd MMM yyyy"),
        badgeText: "RECEIVABLES",
        badgeColor: colors.warning,
      });
      const now = Date.now();
      const ageDays = (d: string) => Math.floor((now - new Date(d).getTime()) / 86400000);
      const all = [
        ...(manualUnpaid || []).map((i: any) => ({ ref: i.invoice_number, type: "Manual Invoice", client: i.client_name || "Client", amount: Number(i.total_amount || 0), date: i.created_at })),
        ...codOutstanding.map((o: any) => ({ ref: o.order_number, type: "COD Order", client: (o.shipping_address as any)?.full_name || "Customer", amount: Number(o.total_amount || 0), date: o.created_at })),
      ];
      const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
      let total = 0;
      all.forEach((r) => {
        const d = ageDays(r.date); total += r.amount;
        if (d <= 30) buckets["0-30"] += r.amount;
        else if (d <= 60) buckets["31-60"] += r.amount;
        else if (d <= 90) buckets["61-90"] += r.amount;
        else buckets["90+"] += r.amount;
      });
      y = createStatCards(doc, [
        { label: "Total Outstanding", value: formatCurrency(total), color: colors.error },
        { label: "0-30 Days", value: formatCurrency(buckets["0-30"]), color: colors.success },
        { label: "31-60 Days", value: formatCurrency(buckets["31-60"]), color: colors.warning },
        { label: "61-90 Days", value: formatCurrency(buckets["61-90"]), color: colors.orange },
        { label: "90+ Days", value: formatCurrency(buckets["90+"]), color: colors.error },
      ], y);
      if (all.length > 0) {
        const rows = all.sort((a, b) => ageDays(b.date) - ageDays(a.date)).map((r) => {
          const d = ageDays(r.date);
          const bucket = d <= 30 ? "0-30" : d <= 60 ? "31-60" : d <= 90 ? "61-90" : "90+";
          return [r.ref, r.type, r.client.substring(0, 32), format(new Date(r.date), "dd MMM yy"), `${d}d`, bucket, formatCurrency(r.amount)];
        });
        const tr = createDataTable(doc, ["Reference", "Type", "Client", "Date", "Age", "Bucket", "Amount"], rows, y, [40, 32, 60, 28, 22, 30, 38], { valueColumnIndices: [4, 6], statusColumnIndex: 5 });
        y = tr.nextY;
      } else {
        doc.setFontSize(10); doc.setTextColor(...colors.success);
        doc.text("No outstanding payments. All clear!", 14, y + 10);
      }
      const tp = doc.getNumberOfPages();
      for (let i = 1; i <= tp; i++) { doc.setPage(i); addReportFooter(doc, i, tp); }
      doc.save(`Pending-Payments-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Pending payments report downloaded!");
    } catch (e: any) { console.error(e); toast.error(e?.message || "Failed"); }
    finally { setIsGenerating(false); }
  }, []);

  const generateCodReport = useCallback(async (startDate: Date, endDate: Date) => {
    setIsGenerating(true);
    try {
      const { data: orders } = await supabase.from("orders").select("*")
        .or("order_type.eq.cod,payment_id.like.COD%")
        .gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const dateRangeStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy")}`;
      let y = await createReportHeader(doc, {
        title: "COD Collection Report", subtitle: `Cash on Delivery tracking for ${dateRangeStr}`,
        dateRange: dateRangeStr, badgeText: "COD", badgeColor: colors.warning,
      });
      const list = orders || [];
      const settled = list.filter((o: any) => o.cod_payment_status === "settled" || o.cod_payment_status === "received");
      const collected = list.filter((o: any) => o.cod_payment_status === "collected_by_courier" || o.cod_payment_status === "awaiting_settlement");
      const pending = list.filter((o: any) => !o.cod_payment_status || o.cod_payment_status === "pending");
      const sumAmt = (arr: any[]) => arr.reduce((s, o) => s + Number(o.total_amount || 0), 0);
      y = createStatCards(doc, [
        { label: "Total COD", value: String(list.length), color: colors.primary },
        { label: "Settled", value: `${settled.length} (${formatCurrency(sumAmt(settled))})`, color: colors.success },
        { label: "In Transit", value: `${collected.length} (${formatCurrency(sumAmt(collected))})`, color: colors.warning },
        { label: "Pending", value: `${pending.length} (${formatCurrency(sumAmt(pending))})`, color: colors.error },
      ], y);
      if (list.length > 0) {
        const rows = list.map((o: any) => [
          o.order_number, format(new Date(o.created_at), "dd MMM yy"),
          ((o.shipping_address as any)?.full_name || "Customer").substring(0, 28),
          formatCurrency(o.total_amount || 0),
          (o.status || "").replace(/_/g, " "),
          (o.cod_payment_status || "pending").replace(/_/g, " "),
          o.cod_settled_at ? format(new Date(o.cod_settled_at), "dd MMM yy") : "-",
        ]);
        const tr = createDataTable(doc, ["Order #", "Date", "Customer", "Amount", "Order Status", "COD Status", "Settled"], rows, y, [32, 24, 50, 32, 30, 38, 30], { valueColumnIndices: [3], statusColumnIndex: 5 });
        y = tr.nextY;
      }
      const tp = doc.getNumberOfPages();
      for (let i = 1; i <= tp; i++) { doc.setPage(i); addReportFooter(doc, i, tp); }
      doc.save(`COD-Report-${format(startDate, "yyyy-MM-dd")}.pdf`);
      toast.success("COD report downloaded!");
    } catch (e: any) { console.error(e); toast.error(e?.message || "Failed"); }
    finally { setIsGenerating(false); }
  }, []);

  const generateTopProductsReport = useCallback(async (startDate: Date, endDate: Date) => {
    setIsGenerating(true);
    try {
      const { data: orders } = await supabase.from("orders")
        .select("status, order_items(product_id, product_name, quantity, total_price)")
        .gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString())
        .neq("status", "cancelled");
      const map: Record<string, { name: string; qty: number; revenue: number }> = {};
      (orders || []).forEach((o: any) => (o.order_items || []).forEach((it: any) => {
        const key = it.product_id || it.product_name;
        if (!map[key]) map[key] = { name: it.product_name || "Unknown", qty: 0, revenue: 0 };
        map[key].qty += Number(it.quantity || 0);
        map[key].revenue += Number(it.total_price || 0);
      }));
      const ranked = Object.values(map).sort((a, b) => b.revenue - a.revenue);
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const dateRangeStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy")}`;
      let y = await createReportHeader(doc, {
        title: "Top Products / Best Sellers", subtitle: `Ranked by revenue for ${dateRangeStr}`,
        dateRange: dateRangeStr, badgeText: "BEST SELLERS", badgeColor: colors.accent,
      });
      const totalUnits = ranked.reduce((s, r) => s + r.qty, 0);
      const totalRev = ranked.reduce((s, r) => s + r.revenue, 0);
      y = createStatCards(doc, [
        { label: "Unique Products", value: String(ranked.length), color: colors.primary },
        { label: "Units Sold", value: String(totalUnits), color: colors.warning },
        { label: "Total Revenue", value: formatCurrency(totalRev), color: colors.accent },
        { label: "Top Seller", value: (ranked[0]?.name || "-").substring(0, 14), color: colors.success },
      ], y);
      if (ranked.length > 0) {
        const rows = ranked.slice(0, 50).map((r, idx) => [
          `#${idx + 1}`, r.name.substring(0, 42), String(r.qty),
          formatCurrency(r.revenue), `${((r.revenue / (totalRev || 1)) * 100).toFixed(1)}%`,
        ]);
        const tr = createDataTable(doc, ["Rank", "Product", "Units", "Revenue", "% Total"], rows, y, [16, 80, 28, 36, 22], { valueColumnIndices: [2, 3, 4] });
        y = tr.nextY;
      }
      const tp = doc.getNumberOfPages();
      for (let i = 1; i <= tp; i++) { doc.setPage(i); addReportFooter(doc, i, tp); }
      doc.save(`Top-Products-${format(startDate, "yyyy-MM-dd")}.pdf`);
      toast.success("Top products report downloaded!");
    } catch (e: any) { console.error(e); toast.error(e?.message || "Failed"); }
    finally { setIsGenerating(false); }
  }, []);

  const generateProfitLossReport = useCallback(async (startDate: Date, endDate: Date) => {
    setIsGenerating(true);
    try {
      const [{ data: orders }, { data: products }, { data: manualInv }] = await Promise.all([
        supabase.from("orders").select("*, order_items(product_id, quantity, total_price)").gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString()),
        supabase.from("products").select("id, cost_price"),
        supabase.from("invoices").select("total_amount, payment_status, is_final").is("order_id", null).eq("is_final", true).gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString()),
      ]);
      const costMap: Record<string, number> = {};
      (products || []).forEach((p: any) => { costMap[p.id] = Number(p.cost_price || 0); });
      const realized = (orders || []).filter((o: any) =>
        o.payment_status === "paid" ||
        ((o.order_type === "cod" || o.payment_id?.startsWith("COD")) && (o.cod_payment_status === "settled" || o.cod_payment_status === "received"))
      );
      const orderRevenue = realized.reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const orderTax = realized.reduce((s, o) => s + Number(o.tax_amount || 0), 0);
      let cogs = 0;
      realized.forEach((o: any) => (o.order_items || []).forEach((it: any) => {
        if (it.product_id && costMap[it.product_id]) cogs += costMap[it.product_id] * it.quantity;
      }));
      const manualPaidRev = (manualInv || []).filter((i: any) => i.payment_status === "paid").reduce((s, i: any) => s + Number(i.total_amount || 0), 0);
      const totalRevenue = orderRevenue + manualPaidRev;
      const grossProfit = totalRevenue - cogs;
      const netProfit = grossProfit - orderTax;
      const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const dateRangeStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy")}`;
      let y = await createReportHeader(doc, {
        title: "Profit & Loss Statement", subtitle: `Financial summary for ${dateRangeStr}`,
        dateRange: dateRangeStr, badgeText: "P&L", badgeColor: colors.accent,
      });
      y = createStatCards(doc, [
        { label: "Total Revenue", value: formatCurrency(totalRevenue), color: colors.success },
        { label: "COGS", value: formatCurrency(cogs), color: colors.error },
        { label: "Gross Profit", value: formatCurrency(grossProfit), color: colors.accent },
        { label: "Net Margin", value: `${margin.toFixed(1)}%`, color: margin >= 0 ? colors.success : colors.error },
      ], y);
      const rows = [
        ["Online Order Revenue (Paid)", formatCurrency(orderRevenue)],
        ["Manual Invoice Revenue (Paid)", formatCurrency(manualPaidRev)],
        ["TOTAL REVENUE", formatCurrency(totalRevenue)],
        ["Less: Cost of Goods Sold", formatCurrency(cogs)],
        ["GROSS PROFIT", formatCurrency(grossProfit)],
        ["Less: GST (Pass-through)", formatCurrency(orderTax)],
        ["NET PROFIT (Pre-Expense)", formatCurrency(netProfit)],
      ];
      const tr = createDataTable(doc, ["Line Item", "Amount"], rows, y, [120, 60], { valueColumnIndices: [1] });
      y = tr.nextY;
      const tp = doc.getNumberOfPages();
      for (let i = 1; i <= tp; i++) { doc.setPage(i); addReportFooter(doc, i, tp); }
      doc.save(`PnL-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.pdf`);
      toast.success("P&L report downloaded!");
    } catch (e: any) { console.error(e); toast.error(e?.message || "Failed"); }
    finally { setIsGenerating(false); }
  }, []);

  const generateLowStockReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const [{ data: products }, { data: materials }] = await Promise.all([
        supabase.from("products").select("name, stock_quantity, availability_status").in("availability_status", ["low_stock", "out_of_stock"]),
        supabase.from("raw_materials").select("name, quantity, min_quantity, unit"),
      ]);
      const lowMaterials = (materials || []).filter((m: any) => Number(m.quantity || 0) <= Number(m.min_quantity || 10));
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let y = await createReportHeader(doc, {
        title: "Low Stock Alert", subtitle: "Products and raw materials needing reorder",
        dateRange: format(new Date(), "dd MMM yyyy"), badgeText: "REORDER", badgeColor: colors.error,
      });
      y = createStatCards(doc, [
        { label: "Low Stock Products", value: String((products || []).length), color: colors.warning },
        { label: "Low Stock Materials", value: String(lowMaterials.length), color: colors.error },
        { label: "Total to Reorder", value: String((products || []).length + lowMaterials.length), color: colors.accent },
      ], y);
      doc.setFontSize(10); doc.setTextColor(...colors.primary); doc.setFont("helvetica", "bold");
      doc.text("Products", 14, y); y += 5;
      if ((products || []).length > 0) {
        const tr = createDataTable(doc, ["Product", "Stock", "Status"], (products || []).map((p: any) => [
          (p.name || "").substring(0, 50), String(p.stock_quantity || 0), (p.availability_status || "").replace(/_/g, " ")
        ]), y, [110, 30, 40], { valueColumnIndices: [1], statusColumnIndex: 2 });
        y = tr.nextY + 4;
      } else {
        doc.setFont("helvetica", "italic"); doc.setTextColor(...colors.muted); doc.text("All products in stock.", 14, y); y += 8;
      }
      doc.setFontSize(10); doc.setTextColor(...colors.primary); doc.setFont("helvetica", "bold");
      doc.text("Raw Materials", 14, y); y += 5;
      if (lowMaterials.length > 0) {
        const tr = createDataTable(doc, ["Material", "Qty", "Min Qty", "Unit"], lowMaterials.map((m: any) => [
          (m.name || "").substring(0, 50), String(m.quantity || 0), String(m.min_quantity || 0), m.unit || "pcs"
        ]), y, [90, 30, 30, 30], { valueColumnIndices: [1, 2] });
        y = tr.nextY;
      } else {
        doc.setFont("helvetica", "italic"); doc.setTextColor(...colors.muted); doc.text("All materials sufficient.", 14, y);
      }
      const tp = doc.getNumberOfPages();
      for (let i = 1; i <= tp; i++) { doc.setPage(i); addReportFooter(doc, i, tp); }
      doc.save(`Low-Stock-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Low stock report downloaded!");
    } catch (e: any) { console.error(e); toast.error(e?.message || "Failed"); }
    finally { setIsGenerating(false); }
  }, []);

  const generateCancellationsReport = useCallback(async (startDate: Date, endDate: Date) => {
    setIsGenerating(true);
    try {
      const { data: orders } = await supabase.from("orders").select("*").eq("status", "cancelled")
        .gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const dateRangeStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy")}`;
      let y = await createReportHeader(doc, {
        title: "Cancellations & Refunds", subtitle: `Cancelled orders during ${dateRangeStr}`,
        dateRange: dateRangeStr, badgeText: "CANCELLED", badgeColor: colors.error,
      });
      const list = orders || [];
      const totalLost = list.reduce((s, o: any) => s + Number(o.total_amount || 0), 0);
      const refunded = list.filter((o: any) => o.payment_status === "refunded" || o.payment_status === "paid");
      y = createStatCards(doc, [
        { label: "Total Cancelled", value: String(list.length), color: colors.error },
        { label: "Lost Revenue", value: formatCurrency(totalLost), color: colors.warning },
        { label: "Refunds Issued", value: String(refunded.length), color: colors.primary },
      ], y);
      if (list.length > 0) {
        const tr = createDataTable(doc, ["Order #", "Date", "Customer", "Amount", "Payment"],
          list.map((o: any) => [
            o.order_number, format(new Date(o.created_at), "dd MMM yy"),
            ((o.shipping_address as any)?.full_name || "Customer").substring(0, 20),
            formatCurrency(o.total_amount || 0), o.payment_status || "n/a",
          ]),
          y, [34, 24, 50, 36, 38], { valueColumnIndices: [3], statusColumnIndex: 4 });
        y = tr.nextY;
      }
      const tp = doc.getNumberOfPages();
      for (let i = 1; i <= tp; i++) { doc.setPage(i); addReportFooter(doc, i, tp); }
      doc.save(`Cancellations-${format(startDate, "yyyy-MM-dd")}.pdf`);
      toast.success("Cancellations report downloaded!");
    } catch (e: any) { console.error(e); toast.error(e?.message || "Failed"); }
    finally { setIsGenerating(false); }
  }, []);

  const generateAttendanceReport = useCallback(async (startDate: Date, endDate: Date) => {
    setIsGenerating(true);
    try {
      const [{ data: employees }, { data: attendance }] = await Promise.all([
        supabase.from("employees").select("id, employee_name, designation, is_active").eq("is_active", true),
        supabase.from("employee_attendance").select("employee_id, attendance_date, status")
          .gte("attendance_date", format(startDate, "yyyy-MM-dd"))
          .lte("attendance_date", format(endDate, "yyyy-MM-dd")),
      ]);
      const summary: Record<string, { present: number; absent: number; leave: number; halfDay: number }> = {};
      (employees || []).forEach((e: any) => { summary[e.id] = { present: 0, absent: 0, leave: 0, halfDay: 0 }; });
      (attendance || []).forEach((a: any) => {
        if (!summary[a.employee_id]) summary[a.employee_id] = { present: 0, absent: 0, leave: 0, halfDay: 0 };
        const s = (a.status || "").toLowerCase();
        if (s.includes("half")) summary[a.employee_id].halfDay++;
        else if (s.includes("present")) summary[a.employee_id].present++;
        else if (s.includes("absent")) summary[a.employee_id].absent++;
        else if (s.includes("leave")) summary[a.employee_id].leave++;
      });
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const dateRangeStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy")}`;
      let y = await createReportHeader(doc, {
        title: "Employee Attendance Summary", subtitle: `Attendance for ${dateRangeStr}`,
        dateRange: dateRangeStr, badgeText: "ATTENDANCE", badgeColor: colors.accent,
      });
      const totals = Object.values(summary).reduce((acc, v) => ({ p: acc.p + v.present, a: acc.a + v.absent, l: acc.l + v.leave, h: acc.h + v.halfDay }), { p: 0, a: 0, l: 0, h: 0 });
      y = createStatCards(doc, [
        { label: "Active Employees", value: String((employees || []).length), color: colors.primary },
        { label: "Present", value: String(totals.p), color: colors.success },
        { label: "Absent", value: String(totals.a), color: colors.error },
        { label: "Leaves", value: String(totals.l), color: colors.warning },
      ], y);
      if ((employees || []).length > 0) {
        const tr = createDataTable(doc, ["Employee", "Designation", "Present", "Absent", "Leave", "Half Day"],
          (employees || []).map((e: any) => {
            const s = summary[e.id];
            return [e.employee_name, e.designation || "-", String(s.present), String(s.absent), String(s.leave), String(s.halfDay)];
          }),
          y, [50, 38, 22, 22, 22, 28], { valueColumnIndices: [2, 3, 4, 5] });
        y = tr.nextY;
      }
      const tp = doc.getNumberOfPages();
      for (let i = 1; i <= tp; i++) { doc.setPage(i); addReportFooter(doc, i, tp); }
      doc.save(`Attendance-${format(startDate, "yyyy-MM-dd")}.pdf`);
      toast.success("Attendance report downloaded!");
    } catch (e: any) { console.error(e); toast.error(e?.message || "Failed"); }
    finally { setIsGenerating(false); }
  }, []);

  return {
    isGenerating,
    generateTodayOrdersReport,
    generateSalesReport,
    generateGSTReport: generateGstReport,
    generateProductInventoryReport,
    generateRawMaterialsReport,
    generateCustomerReport,
    generateInvoiceCollectionReport,
    generatePendingPaymentsReport,
    generateCodReport,
    generateTopProductsReport,
    generateProfitLossReport,
    generateLowStockReport,
    generateCancellationsReport,
    generateAttendanceReport,
  };
}
