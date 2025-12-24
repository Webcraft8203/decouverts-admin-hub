import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, UserCheck, RefreshCw } from "lucide-react";

interface CustomerStats {
  totalCustomers: number;
  newCustomersThisWeek: number;
  returningCustomers: number;
  customersWithOrders: number;
}

interface CustomerInsightsProps {
  stats: CustomerStats;
  isLoading: boolean;
}

export function CustomerInsights({ stats, isLoading }: CustomerInsightsProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        Customer Insights
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {isLoading ? "..." : stats.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New This Week
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <UserPlus className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? "..." : stats.newCustomersThisWeek}
            </div>
            <p className="text-xs text-muted-foreground mt-1">New signups</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Customers
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <UserCheck className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {isLoading ? "..." : stats.customersWithOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">With orders</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Returning Customers
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <RefreshCw className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {isLoading ? "..." : stats.returningCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Multiple orders</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
