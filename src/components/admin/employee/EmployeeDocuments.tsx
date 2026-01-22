import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Eye, Check, X, Download, Trash2 } from "lucide-react";
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

interface EmployeeDocumentsProps {
  employeeId: string;
  canManage: boolean;
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

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${endpoint}`,
    {
      ...options,
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': options.method === 'POST' ? 'return=representation' : 'return=minimal',
        ...options.headers,
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  if (response.status === 204) return null;
  return response.json();
};

export function EmployeeDocuments({ employeeId, canManage }: EmployeeDocumentsProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sensitiveInfo, setSensitiveInfo] = useState<SensitiveInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  // Upload form state
  const [documentType, setDocumentType] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Sensitive info form
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [isSavingSensitive, setIsSavingSensitive] = useState(false);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await apiCall(`employee_documents?employee_id=eq.${employeeId}&order=created_at.desc`);
      setDocuments(docs || []);
      
      // Fetch sensitive info
      const sensitive = await apiCall(`employee_sensitive_info?employee_id=eq.${employeeId}`);
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

    setIsUploading(true);
    try {
      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${employeeId}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Create document record
      const session = await supabase.auth.getSession();
      await apiCall('employee_documents', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: employeeId,
          document_type: documentType,
          document_name: documentName,
          file_path: fileName,
          uploaded_by: session.data.session?.user?.id,
          approval_status: canManage ? 'approved' : 'pending',
        }),
      });

      toast({
        title: "Document Uploaded",
        description: canManage 
          ? "Document has been uploaded and approved." 
          : "Document has been uploaded and is pending approval.",
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

  const handleApproval = async (docId: string, approve: boolean, reason?: string) => {
    try {
      const session = await supabase.auth.getSession();
      await apiCall(`employee_documents?id=eq.${docId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          approval_status: approve ? 'approved' : 'rejected',
          approved_by: session.data.session?.user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason || null,
        }),
      });

      toast({
        title: approve ? "Document Approved" : "Document Rejected",
        description: `The document has been ${approve ? 'approved' : 'rejected'}.`,
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update document status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      // Delete from storage
      await supabase.storage.from('employee-documents').remove([filePath]);
      
      // Delete record
      await apiCall(`employee_documents?id=eq.${docId}`, {
        method: 'DELETE',
      });

      toast({
        title: "Document Deleted",
        description: "The document has been removed.",
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleSaveSensitiveInfo = async () => {
    setIsSavingSensitive(true);
    try {
      const data = {
        employee_id: employeeId,
        aadhaar_number_encrypted: aadhaarNumber || null,
        aadhaar_last_four: aadhaarNumber ? aadhaarNumber.slice(-4) : null,
        pan_number_encrypted: panNumber || null,
        pan_last_four: panNumber ? panNumber.slice(-4).toUpperCase() : null,
      };

      if (sensitiveInfo) {
        await apiCall(`employee_sensitive_info?employee_id=eq.${employeeId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        await apiCall('employee_sensitive_info', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }

      toast({
        title: "Information Saved",
        description: "Sensitive information has been updated.",
      });

      setAadhaarNumber("");
      setPanNumber("");
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save information",
        variant: "destructive",
      });
    } finally {
      setIsSavingSensitive(false);
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
      {/* Government IDs Card */}
      <Card>
        <CardHeader>
          <CardTitle>Government Identification</CardTitle>
          <CardDescription>Aadhaar and PAN details (masked for security)</CardDescription>
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
          
          {canManage && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium mb-4">Update Government IDs</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aadhaar">Aadhaar Number</Label>
                  <Input
                    id="aadhaar"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="Enter 12-digit Aadhaar"
                    maxLength={12}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN Number</Label>
                  <Input
                    id="pan"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="Enter PAN (e.g., ABCDE1234F)"
                    maxLength={10}
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveSensitiveInfo} 
                className="mt-4"
                disabled={isSavingSensitive || (!aadhaarNumber && !panNumber)}
              >
                {isSavingSensitive ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save IDs"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>Uploaded identity and employment documents</CardDescription>
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
                <DialogDescription>Add a new document for this employee</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
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
            </div>
          ) : (
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
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => viewDocument(doc.file_path)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManage && doc.approval_status === 'pending' && (
                          <>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-green-600"
                              onClick={() => handleApproval(doc.id, true)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-destructive"
                              onClick={() => {
                                const reason = prompt("Rejection reason (optional):");
                                handleApproval(doc.id, false, reason || undefined);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {canManage && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-destructive"
                            onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
}
