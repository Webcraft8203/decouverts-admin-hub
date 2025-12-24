import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek } from "date-fns";

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface OrderStatusData {
  name: string;
  value: number;
  color: string;
}

interface ProductSales {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  status: string;
}

interface CustomerStats {
  totalCustomers: number;
  newCustomersThisWeek: number;
  returningCustomers: number;
  customersWithOrders: number;
}

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  todayOrders: number;
  todayRevenue: number;
}

const statusColors: Record<string, string> = {
  pending: "hsl(45, 96%, 53%)",
  confirmed: "hsl(217, 91%, 60%)",
  processing: "hsl(271, 91%, 65%)",
  packed: "hsl(199, 89%, 48%)",
  shipped: "hsl(262, 83%, 58%)",
  ready_for_pickup: "hsl(172, 66%, 50%)",
  delivered: "hsl(145, 60%, 40%)",
  cancelled: "hsl(0, 70%, 50%)",
};

export function useAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [lowProducts, setLowProducts] = useState<ProductSales[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats>({
    totalCustomers: 0,
    newCustomersThisWeek: 0,
    returningCustomers: 0,
    customersWithOrders: 0,
  });

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchSalesData(),
        fetchOrderStatusData(),
        fetchProductSales(),
        fetchLowStockProducts(),
        fetchCustomerStats(),
      ]);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const [ordersRes, productsRes, profilesRes, todayOrdersRes] = await Promise.all([
      supabase.from("orders").select("id, total_amount, payment_status"),
      supabase.from("products").select("id"),
      supabase.from("profiles").select("id"),
      supabase
        .from("orders")
        .select("id, total_amount, payment_status")
        .gte("created_at", startOfDay)
        .lt("created_at", endOfDay),
    ]);

    const orders = ordersRes.data || [];
    const paidOrders = orders.filter((o) => o.payment_status === "paid");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const todayOrders = todayOrdersRes.data || [];
    const todayPaidOrders = todayOrders.filter((o) => o.payment_status === "paid");
    const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    setDashboardStats({
      totalOrders: orders.length,
      totalRevenue,
      totalProducts: (productsRes.data || []).length,
      totalCustomers: (profilesRes.data || []).length,
      todayOrders: todayOrders.length,
      todayRevenue,
    });
  };

  const fetchSalesData = async () => {
    const endDate = new Date();
    const startDate = subDays(endDate, 13);

    const { data: orders } = await supabase
      .from("orders")
      .select("created_at, total_amount, payment_status")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .eq("payment_status", "paid");

    // Group by date
    const dailyData: Record<string, { revenue: number; orders: number }> = {};
    
    // Initialize all dates
    for (let i = 0; i < 14; i++) {
      const date = format(subDays(endDate, 13 - i), "MMM dd");
      dailyData[date] = { revenue: 0, orders: 0 };
    }

    // Fill in data
    (orders || []).forEach((order) => {
      const date = format(new Date(order.created_at), "MMM dd");
      if (dailyData[date]) {
        dailyData[date].revenue += Number(order.total_amount || 0);
        dailyData[date].orders += 1;
      }
    });

    const chartData = Object.entries(dailyData).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }));

    setSalesData(chartData);
  };

  const fetchOrderStatusData = async () => {
    const { data: orders } = await supabase.from("orders").select("status");

    const statusCounts: Record<string, number> = {};
    (orders || []).forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    const chartData = Object.entries(statusCounts)
      .map(([status, count]) => ({
        name: status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: count,
        color: statusColors[status] || "hsl(var(--muted))",
      }))
      .filter((item) => item.value > 0);

    setOrderStatusData(chartData);
  };

  const fetchProductSales = async () => {
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, product_name, quantity, total_price");

    // Aggregate by product
    const productMap: Record<string, { name: string; totalSold: number; revenue: number }> = {};
    
    (orderItems || []).forEach((item) => {
      const id = item.product_id || item.product_name;
      if (!productMap[id]) {
        productMap[id] = { name: item.product_name, totalSold: 0, revenue: 0 };
      }
      productMap[id].totalSold += item.quantity;
      productMap[id].revenue += Number(item.total_price || 0);
    });

    const sorted = Object.entries(productMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    setTopProducts(sorted.slice(0, 5));
    setLowProducts(sorted.slice(-5).reverse().filter((p) => p.totalSold > 0));
  };

  const fetchLowStockProducts = async () => {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, stock_quantity, availability_status")
      .or("availability_status.eq.low_stock,availability_status.eq.out_of_stock")
      .order("stock_quantity", { ascending: true })
      .limit(10);

    setLowStockProducts(
      (products || []).map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock_quantity,
        status: p.availability_status,
      }))
    );
  };

  const fetchCustomerStats = async () => {
    const weekStart = startOfWeek(new Date()).toISOString();

    const [allProfilesRes, newProfilesRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("id"),
      supabase.from("profiles").select("id").gte("created_at", weekStart),
      supabase.from("orders").select("user_id"),
    ]);

    const allProfiles = allProfilesRes.data || [];
    const newProfiles = newProfilesRes.data || [];
    const orders = ordersRes.data || [];

    // Count unique customers with orders
    const customerOrderCount: Record<string, number> = {};
    orders.forEach((order) => {
      customerOrderCount[order.user_id] = (customerOrderCount[order.user_id] || 0) + 1;
    });

    const customersWithOrders = Object.keys(customerOrderCount).length;
    const returningCustomers = Object.values(customerOrderCount).filter((count) => count > 1).length;

    setCustomerStats({
      totalCustomers: allProfiles.length,
      newCustomersThisWeek: newProfiles.length,
      customersWithOrders,
      returningCustomers,
    });
  };

  return {
    isLoading,
    dashboardStats,
    salesData,
    orderStatusData,
    topProducts,
    lowProducts,
    lowStockProducts,
    customerStats,
    refetch: fetchAllAnalytics,
  };
}
