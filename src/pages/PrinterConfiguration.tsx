import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ArrowRight, Check, Printer, User, Settings, Package, Cpu, Thermometer, Shield, Wrench, GraduationCap } from "lucide-react";

interface UserDetails {
  fullName: string;
  phoneNumber: string;
  email: string;
  belongsToOrganization: boolean;
  organizationName: string;
  designation: string;
  organizationType: string;
}

interface PrinterConfig {
  baseModel: string;
  motionTier: string;
  extruderCount: string;
  maxNozzleTemp: string;
  hardenedNozzle: boolean;
  highFlowSetup: boolean;
  pelletExtruder: boolean;
  amsType: string;
  supportedColors: string;
  ams4Color: boolean;
  ams8Color: boolean;
  multiMaterial: boolean;
  amsFilamentDryer: boolean;
  spoolCapacity: string;
  bedSurface: string;
  bedHeating: string;
  largeBedReinforcement: boolean;
  panelMaterial: string;
  activeChamberHeating: boolean;
  hepaFilter: boolean;
  noiseReduction: boolean;
  tpuFlexible: boolean;
  nylonPa: boolean;
  cfGfFilled: boolean;
  engineeringPolymers: boolean;
  electronicsTier: string;
  accuracyTier: string;
  emergencyStop: boolean;
  filamentDryer: boolean;
  multiChamberDryer: boolean;
  printerStand: boolean;
  toolStorage: boolean;
  spareNozzleKit: boolean;
  calibrationKit: boolean;
  cadSlicerTraining: boolean;
  advancedMaterialTraining: boolean;
  amcPlan: string;
}

