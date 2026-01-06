import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Plane, Eye, Download, Building2, User, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

type DroneConfig = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  phone_number: string;
  email: string;
  belongs_to_organization: boolean;
  organization_name: string | null;
  designation: string | null;
  organization_type: string | null;
  drone_category: string;
  fpv_model: string | null;
  surv_model: string | null;
  ind_model: string | null;
  custom_frame: string | null;
  custom_payload_camera: boolean;
  custom_payload_sensor: boolean;
  custom_payload_communication: boolean;
  custom_flight_time: string | null;
  custom_range: string | null;
  custom_control: string | null;
  custom_encryption: boolean;
  custom_frame_size_type: boolean;
  custom_endurance_payload: boolean;
  custom_camera_type: boolean;
  custom_communication_range: boolean;
  custom_encryption_level: boolean;
  custom_environmental_resistance: boolean;
  custom_autonomy_level: boolean;
  status: string;
  admin_notes: string | null;
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  reviewing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  quotation_sent: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const categoryLabels: Record<string, string> = {
  fpv: "FPV Tactical Drones",
  surveillance: "Surveillance & ISR Drones",
  industrial: "Industrial & Inspection Drones",
  custom: "Custom Mission Drones",
};

export default function DroneConfigurations() {
  const queryClient = useQueryClient();
  const [selectedConfig, setSelectedConfig] = useState<DroneConfig | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: configurations, isLoading } = useQuery({
    queryKey: ["drone-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drone_configurations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DroneConfig[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("drone_configurations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drone-configurations"] });
      toast.success("Status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("drone_configurations")
        .update({ admin_notes: notes })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drone-configurations"] });
      toast.success("Notes saved");
    },
    onError: () => {
      toast.error("Failed to save notes");
    },
  });

  const generatePDF = (config: DroneConfig) => {
    const content = `
DECOUVERTES DRONE SYSTEMS
Configuration Request
========================

Request ID: ${config.id}
Date: ${format(new Date(config.created_at), "PPpp")}
Status: ${config.status.toUpperCase()}

------------------------
CUSTOMER DETAILS
------------------------
Name: ${config.full_name}
Phone: ${config.phone_number}
Email: ${config.email}
${config.belongs_to_organization ? `
Organization: ${config.organization_name || "N/A"}
Designation: ${config.designation || "N/A"}
Organization Type: ${config.organization_type || "N/A"}
` : "Individual Customer"}

------------------------
DRONE CONFIGURATION
------------------------
Category: ${categoryLabels[config.drone_category] || config.drone_category}
${config.fpv_model ? `FPV Model: ${config.fpv_model}` : ""}
${config.surv_model ? `Surveillance Model: ${config.surv_model}` : ""}
${config.ind_model ? `Industrial Model: ${config.ind_model}` : ""}
${config.drone_category === "custom" ? `
Custom Mission Configuration:
- Frame: ${config.custom_frame || "N/A"}
- Payload Camera: ${config.custom_payload_camera ? "Yes" : "No"}
- Payload Sensor: ${config.custom_payload_sensor ? "Yes" : "No"}
- Payload Communication: ${config.custom_payload_communication ? "Yes" : "No"}
- Flight Time: ${config.custom_flight_time || "N/A"}
- Range: ${config.custom_range || "N/A"}
- Control: ${config.custom_control || "N/A"}
- Govt Encryption: ${config.custom_encryption ? "Yes" : "No"}
` : ""}

------------------------
CUSTOMIZATION REQUESTS
------------------------
${config.custom_frame_size_type ? "✓ Frame size & type\n" : ""}${config.custom_endurance_payload ? "✓ Endurance vs payload\n" : ""}${config.custom_camera_type ? "✓ Camera (EO / IR / Zoom)\n" : ""}${config.custom_communication_range ? "✓ Communication range\n" : ""}${config.custom_encryption_level ? "✓ Encryption level\n" : ""}${config.custom_environmental_resistance ? "✓ Environmental resistance\n" : ""}${config.custom_autonomy_level ? "✓ Autonomy level\n" : ""}
${config.admin_notes ? `
------------------------
ADMIN NOTES
------------------------
${config.admin_notes}
` : ""}

========================
Generated by Decouvertes Admin Panel
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drone-config-${config.id.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Configuration downloaded");
  };

  const getSelectedModel = (config: DroneConfig) => {
    if (config.fpv_model) return config.fpv_model;
    if (config.surv_model) return config.surv_model;
    if (config.ind_model) return config.ind_model;
    if (config.custom_frame) return `Custom: ${config.custom_frame}`;
    return "N/A";
  };

  const BooleanIcon = ({ value }: { value: boolean }) => 
    value ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-muted-foreground" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plane className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Drone Configurations</h1>
            <p className="text-muted-foreground">Manage drone configuration requests</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Requests</CardTitle>
          <CardDescription>
            {configurations?.length || 0} total requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : configurations?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No configuration requests yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configurations?.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(config.created_at), "PP")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{config.full_name}</p>
                            <p className="text-xs text-muted-foreground">{config.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {config.belongs_to_organization ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{config.organization_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Individual</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[config.drone_category] || config.drone_category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {getSelectedModel(config)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={config.status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({ id: config.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="reviewing">Reviewing</SelectItem>
                            <SelectItem value="quotation_sent">Quotation Sent</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedConfig(config);
                                  setAdminNotes(config.admin_notes || "");
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Plane className="h-5 w-5" />
                                  Configuration Details
                                </DialogTitle>
                              </DialogHeader>

                              {selectedConfig && (
                                <div className="space-y-6">
                                  <Accordion type="multiple" defaultValue={["customer", "drone", "customization"]} className="space-y-2">
                                    <AccordionItem value="customer" className="border rounded-lg px-4">
                                      <AccordionTrigger>Customer Details</AccordionTrigger>
                                      <AccordionContent>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <p className="text-muted-foreground">Name</p>
                                            <p className="font-medium">{selectedConfig.full_name}</p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground">Phone</p>
                                            <p className="font-medium">{selectedConfig.phone_number}</p>
                                          </div>
                                          <div className="col-span-2">
                                            <p className="text-muted-foreground">Email</p>
                                            <p className="font-medium">{selectedConfig.email}</p>
                                          </div>
                                          {selectedConfig.belongs_to_organization && (
                                            <>
                                              <div>
                                                <p className="text-muted-foreground">Organization</p>
                                                <p className="font-medium">{selectedConfig.organization_name}</p>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground">Designation</p>
                                                <p className="font-medium">{selectedConfig.designation || "N/A"}</p>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground">Org Type</p>
                                                <p className="font-medium capitalize">{selectedConfig.organization_type || "N/A"}</p>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="drone" className="border rounded-lg px-4">
                                      <AccordionTrigger>Drone Configuration</AccordionTrigger>
                                      <AccordionContent>
                                        <div className="space-y-4 text-sm">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-muted-foreground">Category</p>
                                              <p className="font-medium">{categoryLabels[selectedConfig.drone_category]}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground">Model</p>
                                              <p className="font-medium">{getSelectedModel(selectedConfig)}</p>
                                            </div>
                                          </div>

                                          {selectedConfig.drone_category === "custom" && (
                                            <div className="border-t pt-4 mt-4">
                                              <h4 className="font-medium mb-3">Custom Mission Details</h4>
                                              <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                  <p className="text-muted-foreground">Frame</p>
                                                  <p className="font-medium capitalize">{selectedConfig.custom_frame}</p>
                                                </div>
                                                <div>
                                                  <p className="text-muted-foreground">Flight Time</p>
                                                  <p className="font-medium capitalize">{selectedConfig.custom_flight_time || "N/A"}</p>
                                                </div>
                                                <div>
                                                  <p className="text-muted-foreground">Range</p>
                                                  <p className="font-medium capitalize">{selectedConfig.custom_range || "N/A"}</p>
                                                </div>
                                                <div>
                                                  <p className="text-muted-foreground">Control</p>
                                                  <p className="font-medium capitalize">{selectedConfig.custom_control || "N/A"}</p>
                                                </div>
                                              </div>
                                              <div className="mt-4">
                                                <p className="text-muted-foreground mb-2">Payload</p>
                                                <div className="flex gap-4">
                                                  <div className="flex items-center gap-1">
                                                    <BooleanIcon value={selectedConfig.custom_payload_camera} />
                                                    <span>Camera</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <BooleanIcon value={selectedConfig.custom_payload_sensor} />
                                                    <span>Sensor</span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <BooleanIcon value={selectedConfig.custom_payload_communication} />
                                                    <span>Communication</span>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="mt-4 flex items-center gap-1">
                                                <BooleanIcon value={selectedConfig.custom_encryption} />
                                                <span>Government-grade Encryption</span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="customization" className="border rounded-lg px-4">
                                      <AccordionTrigger>Customization Requests</AccordionTrigger>
                                      <AccordionContent>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                          <div className="flex items-center gap-2">
                                            <BooleanIcon value={selectedConfig.custom_frame_size_type} />
                                            <span>Frame size & type</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <BooleanIcon value={selectedConfig.custom_endurance_payload} />
                                            <span>Endurance vs payload</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <BooleanIcon value={selectedConfig.custom_camera_type} />
                                            <span>Camera (EO / IR / Zoom)</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <BooleanIcon value={selectedConfig.custom_communication_range} />
                                            <span>Communication range</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <BooleanIcon value={selectedConfig.custom_encryption_level} />
                                            <span>Encryption level</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <BooleanIcon value={selectedConfig.custom_environmental_resistance} />
                                            <span>Environmental resistance</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <BooleanIcon value={selectedConfig.custom_autonomy_level} />
                                            <span>Autonomy level</span>
                                          </div>
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Admin Notes</label>
                                    <Textarea
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="Add notes about this configuration..."
                                      rows={3}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        updateNotesMutation.mutate({
                                          id: selectedConfig.id,
                                          notes: adminNotes,
                                        })
                                      }
                                    >
                                      Save Notes
                                    </Button>
                                  </div>

                                  <div className="flex justify-end">
                                    <Button
                                      variant="outline"
                                      onClick={() => generatePDF(selectedConfig)}
                                      className="gap-2"
                                    >
                                      <Download className="h-4 w-4" />
                                      Download Configuration
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generatePDF(config)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
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
