import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  availability: string;
  setAvailability: (v: string) => void;
  resultCount: number;
}

export function ShopFilterBar({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  availability,
  setAvailability,
  resultCount,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-8">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 pl-10 rounded-xl border-border/70 bg-card focus-visible:ring-primary/40"
        />
      </div>

      <div className="flex items-center gap-3 sm:ml-auto">
        <Select value={availability} onValueChange={setAvailability}>
          <SelectTrigger className="h-11 w-[150px] rounded-xl border-border/70 bg-card text-sm">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="pre_order">Pre-Order</SelectItem>
            <SelectItem value="coming_soon">Coming Soon</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-11 w-[160px] rounded-xl border-border/70 bg-card text-sm">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
          </SelectContent>
        </Select>

        <div className="hidden md:block text-xs text-muted-foreground whitespace-nowrap">
          {resultCount} {resultCount === 1 ? "product" : "products"}
        </div>
      </div>
    </div>
  );
}
