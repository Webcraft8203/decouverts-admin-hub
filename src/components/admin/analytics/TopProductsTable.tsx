import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingDown } from "lucide-react";

interface ProductSales {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
  image?: string;
}

interface TopProductsTableProps {
  topProducts: ProductSales[];
  lowProducts: ProductSales[];
  isLoading: boolean;
}

export function TopProductsTable({ topProducts, lowProducts, isLoading }: TopProductsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading data...</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Selling Products */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Top Selling Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sales data yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="w-6 h-6 flex items-center justify-center p-0 text-xs"
                        >
                          {index + 1}
                        </Badge>
                        <span className="truncate max-w-[150px]">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{product.totalSold}</TableCell>
                    <TableCell className="text-right text-primary font-medium">
                      {formatCurrency(product.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Low Performing Products */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Low Performing Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <span className="truncate max-w-[180px] block">{product.name}</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {product.totalSold}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
