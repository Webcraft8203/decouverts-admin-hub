import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { Printer, Search, Eye, Download, Check, X, Building, User, Phone, Mail, Calendar, MessageSquare } from "lucide-react";

interface PrinterConfiguration {
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
  base_model: string;
  motion_tier: string;
  extruder_count: string;
  max_nozzle_temp: string;
  hardened_nozzle: boolean;
  high_flow_setup: boolean;
  pellet_extruder: boolean;
  ams_type: string;
  supported_colors: string;
  ams_4_color: boolean;
  ams_8_color: boolean;
  multi_material: boolean;
  ams_filament_dryer: boolean;
  spool_capacity: string | null;
  bed_surface: string;
  bed_heating: string;
  large_bed_reinforcement: boolean;
  panel_material: string;
  active_chamber_heating: boolean;
  hepa_carbon_filter: boolean;
  noise_reduction_panels: boolean;
  tpu_flexible: boolean;
  nylon_pa: boolean;
  cf_gf_filled: boolean;
  engineering_polymers: boolean;
  electronics_tier: string;
  accuracy_tier: string;
  emergency_stop: boolean;
  filament_dryer: boolean;
  multi_chamber_dryer: boolean;
  printer_stand: boolean;
  tool_storage: boolean;
  spare_nozzle_kit: boolean;
  calibration_kit: boolean;
  cad_slicer_training: boolean;
  advanced_material_training: boolean;
  amc_plan: string | null;
  status: string;
  admin_notes: string | null;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  quotation_sent: "bg-purple-100 text-purple-800",
  closed: "bg-gray-100 text-gray-800",
};

