import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, PackageX, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  availability_status: string;
}

interface LowStockMaterialsProps {
  materials: Material[];
  isLoading: boolean;
}

export function LowStockMaterials({ materials, isLoading }: LowStockMaterialsProps) {
  // Filter materials that are low stock or out of stock
  const alertMaterials = materials.filter(
    (m) =>
      m.quantity <= 0 ||
      m.quantity <= m.min_quantity ||
      m.availability_status === "low_stock" ||
      m.availability_status === "out_of_stock"
  );

  const outOfStockCount = alertMaterials.filter(
    (m) => m.quantity <= 0 || m.availability_status === "out_of_stock"
  ).length;
  const lowStockCount = alertMaterials.length - outOfStockCount;

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-warning" />
            Raw Material Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alertMaterials.length === 0) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-success" />
            Raw Material Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-success text-sm font-medium">All materials stocked adequately</p>
          <p className="text-xs text-muted-foreground mt-1">
            No materials below minimum threshold
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-warning/20 bg-warning/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Raw Material Alerts
          </CardTitle>
          <div className="flex gap-2">
            {outOfStockCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {outOfStockCount} Out
              </Badge>
            )}
            {lowStockCount > 0 && (
              <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
                {lowStockCount} Low
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="max-h-[200px] overflow-auto space-y-2">
          {alertMaterials.slice(0, 5).map((material) => {
            const isOutOfStock =
              material.quantity <= 0 || material.availability_status === "out_of_stock";
            return (
              <div
                key={material.id}
                className={`flex items-center justify-between p-2 rounded-md ${
                  isOutOfStock
                    ? "bg-destructive/10 border border-destructive/20"
                    : "bg-warning/10 border border-warning/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isOutOfStock ? (
                    <PackageX className="h-4 w-4 text-destructive" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-warning" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{material.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {material.quantity} / {material.min_quantity} {material.unit}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={isOutOfStock ? "destructive" : "outline"}
                  className={
                    isOutOfStock
                      ? ""
                      : "bg-warning/10 text-warning border-warning/30"
                  }
                >
                  {isOutOfStock ? "Out of Stock" : "Low Stock"}
                </Badge>
              </div>
            );
          })}
        </div>
        {alertMaterials.length > 5 && (
          <p className="text-xs text-muted-foreground text-center">
            +{alertMaterials.length - 5} more items need attention
          </p>
        )}
        <Link to="/admin/raw-materials">
          <Button variant="outline" size="sm" className="w-full mt-2">
            View All Materials
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
