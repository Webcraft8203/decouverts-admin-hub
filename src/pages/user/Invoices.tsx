import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInvoiceDownload } from "@/hooks/useInvoiceDownload";
import { UserLayout } from "@/components/UserLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";

const UserInvoices = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { downloadProformaInvoice, downloadFinalInvoice, isDownloading, generateProformaInvoice, isGenerating } = useInvoiceDownload();
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
        .select("id, order_number, total_amount, created_at, invoice_url, proforma_invoice_url, final_invoice_url, status, payment_status, delivered_at")
        .eq("user_id", user!.id)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return null;
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Invoices</h1>
          <p className="text-muted-foreground">Download invoices for your orders</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">₹{order.total_amount.toLocaleString()}</p>
                      <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="text-xs">
                        {order.status === "delivered" ? "Delivered" : "In Progress"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {/* Proforma Invoice */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => order.proforma_invoice_url || order.invoice_url 
                        ? downloadProformaInvoice(order.id) 
                        : generateProformaInvoice(order.id).then(() => downloadProformaInvoice(order.id))
                      }
                      disabled={isDownloading || isGenerating}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Proforma
                    </Button>
                    
                    {/* Final Tax Invoice */}
                    {order.status === "delivered" && order.final_invoice_url ? (
                      <Button
                        size="sm"
                        onClick={() => downloadFinalInvoice(order.id)}
                        disabled={isDownloading}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Tax Invoice
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" disabled className="text-xs">
                        Tax Invoice after delivery
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