const PrinterConfigurations = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedConfig, setSelectedConfig] = useState<PrinterConfiguration | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: configurations, isLoading } = useQuery({
    queryKey: ["printer-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_configurations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PrinterConfiguration[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: any = { status };
      if (notes !== undefined) updateData.admin_notes = notes;
      
      const { error } = await supabase
        .from("printer_configurations")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["printer-configurations"] });
      toast.success("Status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const filteredConfigs = configurations?.filter((config) => {
    const matchesSearch =
      config.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.base_model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || config.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetail = (config: PrinterConfiguration) => {
    setSelectedConfig(config);
    setAdminNotes(config.admin_notes || "");
  };

  const handleSaveNotes = () => {
    if (selectedConfig) {
      updateStatusMutation.mutate({ id: selectedConfig.id, status: selectedConfig.status, notes: adminNotes });
    }
  };

  const generatePDF = (config: PrinterConfiguration) => {
    // Create a simple text-based PDF content
    const content = `
DECOUVERTS DFT SERIES CONFIGURATION
====================================

REQUEST DETAILS
---------------
Date: ${format(new Date(config.created_at), "PPP")}
Status: ${config.status.toUpperCase()}

CUSTOMER INFORMATION
--------------------
Name: ${config.full_name}
Phone: ${config.phone_number}
Email: ${config.email}
${config.belongs_to_organization ? `Organization: ${config.organization_name}
Designation: ${config.designation || "N/A"}
Type: ${config.organization_type || "N/A"}` : "Individual Customer"}

PRINTER CONFIGURATION
---------------------
Base Model: ${config.base_model}
Motion System: ${config.motion_tier}
Extruder Count: ${config.extruder_count}
Max Nozzle Temp: ${config.max_nozzle_temp}°C
${config.hardened_nozzle ? "• Hardened Nozzle" : ""}
${config.high_flow_setup ? "• High-Flow Setup" : ""}
${config.pellet_extruder ? "• Pellet Extruder" : ""}

AMS Configuration: ${config.ams_type} - ${config.supported_colors} colors
${config.ams_4_color ? "• 4-Color AMS" : ""}
${config.ams_8_color ? "• 8-Color AMS" : ""}
${config.multi_material ? "• Multi-Material" : ""}

Bed Surface: ${config.bed_surface}
Bed Heating: ${config.bed_heating}°C
Panel Material: ${config.panel_material}
Electronics: ${config.electronics_tier}
Accuracy: ${config.accuracy_tier}

OPTIONAL MATERIALS
------------------
${config.tpu_flexible ? "• TPU/Flexible" : ""}
${config.nylon_pa ? "• Nylon (PA)" : ""}
${config.cf_gf_filled ? "• CF/GF Filled" : ""}
${config.engineering_polymers ? "• Engineering Polymers" : ""}

ACCESSORIES
-----------
${config.filament_dryer ? "• Filament Dryer" : ""}
${config.multi_chamber_dryer ? "• Multi-chamber Dryer" : ""}
${config.printer_stand ? "• Printer Stand" : ""}
${config.tool_storage ? "• Tool Storage" : ""}
${config.spare_nozzle_kit ? "• Spare Nozzle Kit" : ""}
${config.calibration_kit ? "• Calibration Kit" : ""}

TRAINING & SUPPORT
------------------
${config.cad_slicer_training ? "• CAD + Slicer Training (3-Day)" : ""}
${config.advanced_material_training ? "• Advanced Material Training" : ""}
${config.amc_plan ? `• AMC Plan: ${config.amc_plan}` : ""}

${config.admin_notes ? `
ADMIN NOTES
-----------
${config.admin_notes}` : ""}
    `.trim();

    // Create blob and download
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DFT-Config-${config.full_name.replace(/\s+/g, "-")}-${format(new Date(config.created_at), "yyyy-MM-dd")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Configuration exported");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Printer className="w-6 h-6" />
              Printer Configurations
            </h1>
            <p className="text-muted-foreground">Manage DFT Series configuration requests</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {configurations?.length || 0} Requests
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="quotation_sent">Quotation Sent</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Configurations List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredConfigs?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No configuration requests found
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredConfigs?.map((config) => (
              <Card key={config.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">{config.full_name}</h3>
                        <Badge className={statusColors[config.status]}>
                          {config.status.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline">{config.base_model}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" /> {config.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" /> {config.phone_number}
                        </span>
                        {config.belongs_to_organization && (
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" /> {config.organization_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {format(new Date(config.created_at), "PP")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={config.status}
                        onValueChange={(status) => updateStatusMutation.mutate({ id: config.id, status })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="reviewing">Reviewing</SelectItem>
                          <SelectItem value="quotation_sent">Quotation Sent</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" onClick={() => handleOpenDetail(config)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => generatePDF(config)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={!!selectedConfig} onOpenChange={() => setSelectedConfig(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Configuration Details - {selectedConfig?.base_model}
              </DialogTitle>
            </DialogHeader>

            {selectedConfig && (
              <div className="space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-4 h-4" /> Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{selectedConfig.full_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedConfig.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedConfig.phone_number}</p>
                      </div>
                      {selectedConfig.belongs_to_organization && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Organization</p>
                            <p className="font-medium">{selectedConfig.organization_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Designation</p>
                            <p className="font-medium">{selectedConfig.designation || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Organization Type</p>
                            <p className="font-medium capitalize">{selectedConfig.organization_type || "N/A"}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Configuration Details */}
                <Accordion type="multiple" defaultValue={["base", "motion", "extruder"]} className="space-y-2">
                  <AccordionItem value="base" className="border rounded-lg px-4">
                    <AccordionTrigger>Base Model & Build Volume</AccordionTrigger>
                    <AccordionContent>
                      <p className="font-semibold text-lg text-primary">{selectedConfig.base_model}</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="motion" className="border rounded-lg px-4">
                    <AccordionTrigger>Motion System</AccordionTrigger>
                    <AccordionContent>
                      <p className="capitalize">{selectedConfig.motion_tier}</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="extruder" className="border rounded-lg px-4">
                    <AccordionTrigger>Extruder & Hotend</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Extruder Count</TableCell>
                            <TableCell className="capitalize">{selectedConfig.extruder_count}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Max Nozzle Temp</TableCell>
                            <TableCell>{selectedConfig.max_nozzle_temp}°C</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Hardened Nozzle</TableCell>
                            <TableCell>{selectedConfig.hardened_nozzle ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">High-Flow Setup</TableCell>
                            <TableCell>{selectedConfig.high_flow_setup ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Pellet Extruder</TableCell>
                            <TableCell>{selectedConfig.pellet_extruder ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ams" className="border rounded-lg px-4">
                    <AccordionTrigger>AMS Configuration</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">AMS Type</TableCell>
                            <TableCell className="capitalize">{selectedConfig.ams_type}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Supported Colors</TableCell>
                            <TableCell>{selectedConfig.supported_colors}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">4-Color AMS</TableCell>
                            <TableCell>{selectedConfig.ams_4_color ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">8-Color AMS</TableCell>
                            <TableCell>{selectedConfig.ams_8_color ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Multi-Material</TableCell>
                            <TableCell>{selectedConfig.multi_material ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">AMS + Filament Dryer</TableCell>
                            <TableCell>{selectedConfig.ams_filament_dryer ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}</TableCell>
                          </TableRow>
                          {selectedConfig.spool_capacity && (
                            <TableRow>
                              <TableCell className="font-medium">Spool Capacity</TableCell>
                              <TableCell>{selectedConfig.spool_capacity}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="bed" className="border rounded-lg px-4">
                    <AccordionTrigger>Build Platform & Bed</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Bed Surface</TableCell>
                            <TableCell>{selectedConfig.bed_surface.replace("_", " ").toUpperCase()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Bed Heating</TableCell>
                            <TableCell>{selectedConfig.bed_heating}°C</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Large Bed Reinforcement</TableCell>
                            <TableCell>{selectedConfig.large_bed_reinforcement ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="enclosure" className="border rounded-lg px-4">
                    <AccordionTrigger>Enclosure & Thermal</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Panel Material</TableCell>
                            <TableCell className="capitalize">{selectedConfig.panel_material}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Active Chamber Heating</TableCell>
                            <TableCell>{selectedConfig.active_chamber_heating ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">HEPA + Carbon Filter</TableCell>
                            <TableCell>{selectedConfig.hepa_carbon_filter ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Noise Reduction</TableCell>
                            <TableCell>{selectedConfig.noise_reduction_panels ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="materials" className="border rounded-lg px-4">
                    <AccordionTrigger>Optional Materials</AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedConfig.tpu_flexible && <Badge>TPU / Flexible</Badge>}
                        {selectedConfig.nylon_pa && <Badge>Nylon (PA)</Badge>}
                        {selectedConfig.cf_gf_filled && <Badge>CF / GF Filled</Badge>}
                        {selectedConfig.engineering_polymers && <Badge>Engineering Polymers</Badge>}
                        {!selectedConfig.tpu_flexible && !selectedConfig.nylon_pa && !selectedConfig.cf_gf_filled && !selectedConfig.engineering_polymers && (
                          <span className="text-muted-foreground">None selected</span>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="electronics" className="border rounded-lg px-4">
                    <AccordionTrigger>Electronics & Accuracy</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Electronics Tier</TableCell>
                            <TableCell className="capitalize">{selectedConfig.electronics_tier}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Accuracy Tier</TableCell>
                            <TableCell className="capitalize">{selectedConfig.accuracy_tier.replace("_", " ")}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Emergency Stop</TableCell>
                            <TableCell>{selectedConfig.emergency_stop ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="accessories" className="border rounded-lg px-4">
                    <AccordionTrigger>Accessories</AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedConfig.filament_dryer && <Badge variant="outline">Filament Dryer</Badge>}
                        {selectedConfig.multi_chamber_dryer && <Badge variant="outline">Multi-chamber Dryer</Badge>}
                        {selectedConfig.printer_stand && <Badge variant="outline">Printer Stand</Badge>}
                        {selectedConfig.tool_storage && <Badge variant="outline">Tool Storage</Badge>}
                        {selectedConfig.spare_nozzle_kit && <Badge variant="outline">Spare Nozzle Kit</Badge>}
                        {selectedConfig.calibration_kit && <Badge variant="outline">Calibration Kit</Badge>}
                        {!selectedConfig.filament_dryer && !selectedConfig.multi_chamber_dryer && !selectedConfig.printer_stand && !selectedConfig.tool_storage && !selectedConfig.spare_nozzle_kit && !selectedConfig.calibration_kit && (
                          <span className="text-muted-foreground">None selected</span>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="training" className="border rounded-lg px-4">
                    <AccordionTrigger>Training & Support</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {selectedConfig.cad_slicer_training && <Badge variant="secondary">CAD + Slicer Training (3-Day)</Badge>}
                        {selectedConfig.advanced_material_training && <Badge variant="secondary" className="ml-2">Advanced Material Training</Badge>}
                        {selectedConfig.amc_plan && <Badge variant="secondary" className="ml-2">AMC: {selectedConfig.amc_plan}</Badge>}
                        {!selectedConfig.cad_slicer_training && !selectedConfig.advanced_material_training && !selectedConfig.amc_plan && (
                          <span className="text-muted-foreground">Standard support only</span>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Admin Notes */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Admin Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes for this configuration request..."
                      rows={4}
                    />
                    <Button onClick={handleSaveNotes} disabled={updateStatusMutation.isPending}>
                      {updateStatusMutation.isPending ? "Saving..." : "Save Notes"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default PrinterConfigurations;
