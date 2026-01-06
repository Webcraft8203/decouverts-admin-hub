import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ArrowRight, Check, Plane, Shield, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

type Step = "details" | "configuration";

interface UserDetails {
  fullName: string;
  phoneNumber: string;
  email: string;
  belongsToOrganization: boolean;
  organizationName: string;
  designation: string;
  organizationType: string;
}

interface DroneConfig {
  droneCategory: string;
  fpvModel: string;
  survModel: string;
  indModel: string;
  customFrame: string;
  customPayloadCamera: boolean;
  customPayloadSensor: boolean;
  customPayloadCommunication: boolean;
  customFlightTime: string;
  customRange: string;
  customControl: string;
  customEncryption: boolean;
  customFrameSizeType: boolean;
  customEndurancePayload: boolean;
  customCameraType: boolean;
  customCommunicationRange: boolean;
  customEncryptionLevel: boolean;
  customEnvironmentalResistance: boolean;
  customAutonomyLevel: boolean;
}

export default function DroneConfiguration() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userDetails, setUserDetails] = useState<UserDetails>({
    fullName: "",
    phoneNumber: "",
    email: "",
    belongsToOrganization: false,
    organizationName: "",
    designation: "",
    organizationType: "",
  });

  const [droneConfig, setDroneConfig] = useState<DroneConfig>({
    droneCategory: "",
    fpvModel: "",
    survModel: "",
    indModel: "",
    customFrame: "",
    customPayloadCamera: false,
    customPayloadSensor: false,
    customPayloadCommunication: false,
    customFlightTime: "",
    customRange: "",
    customControl: "",
    customEncryption: false,
    customFrameSizeType: false,
    customEndurancePayload: false,
    customCameraType: false,
    customCommunicationRange: false,
    customEncryptionLevel: false,
    customEnvironmentalResistance: false,
    customAutonomyLevel: false,
  });

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails.fullName || !userDetails.phoneNumber || !userDetails.email) {
      toast.error("Please fill all required fields");
      return;
    }
    if (userDetails.belongsToOrganization && !userDetails.organizationName) {
      toast.error("Please enter organization name");
      return;
    }
    setStep("configuration");
  };

  const handleFinalSubmit = async () => {
    if (!droneConfig.droneCategory) {
      toast.error("Please select a drone category");
      return;
    }

    // Validate based on category
    if (droneConfig.droneCategory === "fpv" && !droneConfig.fpvModel) {
      toast.error("Please select an FPV model");
      return;
    }
    if (droneConfig.droneCategory === "surveillance" && !droneConfig.survModel) {
      toast.error("Please select a Surveillance model");
      return;
    }
    if (droneConfig.droneCategory === "industrial" && !droneConfig.indModel) {
      toast.error("Please select an Industrial model");
      return;
    }
    if (droneConfig.droneCategory === "custom" && !droneConfig.customFrame) {
      toast.error("Please select a frame type for Custom Mission");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("drone_configurations").insert({
        full_name: userDetails.fullName,
        phone_number: userDetails.phoneNumber,
        email: userDetails.email,
        belongs_to_organization: userDetails.belongsToOrganization,
        organization_name: userDetails.organizationName || null,
        designation: userDetails.designation || null,
        organization_type: userDetails.organizationType || null,
        drone_category: droneConfig.droneCategory,
        fpv_model: droneConfig.fpvModel || null,
        surv_model: droneConfig.survModel || null,
        ind_model: droneConfig.indModel || null,
        custom_frame: droneConfig.customFrame || null,
        custom_payload_camera: droneConfig.customPayloadCamera,
        custom_payload_sensor: droneConfig.customPayloadSensor,
        custom_payload_communication: droneConfig.customPayloadCommunication,
        custom_flight_time: droneConfig.customFlightTime || null,
        custom_range: droneConfig.customRange || null,
        custom_control: droneConfig.customControl || null,
        custom_encryption: droneConfig.customEncryption,
        custom_frame_size_type: droneConfig.customFrameSizeType,
        custom_endurance_payload: droneConfig.customEndurancePayload,
        custom_camera_type: droneConfig.customCameraType,
        custom_communication_range: droneConfig.customCommunicationRange,
        custom_encryption_level: droneConfig.customEncryptionLevel,
        custom_environmental_resistance: droneConfig.customEnvironmentalResistance,
        custom_autonomy_level: droneConfig.customAutonomyLevel,
      });

      if (error) throw error;

      toast.success("Drone configuration request submitted successfully!");
      navigate("/manufacturing");
    } catch (error) {
      console.error("Error submitting configuration:", error);
      toast.error("Failed to submit configuration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Plane className="h-10 w-10 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Decouvertes Drone Systems
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Configure your custom drone platform based on mission profile, payload, endurance, and operating environment.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step === "details" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "details" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {step === "configuration" ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <span className="font-medium">Your Details</span>
            </div>
            <div className="w-16 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${step === "configuration" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "configuration" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                2
              </div>
              <span className="font-medium">Drone Configuration</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Details</CardTitle>
                    <CardDescription>Please provide your contact information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleDetailsSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name *</Label>
                          <Input
                            id="fullName"
                            value={userDetails.fullName}
                            onChange={(e) => setUserDetails({ ...userDetails, fullName: e.target.value })}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number *</Label>
                          <Input
                            id="phoneNumber"
                            value={userDetails.phoneNumber}
                            onChange={(e) => setUserDetails({ ...userDetails, phoneNumber: e.target.value })}
                            placeholder="Enter your phone number"
                            required
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={userDetails.email}
                            onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                            placeholder="Enter your email address"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="belongsToOrg"
                            checked={userDetails.belongsToOrganization}
                            onCheckedChange={(checked) =>
                              setUserDetails({ ...userDetails, belongsToOrganization: checked as boolean })
                            }
                          />
                          <Label htmlFor="belongsToOrg">I belong to an organization</Label>
                        </div>

                        {userDetails.belongsToOrganization && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="orgName">Organization Name *</Label>
                              <Input
                                id="orgName"
                                value={userDetails.organizationName}
                                onChange={(e) => setUserDetails({ ...userDetails, organizationName: e.target.value })}
                                placeholder="Organization name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="designation">Designation</Label>
                              <Input
                                id="designation"
                                value={userDetails.designation}
                                onChange={(e) => setUserDetails({ ...userDetails, designation: e.target.value })}
                                placeholder="Your designation"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="orgType">Organization Type</Label>
                              <Select
                                value={userDetails.organizationType}
                                onValueChange={(value) => setUserDetails({ ...userDetails, organizationType: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="startup">Startup</SelectItem>
                                  <SelectItem value="industry">Industry</SelectItem>
                                  <SelectItem value="govt">Government</SelectItem>
                                  <SelectItem value="education">Education</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" className="gap-2">
                          Proceed to Drone Configuration
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === "configuration" && (
              <motion.div
                key="configuration"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Back Button */}
                <Button
                  variant="ghost"
                  onClick={() => setStep("details")}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Details
                </Button>

                {/* Philosophy Section */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Info className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Drone Philosophy</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Decouvertes drone platforms are built on a modular and customizable architecture, 
                          allowing each drone to be configured based on mission profile, payload, endurance, 
                          and operating environment. Our focus is on indigenous R&D, controlled technology 
                          ownership, and government-aligned applications.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Accordion type="multiple" defaultValue={["category"]} className="space-y-4">
                  {/* Drone Category Selection */}
                  <AccordionItem value="category" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-lg font-semibold">
                      1. Drone Variant Classification *
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <RadioGroup
                        value={droneConfig.droneCategory}
                        onValueChange={(value) => setDroneConfig({ 
                          ...droneConfig, 
                          droneCategory: value,
                          fpvModel: "",
                          survModel: "",
                          indModel: "",
                          customFrame: "",
                        })}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="fpv" id="fpv" />
                          <Label htmlFor="fpv" className="flex-1 cursor-pointer">
                            <span className="font-medium">FPV Tactical Drones</span>
                            <p className="text-sm text-muted-foreground">Training, R&D, and tactical operations</p>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="surveillance" id="surveillance" />
                          <Label htmlFor="surveillance" className="flex-1 cursor-pointer">
                            <span className="font-medium">Surveillance & ISR Drones</span>
                            <p className="text-sm text-muted-foreground">Monitoring, border security, and observation</p>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="industrial" id="industrial" />
                          <Label htmlFor="industrial" className="flex-1 cursor-pointer">
                            <span className="font-medium">Industrial & Inspection Drones</span>
                            <p className="text-sm text-muted-foreground">Power lines, factories, and construction</p>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="custom" id="custom" />
                          <Label htmlFor="custom" className="flex-1 cursor-pointer">
                            <span className="font-medium">Custom Mission Drones (Govt / Defense)</span>
                            <p className="text-sm text-muted-foreground">Defense, research, and classified projects</p>
                          </Label>
                        </div>
                      </RadioGroup>
                    </AccordionContent>
                  </AccordionItem>

                  {/* FPV Series */}
                  {droneConfig.droneCategory === "fpv" && (
                    <AccordionItem value="fpv-series" className="border rounded-lg px-4">
                      <AccordionTrigger className="text-lg font-semibold">
                        2. DFT-FPV Series - Select Model *
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 space-y-4">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Frame Size</TableHead>
                                <TableHead>Application</TableHead>
                                <TableHead>Flight Time</TableHead>
                                <TableHead>Payload</TableHead>
                                <TableHead>Control Range</TableHead>
                                <TableHead>Customization</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow className={droneConfig.fpvModel === "DFT-FPV-5" ? "bg-primary/10" : ""}>
                                <TableCell>
                                  <RadioGroup value={droneConfig.fpvModel} onValueChange={(v) => setDroneConfig({ ...droneConfig, fpvModel: v })}>
                                    <RadioGroupItem value="DFT-FPV-5" />
                                  </RadioGroup>
                                </TableCell>
                                <TableCell className="font-medium">DFT-FPV-5</TableCell>
                                <TableCell>5 inch</TableCell>
                                <TableCell>Training / R&D</TableCell>
                                <TableCell>10–15 min</TableCell>
                                <TableCell>Light</TableCell>
                                <TableCell>Medium</TableCell>
                                <TableCell>High</TableCell>
                              </TableRow>
                              <TableRow className={droneConfig.fpvModel === "DFT-FPV-7" ? "bg-primary/10" : ""}>
                                <TableCell>
                                  <RadioGroup value={droneConfig.fpvModel} onValueChange={(v) => setDroneConfig({ ...droneConfig, fpvModel: v })}>
                                    <RadioGroupItem value="DFT-FPV-7" />
                                  </RadioGroup>
                                </TableCell>
                                <TableCell className="font-medium">DFT-FPV-7</TableCell>
                                <TableCell>7 inch</TableCell>
                                <TableCell>Tactical / Long Range</TableCell>
                                <TableCell>15–25 min</TableCell>
                                <TableCell>Medium</TableCell>
                                <TableCell>Long</TableCell>
                                <TableCell>Very High</TableCell>
                              </TableRow>
                              <TableRow className={droneConfig.fpvModel === "DFT-FPV-10" ? "bg-primary/10" : ""}>
                                <TableCell>
                                  <RadioGroup value={droneConfig.fpvModel} onValueChange={(v) => setDroneConfig({ ...droneConfig, fpvModel: v })}>
                                    <RadioGroupItem value="DFT-FPV-10" />
                                  </RadioGroup>
                                </TableCell>
                                <TableCell className="font-medium">DFT-FPV-10</TableCell>
                                <TableCell>10 inch</TableCell>
                                <TableCell>Payload / Endurance</TableCell>
                                <TableCell>25–35 min</TableCell>
                                <TableCell>High</TableCell>
                                <TableCell>Extended</TableCell>
                                <TableCell>Maximum</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Use Cases:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Tactical training</li>
                            <li>• FPV research & development</li>
                            <li>• Controlled test missions</li>
                            <li>• Simulation & evaluation platforms</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Surveillance Series */}
                  {droneConfig.droneCategory === "surveillance" && (
                    <AccordionItem value="surv-series" className="border rounded-lg px-4">
                      <AccordionTrigger className="text-lg font-semibold">
                        2. DFT-SURV Series - Select Model *
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 space-y-4">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Flight Type</TableHead>
                                <TableHead>Endurance</TableHead>
                                <TableHead>Camera</TableHead>
                                <TableHead>Transmission</TableHead>
                                <TableHead>Application</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow className={droneConfig.survModel === "DFT-SUR-X" ? "bg-primary/10" : ""}>
                                <TableCell>
                                  <RadioGroup value={droneConfig.survModel} onValueChange={(v) => setDroneConfig({ ...droneConfig, survModel: v })}>
                                    <RadioGroupItem value="DFT-SUR-X" />
                                  </RadioGroup>
                                </TableCell>
                                <TableCell className="font-medium">DFT-SUR-X</TableCell>
                                <TableCell>Multirotor</TableCell>
                                <TableCell>30–40 min</TableCell>
                                <TableCell>EO</TableCell>
                                <TableCell>Digital</TableCell>
                                <TableCell>Area monitoring</TableCell>
                              </TableRow>
                              <TableRow className={droneConfig.survModel === "DFT-SUR-LR" ? "bg-primary/10" : ""}>
                                <TableCell>
                                  <RadioGroup value={droneConfig.survModel} onValueChange={(v) => setDroneConfig({ ...droneConfig, survModel: v })}>
                                    <RadioGroupItem value="DFT-SUR-LR" />
                                  </RadioGroup>
                                </TableCell>
                                <TableCell className="font-medium">DFT-SUR-LR</TableCell>
                                <TableCell>Long-range multirotor</TableCell>
                                <TableCell>45–60 min</TableCell>
                                <TableCell>EO + IR</TableCell>
                                <TableCell>Encrypted Digital</TableCell>
                                <TableCell>Border / perimeter</TableCell>
                              </TableRow>
                              <TableRow className={droneConfig.survModel === "DFT-SUR-VTOL" ? "bg-primary/10" : ""}>
                                <TableCell>
                                  <RadioGroup value={droneConfig.survModel} onValueChange={(v) => setDroneConfig({ ...droneConfig, survModel: v })}>
                                    <RadioGroupItem value="DFT-SUR-VTOL" />
                                  </RadioGroup>
                                </TableCell>
                                <TableCell className="font-medium">DFT-SUR-VTOL</TableCell>
                                <TableCell>VTOL Hybrid</TableCell>
                                <TableCell>90+ min</TableCell>
                                <TableCell>EO + IR</TableCell>
                                <TableCell>Encrypted Long-Range</TableCell>
                                <TableCell>Wide-area surveillance</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Use Cases:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Government surveillance</li>
                            <li>• Infrastructure monitoring</li>
                            <li>• Disaster response</li>
                            <li>• Smart city observation</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Industrial Series */}
                  {droneConfig.droneCategory === "industrial" && (
                    <AccordionItem value="ind-series" className="border rounded-lg px-4">
                      <AccordionTrigger className="text-lg font-semibold">
                        2. DFT-IND Series - Select Model *
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 space-y-4">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Payload Capacity</TableHead>
                                <TableHead>Flight Time</TableHead>
                                <TableHead>Sensors</TableHead>
                                <TableHead>Stability</TableHead>
                                <TableHead>Environment</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow className={droneConfig.indModel === "DFT-IND-Q" ? "bg-primary/10" : ""}>
                                <TableCell>
                                  <RadioGroup value={droneConfig.indModel} onValueChange={(v) => setDroneConfig({ ...droneConfig, indModel: v })}>
                                    <RadioGroupItem value="DFT-IND-Q" />
                                  </RadioGroup>
                                </TableCell>
                                <TableCell className="font-medium">DFT-IND-Q</TableCell>
                                <TableCell>Low</TableCell>
                                <TableCell>30 min</TableCell>
                                <TableCell>Visual</TableCell>
                                <TableCell>Standard</TableCell>
                                <TableCell>Indoor / Outdoor</TableCell>
                              </TableRow>
                              <TableRow className={droneConfig.indModel === "DFT-IND-X" ? "bg-primary/10" : ""}>
                                <TableCell>
                                  <RadioGroup value={droneConfig.indModel} onValueChange={(v) => setDroneConfig({ ...droneConfig, indModel: v })}>
                                    <RadioGroupItem value="DFT-IND-X" />
                                  </RadioGroup>
                                </TableCell>
                                <TableCell className="font-medium">DFT-IND-X</TableCell>
                                <TableCell>Medium</TableCell>
                                <TableCell>35 min</TableCell>
                                <TableCell>Visual + Thermal</TableCell>
                                <TableCell>Enhanced</TableCell>
                                <TableCell>Outdoor</TableCell>
                              </TableRow>
                              <TableRow className={droneConfig.indModel === "DFT-IND-H" ? "bg-primary/10" : ""}>
                                <TableCell>
                                  <RadioGroup value={droneConfig.indModel} onValueChange={(v) => setDroneConfig({ ...droneConfig, indModel: v })}>
                                    <RadioGroupItem value="DFT-IND-H" />
                                  </RadioGroup>
                                </TableCell>
                                <TableCell className="font-medium">DFT-IND-H</TableCell>
                                <TableCell>Heavy</TableCell>
                                <TableCell>40 min</TableCell>
                                <TableCell>Custom sensors</TableCell>
                                <TableCell>Industrial-grade</TableCell>
                                <TableCell>Harsh environments</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Use Cases:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Power line inspection</li>
                            <li>• Solar & wind farms</li>
                            <li>• Factory & plant inspection</li>
                            <li>• Construction monitoring</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Custom Mission */}
                  {droneConfig.droneCategory === "custom" && (
                    <AccordionItem value="custom-series" className="border rounded-lg px-4">
                      <AccordionTrigger className="text-lg font-semibold">
                        2. DFT-CUS Series - Custom Mission Configuration
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Frame Type *</Label>
                            <RadioGroup
                              value={droneConfig.customFrame}
                              onValueChange={(v) => setDroneConfig({ ...droneConfig, customFrame: v })}
                              className="space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="multirotor" id="multirotor" />
                                <Label htmlFor="multirotor">Multirotor</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="vtol" id="vtol" />
                                <Label htmlFor="vtol">VTOL</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixed-wing" id="fixed-wing" />
                                <Label htmlFor="fixed-wing">Fixed-wing</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-base font-medium">Payload</Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="payloadCamera"
                                  checked={droneConfig.customPayloadCamera}
                                  onCheckedChange={(c) => setDroneConfig({ ...droneConfig, customPayloadCamera: c as boolean })}
                                />
                                <Label htmlFor="payloadCamera">Camera</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="payloadSensor"
                                  checked={droneConfig.customPayloadSensor}
                                  onCheckedChange={(c) => setDroneConfig({ ...droneConfig, customPayloadSensor: c as boolean })}
                                />
                                <Label htmlFor="payloadSensor">Sensor</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="payloadComm"
                                  checked={droneConfig.customPayloadCommunication}
                                  onCheckedChange={(c) => setDroneConfig({ ...droneConfig, customPayloadCommunication: c as boolean })}
                                />
                                <Label htmlFor="payloadComm">Communication</Label>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-base font-medium">Flight Time</Label>
                            <RadioGroup
                              value={droneConfig.customFlightTime}
                              onValueChange={(v) => setDroneConfig({ ...droneConfig, customFlightTime: v })}
                              className="space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="mission-specific" id="mission-specific" />
                                <Label htmlFor="mission-specific">Mission-specific</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-base font-medium">Range</Label>
                            <RadioGroup
                              value={droneConfig.customRange}
                              onValueChange={(v) => setDroneConfig({ ...droneConfig, customRange: v })}
                              className="space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="short" id="short" />
                                <Label htmlFor="short">Short</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="long" id="long" />
                                <Label htmlFor="long">Long</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="bvlos" id="bvlos" />
                                <Label htmlFor="bvlos">BVLOS-ready</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-base font-medium">Control</Label>
                            <RadioGroup
                              value={droneConfig.customControl}
                              onValueChange={(v) => setDroneConfig({ ...droneConfig, customControl: v })}
                              className="space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="manual" id="manual" />
                                <Label htmlFor="manual">Manual</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="assisted" id="assisted" />
                                <Label htmlFor="assisted">Assisted</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="semi-autonomous" id="semi-autonomous" />
                                <Label htmlFor="semi-autonomous">Semi-autonomous</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-base font-medium">Encryption</Label>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="govtEncryption"
                                checked={droneConfig.customEncryption}
                                onCheckedChange={(c) => setDroneConfig({ ...droneConfig, customEncryption: c as boolean })}
                              />
                              <Label htmlFor="govtEncryption">Government-grade (on request)</Label>
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Use Cases:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Defense & strategic missions</li>
                            <li>• Government research programs</li>
                            <li>• Special surveillance tasks</li>
                            <li>• Experimental & classified projects</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Technical Architecture */}
                  {droneConfig.droneCategory && (
                    <AccordionItem value="tech-arch" className="border rounded-lg px-4">
                      <AccordionTrigger className="text-lg font-semibold">
                        3. Common Technical Architecture
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Component</TableHead>
                              <TableHead>Specification</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Flight Controller</TableCell>
                              <TableCell>Industrial-grade (custom firmware)</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Navigation</TableCell>
                              <TableCell>GPS / GNSS / RTK (optional)</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Communication</TableCell>
                              <TableCell>RF / Digital / Encrypted</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Power System</TableCell>
                              <TableCell>LiPo / Li-Ion</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Redundancy</TableCell>
                              <TableCell>Optional</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Ground Station</TableCell>
                              <TableCell>Laptop / Tablet / Custom GCS</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Customization Matrix */}
                  {droneConfig.droneCategory && (
                    <AccordionItem value="customization" className="border rounded-lg px-4">
                      <AccordionTrigger className="text-lg font-semibold">
                        4. Customization Matrix (Optional)
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 space-y-4">
                        <p className="text-sm text-muted-foreground italic">
                          Select areas where you need customization:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="custFrameSize"
                              checked={droneConfig.customFrameSizeType}
                              onCheckedChange={(c) => setDroneConfig({ ...droneConfig, customFrameSizeType: c as boolean })}
                            />
                            <Label htmlFor="custFrameSize">Frame size & type</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="custEndurance"
                              checked={droneConfig.customEndurancePayload}
                              onCheckedChange={(c) => setDroneConfig({ ...droneConfig, customEndurancePayload: c as boolean })}
                            />
                            <Label htmlFor="custEndurance">Endurance vs payload</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="custCamera"
                              checked={droneConfig.customCameraType}
                              onCheckedChange={(c) => setDroneConfig({ ...droneConfig, customCameraType: c as boolean })}
                            />
                            <Label htmlFor="custCamera">Camera (EO / IR / Zoom)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="custCommRange"
                              checked={droneConfig.customCommunicationRange}
                              onCheckedChange={(c) => setDroneConfig({ ...droneConfig, customCommunicationRange: c as boolean })}
                            />
                            <Label htmlFor="custCommRange">Communication range</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="custEncLevel"
                              checked={droneConfig.customEncryptionLevel}
                              onCheckedChange={(c) => setDroneConfig({ ...droneConfig, customEncryptionLevel: c as boolean })}
                            />
                            <Label htmlFor="custEncLevel">Encryption level</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="custEnvResist"
                              checked={droneConfig.customEnvironmentalResistance}
                              onCheckedChange={(c) => setDroneConfig({ ...droneConfig, customEnvironmentalResistance: c as boolean })}
                            />
                            <Label htmlFor="custEnvResist">Environmental resistance</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="custAutonomy"
                              checked={droneConfig.customAutonomyLevel}
                              onCheckedChange={(c) => setDroneConfig({ ...droneConfig, customAutonomyLevel: c as boolean })}
                            />
                            <Label htmlFor="custAutonomy">Autonomy level</Label>
                          </div>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mt-4">
                          <p className="text-sm text-foreground font-medium">
                            "Every Decouvertes drone is mission-configured, not off-the-shelf."
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Compliance Notice */}
                  {droneConfig.droneCategory && (
                    <AccordionItem value="compliance" className="border rounded-lg px-4">
                      <AccordionTrigger className="text-lg font-semibold">
                        5. Compliance Notice
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="flex gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            All drone platforms are developed for research, training, industrial, and 
                            government-aligned applications. Final deployment is subject to applicable 
                            regulations and approvals.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>

                {/* Submit Button */}
                <div className="flex justify-end pt-6">
                  <Button
                    size="lg"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting || !droneConfig.droneCategory}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        <Shield className="h-5 w-5" />
                        Request Drone Configuration
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <PublicFooter />
    </div>
  );
}
