import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  status: string;
}

interface LowStockProductsProps {
  products: LowStockProduct[];
  isLoading: boolean;
}

export function LowStockProducts({ products, isLoading }: LowStockProductsProps) {
  if (isLoading) {
    return (
      <Card className="border-border border-warning/30 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Low Stock Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="border-border border-success/30 bg-success/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-success" />
            Stock Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-success text-sm">All products are well stocked!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border border-warning/30 bg-warning/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Low Stock Alert ({products.length})
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/inventory">View Inventory</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[200px] overflow-y-auto scrollbar-thin">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-2 rounded-lg bg-background/50"
            >
              <span className="text-sm font-medium truncate max-w-[200px]">
                {product.name}
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={product.status === "out_of_stock" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {product.stock} left
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
