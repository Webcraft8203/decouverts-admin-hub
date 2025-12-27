import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserLayout } from "@/components/UserLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileImage, MessageSquare, Eye } from "lucide-react";
import { format } from "date-fns";

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

export default function DesignRequests() {
  const { user } = useAuth();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["design-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: unreadCounts } = useQuery({
    queryKey: ["unread-messages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_messages")
        .select("design_request_id")
        .eq("is_read", false)
        .eq("sender_role", "admin");

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((msg) => {
        counts[msg.design_request_id] = (counts[msg.design_request_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Design Requests</h1>
            <p className="text-muted-foreground">Track your custom print requests and quotations</p>
          </div>
          <Button asChild>
            <Link to="/dashboard/design-requests/new">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => {
              const status = statusConfig[request.status] || { label: request.status, variant: "secondary" as const };
              const unreadCount = unreadCounts?.[request.id] || 0;

              return (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileImage className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-foreground truncate">
                              {request.file_name || "Design File"}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {request.description?.substring(0, 100) || "No description"}
                              {request.description && request.description.length > 100 && "..."}
                            </p>
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                          <span>Qty: {request.quantity}</span>
                          {request.size && <span>Size: {request.size}</span>}
                          <span>{format(new Date(request.created_at), "MMM d, yyyy")}</span>
                          {request.final_amount && (
                            <span className="font-medium text-foreground">
                              Final: ₹{Number(request.final_amount).toLocaleString()}
                            </span>
                          )}
                          {!request.final_amount && request.quoted_amount && (
                            <span className="font-medium text-foreground">
                              Quote: ₹{Number(request.quoted_amount).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/dashboard/design-requests/${request.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/dashboard/design-requests/${request.id}`}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Messages
                              {unreadCount > 0 && (
                                <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">
                                  {unreadCount}
                                </Badge>
                              )}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileImage className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">No design requests yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Submit your first custom print request to get started
              </p>
              <Button asChild>
                <Link to="/dashboard/design-requests/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Request
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
}
