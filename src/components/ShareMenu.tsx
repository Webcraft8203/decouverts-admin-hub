import { Share2, Copy, MessageSquare, Facebook, Twitter, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareMenuProps {
  url: string;
  title: string;
  description?: string;
  triggerClassName?: string;
  iconClassName?: string;
  label?: string;
}

export const ShareMenu = ({ url, title, description, triggerClassName, iconClassName, label }: ShareMenuProps) => {
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleWhatsApp = () => {
    const text = `Check out ${title}: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  };

  const handleTwitter = () => {
    const text = `Check out ${title}`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description || `Check out ${title}`}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={triggerClassName || "bg-background/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm hover:bg-background transition-colors"}
          title="Share product"
        >
          <Share2 className={iconClassName || "w-4 h-4 text-muted-foreground"} />
          {label && <span>{label}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2">
          <Copy className="w-4 h-4" /> Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsApp} className="cursor-pointer gap-2">
          <MessageSquare className="w-4 h-4" /> WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebook} className="cursor-pointer gap-2">
          <Facebook className="w-4 h-4" /> Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTwitter} className="cursor-pointer gap-2">
          <Twitter className="w-4 h-4" /> Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEmail} className="cursor-pointer gap-2">
          <Mail className="w-4 h-4" /> Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
