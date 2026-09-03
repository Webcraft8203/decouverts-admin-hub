import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrendPoint } from "@/hooks/useInvoiceAnalytics";

interface Props {
  monthly: TrendPoint[];
  weekly: TrendPoint[];
  isLoading: boolean;
}

const chartConfig = {
  invoiced: { label: "Invoiced", color: "hsl(var(--chart-1))" },
  received: { label: "Received", color: "hsl(var(--chart-2))" },
};

export function InvoiceTrendChart({ monthly, weekly, isLoading }: Props) {
  const [mode, setMode] = useState<"month" | "week">("month");
  const data = mode === "month" ? monthly : weekly;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Sales Trend
        </CardTitle>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={mode === "month" ? "default" : "outline"}
            onClick={() => setMode("month")}
          >
            Monthly
          </Button>
          <Button
            size="sm"
            variant={mode === "week" ? "default" : "outline"}
            onClick={() => setMode("week")}
          >
            Weekly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="invoicedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${(Number(value) / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="invoiced"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="url(#invoicedGradient)"
              />
              <Area
                type="monotone"
                dataKey="received"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                fill="url(#receivedGradient)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
