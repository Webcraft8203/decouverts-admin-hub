import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  feature_image: string | null;
  author_name: string;
  content_type: string;
  publish_date: string | null;
  created_at: string;
  tags: string[] | null;
}

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link 
      to={`/blogs/${post.slug}`}
      className="group block bg-card border border-border rounded-2xl overflow-hidden shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {post.feature_image ? (
          <img
            src={post.feature_image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-4xl font-bold text-primary/20">
              {post.title.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Type Badge */}
        <Badge 
          className={cn(
            "absolute top-4 left-4",
            post.content_type === "news" 
              ? "bg-blue-500 text-white" 
              : "bg-primary text-primary-foreground"
          )}
        >
          {post.content_type === "news" ? "News" : "Blog"}
        </Badge>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/20 transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(post.publish_date || post.created_at), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{post.author_name}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{post.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Read More */}
        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <span>Read More</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
