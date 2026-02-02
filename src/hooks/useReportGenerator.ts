import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { toast } from "sonner";

// Enterprise color palette - consistent with invoice system
const colors = {
  brand: [45, 62, 80] as [number, number, number],
  primary: [30, 41, 59] as [number, number, number],
  secondary: [71, 85, 105] as [number, number, number],
  accent: [16, 185, 129] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  light: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  error: [239, 68, 68] as [number, number, number],
};

const COMPANY_SETTINGS = {
  business_name: "DECOUVERTS",
  business_address: "Innovation Hub, Tech Park",
  business_city: "Pune",
  business_state: "Maharashtra",
  business_pincode: "411001",
  business_country: "India",
  business_phone: "+91 98765 43210",
  business_email: "info@decouverts.com",
  business_gstin: "27XXXXX1234X1ZX",
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

  // Create standard enterprise report header
  const createReportHeader = async (
    doc: jsPDF,
    config: ReportConfig
  ): Promise<number> => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 5;

    // Top accent bar
    doc.setFillColor(...colors.brand);
    doc.rect(0, 0, pageWidth, 3, "F");

    y = 8;

    // Logo
    const logoBase64 = await fetchLogoAsBase64();
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, y, 28, 14);
      } catch (e) {
        console.error("Failed to add logo:", e);
      }
    }

    // Company name in CAPITALS
    const companyNameX = margin + (logoBase64 ? 32 : 0);
    doc.setFontSize(18);
    doc.setTextColor(...colors.brand);
    doc.setFont("helvetica", "bold");
    doc.text("DECOUVERTS", companyNameX, y + 7);

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "italic");
    doc.text("Discovering Future Technologies", companyNameX, y + 12);

    // Report badge on right
    const badgeWidth = 55;
    const badgeX = pageWidth - margin - badgeWidth;
    const badgeColor = config.badgeColor || colors.accent;

    doc.setFillColor(...badgeColor);
    doc.roundedRect(badgeX, y, badgeWidth, 16, 2, 2, "F");

    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(config.badgeText, badgeX + badgeWidth / 2, y + 6, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(config.dateRange, badgeX + badgeWidth / 2, y + 12, { align: "center" });

    y = 28;

    // Separator
    doc.setDrawColor(...colors.brand);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    y += 5;

    // Company address bar
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");

    doc.setFontSize(7);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${COMPANY_SETTINGS.business_address}, ${COMPANY_SETTINGS.business_city}, ${COMPANY_SETTINGS.business_state} - ${COMPANY_SETTINGS.business_pincode} | Ph: ${COMPANY_SETTINGS.business_phone}`,
      pageWidth / 2,
      y + 6,
      { align: "center" }
    );

    y += 14;

    // Report title section
    doc.setFontSize(14);
    doc.setTextColor(...colors.brand);
    doc.setFont("helvetica", "bold");
    doc.text(config.title, margin, y);

    y += 5;

    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    doc.setFont("helvetica", "normal");
    doc.text(config.subtitle, margin, y);

    y += 8;

    return y;
  };

  // Add standard footer with page number
  const addReportFooter = (doc: jsPDF, pageNum: number, totalPages?: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const footerY = pageHeight - 12;

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, margin, footerY);
    
    const pageText = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
    doc.text(pageText, pageWidth - margin, footerY, { align: "right" });

    doc.setFontSize(6);
    doc.text("DECOUVERTS - Confidential Business Report", pageWidth / 2, footerY + 4, { align: "center" });
  };

  // Create summary stat cards
  const createStatCards = (
    doc: jsPDF,
    stats: { label: string; value: string; color?: [number, number, number] }[],
    y: number
  ): number => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const cardWidth = (pageWidth - 2 * margin - (stats.length - 1) * 5) / stats.length;
    const cardHeight = 22;

    stats.forEach((stat, index) => {
      const x = margin + index * (cardWidth + 5);
      
      doc.setFillColor(...colors.light);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, "FD");

      // Top accent line
      const accentColor = stat.color || colors.accent;
      doc.setFillColor(...accentColor);
      doc.roundedRect(x, y, cardWidth, 3, 3, 3, "F");
      doc.setFillColor(...colors.light);
      doc.rect(x, y + 2, cardWidth, 2, "F");

      doc.setFontSize(7);
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "normal");
      doc.text(stat.label.toUpperCase(), x + cardWidth / 2, y + 10, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(...(stat.color || colors.brand));
      doc.setFont("helvetica", "bold");
      doc.text(stat.value, x + cardWidth / 2, y + 18, { align: "center" });
    });

    return y + cardHeight + 8;
  };

  // Create data table with pagination support
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
    const margin = 15;
    const tableWidth = pageWidth - 2 * margin;

    // Table header
    doc.setFillColor(...colors.brand);
    doc.rect(margin, y, tableWidth, 8, "F");

    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    let x = margin + 3;
    headers.forEach((h, i) => {
      const align = options?.valueColumnIndices?.includes(i) ? "right" : "left";
      if (align === "right") {
        doc.text(h, x + colWidths[i] - 3, y + 5.5, { align: "right" });
      } else {
        doc.text(h, x, y + 5.5);
      }
      x += colWidths[i];
    });

    y += 8;

    // Table rows
    rows.forEach((row, rowIndex) => {
      // Check for page break
      if (y > pageHeight - 30) {
        addReportFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        y = 20;
        
        // Re-add header on new page
        doc.setFillColor(...colors.brand);
        doc.rect(margin, y, tableWidth, 8, "F");
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        
        x = margin + 3;
        headers.forEach((h, i) => {
          const align = options?.valueColumnIndices?.includes(i) ? "right" : "left";
          if (align === "right") {
            doc.text(h, x + colWidths[i] - 3, y + 5.5, { align: "right" });
          } else {
            doc.text(h, x, y + 5.5);
          }
          x += colWidths[i];
        });
        y += 8;
      }

      const rowH = 7;

      // Alternate row background
      if (rowIndex % 2 === 0) {
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
            doc.setTextColor(...colors.primary);
          }
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(...colors.primary);
          doc.setFont("helvetica", "normal");
        }

        const align = options?.valueColumnIndices?.includes(cellIndex) ? "right" : "left";
        if (align === "right") {
          doc.text(cell, x + colWidths[cellIndex] - 3, y + 5, { align: "right" });
        } else {
          doc.text(cell.substring(0, 35), x, y + 5);
        }
        x += colWidths[cellIndex];
      });

      y += rowH;
    });

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
        badgeColor: colors.success,
      });

      // Summary stats
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const paidOrders = orders?.filter((o) => o.payment_status === "paid").length || 0;
      const codOrders = orders?.filter((o) => o.order_type === "cod" || o.payment_id?.startsWith("COD")).length || 0;

      y = createStatCards(doc, [
        { label: "Total Orders", value: totalOrders.toString(), color: colors.brand },
        { label: "Total Value", value: formatCurrency(totalRevenue), color: colors.accent },
        { label: "Paid Orders", value: paidOrders.toString(), color: colors.success },
        { label: "COD Orders", value: codOrders.toString(), color: colors.warning },
      ], y);

      // Orders table
      if (orders && orders.length > 0) {
        const headers = ["Order #", "Customer", "Items", "Amount", "Payment", "Status"];
        const colWidths = [28, 45, 25, 32, 25, 25];
        
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
        doc.text("No orders received today.", 15, y + 10);
      }

      addReportFooter(doc, 1);

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
        { label: "Pre-Tax Subtotal", value: formatCurrency(subtotals), color: colors.brand },
        { label: "Total GST", value: formatCurrency(totalTax), color: colors.warning },
        { label: "Est. Profit", value: formatCurrency(profit), color: colors.success },
      ], y);

      // Order breakdown by status
      doc.setFontSize(10);
      doc.setTextColor(...colors.brand);
      doc.setFont("helvetica", "bold");
      doc.text("Order Status Breakdown", 15, y);
      y += 6;

      const statusCounts: Record<string, number> = {};
      (orders || []).forEach((o) => {
        const status = o.status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      Object.entries(statusCounts).forEach(([status, count]) => {
        doc.setFontSize(8);
        doc.setTextColor(...colors.secondary);
        doc.setFont("helvetica", "normal");
        doc.text(`• ${status}: ${count} orders`, 18, y);
        y += 5;
      });

      y += 8;

      // Top products section
      doc.setFontSize(10);
      doc.setTextColor(...colors.brand);
      doc.setFont("helvetica", "bold");
      doc.text("Top Selling Products", 15, y);
      y += 6;

      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      (orders || []).forEach((o) => {
        (o.order_items || []).forEach((item: any) => {
          const key = item.product_id || item.product_name;
          if (!productSales[key]) {
            productSales[key] = { name: item.product_name, quantity: 0, revenue: 0 };
          }
          productSales[key].quantity += item.quantity;
          productSales[key].revenue += item.total_price || 0;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const headers = ["Product Name", "Qty Sold", "Revenue"];
      const colWidths = [100, 35, 45];
      const rows = topProducts.map((product) => [
        product.name.substring(0, 45),
        product.quantity.toString(),
        formatCurrency(product.revenue),
      ]);

      y = createDataTable(doc, headers, rows, y, colWidths, {
        valueColumnIndices: [2],
      });

      addReportFooter(doc, 1);

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

  // Generate Customer Report
  const generateCustomerReport = useCallback(async (customerId?: string) => {
    setIsGenerating(true);
    try {
      let query = supabase.from("profiles").select("*");
      if (customerId) {
        query = query.eq("id", customerId);
      }
      
      const { data: customers, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      const { data: orders } = await supabase.from("orders").select("user_id, total_amount, status, created_at");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const reportTitle = customerId ? "Customer Detail Report" : "Customer Data Report";
      const subtitle = customerId 
        ? `Detailed analysis for selected customer` 
        : `Complete overview of all registered customers`;

      let y = await createReportHeader(doc, {
        title: reportTitle,
        subtitle: subtitle,
        dateRange: format(new Date(), "dd MMM yyyy"),
        badgeText: "CUSTOMER REPORT",
        badgeColor: colors.brand,
      });

      const totalCustomers = customers?.length || 0;
      const customersWithOrders = new Set((orders || []).map((o) => o.user_id)).size;
      const totalOrderValue = (orders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);

      y = createStatCards(doc, [
        { label: "Total Customers", value: totalCustomers.toString(), color: colors.brand },
        { label: "Active Buyers", value: customersWithOrders.toString(), color: colors.accent },
        { label: "Total Revenue", value: formatCurrency(totalOrderValue), color: colors.success },
      ], y);

      if (customers && customers.length > 0) {
        const headers = ["Name", "Email", "Orders", "Registered"];
        const colWidths = [50, 65, 25, 40];
        
        const rows = customers.slice(0, 30).map((customer) => {
          const customerOrders = (orders || []).filter((o) => o.user_id === customer.id);
          return [
            (customer.full_name || "N/A").substring(0, 25),
            (customer.email || "N/A").substring(0, 30),
            customerOrders.length.toString(),
            format(new Date(customer.created_at), "dd MMM yyyy"),
          ];
        });

        y = createDataTable(doc, headers, rows, y, colWidths);

        if (customers.length > 30) {
          doc.setFontSize(8);
          doc.setTextColor(...colors.muted);
          doc.text(`... and ${customers.length - 30} more customers`, 15, y);
        }
      }

      addReportFooter(doc, 1);

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

  // Generate Raw Materials Report
  const generateRawMaterialsReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { data: materials, error } = await supabase
        .from("raw_materials")
        .select("*")
        .order("name");

      if (error) throw error;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      let y = await createReportHeader(doc, {
        title: "Raw Materials Inventory Report",
        subtitle: "Current stock levels and material availability status",
        dateRange: format(new Date(), "dd MMM yyyy"),
        badgeText: "INVENTORY",
        badgeColor: colors.warning,
      });

      const totalMaterials = materials?.length || 0;
      const lowStock = materials?.filter((m) => m.availability_status === "low_stock").length || 0;
      const outOfStock = materials?.filter((m) => m.availability_status === "out_of_stock").length || 0;
      const inStock = materials?.filter((m) => m.availability_status === "in_stock").length || 0;

      y = createStatCards(doc, [
        { label: "Total Materials", value: totalMaterials.toString(), color: colors.brand },
        { label: "In Stock", value: inStock.toString(), color: colors.success },
        { label: "Low Stock", value: lowStock.toString(), color: colors.warning },
        { label: "Out of Stock", value: outOfStock.toString(), color: colors.error },
      ], y);

      if (materials && materials.length > 0) {
        const headers = ["Material Name", "Quantity", "Unit", "Min Qty", "Status"];
        const colWidths = [60, 30, 25, 30, 35];
        
        const rows = materials.map((material) => {
          const status = (material.availability_status || "in_stock")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l: string) => l.toUpperCase());
          
          return [
            material.name.substring(0, 30),
            material.quantity?.toString() || "0",
            material.unit || "-",
            material.min_quantity?.toString() || "-",
            status,
          ];
        });

        y = createDataTable(doc, headers, rows, y, colWidths, {
          statusColumnIndex: 4,
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(...colors.muted);
        doc.text("No raw materials found.", 15, y + 10);
      }

      addReportFooter(doc, 1);

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

  // Generate Product Inventory Report
  const generateProductInventoryReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      let y = await createReportHeader(doc, {
        title: "Product Inventory Report",
        subtitle: "Complete product stock levels and pricing overview",
        dateRange: format(new Date(), "dd MMM yyyy"),
        badgeText: "INVENTORY",
        badgeColor: colors.accent,
      });

      const totalProducts = products?.length || 0;
      const lowStock = products?.filter((p) => p.availability_status === "low_stock").length || 0;
      const outOfStock = products?.filter((p) => p.availability_status === "out_of_stock").length || 0;
      const totalValue = products?.reduce((sum, p) => sum + (p.price || 0) * (p.stock_quantity || 0), 0) || 0;

      y = createStatCards(doc, [
        { label: "Total Products", value: totalProducts.toString(), color: colors.brand },
        { label: "Low Stock", value: lowStock.toString(), color: colors.warning },
        { label: "Out of Stock", value: outOfStock.toString(), color: colors.error },
        { label: "Stock Value", value: formatCurrency(totalValue), color: colors.success },
      ], y);

      if (products && products.length > 0) {
        const headers = ["Product Name", "Stock", "Price", "Cost", "Status"];
        const colWidths = [60, 25, 35, 35, 25];
        
        const rows = products.map((product) => {
          const status = (product.availability_status || "in_stock")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l: string) => l.toUpperCase());
          
          return [
            product.name.substring(0, 30),
            (product.stock_quantity || 0).toString(),
            formatCurrency(product.price || 0),
            formatCurrency(product.cost_price || 0),
            status,
          ];
        });

        y = createDataTable(doc, headers, rows, y, colWidths, {
          valueColumnIndices: [2, 3],
          statusColumnIndex: 4,
        });
      }

      addReportFooter(doc, 1);

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Product-Inventory-Report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Product inventory report downloaded!");
    } catch (e: any) {
      console.error("Error generating report:", e);
      toast.error(e?.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate GST Report
  const generateGSTReport = useCallback(async (startDate: Date, endDate: Date) => {
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
        title: "GST Summary Report",
        subtitle: `Tax collection breakdown for ${dateRangeStr}`,
        dateRange: dateRangeStr,
        badgeText: "GST REPORT",
        badgeColor: colors.success,
      });

      const totalCgst = invoices?.reduce((sum, inv) => sum + (inv.cgst_amount || 0), 0) || 0;
      const totalSgst = invoices?.reduce((sum, inv) => sum + (inv.sgst_amount || 0), 0) || 0;
      const totalIgst = invoices?.reduce((sum, inv) => sum + (inv.igst_amount || 0), 0) || 0;
      const totalTax = totalCgst + totalSgst + totalIgst;
      const taxableValue = invoices?.reduce((sum, inv) => sum + (inv.subtotal || 0), 0) || 0;

      y = createStatCards(doc, [
        { label: "Taxable Value", value: formatCurrency(taxableValue), color: colors.brand },
        { label: "CGST (9%)", value: formatCurrency(totalCgst), color: colors.accent },
        { label: "SGST (9%)", value: formatCurrency(totalSgst), color: colors.accent },
        { label: "IGST (18%)", value: formatCurrency(totalIgst), color: colors.warning },
      ], y);

      // Total tax summary box
      doc.setFillColor(...colors.accent);
      doc.roundedRect(15, y, 180, 16, 3, 3, "F");

      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL TAX COLLECTED", 25, y + 7);
      doc.setFontSize(14);
      doc.text(formatCurrency(totalTax), 170, y + 10, { align: "right" });

      y += 24;

      // Invoice breakdown
      if (invoices && invoices.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(...colors.brand);
        doc.setFont("helvetica", "bold");
        doc.text("Invoice-wise Tax Breakdown", 15, y);
        y += 6;

        const headers = ["Invoice #", "Customer", "Taxable", "CGST", "SGST", "IGST", "Total Tax"];
        const colWidths = [30, 45, 28, 22, 22, 22, 25];
        
        const rows = invoices.slice(0, 20).map((inv) => [
          inv.invoice_number,
          (inv.client_name || "").substring(0, 20),
          formatCurrency(inv.subtotal || 0),
          formatCurrency(inv.cgst_amount || 0),
          formatCurrency(inv.sgst_amount || 0),
          formatCurrency(inv.igst_amount || 0),
          formatCurrency((inv.cgst_amount || 0) + (inv.sgst_amount || 0) + (inv.igst_amount || 0)),
        ]);

        y = createDataTable(doc, headers, rows, y, colWidths, {
          valueColumnIndices: [2, 3, 4, 5, 6],
        });

        if (invoices.length > 20) {
          doc.setFontSize(8);
          doc.setTextColor(...colors.muted);
          doc.text(`... and ${invoices.length - 20} more invoices`, 15, y);
        }
      } else {
        doc.setFontSize(10);
        doc.setTextColor(...colors.muted);
        doc.text("No finalized invoices found for this period.", 15, y + 10);
      }

      addReportFooter(doc, 1);

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

  return {
    isGenerating,
    generateTodayOrdersReport,
    generateSalesReport,
    generateCustomerReport,
    generateRawMaterialsReport,
    generateProductInventoryReport,
    generateGSTReport,
  };
}
