import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FileImage,
  Download,
  Send,
  MessageSquare,
  ArrowLeft,
  Loader2,
  IndianRupee,
  User,
  Lock,
  CheckCircle,
  XCircle,
  ThumbsUp,
  RotateCcw,
  MessageCircle,
  Pencil,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useActivityLog } from "@/hooks/useActivityLog";

const statusOptions = [
  { value: "pending_review", label: "Pending Review" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "negotiation_requested", label: "Negotiation Requested" },
  { value: "revised_quotation_sent", label: "Revised Quotation Sent" },
  { value: "payment_pending", label: "Payment Pending" },
  { value: "paid", label: "Paid" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_review: { label: "Pending Review", variant: "secondary" },
  quotation_sent: { label: "Quotation Sent", variant: "default" },
  negotiation_requested: { label: "Negotiation", variant: "outline" },
  revised_quotation_sent: { label: "Revised Quote", variant: "default" },
  final_quotation_confirmed: { label: "Final Confirmed", variant: "default" },
  payment_pending: { label: "Payment Pending", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export default function AdminDesignRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [message, setMessage] = useState("");
  const [quotationAmount, setQuotationAmount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [showQuotationDialog, setShowQuotationDialog] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAcceptUserPriceDialog, setShowAcceptUserPriceDialog] = useState(false);
  const [showStickToPreviousDialog, setShowStickToPreviousDialog] = useState(false);
  const [showRejectNegotiationDialog, setShowRejectNegotiationDialog] = useState(false);
  const [showEditPriceDialog, setShowEditPriceDialog] = useState(false);
  const [editPriceAmount, setEditPriceAmount] = useState("");

  // Fetch request details
  const { data: request, isLoading } = useQuery({
    queryKey: ["admin-design-request", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch customer profile
  const { data: customer } = useQuery({
    queryKey: ["customer-profile", request?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", request!.user_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!request?.user_id,
  });

  // Fetch messages
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ["admin-design-messages", id],
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
    queryKey: ["admin-design-negotiations", id],
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

  // Fetch payments
  const { data: payments } = useQuery({
    queryKey: ["design-payments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_payments")
        .select("*")
        .eq("design_request_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Mark user messages as read
  useEffect(() => {
    if (messages) {
      const unreadUserMessages = messages.filter(
        (m) => m.sender_role === "user" && !m.is_read
      );
      if (unreadUserMessages.length > 0) {
        supabase
          .from("quotation_messages")
          .update({ is_read: true })
          .in("id", unreadUserMessages.map((m) => m.id))
          .then(() => queryClient.invalidateQueries({ queryKey: ["admin-unread-messages"] }));
      }
    }
  }, [messages, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize admin notes
  useEffect(() => {
    if (request?.admin_notes) {
      setAdminNotes(request.admin_notes);
    }
  }, [request]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from("quotation_messages").insert({
        design_request_id: id,
        sender_role: "admin",
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

  // Send quotation mutation
  const sendQuotationMutation = useMutation({
    mutationFn: async (amount: number) => {
      const isRevised = request?.status === "negotiation_requested";
      
      // Create negotiation entry
      const { error: negError } = await supabase.from("quotation_negotiations").insert({
        design_request_id: id,
        sender_role: "admin",
        sender_id: user!.id,
        proposed_amount: amount,
        message: isRevised ? "Revised quotation" : "Initial quotation",
      });
      if (negError) throw negError;

      // Update request
      const { error: updateError } = await supabase
        .from("design_requests")
        .update({
          quoted_amount: amount,
          status: isRevised ? "revised_quotation_sent" : "quotation_sent",
        })
        .eq("id", id);
      if (updateError) throw updateError;

      await logActivity({
        actionType: isRevised ? "revised_quotation" : "quotation_sent",
        entityType: "design_request",
        entityId: id!,
        description: `${isRevised ? "Revised" : "Sent"} quotation: ₹${amount.toLocaleString()}`
      });
    },
    onSuccess: () => {
      toast.success("Quotation sent successfully");
      setShowQuotationDialog(false);
      setQuotationAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin-design-request", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-design-negotiations", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send quotation");
    },
  });

  // Lock price mutation
  const lockPriceMutation = useMutation({
    mutationFn: async (amountToLock?: number) => {
      const finalAmount = amountToLock || request?.quoted_amount;
      if (!finalAmount) throw new Error("No quotation amount to lock");

      const { error } = await supabase
        .from("design_requests")
        .update({
          final_amount: finalAmount,
          quoted_amount: finalAmount,
          price_locked: true,
          status: "payment_pending",
        })
        .eq("id", id);
      if (error) throw error;

      await logActivity({
        actionType: "price_locked",
        entityType: "design_request",
        entityId: id!,
        description: `Locked final price: ₹${Number(finalAmount).toLocaleString()}`
      });
    },
    onSuccess: () => {
      toast.success("Price locked! User can now proceed with payment.");
      setShowLockDialog(false);
      setShowAcceptUserPriceDialog(false);
      setShowStickToPreviousDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin-design-request", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-design-negotiations", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to lock price");
    },
  });

  // Accept user's proposed price
  const acceptUserPriceMutation = useMutation({
    mutationFn: async (userAmount: number) => {
      // Add negotiation entry
      const { error: negError } = await supabase.from("quotation_negotiations").insert({
        design_request_id: id,
        sender_role: "admin",
        sender_id: user!.id,
        proposed_amount: userAmount,
        message: "Accepted user's proposed price",
      });
      if (negError) throw negError;

      // Lock the price
      const { error } = await supabase
        .from("design_requests")
        .update({
          quoted_amount: userAmount,
          final_amount: userAmount,
          price_locked: true,
          status: "payment_pending",
        })
        .eq("id", id);
      if (error) throw error;

      await logActivity({
        actionType: "price_locked",
        entityType: "design_request",
        entityId: id!,
        description: `Accepted user's price and locked: ₹${userAmount.toLocaleString()}`
      });
    },
    onSuccess: () => {
      toast.success("Accepted user's price and locked!");
      setShowAcceptUserPriceDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin-design-request", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-design-negotiations", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to accept price");
    },
  });

  // Stick to previous price and lock
  const stickToPreviousPriceMutation = useMutation({
    mutationFn: async (previousAmount: number) => {
      // Add negotiation entry
      const { error: negError } = await supabase.from("quotation_negotiations").insert({
        design_request_id: id,
        sender_role: "admin",
        sender_id: user!.id,
        proposed_amount: previousAmount,
        message: "Final price - sticking to previous quotation",
      });
      if (negError) throw negError;

      // Lock the price - ensure quoted_amount is also updated for consistency
      const { error } = await supabase
        .from("design_requests")
        .update({
          quoted_amount: previousAmount,
          final_amount: previousAmount,
          price_locked: true,
          status: "payment_pending",
        })
        .eq("id", id);
      if (error) throw error;

      await logActivity({
        actionType: "price_locked",
        entityType: "design_request",
        entityId: id!,
        description: `Locked at previous price: ₹${previousAmount.toLocaleString()}`
      });
    },
    onSuccess: () => {
      toast.success("Price locked at previous quotation!");
      setShowStickToPreviousDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin-design-request", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-design-negotiations", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to lock price");
    },
  });

  // Reject negotiation (different from rejecting the whole request)
  const rejectNegotiationMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("design_requests")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;

      await logActivity({
        actionType: "rejected",
        entityType: "design_request",
        entityId: id!,
        description: "Negotiation rejected - deal cancelled"
      });
    },
    onSuccess: () => {
      toast.success("Negotiation rejected");
      setShowRejectNegotiationDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin-design-request", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject negotiation");
    },
  });

  // Edit price mutation - allows admin to change price anytime before lock
  const editPriceMutation = useMutation({
    mutationFn: async (newAmount: number) => {
      const { error: negError } = await supabase.from("quotation_negotiations").insert({
        design_request_id: id,
        sender_role: "admin",
        sender_id: user!.id,
        proposed_amount: newAmount,
        message: "Updated quotation",
      });
      if (negError) throw negError;

      const { error } = await supabase
        .from("design_requests")
        .update({ quoted_amount: newAmount })
        .eq("id", id);
      if (error) throw error;

      await logActivity({
        actionType: "price_updated",
        entityType: "design_request",
        entityId: id!,
        description: `Updated quotation to: ₹${newAmount.toLocaleString()}`
      });
    },
    onSuccess: () => {
      toast.success("Price updated successfully");
      setShowEditPriceDialog(false);
      setEditPriceAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin-design-request", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-design-negotiations", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update price");
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("design_requests")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;

      await logActivity({
        actionType: "status_change",
        entityType: "design_request",
        entityId: id!,
        description: `Status changed to: ${statusOptions.find((s) => s.value === newStatus)?.label}`
      });
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-design-request", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("design_requests")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;

      await logActivity({
        actionType: "rejected",
        entityType: "design_request",
        entityId: id!,
        description: "Design request rejected"
      });
    },
    onSuccess: () => {
      toast.success("Request rejected");
      setShowRejectDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin-design-request", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject request");
    },
  });

  // Save admin notes
  const saveNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const { error } = await supabase
        .from("design_requests")
        .update({ admin_notes: notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notes saved");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save notes");
    },
  });

  // Download file
  const handleDownload = async () => {
    if (!request?.file_url) return;
    const { data } = await supabase.storage
      .from("design-uploads")
      .createSignedUrl(request.file_url, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!request) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <p>Request not found</p>
            <Button onClick={() => navigate("/admin/design-requests")} className="mt-4">
              Back to Requests
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  const status = statusConfig[request.status] || { label: request.status, variant: "secondary" as const };
  const canSendQuotation = ["pending_review"].includes(request.status) && !request.price_locked;
  const isNegotiationRequested = request.status === "negotiation_requested" && !request.price_locked;
  const canLockPrice = request.quoted_amount && !request.price_locked && ["quotation_sent", "revised_quotation_sent"].includes(request.status);
  const isPaid = request.status === "paid" || payments?.some((p) => p.payment_status === "success");
  const canUpdateProgress = isPaid && ["paid", "in_progress"].includes(request.status);
  // Admin can edit price anytime before it's locked
  const canEditPrice = request.quoted_amount && !request.price_locked && !isNegotiationRequested;
  
  // Get the latest user negotiation (counter-offer)
  const latestUserNegotiation = negotiations?.filter(n => n.sender_role === "user").pop();
  // Get the latest admin quotation
  const latestAdminQuotation = negotiations?.filter(n => n.sender_role === "admin").pop();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/design-requests")}>
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
          {/* Left Column */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{customer?.full_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{customer?.email}</span>
                </div>
                {customer?.phone_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{customer.phone_number}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Request Details */}
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
                      Download Design
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

            {/* Quotation & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Quotation & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.quoted_amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Your Quote</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        ₹{Number(request.quoted_amount).toLocaleString()}
                      </span>
                      {canEditPrice && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditPriceAmount(String(request.quoted_amount));
                            setShowEditPriceDialog(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {request.final_amount && (
                  <div className="flex justify-between items-center bg-primary/10 p-3 rounded-lg">
                    <span className="font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Final Amount
                    </span>
                    <span className="text-xl font-bold text-primary">
                      ₹{Number(request.final_amount).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Negotiation Response Section */}
                {isNegotiationRequested && latestUserNegotiation && (
                  <div className="border border-orange-500/30 bg-orange-500/10 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-medium">User Counter-Offer</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">User's Price</span>
                      <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        ₹{Number(latestUserNegotiation.proposed_amount).toLocaleString()}
                      </span>
                    </div>
                    {latestUserNegotiation.message && (
                      <p className="text-sm text-muted-foreground italic">
                        "{latestUserNegotiation.message}"
                      </p>
                    )}
                    
                    <Separator />
                    
                    <div className="grid gap-2">
                      <Button 
                        className="w-full" 
                        variant="default"
                        onClick={() => setShowAcceptUserPriceDialog(true)}
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Accept ₹{Number(latestUserNegotiation.proposed_amount).toLocaleString()}
                      </Button>
                      
                      <Button 
                        className="w-full" 
                        variant="secondary"
                        onClick={() => setShowStickToPreviousDialog(true)}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Stick to ₹{Number(request.quoted_amount).toLocaleString()}
                      </Button>
                      
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => setShowQuotationDialog(true)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Counter with Different Price
                      </Button>
                      
                      <Button 
                        className="w-full" 
                        variant="destructive"
                        onClick={() => setShowRejectNegotiationDialog(true)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Deal
                      </Button>
                    </div>
                  </div>
                )}

                {canSendQuotation && (
                  <Button className="w-full" onClick={() => setShowQuotationDialog(true)}>
                    Send Quotation
                  </Button>
                )}

                {canLockPrice && (
                  <Button className="w-full" variant="default" onClick={() => setShowLockDialog(true)}>
                    <Lock className="w-4 h-4 mr-2" />
                    Lock Final Price
                  </Button>
                )}

                {canUpdateProgress && (
                  <Select
                    value={request.status}
                    onValueChange={(v) => updateStatusMutation.mutate(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {request.status === "pending_review" && (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Request
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Internal Notes</CardTitle>
                <CardDescription>Only visible to admins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Add internal notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
                <Button
                  size="sm"
                  onClick={() => saveNotesMutation.mutate(adminNotes)}
                  disabled={saveNotesMutation.isPending}
                >
                  {saveNotesMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Save Notes
                </Button>
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

            {/* Payment History */}
            {payments && payments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="p-3 rounded-lg bg-muted text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">₹{Number(payment.amount).toLocaleString()}</span>
                          <Badge variant={payment.payment_status === "success" ? "default" : "secondary"}>
                            {payment.payment_status}
                          </Badge>
                        </div>
                        {payment.razorpay_payment_id && (
                          <p className="text-xs text-muted-foreground">
                            ID: {payment.razorpay_payment_id}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.created_at), "MMM d, h:mm a")}
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
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </CardTitle>
                <CardDescription>Chat with customer about this request</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                {messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_role === "admin" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.sender_role === "admin"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.message_text}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_role === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"
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

      {/* Quotation Dialog */}
      <Dialog open={showQuotationDialog} onOpenChange={setShowQuotationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {request.status === "negotiation_requested" ? "Send Revised Quotation" : "Send Quotation"}
            </DialogTitle>
            <DialogDescription>
              Enter the amount for this custom print request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter quotation amount"
                value={quotationAmount}
                onChange={(e) => setQuotationAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuotationDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!quotationAmount || parseFloat(quotationAmount) <= 0) {
                  toast.error("Please enter a valid amount");
                  return;
                }
                sendQuotationMutation.mutate(parseFloat(quotationAmount));
              }}
              disabled={sendQuotationMutation.isPending}
            >
              {sendQuotationMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Send Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Price Dialog */}
      <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock Final Price?</AlertDialogTitle>
            <AlertDialogDescription>
              This will lock the price at ₹{Number(request.quoted_amount).toLocaleString()} and allow the customer to proceed with payment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => lockPriceMutation.mutate(Number(request.quoted_amount))}>
              {lockPriceMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Lock Price
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept User Price Dialog */}
      <AlertDialog open={showAcceptUserPriceDialog} onOpenChange={setShowAcceptUserPriceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept User's Price?</AlertDialogTitle>
            <AlertDialogDescription>
              This will accept the user's counter-offer of ₹{latestUserNegotiation ? Number(latestUserNegotiation.proposed_amount).toLocaleString() : 0} and lock the price. The customer can then proceed with payment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => latestUserNegotiation && acceptUserPriceMutation.mutate(Number(latestUserNegotiation.proposed_amount))}
            >
              {acceptUserPriceMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ThumbsUp className="w-4 h-4 mr-2" />
              )}
              Accept & Lock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stick to Previous Price Dialog */}
      <AlertDialog open={showStickToPreviousDialog} onOpenChange={setShowStickToPreviousDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stick to Previous Price?</AlertDialogTitle>
            <AlertDialogDescription>
              This will decline the user's counter-offer and lock the price at your original quote of ₹{Number(request.quoted_amount).toLocaleString()}. The customer can then proceed with payment at this price.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => stickToPreviousPriceMutation.mutate(Number(request.quoted_amount))}
            >
              {stickToPreviousPriceMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Lock at ₹{Number(request.quoted_amount).toLocaleString()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Negotiation Dialog */}
      <AlertDialog open={showRejectNegotiationDialog} onOpenChange={setShowRejectNegotiationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Deal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reject the negotiation and cancel the design request. The customer will be notified that the deal has been cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectNegotiationMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectNegotiationMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject Deal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this design request? The customer will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Price Dialog */}
      <Dialog open={showEditPriceDialog} onOpenChange={setShowEditPriceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
            <DialogDescription>
              Update the quotation amount. The customer will see the new price.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter new amount"
                value={editPriceAmount}
                onChange={(e) => setEditPriceAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPriceDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editPriceAmount || parseFloat(editPriceAmount) <= 0) {
                  toast.error("Please enter a valid amount");
                  return;
                }
                editPriceMutation.mutate(parseFloat(editPriceAmount));
              }}
              disabled={editPriceMutation.isPending}
            >
              {editPriceMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Pencil className="w-4 h-4 mr-2" />
              )}
              Update Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
