import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Mail, Send, Users, History, Loader2, Trash2, AlertCircle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Newsletter() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState<string | null>(null);

  // Fetch subscribers
  const { data: subscribers = [], isLoading: loadingSubs } = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch send history
  const { data: sendHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["newsletter-sends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_sends")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const activeCount = subscribers.filter((s: any) => s.is_active).length;

  // Send newsletter mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-newsletter", {
        body: { subject, content },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Newsletter sent to ${data.sent} subscribers!`);
      setSubject("");
      setContent("");
      setShowConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["newsletter-sends"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send newsletter");
      setShowConfirm(false);
    },
  });

  // Remove subscriber
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subscriber removed");
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      setDeleteEmail(null);
    },
  });

  const handleSend = () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Please fill in both subject and content");
      return;
    }
    setShowConfirm(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Newsletter</h1>
        <p className="text-muted-foreground mt-1">
          Manage subscribers and send newsletters
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Active Subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subscribers.length}</p>
              <p className="text-sm text-muted-foreground">Total Subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <History className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sendHistory.length}</p>
              <p className="text-sm text-muted-foreground">Newsletters Sent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">
            <Send className="h-4 w-4 mr-2" /> Compose
          </TabsTrigger>
          <TabsTrigger value="subscribers">
            <Users className="h-4 w-4 mr-2" /> Subscribers
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" /> History
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Compose Newsletter</CardTitle>
              <CardDescription>
                Send an email to all {activeCount} active subscribers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g. New Product Launch - DFT Series 3D Printer"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">
                  Content <span className="text-muted-foreground text-xs">(HTML supported)</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="Write your newsletter content here... You can use HTML tags for formatting."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              {content && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div
                    className="border rounded-lg p-6 bg-muted/30 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSend} disabled={sendMutation.isPending || activeCount === 0}>
                  {sendMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Send Newsletter</>
                  )}
                </Button>
                {activeCount === 0 && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> No active subscribers
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <CardTitle>Subscribers</CardTitle>
              <CardDescription>
                {activeCount} active out of {subscribers.length} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : subscribers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No subscribers yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((sub: any) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.email}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(sub.subscribed_at), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sub.is_active ? "default" : "secondary"}>
                            {sub.is_active ? "Active" : "Unsubscribed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {sub.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteEmail(sub.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Send History</CardTitle>
              <CardDescription>Previously sent newsletters</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sendHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No newsletters sent yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Sent By</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sendHistory.map((send: any) => (
                      <TableRow key={send.id}>
                        <TableCell className="font-medium max-w-[300px] truncate">
                          {send.subject}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {send.sent_by}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{send.recipient_count}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(send.created_at), "dd MMM yyyy, HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Send Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Newsletter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send the newsletter "<strong>{subject}</strong>" to{" "}
              <strong>{activeCount}</strong> active subscribers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => sendMutation.mutate()}>
              Send to {activeCount} subscribers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Remove Subscriber Dialog */}
      <AlertDialog open={!!deleteEmail} onOpenChange={() => setDeleteEmail(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Subscriber?</AlertDialogTitle>
            <AlertDialogDescription>
              This subscriber will be marked as unsubscribed and won't receive future newsletters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteEmail && removeMutation.mutate(deleteEmail)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
