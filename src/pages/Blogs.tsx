import { useState } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { BlogHeroSlider } from "@/components/blog/BlogHeroSlider";
import { BlogCard } from "@/components/blog/BlogCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

type ContentType = "all" | "blog" | "news";

export default function Blogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ContentType>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  usePageSEO({
    title: "Blogs & News | DECOUVERTES – Tech Insights & Updates",
    description: "Read the latest blogs, news & insights on 3D printing, drone technology, engineering innovation & industry trends from DECOUVERTES.",
    path: "/blogs",
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch blog posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["blog-posts", selectedType, searchQuery, selectedTag],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("publish_date", { ascending: false });

      if (selectedType !== "all") {
        query = query.eq("content_type", selectedType);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      if (selectedTag) {
        query = query.contains("tags", [selectedTag]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Get all unique tags
  const allTags = posts?.reduce<string[]>((acc, post) => {
    const postTags = post.tags || [];
    postTags.forEach((tag: string) => {
      if (!acc.includes(tag)) acc.push(tag);
    });
    return acc;
  }, []) || [];

  const clearFilters = () => {
    setSelectedType("all");
    setSelectedTag(null);
    setSearchQuery("");
  };

  const hasActiveFilters = selectedType !== "all" || selectedTag || searchQuery;

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      
      {/* Hero Slider */}
      <BlogHeroSlider />

      {/* Main Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              Insights & Updates
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Blogs & News
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Stay updated with the latest in technology, manufacturing insights, and company news.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-6 mb-8 shadow-soft">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search */}
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
                {(["all", "blog", "news"] as ContentType[]).map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="capitalize"
                  >
                    {type === "all" ? "All Posts" : type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground mr-2">Tags:</span>
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTag === tag ? "default" : "secondary"}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {selectedType !== "all" && (
                  <Badge variant="outline" className="gap-1">
                    Type: {selectedType}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedType("all")} />
                  </Badge>
                )}
                {selectedTag && (
                  <Badge variant="outline" className="gap-1">
                    Tag: {selectedTag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedTag(null)} />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="outline" className="gap-1">
                    Search: {searchQuery}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive">
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {/* Posts Grid */}
          {postsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
                  <Skeleton className="w-full aspect-video" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Try adjusting your filters or search query."
                  : "Check back later for new content."}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
