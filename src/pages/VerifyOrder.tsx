import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Search,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  QrCode
} from "lucide-react";

interface VerificationData {
  success: boolean;
  verified: boolean;
  order: {
    id: string;
    orderNumber: string;
    shipmentId: string | null;
    status: {
      code: string;
      label: string;
      color: string;
      icon: string;
    };
    isCustomDesign: boolean;
    paymentMode: string;
    courier: {
      name: string | null;
      trackingId: string | null;
      trackingUrl: string | null;
    };
    dates: {
      ordered: string;
      shipped: string | null;
      expectedDelivery: string | null;
      delivered: string | null;
    };
    customer: {
      name: string;
      location: string;
    };
    products: Array<{ name: string; quantity: number }>;
    totalItems: number;
  };
  verifiedAt: string;
}

const VerifyOrder = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id");
  
  const [manualOrderId, setManualOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyOrder = async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("verify-order", {
        body: { orderId: id },
      });

      if (fnError) throw fnError;

      if (result.success) {
        setData(result);
      } else {
        setError(result.error || "Failed to verify order");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Unable to verify this order. Please check the order ID and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      verifyOrder(orderId);
    }
  }, [orderId]);

  const handleManualVerify = () => {
    if (manualOrderId.trim()) {
      verifyOrder(manualOrderId.trim());
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusSteps = () => {
    const steps = [
      { key: "pending", label: "Order Placed", icon: Package },
      { key: "confirmed", label: "Confirmed", icon: CheckCircle },
      { key: "packing", label: "Packing", icon: Package },
      { key: "shipped", label: "Shipped", icon: Truck },
      { key: "out-for-delivery", label: "Out for Delivery", icon: Truck },
      { key: "delivered", label: "Delivered", icon: CheckCircle },
    ];

    const currentIndex = steps.findIndex((s) => s.key === data?.order.status.code);
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <QrCode className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Order Verification</h1>
            <p className="text-muted-foreground">
              Verify your order authenticity and track delivery status
            </p>
          </div>

          {/* Manual Search */}
          {!orderId && !data && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter Order ID or scan QR code"
                    value={manualOrderId}
                    onChange={(e) => setManualOrderId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualVerify()}
                    className="flex-1"
                  />
                  <Button onClick={handleManualVerify} disabled={loading}>
                    <Search className="w-4 h-4 mr-2" />
                    Verify
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {loading && (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48 mx-auto" />
                  <Skeleton className="h-4 w-64 mx-auto" />
                  <div className="flex justify-center gap-2 mt-6">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="w-12 h-12 rounded-full" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="py-8 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Verification Failed</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button variant="outline" onClick={() => setError(null)}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Verified Order */}
          {data && data.verified && (
            <div className="space-y-6">
              {/* Verified Badge */}
              <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        Order Verified ✓
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-500">
                        This is an authentic order from Decouverts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      {data.order.orderNumber}
                    </CardTitle>
                    <Badge 
                      style={{ 
                        backgroundColor: `${data.order.status.color}20`,
                        color: data.order.status.color,
                      }}
                    >
                      {data.order.status.icon} {data.order.status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status Timeline */}
                  <div className="py-4">
                    <div className="flex items-center justify-between relative">
                      {/* Progress line */}
                      <div className="absolute left-0 right-0 top-1/2 h-1 bg-muted -translate-y-1/2 z-0" />
                      <div 
                        className="absolute left-0 top-1/2 h-1 bg-primary -translate-y-1/2 z-0 transition-all"
                        style={{ 
                          width: `${(getStatusSteps().findIndex(s => s.current) / (getStatusSteps().length - 1)) * 100}%` 
                        }}
                      />
                      
                      {getStatusSteps().map((step, index) => (
                        <div key={step.key} className="relative z-10 flex flex-col items-center">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              step.completed 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted text-muted-foreground"
                            } ${step.current ? "ring-4 ring-primary/30" : ""}`}
                          >
                            <step.icon className="w-5 h-5" />
                          </div>
                          <span className={`text-xs mt-2 text-center max-w-[60px] ${
                            step.completed ? "text-primary font-medium" : "text-muted-foreground"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Ordered
                      </p>
                      <p className="font-medium">{formatDate(data.order.dates.ordered)}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Delivery
                      </p>
                      <p className="font-medium">{data.order.customer.location}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" /> Customer
                      </p>
                      <p className="font-medium">{data.order.customer.name}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-muted-foreground">Payment</p>
                      <Badge variant={data.order.paymentMode === "Prepaid" ? "default" : "secondary"}>
                        {data.order.paymentMode}
                      </Badge>
                    </div>
                  </div>

                  {/* Courier Info */}
                  {data.order.courier.name && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <p className="font-medium flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        Courier Details
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Courier:</span>
                          <span className="ml-2 font-medium">{data.order.courier.name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">AWB:</span>
                          <span className="ml-2 font-medium">{data.order.courier.trackingId}</span>
                        </div>
                      </div>
                      {data.order.courier.trackingUrl && (
                        <a
                          href={data.order.courier.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Track Package
                        </a>
                      )}
                      {data.order.dates.expectedDelivery && (
                        <p className="text-sm flex items-center gap-1 mt-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Expected:</span>
                          <span className="font-medium">{formatDate(data.order.dates.expectedDelivery)}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Products */}
                  <div className="space-y-2">
                    <p className="font-medium">Package Contents ({data.order.totalItems} items)</p>
                    <div className="space-y-1">
                      {data.order.products.map((product, idx) => (
                        <div key={idx} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                          <span>{product.name}</span>
                          <span className="text-muted-foreground">×{product.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verification timestamp */}
                  <p className="text-xs text-muted-foreground text-center pt-4 border-t">
                    Verified at {formatDateTime(data.verifiedAt)}
                  </p>
                </CardContent>
              </Card>

              {/* Search Another */}
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-3">Verify another order:</p>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter Order ID"
                      value={manualOrderId}
                      onChange={(e) => setManualOrderId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleManualVerify()}
                      className="flex-1"
                    />
                    <Button onClick={handleManualVerify} disabled={loading} variant="outline">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default VerifyOrder;
