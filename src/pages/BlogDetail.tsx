import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/usePageSEO";
import { ArticleSchema, BreadcrumbSchema } from "@/components/SEOSchemas";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogCard } from "@/components/blog/BlogCard";
import { YouTubeEmbed } from "@/components/blog/YouTubeEmbed";
import { BlogImageGallery } from "@/components/blog/BlogImageGallery";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin,
  Copy,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const article = document.getElementById("article-content");
      if (!article) return;
      
      const rect = article.getBoundingClientRect();
      const articleTop = window.scrollY + rect.top;
      const articleHeight = rect.height;
      const scrollPosition = window.scrollY - articleTop + window.innerHeight * 0.5;
      const progress = Math.min(Math.max((scrollPosition / articleHeight) * 100, 0), 100);
      setReadProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch post
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch related posts
  const { data: relatedPosts } = useQuery({
    queryKey: ["related-posts", post?.id, post?.content_type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .eq("content_type", post?.content_type || "blog")
        .neq("id", post?.id || "")
        .order("publish_date", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!post?.id,
  });

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const title = post?.title || "Blog Post";

    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, "_blank");
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, "_blank");
        break;
      case "copy":
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  // Calculate read time
  const calculateReadTime = (content: string | null) => {
    if (!content) return 1;
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-64 mb-8" />
            <Skeleton className="w-full aspect-video rounded-2xl mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-8">The post you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/blogs")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blogs
            </Button>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const blogUrl = `/blogs/${slug}`;

  usePageSEO({
    title: `${post.meta_title || post.title} | DECOUVERTES`.slice(0, 60),
    description: (post.meta_description || post.excerpt || post.title).slice(0, 160),
    path: blogUrl,
    type: "article",
    image: post.feature_image || undefined,
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <ArticleSchema
        title={post.title}
        description={post.meta_description || post.excerpt || post.title}
        image={post.feature_image || undefined}
        datePublished={post.publish_date || post.created_at}
        dateModified={post.updated_at}
        author={post.author_name}
        url={blogUrl}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Blogs", url: "/blogs" },
          { name: post.title, url: blogUrl },
        ]}
      />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Hero Section */}
      <section className="pt-24 pb-8 lg:pt-32 lg:pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/blogs")}
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blogs
          </Button>

          {/* Type Badge */}
          <Badge 
            className={cn(
              "mb-4",
              post.content_type === "news" 
                ? "bg-blue-500/10 text-blue-600 border-blue-500/20" 
                : "bg-primary/10 text-primary border-primary/20"
            )}
          >
            {post.content_type === "news" ? "News" : "Blog"}
          </Badge>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(post.publish_date || post.created_at), "MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{calculateReadTime(post.content)} min read</span>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature Image */}
      {post.feature_image && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <img
            src={post.feature_image}
            alt={post.title}
            className="w-full aspect-video object-cover rounded-2xl shadow-lg"
          />
        </div>
      )}

      {/* Article Content */}
      <article id="article-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* YouTube Video */}
        {post.youtube_url && (
          <div className="mb-12">
            <YouTubeEmbed url={post.youtube_url} title={post.title} />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />

        {/* Image Gallery */}
        {post.image_gallery && post.image_gallery.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-foreground mb-6">Image Gallery</h3>
            <BlogImageGallery images={post.image_gallery} />
          </div>
        )}

        {/* Share Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Share2 className="w-4 h-4" />
              <span className="font-medium">Share this article:</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("facebook")}
                className="hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]"
              >
                <Facebook className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("twitter")}
                className="hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]"
              >
                <Twitter className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("linkedin")}
                className="hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]"
              >
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("copy")}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-8">Related Posts</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}

      <PublicFooter />
    </div>
  );
}
