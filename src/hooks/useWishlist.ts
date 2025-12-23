import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("wishlist")
        .select("*, products(id, name, price, images, stock_quantity, categories(name))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("wishlist")
        .insert({ user_id: user.id, product_id: productId });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Already in wishlist");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Added to Wishlist");
    },
    onError: (error: Error) => {
      if (error.message === "Already in wishlist") {
        toast.info("Already in your wishlist");
      } else {
        toast.error("Failed to add to wishlist");
      }
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from Wishlist");
    },
    onError: () => {
      toast.error("Failed to remove from wishlist");
    },
  });

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item: any) => item.product_id === productId);
  };

  const toggleWishlist = (productId: string) => {
    if (isInWishlist(productId)) {
      removeFromWishlistMutation.mutate(productId);
    } else {
      addToWishlistMutation.mutate(productId);
    }
  };

  return {
    wishlistItems,
    isLoading,
    isInWishlist,
    toggleWishlist,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    isToggling: addToWishlistMutation.isPending || removeFromWishlistMutation.isPending,
  };
}
