import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";

interface ProductParameter {
  id: string;
  parameter_name: string;
  parameter_value: string;
  display_order: number;
}

interface ProductSpecificationsProps {
  productId: string;
}

export function ProductSpecifications({ productId }: ProductSpecificationsProps) {
  const { data: parameters, isLoading } = useQuery({
    queryKey: ["product-parameters", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_parameters")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as ProductParameter[];
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!parameters || parameters.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8 border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ClipboardList className="w-5 h-5 text-primary" />
          Specifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parameters.map((param, index) => (
            <div
              key={param.id}
              className={`flex items-start justify-between py-3 px-4 rounded-lg ${
                index % 2 === 0 ? 'bg-muted/50' : 'bg-muted/30'
              }`}
            >
              <span className="text-muted-foreground font-medium text-sm">
                {param.parameter_name}
              </span>
              <span className="text-foreground font-semibold text-sm text-right max-w-[60%]">
                {param.parameter_value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