const PrinterConfiguration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [userDetails, setUserDetails] = useState<UserDetails>({
    fullName: "",
    phoneNumber: "",
    email: "",
    belongsToOrganization: false,
    organizationName: "",
    designation: "",
    organizationType: "",
  });

  const [config, setConfig] = useState<PrinterConfig>({
    baseModel: "",
    motionTier: "standard",
    extruderCount: "single",
    maxNozzleTemp: "300",
    hardenedNozzle: false,
    highFlowSetup: false,
    pelletExtruder: false,
    amsType: "external",
    supportedColors: "2",
    ams4Color: false,
    ams8Color: false,
    multiMaterial: false,
    amsFilamentDryer: false,
    spoolCapacity: "",
    bedSurface: "pei_smooth",
    bedHeating: "100",
    largeBedReinforcement: false,
    panelMaterial: "polycarbonate",
    activeChamberHeating: false,
    hepaFilter: false,
    noiseReduction: false,
    tpuFlexible: false,
    nylonPa: false,
    cfGfFilled: false,
    engineeringPolymers: false,
    electronicsTier: "standard",
    accuracyTier: "standard",
    emergencyStop: false,
    filamentDryer: false,
    multiChamberDryer: false,
    printerStand: false,
    toolStorage: false,
    spareNozzleKit: false,
    calibrationKit: false,
    cadSlicerTraining: false,
    advancedMaterialTraining: false,
    amcPlan: "",
  });

  const validateUserDetails = () => {
    if (!userDetails.fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!userDetails.phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (!userDetails.email.trim() || !userDetails.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (userDetails.belongsToOrganization && !userDetails.organizationName.trim()) {
      toast.error("Please enter your organization name");
      return false;
    }
    return true;
  };

  const validateConfig = () => {
    if (!config.baseModel) {
      toast.error("Please select a base model");
      return false;
    }
    return true;
  };

  const handleProceedToConfig = () => {
    if (validateUserDetails()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!validateConfig()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("printer_configurations").insert({
        full_name: userDetails.fullName,
        phone_number: userDetails.phoneNumber,
        email: userDetails.email,
        belongs_to_organization: userDetails.belongsToOrganization,
        organization_name: userDetails.organizationName || null,
        designation: userDetails.designation || null,
        organization_type: userDetails.organizationType || null,
        base_model: config.baseModel,
        motion_tier: config.motionTier,
        extruder_count: config.extruderCount,
        max_nozzle_temp: config.maxNozzleTemp,
        hardened_nozzle: config.hardenedNozzle,
        high_flow_setup: config.highFlowSetup,
        pellet_extruder: config.pelletExtruder,
        ams_type: config.amsType,
        supported_colors: config.supportedColors,
        ams_4_color: config.ams4Color,
        ams_8_color: config.ams8Color,
        multi_material: config.multiMaterial,
        ams_filament_dryer: config.amsFilamentDryer,
        spool_capacity: config.spoolCapacity || null,
        bed_surface: config.bedSurface,
        bed_heating: config.bedHeating,
        large_bed_reinforcement: config.largeBedReinforcement,
        panel_material: config.panelMaterial,
        active_chamber_heating: config.activeChamberHeating,
        hepa_carbon_filter: config.hepaFilter,
        noise_reduction_panels: config.noiseReduction,
        tpu_flexible: config.tpuFlexible,
        nylon_pa: config.nylonPa,
        cf_gf_filled: config.cfGfFilled,
        engineering_polymers: config.engineeringPolymers,
        electronics_tier: config.electronicsTier,
        accuracy_tier: config.accuracyTier,
        emergency_stop: config.emergencyStop,
        filament_dryer: config.filamentDryer,
        multi_chamber_dryer: config.multiChamberDryer,
        printer_stand: config.printerStand,
        tool_storage: config.toolStorage,
        spare_nozzle_kit: config.spareNozzleKit,
        calibration_kit: config.calibrationKit,
        cad_slicer_training: config.cadSlicerTraining,
        advanced_material_training: config.advancedMaterialTraining,
        amc_plan: config.amcPlan || null,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Configuration request submitted successfully!");
    } catch (error: any) {
      toast.error("Failed to submit configuration. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLargeModel = config.baseModel === "DFT 400" || config.baseModel === "DFT 500";

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicNavbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-lg mx-auto px-4"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Configuration Submitted!</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for configuring your Decouverts DFT Series printer. Our team will review your requirements and get back to you with a detailed quotation shortly.
            </p>
            <Button onClick={() => navigate("/")} size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </motion.div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Printer className="w-10 h-10 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Decouverts DFT Series
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">Custom 3D Printer Configuration</p>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  1
                </div>
                <span className="hidden sm:inline font-medium">Your Details</span>
              </div>
              <div className="w-12 h-0.5 bg-muted" />
              <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  2
                </div>
                <span className="hidden sm:inline font-medium">Configuration</span>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <UserDetailsForm 
                  details={userDetails} 
                  setDetails={setUserDetails}
                  onProceed={handleProceedToConfig}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6">
                  <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Details
                  </Button>
                </div>

                <Card className="mb-6 bg-primary/5 border-primary/20">
                  <CardContent className="py-4">
                    <p className="text-sm text-muted-foreground text-center">
                      <strong>Note:</strong> All specifications are fixed. Please select options as per your requirement.
                    </p>
                  </CardContent>
                </Card>

                <ConfigurationMatrix 
                  config={config} 
                  setConfig={setConfig}
                  isLargeModel={isLargeModel}
                />

                <div className="mt-8 flex justify-center">
                  <Button 
                    size="lg" 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="gap-2 px-8"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Configuration Request"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

// User Details Form Component
const UserDetailsForm = ({ 
  details, 
  setDetails, 
  onProceed 
}: { 
  details: UserDetails; 
  setDetails: (d: UserDetails) => void;
  onProceed: () => void;
}) => {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={details.fullName}
              onChange={(e) => setDetails({ ...details, fullName: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={details.phoneNumber}
              onChange={(e) => setDetails({ ...details, phoneNumber: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="belongsToOrg"
              checked={details.belongsToOrganization}
              onCheckedChange={(checked) => 
                setDetails({ ...details, belongsToOrganization: checked as boolean })
              }
            />
            <Label htmlFor="belongsToOrg" className="cursor-pointer">
              I belong to an organization
            </Label>
          </div>

          {details.belongsToOrganization && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pl-6 border-l-2 border-primary/20"
            >
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  value={details.organizationName}
                  onChange={(e) => setDetails({ ...details, organizationName: e.target.value })}
                  placeholder="Company / Institution name"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={details.designation}
                    onChange={(e) => setDetails({ ...details, designation: e.target.value })}
                    placeholder="Your role"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgType">Organization Type</Label>
                  <Select
                    value={details.organizationType}
                    onValueChange={(value) => setDetails({ ...details, organizationType: value })}
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
              </div>
            </motion.div>
          )}
        </div>

        <Button onClick={onProceed} className="w-full gap-2" size="lg">
          Proceed to Printer Configuration
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

// Configuration Matrix Component
const ConfigurationMatrix = ({ 
  config, 
  setConfig,
  isLargeModel
}: { 
  config: PrinterConfig; 
  setConfig: (c: PrinterConfig) => void;
  isLargeModel: boolean;
}) => {
  return (
    <Accordion type="multiple" defaultValue={["base-model"]} className="space-y-4">
      {/* 1. Base Model & Build Volume */}
      <AccordionItem value="base-model" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-primary" />
            <span className="font-semibold">1. Base Model & Build Volume</span>
            <span className="text-xs text-destructive">*Required</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="overflow-x-auto">
            <RadioGroup 
              value={config.baseModel} 
              onValueChange={(v) => setConfig({ ...config, baseModel: v })}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Build Volume (XYZ)</TableHead>
                    <TableHead>Target Use</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { model: "DFT 250", volume: "250 × 250 × 240 mm", use: "Education, Labs, R&D" },
                    { model: "DFT 300", volume: "300 × 300 × 290 mm", use: "Prototyping, Product Dev" },
                    { model: "DFT 400", volume: "400 × 400 × 390 mm", use: "Industrial & Functional Parts" },
                    { model: "DFT 500", volume: "500 × 500 × 490 mm", use: "Large Parts, Production, Govt" },
                  ].map((item) => (
                    <TableRow key={item.model} className="cursor-pointer hover:bg-muted/50" onClick={() => setConfig({ ...config, baseModel: item.model })}>
                      <TableCell>
                        <RadioGroupItem value={item.model} id={item.model} />
                      </TableCell>
                      <TableCell className="font-medium">{item.model}</TableCell>
                      <TableCell className="text-muted-foreground">{item.volume}</TableCell>
                      <TableCell className="text-muted-foreground">{item.use}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </RadioGroup>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 2. Motion System & Architecture */}
      <AccordionItem value="motion" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary" />
            <span className="font-semibold">2. Motion System & Architecture</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <RadioGroup 
            value={config.motionTier} 
            onValueChange={(v) => setConfig({ ...config, motionTier: v })}
            className="mb-4"
          >
            <div className="flex flex-wrap gap-4">
              {["standard", "optional", "industrial"].map((tier) => (
                <div key={tier} className="flex items-center space-x-2">
                  <RadioGroupItem value={tier} id={`motion-${tier}`} />
                  <Label htmlFor={`motion-${tier}`} className="capitalize cursor-pointer">
                    {tier === "industrial" ? "Industrial Grade" : tier}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Standard</TableHead>
                  <TableHead>Optional</TableHead>
                  <TableHead>Industrial Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Kinematics</TableCell>
                  <TableCell>CoreXY</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Reinforced CoreXY</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Linear Rails</TableCell>
                  <TableCell>MGN9 Precision Rails</TableCell>
                  <TableCell>Dual-rail upgrade</TableCell>
                  <TableCell>Industrial linear guides</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Belts</TableCell>
                  <TableCell>Gates GT2</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>Heavy-duty Gates</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Max Acceleration</TableCell>
                  <TableCell>15,000 mm/s²</TableCell>
                  <TableCell>25,000 mm/s²</TableCell>
                  <TableCell>Tuned per application</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Max Speed</TableCell>
                  <TableCell>300 mm/s</TableCell>
                  <TableCell>500 mm/s</TableCell>
                  <TableCell>High-speed tuned (Klipper)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 3. Extruder, Hotend & Toolhead */}
      <AccordionItem value="extruder" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <Thermometer className="w-5 h-5 text-primary" />
            <span className="font-semibold">3. Extruder, Hotend & Toolhead</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Fixed Specifications</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Extruder Type: All-metal Direct Drive</li>
              <li>• Hotend: High-flow (Rapido UHF / equivalent)</li>
              <li>• Nozzle Sizes: 0.2 – 1.2 mm</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Number of Extruders</Label>
              <RadioGroup 
                value={config.extruderCount} 
                onValueChange={(v) => setConfig({ ...config, extruderCount: v })}
                className="flex flex-wrap gap-4"
              >
                {["single", "dual", "idex"].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={type} id={`ext-${type}`} />
                    <Label htmlFor={`ext-${type}`} className="capitalize cursor-pointer">{type === "idex" ? "IDEX" : type}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Max Nozzle Temperature</Label>
              <RadioGroup 
                value={config.maxNozzleTemp} 
                onValueChange={(v) => setConfig({ ...config, maxNozzleTemp: v })}
                className="flex flex-wrap gap-4"
              >
                {["300", "320", "400"].map((temp) => (
                  <div key={temp} className="flex items-center space-x-2">
                    <RadioGroupItem value={temp} id={`temp-${temp}`} />
                    <Label htmlFor={`temp-${temp}`} className="cursor-pointer">
                      {temp}°C {temp === "400" && "(custom)"}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Optional Add-ons</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hardened" 
                    checked={config.hardenedNozzle}
                    onCheckedChange={(c) => setConfig({ ...config, hardenedNozzle: c as boolean })}
                  />
                  <Label htmlFor="hardened" className="cursor-pointer">Hardened Nozzle</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="highflow" 
                    checked={config.highFlowSetup}
                    onCheckedChange={(c) => setConfig({ ...config, highFlowSetup: c as boolean })}
                  />
                  <Label htmlFor="highflow" className="cursor-pointer">High-Flow Setup</Label>
                </div>
                {isLargeModel && (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="pellet" 
                      checked={config.pelletExtruder}
                      onCheckedChange={(c) => setConfig({ ...config, pelletExtruder: c as boolean })}
                    />
                    <Label htmlFor="pellet" className="cursor-pointer">Pellet Extruder</Label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 4. Multi-Color & Multi-Material (AMS) */}
      <AccordionItem value="ams" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-primary" />
            <span className="font-semibold">4. Multi-Color & Multi-Material (AMS)</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Fixed Specifications</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Material Switching: Automatic</li>
              <li>• AMS Compatibility: PLA, PETG, ABS, ASA</li>
              <li>• Smart Filament Detection: Yes</li>
              <li>• Application: Prototypes, Branding, Visual Parts</li>
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>AMS Type</Label>
              <RadioGroup 
                value={config.amsType} 
                onValueChange={(v) => setConfig({ ...config, amsType: v })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="external" id="ams-ext" />
                  <Label htmlFor="ams-ext" className="cursor-pointer">External</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="integrated" id="ams-int" />
                  <Label htmlFor="ams-int" className="cursor-pointer">Integrated</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Supported Colors</Label>
              <RadioGroup 
                value={config.supportedColors} 
                onValueChange={(v) => setConfig({ ...config, supportedColors: v })}
                className="flex gap-4"
              >
                {["2", "4", "8"].map((n) => (
                  <div key={n} className="flex items-center space-x-2">
                    <RadioGroupItem value={n} id={`colors-${n}`} />
                    <Label htmlFor={`colors-${n}`} className="cursor-pointer">{n}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Optional Add-ons</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="ams4" checked={config.ams4Color} onCheckedChange={(c) => setConfig({ ...config, ams4Color: c as boolean })} />
                <Label htmlFor="ams4" className="cursor-pointer">4-Color AMS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="ams8" checked={config.ams8Color} onCheckedChange={(c) => setConfig({ ...config, ams8Color: c as boolean })} />
                <Label htmlFor="ams8" className="cursor-pointer">8-Color AMS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="multimat" checked={config.multiMaterial} onCheckedChange={(c) => setConfig({ ...config, multiMaterial: c as boolean })} />
                <Label htmlFor="multimat" className="cursor-pointer">Multi-Material Printing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="amsdryer" checked={config.amsFilamentDryer} onCheckedChange={(c) => setConfig({ ...config, amsFilamentDryer: c as boolean })} />
                <Label htmlFor="amsdryer" className="cursor-pointer">AMS + Filament Dryer</Label>
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor="spoolCap">Spool Capacity</Label>
              <Select value={config.spoolCapacity} onValueChange={(v) => setConfig({ ...config, spoolCapacity: v })}>
                <SelectTrigger className="w-full sm:w-48 mt-1">
                  <SelectValue placeholder="Select capacity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1kg">1 kg</SelectItem>
                  <SelectItem value="2kg">2 kg</SelectItem>
                  <SelectItem value="3kg">3 kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 5. Build Platform & Bed System */}
      <AccordionItem value="bed" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-primary" />
            <span className="font-semibold">5. Build Platform & Bed System</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Fixed Specifications</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Bed Type: Magnetic Spring Steel</li>
              <li>• Bed Leveling: Fully Automatic</li>
              <li>• Z Compensation: Active</li>
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Bed Surface</Label>
              <RadioGroup value={config.bedSurface} onValueChange={(v) => setConfig({ ...config, bedSurface: v })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pei_smooth" id="bed-smooth" />
                  <Label htmlFor="bed-smooth" className="cursor-pointer">PEI Smooth</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pei_textured" id="bed-textured" />
                  <Label htmlFor="bed-textured" className="cursor-pointer">PEI Textured</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Bed Heating</Label>
              <RadioGroup value={config.bedHeating} onValueChange={(v) => setConfig({ ...config, bedHeating: v })}>
                {["100", "110", "150"].map((t) => (
                  <div key={t} className="flex items-center space-x-2">
                    <RadioGroupItem value={t} id={`heat-${t}`} />
                    <Label htmlFor={`heat-${t}`} className="cursor-pointer">{t}°C</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {isLargeModel && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bedReinforce" 
                checked={config.largeBedReinforcement}
                onCheckedChange={(c) => setConfig({ ...config, largeBedReinforcement: c as boolean })}
              />
              <Label htmlFor="bedReinforce" className="cursor-pointer">Large Bed Reinforcement (DFT 400/500)</Label>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* 6. Enclosure & Thermal Control */}
      <AccordionItem value="enclosure" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">6. Enclosure & Thermal Control</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Fixed Specifications</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Enclosure: Fully Enclosed</li>
              <li>• Passive Chamber Temp: Up to 65°C</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label>Panel Material</Label>
            <RadioGroup value={config.panelMaterial} onValueChange={(v) => setConfig({ ...config, panelMaterial: v })} className="flex flex-wrap gap-4">
              {[
                { value: "polycarbonate", label: "Polycarbonate" },
                { value: "glass", label: "Glass" },
                { value: "metal", label: "Metal" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`panel-${opt.value}`} />
                  <Label htmlFor={`panel-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Optional Add-ons</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="activeheat" checked={config.activeChamberHeating} onCheckedChange={(c) => setConfig({ ...config, activeChamberHeating: c as boolean })} />
                <Label htmlFor="activeheat" className="cursor-pointer">Active Chamber Heating</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="hepa" checked={config.hepaFilter} onCheckedChange={(c) => setConfig({ ...config, hepaFilter: c as boolean })} />
                <Label htmlFor="hepa" className="cursor-pointer">HEPA + Carbon Filter</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="noise" checked={config.noiseReduction} onCheckedChange={(c) => setConfig({ ...config, noiseReduction: c as boolean })} />
                <Label htmlFor="noise" className="cursor-pointer">Noise Reduction Panels</Label>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 7. Material Compatibility */}
      <AccordionItem value="materials" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-primary" />
            <span className="font-semibold">7. Material Compatibility</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Supported (Fixed)</h4>
            <div className="flex flex-wrap gap-2">
              {["PLA / PLA+", "PETG", "ABS", "ASA"].map((mat) => (
                <span key={mat} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> {mat}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Optional Materials</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="tpu" checked={config.tpuFlexible} onCheckedChange={(c) => setConfig({ ...config, tpuFlexible: c as boolean })} />
                <Label htmlFor="tpu" className="cursor-pointer">TPU / Flexible</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="nylon" checked={config.nylonPa} onCheckedChange={(c) => setConfig({ ...config, nylonPa: c as boolean })} />
                <Label htmlFor="nylon" className="cursor-pointer">Nylon (PA)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cfgf" checked={config.cfGfFilled} onCheckedChange={(c) => setConfig({ ...config, cfGfFilled: c as boolean })} />
                <Label htmlFor="cfgf" className="cursor-pointer">CF / GF Filled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="engpoly" checked={config.engineeringPolymers} onCheckedChange={(c) => setConfig({ ...config, engineeringPolymers: c as boolean })} />
                <Label htmlFor="engpoly" className="cursor-pointer">Engineering Polymers (Custom)</Label>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 8. Electronics & Control System */}
      <AccordionItem value="electronics" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-primary" />
            <span className="font-semibold">8. Electronics & Control System</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <RadioGroup value={config.electronicsTier} onValueChange={(v) => setConfig({ ...config, electronicsTier: v })} className="flex flex-wrap gap-4 mb-4">
            {["standard", "optional", "advanced"].map((tier) => (
              <div key={tier} className="flex items-center space-x-2">
                <RadioGroupItem value={tier} id={`elec-${tier}`} />
                <Label htmlFor={`elec-${tier}`} className="capitalize cursor-pointer">{tier}</Label>
              </div>
            ))}
          </RadioGroup>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Standard</TableHead>
                  <TableHead>Optional</TableHead>
                  <TableHead>Advanced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className="font-medium">Controller</TableCell><TableCell>32-bit</TableCell><TableCell>Industrial board</TableCell><TableCell>Custom</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Drivers</TableCell><TableCell>TMC2209</TableCell><TableCell>—</TableCell><TableCell>Closed-loop</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Firmware</TableCell><TableCell>Klipper</TableCell><TableCell>Tuned Klipper</TableCell><TableCell>Custom</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Display</TableCell><TableCell>LCD</TableCell><TableCell>Touchscreen</TableCell><TableCell>Industrial HMI</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Connectivity</TableCell><TableCell>USB</TableCell><TableCell>Wi-Fi</TableCell><TableCell>Ethernet</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Camera</TableCell><TableCell>Optional</TableCell><TableCell>Standard</TableCell><TableCell>Multi-cam</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 9. Accuracy & Print Quality */}
      <AccordionItem value="accuracy" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary" />
            <span className="font-semibold">9. Accuracy & Print Quality</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <RadioGroup value={config.accuracyTier} onValueChange={(v) => setConfig({ ...config, accuracyTier: v })} className="flex gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="standard" id="acc-std" />
              <Label htmlFor="acc-std" className="cursor-pointer">Standard</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="high_precision" id="acc-high" />
              <Label htmlFor="acc-high" className="cursor-pointer">High Precision</Label>
            </div>
          </RadioGroup>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Standard</TableHead>
                  <TableHead>High Precision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className="font-medium">Layer Height</TableCell><TableCell>50–300 μm</TableCell><TableCell>20–200 μm</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">XY Accuracy</TableCell><TableCell>±0.15 mm</TableCell><TableCell>±0.1 mm</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Input Shaping</TableCell><TableCell>Optional</TableCell><TableCell>Standard</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Vibration Damping</TableCell><TableCell>Standard</TableCell><TableCell>Advanced</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 10. Safety & Reliability */}
      <AccordionItem value="safety" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">10. Safety & Reliability</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Included (Fixed)</h4>
            <div className="flex flex-wrap gap-2">
              {["Thermal Runaway Protection", "Filament Runout Sensor", "Power Loss Recovery", "Industrial PSU (Meanwell)"].map((f) => (
                <span key={f} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> {f}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="estop" checked={config.emergencyStop} onCheckedChange={(c) => setConfig({ ...config, emergencyStop: c as boolean })} />
            <Label htmlFor="estop" className="cursor-pointer">Emergency Stop</Label>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 11. Accessories & Add-ons */}
      <AccordionItem value="accessories" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-primary" />
            <span className="font-semibold">11. Accessories & Add-ons</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="fdryer" checked={config.filamentDryer} onCheckedChange={(c) => setConfig({ ...config, filamentDryer: c as boolean })} />
              <Label htmlFor="fdryer" className="cursor-pointer">Filament Dryer</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="mcdryer" checked={config.multiChamberDryer} onCheckedChange={(c) => setConfig({ ...config, multiChamberDryer: c as boolean })} />
              <Label htmlFor="mcdryer" className="cursor-pointer">Multi-chamber Dryer</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="stand" checked={config.printerStand} onCheckedChange={(c) => setConfig({ ...config, printerStand: c as boolean })} />
              <Label htmlFor="stand" className="cursor-pointer">Fixed Printer Stand (Heavy-duty MS)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="toolstore" checked={config.toolStorage} onCheckedChange={(c) => setConfig({ ...config, toolStorage: c as boolean })} />
              <Label htmlFor="toolstore" className="cursor-pointer">Tool Storage</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="sparenozzle" checked={config.spareNozzleKit} onCheckedChange={(c) => setConfig({ ...config, spareNozzleKit: c as boolean })} />
              <Label htmlFor="sparenozzle" className="cursor-pointer">Spare Nozzle Kit</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="calibkit" checked={config.calibrationKit} onCheckedChange={(c) => setConfig({ ...config, calibrationKit: c as boolean })} />
              <Label htmlFor="calibkit" className="cursor-pointer">Calibration Kit</Label>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 12. Installation, Training & Support */}
      <AccordionItem value="support" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-semibold">12. Installation, Training & Support</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Included (Fixed)</h4>
            <div className="flex flex-wrap gap-2">
              {["On-site Installation", "1 Year Warranty", "2 Years Support"].map((f) => (
                <span key={f} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> {f}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Optional Training & AMC</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="cadtrain" checked={config.cadSlicerTraining} onCheckedChange={(c) => setConfig({ ...config, cadSlicerTraining: c as boolean })} />
                <Label htmlFor="cadtrain" className="cursor-pointer">CAD + Slicer Training (3-Day)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="advtrain" checked={config.advancedMaterialTraining} onCheckedChange={(c) => setConfig({ ...config, advancedMaterialTraining: c as boolean })} />
                <Label htmlFor="advtrain" className="cursor-pointer">Advanced Material Training</Label>
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor="amc">AMC Plan</Label>
              <Select value={config.amcPlan} onValueChange={(v) => setConfig({ ...config, amcPlan: v })}>
                <SelectTrigger className="w-full sm:w-48 mt-1">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default PrinterConfiguration;
