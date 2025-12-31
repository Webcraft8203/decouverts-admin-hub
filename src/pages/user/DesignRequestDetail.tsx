import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserLayout } from "@/components/UserLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FileImage,
  Download,
  Send,
  Check,
  MessageSquare,
  ArrowLeft,
  Loader2,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_review: { label: "Pending Review", variant: "secondary" },
  quotation_sent: { label: "Quotation Sent", variant: "default" },
  negotiation_requested: { label: "Negotiation Requested", variant: "outline" },
  revised_quotation_sent: { label: "Revised Quotation", variant: "default" },
  final_quotation_confirmed: { label: "Final Quote Confirmed", variant: "default" },
  payment_pending: { label: "Payment Pending", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export default function DesignRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [message, setMessage] = useState("");
  const [counterOffer, setCounterOffer] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [showNegotiateDialog, setShowNegotiateDialog] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch request details
  const { data: request, isLoading } = useQuery({
    queryKey: ["design-request", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_requests")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Fetch messages
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ["design-messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_messages")
        .select("*")
        .eq("design_request_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch negotiations
  const { data: negotiations } = useQuery({
    queryKey: ["design-negotiations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_negotiations")
        .select("*")
        .eq("design_request_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Mark messages as read
  useEffect(() => {
    if (messages && user) {
      const unreadAdminMessages = messages.filter(
        (m) => m.sender_role === "admin" && !m.is_read
      );
      if (unreadAdminMessages.length > 0) {
        supabase
          .from("quotation_messages")
          .update({ is_read: true })
          .in("id", unreadAdminMessages.map((m) => m.id))
          .then(() => queryClient.invalidateQueries({ queryKey: ["unread-messages"] }));
      }
    }
  }, [messages, user, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from("quotation_messages").insert({
        design_request_id: id,
        sender_role: "user",
        sender_id: user!.id,
        message_text: text,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      refetchMessages();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  // Counter offer mutation
  const counterOfferMutation = useMutation({
    mutationFn: async ({ amount, msg }: { amount: number; msg: string }) => {
      // Create negotiation entry
      const { error: negError } = await supabase.from("quotation_negotiations").insert({
        design_request_id: id,
        sender_role: "user",
        sender_id: user!.id,
        proposed_amount: amount,
        message: msg,
      });
      if (negError) throw negError;

      // Update request status
      const { error: updateError } = await supabase
        .from("design_requests")
        .update({ status: "negotiation_requested" })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Counter offer sent successfully");
      setShowNegotiateDialog(false);
      setCounterOffer("");
      setCounterMessage("");
      queryClient.invalidateQueries({ queryKey: ["design-request", id] });
      queryClient.invalidateQueries({ queryKey: ["design-negotiations", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send counter offer");
    },
  });

  // Accept quotation mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async () => {
      if (!request?.quoted_amount) {
        throw new Error("No quotation amount available");
      }
      
      const { error } = await supabase
        .from("design_requests")
        .update({ 
          status: "payment_pending",
          final_amount: request.quoted_amount,
          price_locked: true,
        })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quotation accepted! Please proceed with payment.");
      queryClient.invalidateQueries({ queryKey: ["design-request", id] });
      queryClient.invalidateQueries({ queryKey: ["design-negotiations", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to accept quotation");
    },
  });

  // Load Razorpay script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle payment
  const handlePayment = async () => {
    if (!request?.final_amount || !request.price_locked) {
      toast.error("Price not confirmed yet");
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Load Razorpay SDK first
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      const { data, error } = await supabase.functions.invoke("create-design-payment", {
        body: { designRequestId: id },
      });

      if (error) throw error;

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Decouverts Plus",
        description: `Custom Print - ${request.file_name}`,
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            const { error: verifyError } = await supabase.functions.invoke("verify-design-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                design_request_id: id,
              },
            });

            if (verifyError) throw verifyError;
            
            toast.success("Payment successful!");
            queryClient.invalidateQueries({ queryKey: ["design-request", id] });
          } catch (err: any) {
            toast.error(err.message || "Payment verification failed");
          }
        },
        prefill: {
          email: user?.email,
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Get file URL
  const getFileUrl = async () => {
    if (!request?.file_url) return null;
    const { data } = await supabase.storage
      .from("design-uploads")
      .createSignedUrl(request.file_url, 3600);
    return data?.signedUrl;
  };

  const handleDownload = async () => {
    const url = await getFileUrl();
    if (url) {
      window.open(url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <UserLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </UserLayout>
    );
  }

  if (!request) {
    return (
      <UserLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <p>Request not found</p>
            <Button onClick={() => navigate("/dashboard/design-requests")} className="mt-4">
              Back to Requests
            </Button>
          </CardContent>
        </Card>
      </UserLayout>
    );
  }

  const status = statusConfig[request.status] || { label: request.status, variant: "secondary" as const };
  const canNegotiate = ["quotation_sent", "revised_quotation_sent"].includes(request.status) && !request.price_locked;
  const canAccept = ["quotation_sent", "revised_quotation_sent"].includes(request.status) && !request.price_locked;
  const canPay = request.status === "payment_pending" && request.price_locked && request.final_amount;

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/design-requests")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Design Request</h1>
            <p className="text-muted-foreground">
              Submitted {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <Badge variant={status.variant} className="text-sm">
            {status.label}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Request Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{request.file_name}</p>
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleDownload}>
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-medium">{request.quantity}</span>
                  </div>
                  {request.size && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-medium">{request.size}</span>
                    </div>
                  )}
                </div>
                
                {request.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{request.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quotation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Quotation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.quoted_amount ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Quoted Amount</span>
                      <span className="text-lg font-bold">
                        ₹{Number(request.quoted_amount).toLocaleString()}
                      </span>
                    </div>
                    {request.final_amount && (
                      <div className="flex justify-between items-center bg-primary/10 p-3 rounded-lg">
                        <span className="font-medium">Final Amount</span>
                        <span className="text-xl font-bold text-primary">
                          ₹{Number(request.final_amount).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {canAccept && (
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          onClick={() => acceptQuotationMutation.mutate()}
                          disabled={acceptQuotationMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setShowNegotiateDialog(true)}
                        >
                          Negotiate
                        </Button>
                      </div>
                    )}
                    
                    {canPay && (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handlePayment}
                        disabled={isProcessingPayment}
                      >
                        {isProcessingPayment ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <IndianRupee className="w-4 h-4 mr-2" />
                        )}
                        Pay ₹{Number(request.final_amount).toLocaleString()}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p>Awaiting quotation from admin</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Negotiation History */}
            {negotiations && negotiations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Negotiation History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {negotiations.map((neg) => (
                      <div
                        key={neg.id}
                        className={`p-3 rounded-lg text-sm ${
                          neg.sender_role === "admin" ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium capitalize">{neg.sender_role}</span>
                          <span className="font-bold">₹{Number(neg.proposed_amount).toLocaleString()}</span>
                        </div>
                        {neg.message && (
                          <p className="text-muted-foreground">{neg.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(neg.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Messages */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </CardTitle>
                <CardDescription>Chat with admin about your request</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                {messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.sender_role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.message_text}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                            {format(new Date(msg.created_at), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (message.trim()) {
                      sendMessageMutation.mutate(message.trim());
                    }
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button type="submit" disabled={!message.trim() || sendMessageMutation.isPending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Negotiate Dialog */}
      <Dialog open={showNegotiateDialog} onOpenChange={setShowNegotiateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Counter Offer</DialogTitle>
            <DialogDescription>
              Current quote: ₹{Number(request.quoted_amount).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Offer (₹)</label>
              <Input
                type="number"
                placeholder="Enter your offer amount"
                value={counterOffer}
                onChange={(e) => setCounterOffer(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message (Optional)</label>
              <Textarea
                placeholder="Explain your counter offer..."
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNegotiateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!counterOffer || parseFloat(counterOffer) <= 0) {
                  toast.error("Please enter a valid amount");
                  return;
                }
                counterOfferMutation.mutate({
                  amount: parseFloat(counterOffer),
                  msg: counterMessage,
                });
              }}
              disabled={counterOfferMutation.isPending}
            >
              {counterOfferMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Send Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
}
