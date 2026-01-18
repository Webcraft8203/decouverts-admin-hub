import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  const [isExpanded, setIsExpanded] = useState(false);
  
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
      <div className="mt-16 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 border-b border-slate-100">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!parameters || parameters.length === 0) {
    return null;
  }

  // Show first 10 items by default
  const INITIAL_COUNT = 10;
  const hasMore = parameters.length > INITIAL_COUNT;
  const visibleParams = isExpanded ? parameters : parameters.slice(0, INITIAL_COUNT);

  return (
    <section className="mt-20 scroll-mt-24" id="specifications">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200">
          <FileText className="w-5 h-5 text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Technical Specifications</h2>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {visibleParams.map((param, index) => (
              <motion.div
                key={param.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex flex-col sm:flex-row sm:justify-between sm:items-center p-5 gap-2 hover:bg-slate-50/80 transition-colors border-b border-slate-100",
                  // Add right border to odd items (left column) on desktop
                  index % 2 === 0 ? "md:border-r border-slate-100" : ""
                )}
              >
                <span className="text-sm font-medium text-slate-500">{param.parameter_name}</span>
                <span className="text-sm font-semibold text-slate-900 text-left sm:text-right">{param.parameter_value}</span>
              </motion.div>
            ))}
          </div>
          
          {hasMore && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-center">
              <Button
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
              >
                {isExpanded ? (
                  <>Show Less <ChevronUp className="ml-2 w-4 h-4" /></>
                ) : (
                  <>View All Specifications <ChevronDown className="ml-2 w-4 h-4" /></>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
