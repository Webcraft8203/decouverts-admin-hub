import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeActivityLog } from "@/hooks/useEmployeeActivityLog";
import { Loader2, Upload, FileText, Eye, Info } from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  approval_status: string;
  created_at: string;
  rejection_reason: string | null;
}

interface EmployeeSelfServiceDocumentsProps {
  employeeId: string;
}

interface SensitiveInfo {
  aadhaar_last_four: string | null;
  pan_last_four: string | null;
}

const DOCUMENT_TYPES = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  { value: "bank_passbook", label: "Bank Passbook" },
  { value: "address_proof", label: "Address Proof" },
  { value: "education", label: "Educational Certificate" },
  { value: "experience", label: "Experience Letter" },
  { value: "other", label: "Other Document" },
];

export function EmployeeSelfServiceDocuments({ employeeId }: EmployeeSelfServiceDocumentsProps) {
  const { toast } = useToast();
  const { logActivity } = useEmployeeActivityLog();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sensitiveInfo, setSensitiveInfo] = useState<SensitiveInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  // Upload form state
  const [documentType, setDocumentType] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data: docs, error: docsError } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      
      if (docsError) throw docsError;
      setDocuments(docs || []);
      
      // Fetch sensitive info
      const { data: sensitive, error: sensitiveError } = await supabase
        .from('employee_sensitive_info')
        .select('*')
        .eq('employee_id', employeeId);
      
      if (sensitiveError) throw sensitiveError;
      
      if (sensitive && sensitive.length > 0) {
        setSensitiveInfo(sensitive[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [employeeId]);

  const handleFileUpload = async () => {
    if (!selectedFile || !documentType || !documentName) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields and select a file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${employeeId}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Create document record using Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      const { error: insertError } = await supabase
        .from('employee_documents')
        .insert({
          employee_id: employeeId,
          document_type: documentType,
          document_name: documentName,
          file_path: fileName,
          uploaded_by: session?.user?.id,
          approval_status: 'pending',
        });

      if (insertError) throw insertError;

      // Log the activity
      logActivity({
        actionType: "document_uploaded",
        entityType: "document",
        entityId: employeeId,
        description: `Uploaded document: ${documentName}`,
        metadata: { documentType, documentName }
      });

      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded and is pending HR approval.",
      });

      setIsUploadDialogOpen(false);
      setDocumentType("");
      setDocumentName("");
      setSelectedFile(null);
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const viewDocument = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('employee-documents')
        .createSignedUrl(filePath, 60);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to view document",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Government IDs Card - View Only */}
      <Card>
        <CardHeader>
          <CardTitle>Government Identification</CardTitle>
          <CardDescription>Your Aadhaar and PAN details (masked for security)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Aadhaar Number</p>
              <p className="font-medium font-mono">
                {sensitiveInfo?.aadhaar_last_four 
                  ? `XXXX XXXX ${sensitiveInfo.aadhaar_last_four}` 
                  : "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PAN Number</p>
              <p className="font-medium font-mono">
                {sensitiveInfo?.pan_last_four 
                  ? `XXXXXX${sensitiveInfo.pan_last_four}` 
                  : "Not provided"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Contact HR to update your government ID information.
          </p>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Documents
            </CardTitle>
            <CardDescription>Upload and manage your identity and employment documents</CardDescription>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>Add a new document for HR approval</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Uploaded documents will require HR approval before being accepted.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docName">Document Name</Label>
                  <Input
                    id="docName"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g., Aadhaar Card Front"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleFileUpload} disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Click "Upload Document" to add your first document</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.document_name}</TableCell>
                      <TableCell className="capitalize">
                        {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(doc.approval_status)}
                        {doc.rejection_reason && (
                          <p className="text-xs text-destructive mt-1">{doc.rejection_reason}</p>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(doc.created_at), "PP")}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => viewDocument(doc.file_path)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
