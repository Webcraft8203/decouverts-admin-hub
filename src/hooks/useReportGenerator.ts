import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { toast } from "sonner";

// Brand colors
const PRIMARY_COLOR: [number, number, number] = [234, 171, 28]; // #EAAB1C
const TEXT_DARK: [number, number, number] = [33, 33, 33];
const TEXT_GRAY: [number, number, number] = [102, 102, 102];
const TEXT_LIGHT: [number, number, number] = [140, 140, 140];
const BORDER_COLOR: [number, number, number] = [220, 220, 220];
const SUCCESS_COLOR: [number, number, number] = [76, 175, 80];

// Company settings (should match invoice settings)
const COMPANY_SETTINGS = {
  business_name: "Decouverts",
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

// Fetch and convert image to base64
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
}

export function useReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  // Create standard report header
  const createReportHeader = async (
    doc: jsPDF,
    config: ReportConfig
  ): Promise<number> => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 12;

    // Header background
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, pageWidth, 45, "F");

    // Try to add logo
    const logoBase64 = await fetchLogoAsBase64();
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, y, 35, 18);
      } catch (e) {
        console.error("Failed to add logo:", e);
      }
    }

    // Badge on right
    const badgeWidth = 55;
    const badgeHeight = 20;
    const badgeX = pageWidth - margin - badgeWidth;

    doc.setFillColor(...SUCCESS_COLOR);
    doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 3, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(config.badgeText, badgeX + badgeWidth / 2, y + 8, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(config.dateRange, badgeX + badgeWidth / 2, y + 14, { align: "center" });

    // Company name
    const companyNameY = y + 22;
    doc.setFontSize(18);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_SETTINGS.business_name, margin, companyNameY);

    // Tagline
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_GRAY);
    doc.setFont("helvetica", "italic");
    doc.text("Discovering Future Technologies", margin, companyNameY + 5);

    y = 50;

    // Company address
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_GRAY);
    doc.setFont("helvetica", "normal");

    const companyDetails = [
      COMPANY_SETTINGS.business_address,
      `${COMPANY_SETTINGS.business_city}, ${COMPANY_SETTINGS.business_state} - ${COMPANY_SETTINGS.business_pincode}`,
      `Phone: ${COMPANY_SETTINGS.business_phone} | Email: ${COMPANY_SETTINGS.business_email}`,
    ];

    companyDetails.forEach((line) => {
      doc.text(line, margin, y);
      y += 4;
    });

    y += 4;

    // Separator line
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    y += 8;

    // Report title
    doc.setFontSize(14);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont("helvetica", "bold");
    doc.text(config.title, margin, y);

    y += 5;

    doc.setFontSize(9);
    doc.setTextColor(...TEXT_GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(config.subtitle, margin, y);

    y += 10;

    return y;
  };

  // Add standard footer
  const addReportFooter = (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = pageHeight - 15;

    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    doc.setFontSize(8);
    doc.setTextColor(...TEXT_GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, margin, y);
    doc.text("Decouverts - Confidential", pageWidth - margin, y, { align: "right" });

    y += 4;

    doc.setFontSize(7);
    doc.setTextColor(...TEXT_LIGHT);
    doc.text("This is a computer-generated report.", pageWidth / 2, y, { align: "center" });
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
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;

      let y = await createReportHeader(doc, {
        title: "Today's Orders Report",
        subtitle: `Orders received on ${format(today, "dd MMMM yyyy")}`,
        dateRange: format(today, "dd MMM yyyy"),
        badgeText: "DAILY REPORT",
      });

      // Summary stats
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const paidOrders = orders?.filter((o) => o.payment_status === "paid").length || 0;
      const codOrders = orders?.filter((o) => o.order_type === "cod" || o.payment_id?.startsWith("COD")).length || 0;

      // Stats cards
      doc.setFillColor(248, 248, 248);
      const cardWidth = (pageWidth - 2 * margin - 15) / 4;

      const stats = [
        { label: "Total Orders", value: totalOrders.toString() },
        { label: "Total Value", value: formatCurrency(totalRevenue) },
        { label: "Paid Orders", value: paidOrders.toString() },
        { label: "COD Orders", value: codOrders.toString() },
      ];

      stats.forEach((stat, index) => {
        const x = margin + index * (cardWidth + 5);
        doc.setFillColor(248, 248, 248);
        doc.setDrawColor(...BORDER_COLOR);
        doc.roundedRect(x, y, cardWidth, 18, 2, 2, "FD");

        doc.setFontSize(8);
        doc.setTextColor(...TEXT_GRAY);
        doc.setFont("helvetica", "normal");
        doc.text(stat.label, x + cardWidth / 2, y + 5, { align: "center" });

        doc.setFontSize(11);
        doc.setTextColor(...TEXT_DARK);
        doc.setFont("helvetica", "bold");
        doc.text(stat.value, x + cardWidth / 2, y + 13, { align: "center" });
      });

      y += 25;

      // Orders table
      if (orders && orders.length > 0) {
        // Table header
        doc.setFillColor(...PRIMARY_COLOR);
        doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");

        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");

        const colWidths = [25, 50, 25, 30, 30, 20];
        let x = margin + 2;

        const headers = ["Order #", "Customer", "Items", "Amount", "Payment", "Status"];
        headers.forEach((h, i) => {
          doc.text(h, x, y + 5);
          x += colWidths[i];
        });

        y += 8;

        // Table rows
        orders.forEach((order, index) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }

          const rowBg = index % 2 === 0 ? [255, 255, 255] : [248, 248, 248];
          doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
          doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");

          doc.setFontSize(7);
          doc.setTextColor(...TEXT_DARK);
          doc.setFont("helvetica", "normal");

          x = margin + 2;
          const shippingAddr = order.shipping_address as any;
          const customerName = shippingAddr?.full_name || "Customer";
          const itemCount = order.order_items?.length || 0;
          const isCod = order.order_type === "cod" || order.payment_id?.startsWith("COD");

          const rowData = [
            order.order_number,
            customerName.substring(0, 20),
            `${itemCount} item(s)`,
            formatCurrency(order.total_amount || 0),
            isCod ? "COD" : "Online",
            order.status,
          ];

          rowData.forEach((cell, i) => {
            doc.text(String(cell), x, y + 5);
            x += colWidths[i];
          });

          y += 8;
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(...TEXT_GRAY);
        doc.text("No orders received today.", margin, y + 10);
      }

      addReportFooter(doc);

      // Download
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Daily-Orders-Report-${format(today, "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Today's orders report downloaded!");
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
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;

      const dateRangeStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy")}`;

      let y = await createReportHeader(doc, {
        title: "Sales Report",
        subtitle: `Sales performance for ${dateRangeStr}`,
        dateRange: dateRangeStr,
        badgeText: "SALES REPORT",
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

      // Stats section
      const stats = [
        { label: "Total Revenue", value: formatCurrency(totalRevenue), color: SUCCESS_COLOR },
        { label: "Subtotal (Pre-Tax)", value: formatCurrency(subtotals), color: [100, 149, 237] },
        { label: "Total Tax", value: formatCurrency(totalTax), color: [255, 152, 0] },
        { label: "Estimated Profit", value: formatCurrency(profit), color: [76, 175, 80] },
      ];

      const cardWidth = (pageWidth - 2 * margin - 15) / 4;

      stats.forEach((stat, index) => {
        const x = margin + index * (cardWidth + 5);
        doc.setFillColor(248, 248, 248);
        doc.setDrawColor(...BORDER_COLOR);
        doc.roundedRect(x, y, cardWidth, 20, 2, 2, "FD");

        doc.setFontSize(7);
        doc.setTextColor(...TEXT_GRAY);
        doc.setFont("helvetica", "normal");
        doc.text(stat.label, x + cardWidth / 2, y + 5, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.setFont("helvetica", "bold");
        doc.text(stat.value, x + cardWidth / 2, y + 14, { align: "center" });
      });

      y += 28;

      // Order breakdown by status
      doc.setFontSize(10);
      doc.setTextColor(...TEXT_DARK);
      doc.setFont("helvetica", "bold");
      doc.text("Order Breakdown by Status", margin, y);
      y += 6;

      const statusCounts: Record<string, number> = {};
      (orders || []).forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });

      Object.entries(statusCounts).forEach(([status, count]) => {
        doc.setFontSize(8);
        doc.setTextColor(...TEXT_GRAY);
        doc.setFont("helvetica", "normal");
        doc.text(`• ${status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}: ${count} orders`, margin + 5, y);
        y += 5;
      });

      y += 10;

      // Top selling products
      doc.setFontSize(10);
      doc.setTextColor(...TEXT_DARK);
      doc.setFont("helvetica", "bold");
      doc.text("Top Selling Products", margin, y);
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

      // Table header
      doc.setFillColor(...PRIMARY_COLOR);
      doc.rect(margin, y, pageWidth - 2 * margin, 7, "F");

      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("Product Name", margin + 3, y + 5);
      doc.text("Qty Sold", margin + 100, y + 5);
      doc.text("Revenue", margin + 130, y + 5);

      y += 7;

      topProducts.forEach((product, index) => {
        const rowBg = index % 2 === 0 ? [255, 255, 255] : [248, 248, 248];
        doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
        doc.rect(margin, y, pageWidth - 2 * margin, 7, "F");

        doc.setFontSize(8);
        doc.setTextColor(...TEXT_DARK);
        doc.setFont("helvetica", "normal");
        doc.text(product.name.substring(0, 50), margin + 3, y + 5);
        doc.text(product.quantity.toString(), margin + 100, y + 5);
        doc.text(formatCurrency(product.revenue), margin + 130, y + 5);

        y += 7;
      });

      addReportFooter(doc);

      // Download
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

      // Get orders for each customer
      const { data: orders } = await supabase.from("orders").select("user_id, total_amount, status, created_at");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;

      const reportTitle = customerId ? "Customer Detail Report" : "Customer Data Report";
      const subtitle = customerId 
        ? `Detailed report for selected customer` 
        : `Overview of all registered customers`;

      let y = await createReportHeader(doc, {
        title: reportTitle,
        subtitle: subtitle,
        dateRange: format(new Date(), "dd MMM yyyy"),
        badgeText: "CUSTOMER REPORT",
      });

      // Summary stats
      const totalCustomers = customers?.length || 0;
      const customersWithOrders = new Set((orders || []).map((o) => o.user_id)).size;
      const totalOrderValue = (orders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const stats = [
        { label: "Total Customers", value: totalCustomers.toString() },
        { label: "With Orders", value: customersWithOrders.toString() },
        { label: "Total Order Value", value: formatCurrency(totalOrderValue) },
      ];

      const cardWidth = (pageWidth - 2 * margin - 10) / 3;

      stats.forEach((stat, index) => {
        const x = margin + index * (cardWidth + 5);
        doc.setFillColor(248, 248, 248);
        doc.setDrawColor(...BORDER_COLOR);
        doc.roundedRect(x, y, cardWidth, 18, 2, 2, "FD");

        doc.setFontSize(8);
        doc.setTextColor(...TEXT_GRAY);
        doc.setFont("helvetica", "normal");
        doc.text(stat.label, x + cardWidth / 2, y + 5, { align: "center" });

        doc.setFontSize(11);
        doc.setTextColor(...TEXT_DARK);
        doc.setFont("helvetica", "bold");
        doc.text(stat.value, x + cardWidth / 2, y + 13, { align: "center" });
      });

      y += 25;

      // Customer list/detail
      if (customers && customers.length > 0) {
        // Table header
        doc.setFillColor(...PRIMARY_COLOR);
        doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");

        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");

        const colWidths = customerId ? [60, 50, 35, 35] : [50, 60, 30, 40];
        let x = margin + 2;

        const headers = customerId 
          ? ["Field", "Value", "", ""]
          : ["Name", "Email", "Orders", "Registered"];
        headers.forEach((h, i) => {
          if (h) doc.text(h, x, y + 5);
          x += colWidths[i];
        });

        y += 8;

        if (customerId && customers[0]) {
          // Detailed view for single customer
          const customer = customers[0];
          const customerOrders = (orders || []).filter((o) => o.user_id === customer.id);
          
          const fields = [
            ["Full Name", customer.full_name || "N/A"],
            ["Email", customer.email || "N/A"],
            ["Phone", customer.phone_number || "N/A"],
            ["Age", customer.age?.toString() || "N/A"],
            ["Registered On", format(new Date(customer.created_at), "dd MMM yyyy")],
            ["Total Orders", customerOrders.length.toString()],
            ["Total Spent", formatCurrency(customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0))],
          ];

          fields.forEach(([field, value], index) => {
            const rowBg = index % 2 === 0 ? [255, 255, 255] : [248, 248, 248];
            doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
            doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");

            doc.setFontSize(8);
            doc.setTextColor(...TEXT_DARK);
            doc.setFont("helvetica", "bold");
            doc.text(field, margin + 3, y + 5);

            doc.setFont("helvetica", "normal");
            doc.text(value, margin + 65, y + 5);

            y += 8;
          });
        } else {
          // List view for all customers
          customers.slice(0, 25).forEach((customer, index) => {
            if (y > 260) {
              doc.addPage();
              y = 20;
            }

            const rowBg = index % 2 === 0 ? [255, 255, 255] : [248, 248, 248];
            doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
            doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");

            const customerOrders = (orders || []).filter((o) => o.user_id === customer.id);

            doc.setFontSize(7);
            doc.setTextColor(...TEXT_DARK);
            doc.setFont("helvetica", "normal");

            x = margin + 2;
            const rowData = [
              (customer.full_name || "N/A").substring(0, 25),
              (customer.email || "N/A").substring(0, 30),
              customerOrders.length.toString(),
              format(new Date(customer.created_at), "dd MMM yyyy"),
            ];

            rowData.forEach((cell, i) => {
              doc.text(cell, x, y + 5);
              x += colWidths[i];
            });

            y += 8;
          });

          if (customers.length > 25) {
            y += 5;
            doc.setFontSize(8);
            doc.setTextColor(...TEXT_GRAY);
            doc.text(`... and ${customers.length - 25} more customers`, margin, y);
          }
        }
      }

      addReportFooter(doc);

      // Download
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
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;

      let y = await createReportHeader(doc, {
        title: "Raw Materials Inventory Report",
        subtitle: "Current stock levels and availability status",
        dateRange: format(new Date(), "dd MMM yyyy"),
        badgeText: "INVENTORY",
      });

      // Summary stats
      const totalMaterials = materials?.length || 0;
      const lowStock = materials?.filter((m) => m.availability_status === "low_stock").length || 0;
      const outOfStock = materials?.filter((m) => m.availability_status === "out_of_stock").length || 0;
      const inStock = materials?.filter((m) => m.availability_status === "in_stock").length || 0;

      const stats = [
        { label: "Total Materials", value: totalMaterials.toString(), color: PRIMARY_COLOR },
        { label: "In Stock", value: inStock.toString(), color: SUCCESS_COLOR },
        { label: "Low Stock", value: lowStock.toString(), color: [255, 152, 0] as [number, number, number] },
        { label: "Out of Stock", value: outOfStock.toString(), color: [244, 67, 54] as [number, number, number] },
      ];

      const cardWidth = (pageWidth - 2 * margin - 15) / 4;

      stats.forEach((stat, index) => {
        const x = margin + index * (cardWidth + 5);
        doc.setFillColor(248, 248, 248);
        doc.setDrawColor(...BORDER_COLOR);
        doc.roundedRect(x, y, cardWidth, 18, 2, 2, "FD");

        doc.setFontSize(8);
        doc.setTextColor(...TEXT_GRAY);
        doc.setFont("helvetica", "normal");
        doc.text(stat.label, x + cardWidth / 2, y + 5, { align: "center" });

        doc.setFontSize(11);
        doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.setFont("helvetica", "bold");
        doc.text(stat.value, x + cardWidth / 2, y + 13, { align: "center" });
      });

      y += 25;

      // Materials table
      if (materials && materials.length > 0) {
        // Table header
        doc.setFillColor(...PRIMARY_COLOR);
        doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");

        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");

        const colWidths = [50, 25, 25, 35, 45];
        let x = margin + 2;

        const headers = ["Material Name", "Quantity", "Unit", "Min Qty", "Status"];
        headers.forEach((h, i) => {
          doc.text(h, x, y + 5);
          x += colWidths[i];
        });

        y += 8;

        // Table rows
        materials.forEach((material, index) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }

          const rowBg = index % 2 === 0 ? [255, 255, 255] : [248, 248, 248];
          doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
          doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");

          doc.setFontSize(7);
          doc.setTextColor(...TEXT_DARK);
          doc.setFont("helvetica", "normal");

          x = margin + 2;

          const status = material.availability_status || "in_stock";
          const statusLabel = status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

          const rowData = [
            material.name.substring(0, 25),
            material.quantity?.toString() || "0",
            material.unit || "-",
            material.min_quantity?.toString() || "-",
            statusLabel,
          ];

          rowData.forEach((cell, i) => {
            // Color code status
            if (i === 4) {
              if (status === "out_of_stock") {
                doc.setTextColor(244, 67, 54);
              } else if (status === "low_stock") {
                doc.setTextColor(255, 152, 0);
              } else {
                doc.setTextColor(76, 175, 80);
              }
            } else {
              doc.setTextColor(...TEXT_DARK);
            }
            doc.text(cell, x, y + 5);
            x += colWidths[i];
          });

          y += 8;
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(...TEXT_GRAY);
        doc.text("No raw materials found.", margin, y + 10);
      }

      addReportFooter(doc);

      // Download
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
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;

      let y = await createReportHeader(doc, {
        title: "Product Inventory Report",
        subtitle: "Current product stock levels and pricing",
        dateRange: format(new Date(), "dd MMM yyyy"),
        badgeText: "INVENTORY",
      });

      // Summary stats
      const totalProducts = products?.length || 0;
      const lowStock = products?.filter((p) => p.availability_status === "low_stock").length || 0;
      const outOfStock = products?.filter((p) => p.availability_status === "out_of_stock").length || 0;
      const totalValue = products?.reduce((sum, p) => sum + (p.price || 0) * (p.stock_quantity || 0), 0) || 0;

      const stats = [
        { label: "Total Products", value: totalProducts.toString() },
        { label: "Low Stock", value: lowStock.toString() },
        { label: "Out of Stock", value: outOfStock.toString() },
        { label: "Total Stock Value", value: formatCurrency(totalValue) },
      ];

      const cardWidth = (pageWidth - 2 * margin - 15) / 4;

      stats.forEach((stat, index) => {
        const x = margin + index * (cardWidth + 5);
        doc.setFillColor(248, 248, 248);
        doc.setDrawColor(...BORDER_COLOR);
        doc.roundedRect(x, y, cardWidth, 18, 2, 2, "FD");

        doc.setFontSize(8);
        doc.setTextColor(...TEXT_GRAY);
        doc.setFont("helvetica", "normal");
        doc.text(stat.label, x + cardWidth / 2, y + 5, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(...TEXT_DARK);
        doc.setFont("helvetica", "bold");
        doc.text(stat.value, x + cardWidth / 2, y + 13, { align: "center" });
      });

      y += 25;

      // Products table
      if (products && products.length > 0) {
        doc.setFillColor(...PRIMARY_COLOR);
        doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");

        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");

        const colWidths = [55, 25, 30, 30, 40];
        let x = margin + 2;

        const headers = ["Product Name", "Stock", "Price", "Cost", "Status"];
        headers.forEach((h, i) => {
          doc.text(h, x, y + 5);
          x += colWidths[i];
        });

        y += 8;

        products.forEach((product, index) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }

          const rowBg = index % 2 === 0 ? [255, 255, 255] : [248, 248, 248];
          doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
          doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");

          doc.setFontSize(7);
          doc.setTextColor(...TEXT_DARK);
          doc.setFont("helvetica", "normal");

          x = margin + 2;

          const status = product.availability_status || "in_stock";
          const statusLabel = status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

          const rowData = [
            product.name.substring(0, 28),
            (product.stock_quantity || 0).toString(),
            formatCurrency(product.price || 0),
            formatCurrency(product.cost_price || 0),
            statusLabel,
          ];

          rowData.forEach((cell, i) => {
            if (i === 4) {
              if (status === "out_of_stock") {
                doc.setTextColor(244, 67, 54);
              } else if (status === "low_stock") {
                doc.setTextColor(255, 152, 0);
              } else {
                doc.setTextColor(76, 175, 80);
              }
            } else {
              doc.setTextColor(...TEXT_DARK);
            }
            doc.text(cell, x, y + 5);
            x += colWidths[i];
          });

          y += 8;
        });
      }

      addReportFooter(doc);

      // Download
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
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;

      const dateRangeStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy")}`;

      let y = await createReportHeader(doc, {
        title: "GST Tax Report",
        subtitle: `Tax collection summary for ${dateRangeStr}`,
        dateRange: dateRangeStr,
        badgeText: "GST REPORT",
      });

      // Calculate totals
      const totalCgst = invoices?.reduce((sum, inv) => sum + (inv.cgst_amount || 0), 0) || 0;
      const totalSgst = invoices?.reduce((sum, inv) => sum + (inv.sgst_amount || 0), 0) || 0;
      const totalIgst = invoices?.reduce((sum, inv) => sum + (inv.igst_amount || 0), 0) || 0;
      const totalTax = totalCgst + totalSgst + totalIgst;
      const totalInvoiceAmount = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      const stats = [
        { label: "CGST Collected", value: formatCurrency(totalCgst), color: [33, 150, 243] },
        { label: "SGST Collected", value: formatCurrency(totalSgst), color: [156, 39, 176] },
        { label: "IGST Collected", value: formatCurrency(totalIgst), color: [255, 152, 0] },
        { label: "Total GST", value: formatCurrency(totalTax), color: SUCCESS_COLOR },
      ];

      const cardWidth = (pageWidth - 2 * margin - 15) / 4;

      stats.forEach((stat, index) => {
        const x = margin + index * (cardWidth + 5);
        doc.setFillColor(248, 248, 248);
        doc.setDrawColor(...BORDER_COLOR);
        doc.roundedRect(x, y, cardWidth, 20, 2, 2, "FD");

        doc.setFontSize(7);
        doc.setTextColor(...TEXT_GRAY);
        doc.setFont("helvetica", "normal");
        doc.text(stat.label, x + cardWidth / 2, y + 5, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.setFont("helvetica", "bold");
        doc.text(stat.value, x + cardWidth / 2, y + 14, { align: "center" });
      });

      y += 28;

      // Summary
      doc.setFontSize(10);
      doc.setTextColor(...TEXT_DARK);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", margin, y);
      y += 6;

      doc.setFontSize(8);
      doc.setTextColor(...TEXT_GRAY);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Final Invoices: ${invoices?.length || 0}`, margin + 5, y);
      y += 5;
      doc.text(`Total Invoice Value: ${formatCurrency(totalInvoiceAmount)}`, margin + 5, y);
      y += 5;
      doc.text(`Seller GSTIN: ${COMPANY_SETTINGS.business_gstin}`, margin + 5, y);
      y += 10;

      // Invoice details table
      if (invoices && invoices.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(...TEXT_DARK);
        doc.setFont("helvetica", "bold");
        doc.text("Invoice Details", margin, y);
        y += 6;

        doc.setFillColor(...PRIMARY_COLOR);
        doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");

        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");

        const colWidths = [30, 35, 25, 25, 25, 25, 25];
        let x = margin + 2;

        const headers = ["Invoice #", "Client", "Subtotal", "CGST", "SGST", "IGST", "Total"];
        headers.forEach((h, i) => {
          doc.text(h, x, y + 5);
          x += colWidths[i];
        });

        y += 8;

        invoices.slice(0, 20).forEach((inv, index) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }

          const rowBg = index % 2 === 0 ? [255, 255, 255] : [248, 248, 248];
          doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
          doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");

          doc.setFontSize(6);
          doc.setTextColor(...TEXT_DARK);
          doc.setFont("helvetica", "normal");

          x = margin + 2;

          const rowData = [
            inv.invoice_number.substring(0, 15),
            (inv.client_name || "").substring(0, 18),
            formatCurrency(inv.subtotal || 0),
            formatCurrency(inv.cgst_amount || 0),
            formatCurrency(inv.sgst_amount || 0),
            formatCurrency(inv.igst_amount || 0),
            formatCurrency(inv.total_amount || 0),
          ];

          rowData.forEach((cell, i) => {
            doc.text(cell, x, y + 5);
            x += colWidths[i];
          });

          y += 8;
        });

        if (invoices.length > 20) {
          y += 5;
          doc.setFontSize(8);
          doc.setTextColor(...TEXT_GRAY);
          doc.text(`... and ${invoices.length - 20} more invoices`, margin, y);
        }
      }

      addReportFooter(doc);

      // Download
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
