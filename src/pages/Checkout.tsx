import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Package, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  MapPin, 
  Plus,
  AlertCircle,
  Phone,
  User
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const addressSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
  address_line1: z.string().min(5, "Address must be at least 5 characters").max(200),
  address_line2: z.string().max(200).optional(),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  postal_code: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  label: z.string().default("Home"),
});

type AddressFormData = z.infer<typeof addressSchema>;

const Checkout = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "failed">("idle");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [step, setStep] = useState<"address" | "review" | "payment">("address");

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      label: "Home",
    },
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast.error("Please login to checkout");
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch product
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", productId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  // Fetch user addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["user-addresses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Set default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const { error } = await supabase.from("user_addresses").insert([{
        full_name: data.full_name,
        phone: data.phone,
        address_line1: data.address_line1,
        address_line2: data.address_line2 || null,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        label: data.label,
        user_id: user!.id,
        country: "India",
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      toast.success("Address added successfully");
      setShowAddressForm(false);
      form.reset();
    },
    onError: () => toast.error("Failed to add address"),
  });

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);
  const totalAmount = product ? product.price * quantity : 0;

  // Validation checks
  const canProceedToReview = (): { valid: boolean; message?: string } => {
    if (!selectedAddress) {
      return { valid: false, message: "Please select or add a delivery address" };
    }
    if (!selectedAddress.phone || !/^[6-9]\d{9}$/.test(selectedAddress.phone)) {
      return { valid: false, message: "Selected address has an invalid phone number" };
    }
    return { valid: true };
  };

  const canProceedToPayment = (): { valid: boolean; message?: string } => {
    if (!product) {
      return { valid: false, message: "Product not found" };
    }
    if (product.availability_status !== "in_stock") {
      return { valid: false, message: "This product is currently out of stock" };
    }
    if (product.stock_quantity < quantity) {
      return { valid: false, message: `Only ${product.stock_quantity} items available` };
    }
    return { valid: true };
  };

  const handleProceedToReview = () => {
    const check = canProceedToReview();
    if (!check.valid) {
      toast.error(check.message);
      return;
    }
    setStep("review");
  };

  const handleProceedToPayment = () => {
    const check = canProceedToPayment();
    if (!check.valid) {
      toast.error(check.message);
      return;
    }
    setStep("payment");
  };

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error("Payment gateway is loading. Please try again.");
      return;
    }

    if (!product || !user || !selectedAddress) return;

    // Final verification before payment
    const reviewCheck = canProceedToReview();
    const paymentCheck = canProceedToPayment();
    
    if (!reviewCheck.valid) {
      toast.error(reviewCheck.message);
      setStep("address");
      return;
    }
    
    if (!paymentCheck.valid) {
      toast.error(paymentCheck.message);
      setStep("review");
      return;
    }

    setIsProcessing(true);

    try {
      // Verify product availability one more time
      const { data: freshProduct, error: productError } = await supabase
        .from("products")
        .select("stock_quantity, availability_status")
        .eq("id", product.id)
        .single();

      if (productError || !freshProduct) {
        throw new Error("Failed to verify product availability");
      }

      if (freshProduct.availability_status !== "in_stock" || freshProduct.stock_quantity < quantity) {
        toast.error("Product is no longer available in the requested quantity");
        setIsProcessing(false);
        return;
      }

      // Create order via edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: {
            amount: totalAmount * 100,
            currency: "INR",
            productId: product.id,
            productName: product.name,
            quantity,
            addressId: selectedAddress.id,
            shippingAddress: {
              full_name: selectedAddress.full_name,
              phone: selectedAddress.phone,
              address_line1: selectedAddress.address_line1,
              address_line2: selectedAddress.address_line2,
              city: selectedAddress.city,
              state: selectedAddress.state,
              postal_code: selectedAddress.postal_code,
              country: selectedAddress.country,
            },
          },
        }
      );

      if (orderError) throw orderError;

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Decouverts Plus",
        description: `Purchase: ${product.name}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Payment successful - create order in database
          try {
            const orderNumber = `DP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            const { data: newOrder, error: createOrderError } = await supabase
              .from("orders")
              .insert({
                user_id: user.id,
                order_number: orderNumber,
                address_id: selectedAddress.id,
                shipping_address: {
                  full_name: selectedAddress.full_name,
                  phone: selectedAddress.phone,
                  address_line1: selectedAddress.address_line1,
                  address_line2: selectedAddress.address_line2,
                  city: selectedAddress.city,
                  state: selectedAddress.state,
                  postal_code: selectedAddress.postal_code,
                  country: selectedAddress.country,
                },
                subtotal: totalAmount,
                tax_amount: 0,
                shipping_amount: 0,
                total_amount: totalAmount,
                status: "pending",
                payment_status: "paid",
                payment_id: response.razorpay_payment_id,
              })
              .select()
              .single();

            if (createOrderError) throw createOrderError;

            // Create order item
            await supabase.from("order_items").insert({
              order_id: newOrder.id,
              product_id: product.id,
              product_name: product.name,
              product_price: product.price,
              quantity: quantity,
              total_price: totalAmount,
            });

            // Generate invoice automatically
            try {
              await supabase.functions.invoke("generate-invoice", {
                body: { orderId: newOrder.id },
              });
              console.log("Invoice generated successfully");
            } catch (invoiceError) {
              console.error("Invoice generation error:", invoiceError);
              // Don't fail the order if invoice generation fails
            }

            setPaymentStatus("success");
            toast.success("Payment successful! Your order has been placed.");
          } catch (error) {
            console.error("Order creation error:", error);
            setPaymentStatus("success");
            toast.success("Payment successful! Your order is being processed.");
          }
        },
        prefill: {
          email: user.email,
          contact: selectedAddress.phone,
        },
        theme: {
          color: "#EAAB1C",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setPaymentStatus("failed");
        toast.error("Payment failed. Please try again.");
        setIsProcessing(false);
      });
      rzp.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  const onAddressSubmit = (data: AddressFormData) => {
    addAddressMutation.mutate(data);
  };

  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNavbar />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for your purchase. Your order is pending confirmation from the admin.
              </p>
              <div className="space-y-3">
                <Button onClick={() => navigate("/dashboard/orders")} className="w-full">
                  View My Orders
                </Button>
                <Button variant="outline" onClick={() => navigate("/shop")} className="w-full">
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNavbar />
        <main className="flex-1 pt-20 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't process your payment. Please try again.
              </p>
              <div className="space-y-3">
                <Button onClick={() => setPaymentStatus("idle")} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate("/shop")} className="w-full">
                  Back to Shop
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button variant="ghost" onClick={() => navigate("/shop")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>

          <h1 className="text-3xl font-bold text-foreground mb-4">Checkout</h1>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            {["address", "review", "payment"].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : ["address", "review", "payment"].indexOf(step) > idx
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`ml-2 text-sm ${step === s ? "font-medium" : "text-muted-foreground"}`}>
                  {s === "address" ? "Address" : s === "review" ? "Review" : "Payment"}
                </span>
                {idx < 2 && <div className="w-8 h-0.5 bg-muted mx-2" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Address Selection */}
              {step === "address" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Select Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {addressesLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <Skeleton key={i} className="h-24" />
                        ))}
                      </div>
                    ) : addresses && addresses.length > 0 ? (
                      <RadioGroup
                        value={selectedAddressId}
                        onValueChange={setSelectedAddressId}
                        className="space-y-3"
                      >
                        {addresses.map((addr) => (
                          <div
                            key={addr.id}
                            className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedAddressId === addr.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                            onClick={() => setSelectedAddressId(addr.id)}
                          >
                            <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
                            <label htmlFor={addr.id} className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{addr.full_name}</span>
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">{addr.label}</span>
                                {addr.is_default && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {addr.address_line1}
                                {addr.address_line2 && `, ${addr.address_line2}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {addr.city}, {addr.state} - {addr.postal_code}
                              </p>
                              <p className="text-sm flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {addr.phone}
                              </p>
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No addresses saved yet</p>
                      </div>
                    )}

                    <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Address
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Address</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onAddressSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="full_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="9876543210" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="address_line1"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address Line 1</FormLabel>
                                  <FormControl>
                                    <Input placeholder="House/Flat No, Street" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="address_line2"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Landmark, Area" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Mumbai" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>State</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Maharashtra" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={form.control}
                              name="postal_code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>PIN Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="400001" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="label"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Label</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Home, Office, etc." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full" disabled={addAddressMutation.isPending}>
                              {addAddressMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : null}
                              Save Address
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <Button onClick={handleProceedToReview} className="w-full" disabled={!selectedAddressId}>
                      Continue to Review
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Review Order */}
              {step === "review" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      Review Your Order
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Delivery Address */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Delivery Address
                        </h4>
                        <Button variant="link" size="sm" onClick={() => setStep("address")}>
                          Change
                        </Button>
                      </div>
                      {selectedAddress && (
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{selectedAddress.full_name}</p>
                          <p>{selectedAddress.address_line1}</p>
                          {selectedAddress.address_line2 && <p>{selectedAddress.address_line2}</p>}
                          <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postal_code}</p>
                          <p className="flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {selectedAddress.phone}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    {productLoading ? (
                      <Skeleton className="h-32" />
                    ) : product ? (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{product.name}</h3>
                            <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
                            <p className="text-primary font-bold mt-2">₹{product.price.toLocaleString()} each</p>
                          </div>
                        </div>

                        {/* Stock Check */}
                        {product.availability_status !== "in_stock" && (
                          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                            <AlertCircle className="w-5 h-5" />
                            <span>This product is currently out of stock</span>
                          </div>
                        )}

                        {product.stock_quantity < quantity && product.availability_status === "in_stock" && (
                          <div className="flex items-center gap-2 p-3 bg-warning/10 text-warning rounded-lg">
                            <AlertCircle className="w-5 h-5" />
                            <span>Only {product.stock_quantity} items available</span>
                          </div>
                        )}

                        <div className="border-t pt-4">
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max={product.stock_quantity}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                            className="mt-2 w-24"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            {product.stock_quantity} available
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Product not found</p>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep("address")} className="flex-1">
                        Back
                      </Button>
                      <Button 
                        onClick={handleProceedToPayment} 
                        className="flex-1"
                        disabled={!canProceedToPayment().valid}
                      >
                        Proceed to Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Payment */}
              {step === "payment" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Payment Method</p>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">RZP</span>
                        </div>
                        <span className="font-medium">Razorpay</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Secure payment powered by Razorpay. Supports UPI, Cards, Net Banking & more.
                      </p>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                      <p className="text-sm font-medium text-primary mb-1">Test Mode Active</p>
                      <p className="text-xs text-muted-foreground">
                        This is a test payment. No real money will be charged.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep("review")} className="flex-1">
                        Back
                      </Button>
                      <Button
                        onClick={handlePayment}
                        disabled={isProcessing || !product || !razorpayLoaded}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pay ₹{totalAmount.toLocaleString()}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {productLoading ? (
                    <Skeleton className="h-20" />
                  ) : product ? (
                    <>
                      <div className="flex gap-3">
                        <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm line-clamp-2">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>₹{(product.price * quantity).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span className="text-green-600">Free</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                          <span>Total</span>
                          <span className="text-primary">₹{totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">Product not found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Checkout;