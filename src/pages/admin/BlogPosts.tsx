import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, Image as ImageIcon, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  feature_image: string | null;
  image_gallery: string[] | null;
  youtube_url: string | null;
  author_name: string;
  content_type: string;
  tags: string[] | null;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
  publish_date: string | null;
  created_at: string;
}

interface PostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  feature_image: string;
  image_gallery: string[];
  youtube_url: string;
  author_name: string;
  content_type: string;
  tags: string[];
  status: string;
  meta_title: string;
  meta_description: string;
  publish_date: string;
}

const defaultFormData: PostFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  feature_image: "",
  image_gallery: [],
  youtube_url: "",
  author_name: "Decouverts Team",
  content_type: "blog",
  tags: [],
  status: "draft",
  meta_title: "",
  meta_description: "",
  publish_date: new Date().toISOString().split("T")[0],
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BlogPosts() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<PostFormData>(defaultFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [tagsInput, setTagsInput] = useState("");
  const [galleryInput, setGalleryInput] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as BlogPost[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const { error } = await supabase.from("blog_posts").insert([{
        ...data,
        publish_date: data.publish_date ? new Date(data.publish_date).toISOString() : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Post created successfully");
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      setTagsInput("");
      setGalleryInput("");
    },
    onError: (error) => {
      toast.error("Failed to create post: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PostFormData> }) => {
      const updateData = {
        ...data,
        publish_date: data.publish_date ? new Date(data.publish_date).toISOString() : null,
      };
      const { error } = await supabase.from("blog_posts").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Post updated successfully");
      setIsDialogOpen(false);
      setEditingPost(null);
      setFormData(defaultFormData);
      setTagsInput("");
      setGalleryInput("");
    },
    onError: (error) => {
      toast.error("Failed to update post: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Post deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete post: " + error.message);
    },
  });

  const handleOpenDialog = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        content: post.content || "",
        feature_image: post.feature_image || "",
        image_gallery: post.image_gallery || [],
        youtube_url: post.youtube_url || "",
        author_name: post.author_name,
        content_type: post.content_type,
        tags: post.tags || [],
        status: post.status,
        meta_title: post.meta_title || "",
        meta_description: post.meta_description || "",
        publish_date: post.publish_date 
          ? new Date(post.publish_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
      setTagsInput((post.tags || []).join(", "));
      setGalleryInput((post.image_gallery || []).join("\n"));
    } else {
      setEditingPost(null);
      setFormData(defaultFormData);
      setTagsInput("");
      setGalleryInput("");
    }
    setIsDialogOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingPost ? formData.slug : generateSlug(title),
    });
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    setFormData({ ...formData, tags });
  };

  const handleGalleryChange = (value: string) => {
    setGalleryInput(value);
    const images = value
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
    setFormData({ ...formData, image_gallery: images });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      toast.error("Title and slug are required");
      return;
    }

    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleStatus = (post: BlogPost) => {
    updateMutation.mutate({
      id: post.id,
      data: { status: post.status === "published" ? "draft" : "published" },
    });
  };

  // Filter posts
  const filteredPosts = posts?.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || post.content_type === filterType;
    const matchesStatus = filterStatus === "all" || post.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-muted-foreground">Create and manage blog posts and news articles</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="news">News</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Posts ({filteredPosts?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Published</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        {post.feature_image ? (
                          <img
                            src={post.feature_image}
                            alt={post.title}
                            className="w-12 h-8 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium line-clamp-1">{post.title}</p>
                          <p className="text-xs text-muted-foreground">/{post.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={post.content_type === "news" ? "secondary" : "outline"}>
                          {post.content_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={post.status === "published" ? "default" : "secondary"}>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {post.publish_date
                          ? format(new Date(post.publish_date), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleStatus(post)}
                            title={post.status === "published" ? "Unpublish" : "Publish"}
                          >
                            {post.status === "published" ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(post)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`/blogs/${post.slug}`, "_blank")}
                            title="Preview"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this post?")) {
                                deleteMutation.mutate(post.id);
                              }
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No posts found. Create your first post to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Post title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="post-url-slug"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="content_type">Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value) => setFormData({ ...formData, content_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="publish_date">Publish Date</Label>
                <Input
                  id="publish_date"
                  type="date"
                  value={formData.publish_date}
                  onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="author_name">Author Name</Label>
              <Input
                id="author_name"
                value={formData.author_name}
                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                placeholder="Author name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt / Summary</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Short summary for listing pages"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (HTML supported)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Full post content. HTML tags like <p>, <h2>, <ul>, <li>, <strong> are supported."
                rows={8}
              />
            </div>

            {/* Media */}
            <div className="space-y-4">
              <h3 className="font-semibold">Media</h3>
              <div className="space-y-2">
                <Label htmlFor="feature_image">Feature Image URL</Label>
                <Input
                  id="feature_image"
                  value={formData.feature_image}
                  onChange={(e) => setFormData({ ...formData, feature_image: e.target.value })}
                  placeholder="https://..."
                />
                {formData.feature_image && (
                  <img
                    src={formData.feature_image}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_url">YouTube Video URL</Label>
                <Input
                  id="youtube_url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_gallery">Image Gallery (one URL per line)</Label>
                <Textarea
                  id="image_gallery"
                  value={galleryInput}
                  onChange={(e) => handleGalleryChange(e.target.value)}
                  placeholder="https://image1.jpg&#10;https://image2.jpg"
                  rows={3}
                />
              </div>
            </div>

            {/* Tags & SEO */}
            <div className="space-y-4">
              <h3 className="font-semibold">Tags & SEO</h3>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="technology, manufacturing, news"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="SEO title (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="SEO description (optional)"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingPost ? "Update Post" : "Create Post"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
