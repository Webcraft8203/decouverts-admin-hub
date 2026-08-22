import { supabase } from "@/integrations/supabase/client";

export type DocumentTermType = "invoice" | "quotation";

export interface DocumentTerm {
  id: string;
  document_type: string;
  content: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch active, admin-managed terms & conditions for a document type.
 * Returns numbered lines ready for PDF rendering, or `fallback` when
 * nothing is configured / the request fails.
 */
export async function fetchDocumentTerms(
  type: DocumentTermType,
  fallback: string[] = []
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("document_terms")
      .select("content, display_order")
      .eq("document_type", type)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return fallback;

    return data.map((t, i) => `${i + 1}. ${String(t.content).trim()}`);
  } catch (e) {
    console.error("Failed to load document terms:", e);
    return fallback;
  }
}
