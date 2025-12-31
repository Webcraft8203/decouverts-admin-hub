import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  IndianRupee,
  Shield,
  ShieldOff,
  ArrowLeft,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CustomerWithStats {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  age: number | null;
  account_status: string;
  is_blocked: boolean;
  created_at: string;
  total_orders: number;
  total_spent: number;
}

export default function Customers() {
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (profilesError) throw profilesError;

      // Get orders to calculate stats
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("user_id, total_amount");
      
      if (ordersError) throw ordersError;

      // Calculate stats per customer
      const orderStats = orders?.reduce((acc, order) => {
        if (!acc[order.user_id]) {
          acc[order.user_id] = { count: 0, total: 0 };
        }
        acc[order.user_id].count++;
        acc[order.user_id].total += Number(order.total_amount);
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      return profiles.map((profile) => ({
        ...profile,
        total_orders: orderStats?.[profile.id]?.count || 0,
        total_spent: orderStats?.[profile.id]?.total || 0,
      })) as CustomerWithStats[];
    },
  });

  const { data: customerOrders } = useQuery({
    queryKey: ["customer-orders", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(product_name, quantity, total_price)")
        .eq("user_id", selectedCustomer.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCustomer,
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, isBlocked }: { id: string; isBlocked: boolean }) => {
      const newBlockedState = !isBlocked;
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_blocked: newBlockedState,
          account_status: newBlockedState ? "blocked" : "active"
        })
        .eq("id", id);
      if (error) throw error;
      return { id, newBlockedState };
    },
    onMutate: async ({ id, isBlocked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["admin-customers"] });
      
      // Snapshot current data
      const previousCustomers = queryClient.getQueryData<CustomerWithStats[]>(["admin-customers"]);
      
      // Optimistically update the cache
      const newBlockedState = !isBlocked;
      queryClient.setQueryData<CustomerWithStats[]>(["admin-customers"], (old) =>
        old?.map((customer) =>
          customer.id === id ? { 
            ...customer, 
            is_blocked: newBlockedState,
            account_status: newBlockedState ? "blocked" : "active"
          } : customer
        )
      );
      
      // Update selected customer if it's the one being modified
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(prev => prev ? { 
          ...prev, 
          is_blocked: newBlockedState,
          account_status: newBlockedState ? "blocked" : "active"
        } : null);
      }
      
      return { previousCustomers };
    },
    onSuccess: async ({ id, newBlockedState }) => {
      toast.success(`Customer ${newBlockedState ? "blocked" : "unblocked"} successfully`);
      
      await logActivity({
        actionType: newBlockedState ? "customer_block" : "customer_unblock",
        entityType: "user",
        entityId: id,
        description: `Customer account ${newBlockedState ? "blocked" : "unblocked"}`,
      });
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCustomers) {
        queryClient.setQueryData(["admin-customers"], context.previousCustomers);
      }
      // Rollback selected customer
      if (selectedCustomer?.id === variables.id) {
        setSelectedCustomer(prev => prev ? { 
          ...prev, 
          is_blocked: variables.isBlocked,
          account_status: variables.isBlocked ? "blocked" : "active"
        } : null);
      }
      toast.error("Failed to update customer status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    },
  });

  const filteredCustomers = customers?.filter((customer) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.email.toLowerCase().includes(query) ||
      customer.full_name?.toLowerCase().includes(query) ||
      customer.phone_number?.toLowerCase().includes(query)
    );
  });

  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedCustomer(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Profile */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile
                </span>
                <Badge variant={selectedCustomer.is_blocked ? "destructive" : "default"}>
                  {selectedCustomer.is_blocked ? "blocked" : "active"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center pb-4 border-b">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary">
                    {selectedCustomer.full_name?.[0]?.toUpperCase() || selectedCustomer.email[0].toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-lg">{selectedCustomer.full_name || "No Name"}</h3>
                <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
              </div>

              <div className="space-y-3">
                {selectedCustomer.phone_number && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCustomer.phone_number}</span>
                  </div>
                )}
                {selectedCustomer.age && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCustomer.age} years old</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Joined {format(new Date(selectedCustomer.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-xl font-bold">{selectedCustomer.total_orders}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <IndianRupee className="w-5 h-5 mx-auto mb-1 text-green-600" />
                  <p className="text-xl font-bold">₹{selectedCustomer.total_spent.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Spent</p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant={selectedCustomer.is_blocked ? "default" : "destructive"}
                    className="w-full"
                  >
                    {selectedCustomer.is_blocked ? (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Unblock Customer
                      </>
                    ) : (
                      <>
                        <ShieldOff className="w-4 h-4 mr-2" />
                        Block Customer
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {selectedCustomer.is_blocked ? "Unblock Customer?" : "Block Customer?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {selectedCustomer.is_blocked
                        ? "This will restore the customer's access to their account."
                        : "Blocked customers cannot log in or place orders. This action can be reversed."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => toggleBlockMutation.mutate({ 
                        id: selectedCustomer.id, 
                        isBlocked: selectedCustomer.is_blocked 
                      })}
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Order History */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerOrders && customerOrders.length > 0 ? (
                <div className="space-y-3">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{order.order_number}</span>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(order.created_at), "MMM d, yyyy")}
                        </span>
                        <span className="font-medium text-foreground">
                          ₹{Number(order.total_amount).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.order_items?.map((item: any) => item.product_name).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No orders yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Customer Management
          </h1>
          <p className="text-muted-foreground">View and manage registered customers</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-1">
          {customers?.length || 0} Customers
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filteredCustomers && filteredCustomers.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {customer.full_name?.[0]?.toUpperCase() || customer.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{customer.full_name || "No Name"}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {format(new Date(customer.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </p>
                        {customer.phone_number && (
                          <p className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {customer.phone_number}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{customer.total_orders}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{customer.total_spent.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={customer.is_blocked ? "destructive" : "default"}>
                        {customer.is_blocked ? "blocked" : "active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          View
                        </Button>
                        <Button
                          variant={customer.is_blocked ? "default" : "destructive"}
                          size="sm"
                          onClick={() => toggleBlockMutation.mutate({ 
                            id: customer.id, 
                            isBlocked: customer.is_blocked 
                          })}
                        >
                          {customer.is_blocked ? "Unblock" : "Block"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "No customers match your search" : "No customers registered yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
