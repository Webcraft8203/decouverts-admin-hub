import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileImage, Search, Eye, MessageSquare, Download } from "lucide-react";
import { useActivityLog } from "@/hooks/useActivityLog";

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

export default function AdminDesignRequests() {
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all design requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-design-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch user profiles for display
  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (error) throw error;
      const map: Record<string, { full_name: string | null; email: string }> = {};
      data?.forEach((p) => {
        map[p.id] = { full_name: p.full_name, email: p.email };
      });
      return map;
    },
  });

  // Fetch unread message counts
  const { data: unreadCounts } = useQuery({
    queryKey: ["admin-unread-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_messages")
        .select("design_request_id")
        .eq("is_read", false)
        .eq("sender_role", "user");

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((msg) => {
        counts[msg.design_request_id] = (counts[msg.design_request_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Download file
  const handleDownload = async (fileUrl: string) => {
    const { data } = await supabase.storage
      .from("design-uploads")
      .createSignedUrl(fileUrl, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  // Filter requests
  const filteredRequests = requests?.filter((r) => {
    const matchesSearch =
      !search ||
      r.file_name?.toLowerCase().includes(search.toLowerCase()) ||
      profiles?.[r.user_id]?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      profiles?.[r.user_id]?.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Design Requests</h1>
          <p className="text-muted-foreground">Manage custom print requests and quotations</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by file name or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filteredRequests && filteredRequests.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quote</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const status = statusConfig[request.status] || { label: request.status, variant: "secondary" as const };
                    const customer = profiles?.[request.user_id];
                    const unreadCount = unreadCounts?.[request.id] || 0;

                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                              <FileImage className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[200px]">
                                {request.file_name || "Design File"}
                              </p>
                              {request.size && (
                                <p className="text-xs text-muted-foreground">{request.size}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{customer?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{request.quantity}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {request.final_amount ? (
                            <span className="font-medium">₹{Number(request.final_amount).toLocaleString()}</span>
                          ) : request.quoted_amount ? (
                            <span>₹{Number(request.quoted_amount).toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(request.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(request.file_url)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/admin/design-requests/${request.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                                {unreadCount > 0 && (
                                  <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">
                                    {unreadCount}
                                  </Badge>
                                )}
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileImage className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No design requests found</h3>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Design requests will appear here when customers submit them"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
