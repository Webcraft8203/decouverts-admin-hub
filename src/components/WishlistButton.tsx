import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  variant?: "icon" | "default";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function WishlistButton({ 
  productId, 
  variant = "icon",
  size = "default",
  className 
}: WishlistButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist, isToggling } = useWishlist();

  const inWishlist = isInWishlist(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      toast.info("Please login to save items", {
        action: { label: "Login", onClick: () => navigate("/login") },
      });
      return;
    }
    
    toggleWishlist(productId);
  };

  if (variant === "icon") {
    return (
      <Button
        size="icon"
        variant="secondary"
        onClick={handleClick}
        disabled={isToggling}
        className={cn(
          "rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background transition-all duration-300",
          size === "sm" && "w-8 h-8",
          size === "default" && "w-10 h-10",
          size === "lg" && "w-12 h-12",
          className
        )}
      >
        <Heart 
          className={cn(
            "transition-all duration-300",
            size === "sm" && "w-4 h-4",
            size === "default" && "w-5 h-5",
            size === "lg" && "w-6 h-6",
            inWishlist ? "fill-destructive text-destructive" : "text-muted-foreground hover:text-destructive"
          )} 
        />
      </Button>
    );
  }

  return (
    <Button
      variant={inWishlist ? "default" : "outline"}
      size={size}
      onClick={handleClick}
      disabled={isToggling}
      className={cn(
        "transition-all duration-300",
        inWishlist && "bg-destructive hover:bg-destructive/90",
        className
      )}
    >
      <Heart 
        className={cn(
          "w-4 h-4 mr-2 transition-all duration-300",
          inWishlist && "fill-current"
        )} 
      />
      {inWishlist ? "Saved" : "Save"}
    </Button>
  );
}
