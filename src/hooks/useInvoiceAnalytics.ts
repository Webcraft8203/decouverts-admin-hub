import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subMonths, startOfWeek, subWeeks } from "date-fns";

export interface TrendPoint {
  label: string;
  invoiced: number;
  received: number;
}

export interface InvoiceKpis {
  proformaCount: number;
  proformaValue: number;
  proformaPending: number;
  proformaPendingCount: number;
  finalCount: number;
  finalValue: number;
  finalPending: number;
  finalPendingCount: number;
  totalReceived: number;
  receivedCount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  monthlyTrend: TrendPoint[];
  weeklyTrend: TrendPoint[];
}

const emptyKpis: InvoiceKpis = {
  proformaCount: 0,
  proformaValue: 0,
  proformaPending: 0,
  proformaPendingCount: 0,
  finalCount: 0,
  finalValue: 0,
  finalPending: 0,
  finalPendingCount: 0,
  totalReceived: 0,
  receivedCount: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  totalGst: 0,
  monthlyTrend: [],
  weeklyTrend: [],
};

export function useInvoiceAnalytics() {
  const query = useQuery({
    queryKey: ["invoice-analytics"],
    queryFn: async (): Promise<InvoiceKpis> => {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          "id, invoice_type, is_final, total_amount, amount_paid, payment_status, payment_date, created_at, cgst_amount, sgst_amount, igst_amount"
        );
      if (error) throw error;

      const list = data || [];
      const isFinal = (i: any) => i.invoice_type === "final" || i.is_final === true;
      const isPaid = (i: any) => i.payment_status === "paid";
      const amt = (i: any) => Number(i.total_amount || 0);
      // Amount actually received (supports partial payments)
      const paidAmt = (i: any) =>
        i.payment_status === "paid" ? amt(i) : Math.min(Number((i as any).amount_paid || 0), amt(i));

      const proformas = list.filter((i) => !isFinal(i));
      const finals = list.filter(isFinal);
      const paid = list.filter((i) => paidAmt(i) > 0);

      const proformaPendingList = proformas.filter((i) => paidAmt(i) < amt(i));
      const finalPendingList = finals.filter((i) => paidAmt(i) < amt(i));

      // Trends
      const monthBuckets: Record<string, TrendPoint> = {};
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(startOfMonth(new Date()), i);
        monthBuckets[format(d, "MMM yy")] = { label: format(d, "MMM yy"), invoiced: 0, received: 0 };
      }
      const weekBuckets: Record<string, TrendPoint> = {};
      for (let i = 11; i >= 0; i--) {
        const d = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
        weekBuckets[format(d, "dd MMM")] = { label: format(d, "dd MMM"), invoiced: 0, received: 0 };
      }

      finals.forEach((inv) => {
        const created = new Date(inv.created_at);
        const mKey = format(startOfMonth(created), "MMM yy");
        const wKey = format(startOfWeek(created, { weekStartsOn: 1 }), "dd MMM");
        if (monthBuckets[mKey]) monthBuckets[mKey].invoiced += amt(inv);
        if (weekBuckets[wKey]) weekBuckets[wKey].invoiced += amt(inv);
      });

      paid.forEach((inv) => {
        const when = new Date(inv.payment_date || inv.created_at);
        const mKey = format(startOfMonth(when), "MMM yy");
        const wKey = format(startOfWeek(when, { weekStartsOn: 1 }), "dd MMM");
        if (monthBuckets[mKey]) monthBuckets[mKey].received += paidAmt(inv);
        if (weekBuckets[wKey]) weekBuckets[wKey].received += paidAmt(inv);
      });

      const cgst = finals.reduce((s, i) => s + Number(i.cgst_amount || 0), 0);
      const sgst = finals.reduce((s, i) => s + Number(i.sgst_amount || 0), 0);
      const igst = finals.reduce((s, i) => s + Number(i.igst_amount || 0), 0);

      return {
        proformaCount: proformas.length,
        proformaValue: proformas.reduce((s, i) => s + amt(i), 0),
        proformaPending: proformaPendingList.reduce((s, i) => s + (amt(i) - paidAmt(i)), 0),
        proformaPendingCount: proformaPendingList.length,
        finalCount: finals.length,
        finalValue: finals.reduce((s, i) => s + amt(i), 0),
        finalPending: finalPendingList.reduce((s, i) => s + (amt(i) - paidAmt(i)), 0),
        finalPendingCount: finalPendingList.length,
        totalReceived: list.reduce((s, i) => s + paidAmt(i), 0),
        receivedCount: paid.length,
        cgst,
        sgst,
        igst,
        totalGst: cgst + sgst + igst,
        monthlyTrend: Object.values(monthBuckets),
        weeklyTrend: Object.values(weekBuckets),
      };
    },
  });

  return {
    kpis: query.data ?? emptyKpis,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
