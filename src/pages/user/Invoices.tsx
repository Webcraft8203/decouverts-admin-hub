import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInvoiceDownload } from "@/hooks/useInvoiceDownload";
import { UserLayout } from "@/components/UserLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Receipt, 
  FileCheck, 
  Package, 
  Truck, 
  CheckCircle,
  Clock,
  Banknote,
  CreditCard,
  Info
} from "lucide-react";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const UserInvoices = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { 
    downloadProformaInvoice, 
    downloadFinalInvoice, 
    isDownloading, 
    generateProformaInvoice, 
    isGenerating 
  } = useInvoiceDownload();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["user-invoices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, total_amount, created_at, 
          invoice_url, proforma_invoice_url, final_invoice_url, 
          status, payment_status, payment_id, delivered_at
        `)
        .eq("user_id", user!.id)
        .in("payment_status", ["paid", "cod_pending", "cod_collected", "cod_settled"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getPaymentTypeBadge = (order: any) => {
    const isCOD = !order.payment_id || order.payment_id.startsWith("COD");
    if (isCOD) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
          <Banknote className="w-3 h-3 mr-1" />
          COD
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
        <CreditCard className="w-3 h-3 mr-1" />
        Online
      </Badge>
    );
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
      confirmed: { label: "Confirmed", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: CheckCircle },
      packing: { label: "Packing", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Package },
      shipped: { label: "Shipped", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", icon: Truck },
      delivered: { label: "Delivered", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getCODPaymentNote = (order: any) => {
    const isCOD = !order.payment_id || order.payment_id.startsWith("COD");
    if (!isCOD) return null;
    
    if (order.status === "delivered") {
      return (
        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-md">
          <CheckCircle className="w-3 h-3" />
          <span>Amount collected by delivery partner</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md">
        <Clock className="w-3 h-3" />
        <span>Payment pending - COD on delivery</span>
      </div>
    );
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Invoices</h1>
          <p className="text-muted-foreground">Download invoices for your orders</p>
        </div>

        {/* Info Card */}
        <Card className="bg-muted/30 border-muted">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong className="text-foreground">Proforma Invoice:</strong> Temporary invoice generated at order placement. Not valid for tax filing.
                </p>
                <p>
                  <strong className="text-foreground">Final Tax Invoice:</strong> GST-compliant invoice generated after delivery. Valid for tax purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const hasProforma = order.proforma_invoice_url || order.invoice_url;
              const hasFinal = order.final_invoice_url && order.status === "delivered";
              
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order Header */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="font-bold text-lg text-primary">{formatCurrency(order.total_amount)}</p>
                        <div className="flex items-center gap-2">
                          {getPaymentTypeBadge(order)}
                          {getOrderStatusBadge(order.status)}
                        </div>
                      </div>
                    </div>

                    {/* COD Payment Note */}
                    {getCODPaymentNote(order) && (
                      <div className="px-4 py-2 border-b bg-background">
                        {getCODPaymentNote(order)}
                      </div>
                    )}

                    {/* Invoice Actions */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Proforma Invoice */}
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
                            <Receipt className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Proforma Invoice</p>
                            <p className="text-xs text-muted-foreground">Temporary reference</p>
                          </div>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => hasProforma 
                                  ? downloadProformaInvoice(order.id) 
                                  : generateProformaInvoice(order.id).then(() => downloadProformaInvoice(order.id))
                                }
                                disabled={isDownloading || isGenerating}
                                className="gap-1.5"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download proforma invoice (not for tax filing)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Final Tax Invoice */}
                      <div className={`flex items-center justify-between p-3 rounded-lg border ${
                        hasFinal 
                          ? "bg-green-500/5 border-green-500/20" 
                          : "bg-muted/30 border-muted"
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            hasFinal ? "bg-green-500/10" : "bg-muted"
                          }`}>
                            <FileCheck className={`w-4 h-4 ${hasFinal ? "text-green-600" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Final Tax Invoice</p>
                            <p className="text-xs text-muted-foreground">
                              {hasFinal ? "GST compliant" : "Available after delivery"}
                            </p>
                          </div>
                        </div>
                        {hasFinal ? (
                          <Button
                            size="sm"
                            onClick={() => downloadFinalInvoice(order.id)}
                            disabled={isDownloading}
                            className="gap-1.5 bg-green-600 hover:bg-green-700"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" disabled className="text-xs gap-1">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Final tax invoice will be available after order delivery</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No invoices yet</h2>
              <p className="text-muted-foreground mb-6">
                Invoices will appear here after you make purchases.
              </p>
              <Button asChild>
                <Link to="/shop">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
};

export default UserInvoices;
