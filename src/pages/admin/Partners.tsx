import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, X, ExternalLink } from "lucide-react";

interface Partner {
  id: string;
  partner_name: string;
  logo_url: string;
  image_title: string;
  image_description: string;
  website_url: string | null;
  display_order: number;
  status: string;
  created_at: string;
}

interface PartnerFormData {
  partner_name: string;
  image_title: string;
  image_description: string;
  website_url: string;
  status: string;
  display_order: string;
}

const Partners = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<PartnerFormData>({
    partner_name: "",
    image_title: "",
    image_description: "",
    website_url: "",
    status: "draft",
    display_order: "0",
  });

  const { data: partners, isLoading } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Partner[];
    },
  });

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `partner-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("customer-partner-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("customer-partner-images")
        .getPublicUrl(fileName);

      setLogoUrl(data.publicUrl);
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      if (!logoUrl) throw new Error("Please upload a logo");
      const { error } = await supabase.from("partners").insert({
        partner_name: data.partner_name,
        logo_url: logoUrl,
        image_title: data.image_title,
        image_description: data.image_description,
        website_url: data.website_url || null,
        status: data.status,
        display_order: parseInt(data.display_order) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      queryClient.invalidateQueries({ queryKey: ["published-partners"] });
      resetForm();
      setIsDialogOpen(false);
      toast.success("Partner created successfully");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PartnerFormData & { id: string }) => {
      if (!logoUrl) throw new Error("Please upload a logo");
      const { error } = await supabase
        .from("partners")
        .update({
          partner_name: data.partner_name,
          logo_url: logoUrl,
          image_title: data.image_title,
          image_description: data.image_description,
          website_url: data.website_url || null,
          status: data.status,
          display_order: parseInt(data.display_order) || 0,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      queryClient.invalidateQueries({ queryKey: ["published-partners"] });
      resetForm();
      setIsDialogOpen(false);
      toast.success("Partner updated successfully");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      queryClient.invalidateQueries({ queryKey: ["published-partners"] });
      toast.success("Partner deleted successfully");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({
      partner_name: "",
      image_title: "",
      image_description: "",
      website_url: "",
      status: "draft",
      display_order: "0",
    });
    setLogoUrl(null);
    setEditingPartner(null);
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      partner_name: partner.partner_name,
      image_title: partner.image_title,
      image_description: partner.image_description,
      website_url: partner.website_url || "",
      status: partner.status,
      display_order: partner.display_order.toString(),
    });
    setLogoUrl(partner.logo_url);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPartner) {
      updateMutation.mutate({ ...formData, id: editingPartner.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Partners</h1>
          <p className="text-muted-foreground">Manage partner logos displayed on the homepage</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Partner</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPartner ? "Edit Partner" : "Add New Partner"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Partner Name *</Label>
                <Input
                  value={formData.partner_name}
                  onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Partner Logo *</Label>
                <div className="flex items-center gap-4 mt-2">
                  {logoUrl ? (
                    <div className="relative">
                      <img
                        src={logoUrl}
                        alt="Partner logo"
                        className="h-16 w-auto object-contain border rounded p-2"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoUrl(null)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-muted transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">{uploading ? "Uploading..." : "Upload Logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label>Image Title *</Label>
                <Input
                  value={formData.image_title}
                  onChange={(e) => setFormData({ ...formData, image_title: e.target.value })}
                  placeholder="Alt text for accessibility"
                  required
                />
              </div>

              <div>
                <Label>Image Description *</Label>
                <Input
                  value={formData.image_description}
                  onChange={(e) => setFormData({ ...formData, image_description: e.target.value })}
                  placeholder="Brief description for SEO"
                  required
                />
              </div>

              <div>
                <Label>Website URL</Label>
                <Input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPartner ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Partners</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !partners?.length ? (
            <div className="text-center py-8 text-muted-foreground">No partners yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Partner Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <img
                        src={partner.logo_url}
                        alt={partner.image_title}
                        className="h-10 w-auto object-contain"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{partner.partner_name}</div>
                        <div className="text-xs text-muted-foreground">{partner.image_title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {partner.website_url ? (
                        <a
                          href={partner.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="text-xs">Visit</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={partner.status === "published" ? "default" : "secondary"}>
                        {partner.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{partner.display_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(partner)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(partner.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Partners;
