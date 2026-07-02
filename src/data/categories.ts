import agriculture from "@/assets/categories/agriculture.jpg";
import survey from "@/assets/categories/survey.jpg";
import surveillance from "@/assets/categories/surveillance.jpg";
import defence from "@/assets/categories/defence.jpg";
import mining from "@/assets/categories/mining.jpg";
import research from "@/assets/categories/research.jpg";
import training from "@/assets/categories/training.jpg";
import education from "@/assets/categories/education.jpg";
import printers from "@/assets/categories/3d-printers.jpg";

export interface CategoryDef {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  intro: string;
  /** Applications / use-cases shown as feature cards */
  applications: { title: string; description: string }[];
  /** Key differentiators */
  keyFeatures: { title: string; description: string }[];
  industries: string[];
  specifications: { label: string; value: string }[];
  /** Gallery image URLs (fallback to hero image if empty) */
  gallery?: string[];
  faqs: { q: string; a: string }[];
  /** Match key against products.categories.name or blog tag */
  matchKey: string;
  /** Accent color used across the category hero + CTAs */
  accent: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: "agriculture",
    title: "Agriculture",
    tagline: "Precision Farming Reimagined",
    description: "Precision spraying, crop health monitoring and smart farming solutions.",
    image: agriculture,
    matchKey: "agriculture",
    accent: "#ff6b00",
    intro:
      "Purpose-built agricultural UAV platforms for precision spraying, crop health analytics and end-to-end smart farming operations across India.",
    applications: [
      { title: "Crop Spraying", description: "Uniform pesticide application with variable-rate control." },
      { title: "Precision Farming", description: "Data-driven decisions across every acre of your operation." },
      { title: "Fertilizer Spraying", description: "Targeted nutrient delivery for maximum yield efficiency." },
      { title: "Crop Monitoring", description: "NDVI/multispectral mapping to detect stress before it spreads." },
      { title: "Smart Farming Solutions", description: "End-to-end digital agriculture from sowing to harvest." },
    ],
    keyFeatures: [
      { title: "DGCA Type Certified", description: "Fully compliant with Indian drone regulations." },
      { title: "Swappable Payloads", description: "10L / 16L / 20L tanks with quick-release mounts." },
      { title: "RTK Precision", description: "Centimeter-grade positioning for repeatable spray paths." },
      { title: "AI Flight Planning", description: "Autonomous mission planning with obstacle avoidance." },
    ],
    industries: ["Agri-Cooperatives", "Plantations", "Contract Farming", "Agri-Input Companies"],
    specifications: [
      { label: "Payload", value: "10L / 16L / 20L" },
      { label: "Spray Width", value: "Up to 7 m" },
      { label: "Flow Rate", value: "Up to 8 L/min" },
      { label: "Endurance", value: "15–22 min" },
    ],
    faqs: [
      { q: "Are your agri drones DGCA compliant?", a: "Yes. All platforms are Type Certified and comply with DGCA drone rules." },
      { q: "Do you offer training?", a: "Yes, we bundle DGCA-approved RPTO training with every enterprise deployment." },
      { q: "What is the coverage per battery?", a: "Between 4–7 acres per charge depending on payload and terrain." },
    ],
  },
  {
    slug: "survey",
    title: "Survey & Mapping",
    tagline: "Survey-Grade Aerial Intelligence",
    description: "High-accuracy aerial surveying, mapping and GIS intelligence.",
    image: survey,
    matchKey: "survey",
    accent: "#00b8d9",
    intro:
      "Photogrammetry and LiDAR-ready UAV systems delivering survey-grade accuracy for infrastructure, urban planning and natural resources.",
    applications: [
      { title: "GIS Mapping", description: "High-resolution orthomosaics and 3D city models for GIS." },
      { title: "Land Survey", description: "Centimeter-level DEMs, contours and cadastral outputs." },
      { title: "Construction Survey", description: "Progress tracking, as-built vs design, and BIM integration." },
      { title: "Mining Survey", description: "Volumetrics, pit progression and haul-road analytics." },
      { title: "Corridor Mapping", description: "Highways, railways, transmission lines and pipelines." },
    ],
    keyFeatures: [
      { title: "RTK / PPK Ready", description: "≤ 3 cm horizontal accuracy without ground control." },
      { title: "LiDAR & Multispec", description: "Interchangeable RGB, LiDAR and multispectral payloads." },
      { title: "Long Endurance", description: "40–55 min flight time covering up to 5 km² per sortie." },
      { title: "Processed Deliverables", description: "Orthos, DTM/DSM, contours and 3D meshes." },
    ],
    industries: ["Infrastructure", "Government", "Urban Planning", "Utilities"],
    specifications: [
      { label: "Accuracy", value: "≤ 3 cm RTK/PPK" },
      { label: "Coverage", value: "Up to 5 km² / flight" },
      { label: "Sensors", value: "RGB / LiDAR / Multispec" },
      { label: "Endurance", value: "40–55 min" },
    ],
    faqs: [
      { q: "Do you provide processed deliverables?", a: "Yes — orthomosaics, DTM/DSM, contours and 3D meshes." },
      { q: "Can you integrate with our BIM/GIS stack?", a: "Yes, outputs are compatible with Autodesk, Bentley, ArcGIS and QGIS." },
    ],
  },
  {
    slug: "surveillance",
    title: "Surveillance",
    tagline: "24/7 Aerial Situational Awareness",
    description: "Real-time aerial intelligence for security, inspection and monitoring.",
    image: surveillance,
    matchKey: "surveillance",
    accent: "#7c3aed",
    intro:
      "Persistent aerial surveillance platforms with EO/IR payloads for critical infrastructure, perimeter security and industrial inspection.",
    applications: [
      { title: "Border Security", description: "Persistent overwatch with encrypted real-time video links." },
      { title: "Police", description: "Rapid deployment for search, pursuit and public safety missions." },
      { title: "Smart Cities", description: "Traffic monitoring, crowd analytics and event security." },
      { title: "Disaster Monitoring", description: "First-look aerial imagery for incident commanders." },
      { title: "Industrial Security", description: "Automated perimeter patrols with anomaly detection." },
    ],
    keyFeatures: [
      { title: "EO/IR Gimbal", description: "30× optical + thermal payload for 24/7 operations." },
      { title: "Encrypted Data-Link", description: "AES-256 command and video encryption up to 15 km." },
      { title: "Auto Patrol Missions", description: "Scheduled autonomous patrols with alert triggers." },
      { title: "Ruggedized Airframe", description: "IP54 sealed for rain, dust and coastal environments." },
    ],
    industries: ["Energy", "Public Safety", "Ports", "Enterprise Security"],
    specifications: [
      { label: "Payload", value: "EO/IR gimbal" },
      { label: "Zoom", value: "30× optical" },
      { label: "Endurance", value: "45–90 min" },
      { label: "Link Range", value: "Up to 15 km" },
    ],
    faqs: [
      { q: "Can it operate at night?", a: "Yes, thermal payloads support 24/7 operations." },
      { q: "Is the link encrypted?", a: "Yes, AES-256 encryption on both command and video channels." },
    ],
  },
  {
    slug: "defence",
    title: "Defence",
    tagline: "Mission-Ready. Made in India.",
    description: "Mission-ready UAV platforms built for defence and homeland security.",
    image: defence,
    matchKey: "defence",
    accent: "#dc2626",
    intro:
      "Indigenous defence UAV systems engineered for ISR, tactical operations and homeland security under India's Make-in-India initiative.",
    applications: [
      { title: "Tactical UAVs", description: "Micro, mini and small-class UAS for frontline operations." },
      { title: "ISR Missions", description: "Intelligence, surveillance and reconnaissance at any scale." },
      { title: "Mission Planning", description: "Encrypted GCS with multi-vehicle command capability." },
      { title: "Defence Research", description: "Partnership with DRDO labs for next-gen platforms." },
      { title: "Military Applications", description: "Border patrol, S&R, logistics resupply and overwatch." },
    ],
    keyFeatures: [
      { title: "Indigenous Design", description: "Designed, built and supported entirely in India." },
      { title: "AES-256 Encrypted", description: "Military-grade encryption on all comms." },
      { title: "Extended Endurance", description: "From 60 min tactical to 6-hour ISR platforms." },
      { title: "Modular Payloads", description: "EO/IR, SIGINT, comms-relay and delivery." },
    ],
    industries: ["Armed Forces", "Paramilitary", "Homeland Security", "Coast Guard"],
    specifications: [
      { label: "Class", value: "Micro / Mini / Small UAS" },
      { label: "Endurance", value: "60 min – 6 hrs" },
      { label: "Comms", value: "Encrypted AES-256" },
      { label: "MTOW", value: "2 – 25 kg" },
    ],
    faqs: [
      { q: "Are systems indigenously designed?", a: "Yes — designed, built and supported in India." },
      { q: "Do you support export?", a: "Export approvals handled case-by-case in coordination with MoD." },
    ],
  },
  {
    slug: "mining",
    title: "Mining",
    tagline: "Volumes, Safety, Insight",
    description: "Stockpile measurement, volumetric analysis and mining inspections.",
    image: mining,
    matchKey: "mining",
    accent: "#f59e0b",
    intro:
      "Mining-grade drone workflows for volumetrics, haul-road planning and safety inspections across open-pit and quarry operations.",
    applications: [
      { title: "Volume Calculation", description: "Audit-grade weekly volume reports for stockpiles." },
      { title: "Pit Inspection", description: "Highwall, bench and slope condition monitoring." },
      { title: "Safety Monitoring", description: "Automated risk detection and change analysis." },
      { title: "Terrain Mapping", description: "High-resolution DEMs for planning and design." },
      { title: "Stockpile Analysis", description: "Reconcile production reports with reality." },
    ],
    keyFeatures: [
      { title: "±2 cm PPK Accuracy", description: "Reliable enough for financial reconciliation." },
      { title: "Fast Site Coverage", description: "Up to 300 ha per flight for weekly cycles." },
      { title: "GIS-Ready Outputs", description: "Ortho, DEM, contours and volume reports." },
      { title: "Turnkey Service", description: "Weekly or monthly retainers with dashboards." },
    ],
    industries: ["Coal", "Iron Ore", "Cement", "Aggregates"],
    specifications: [
      { label: "Accuracy", value: "±2 cm PPK" },
      { label: "Coverage", value: "Up to 300 ha / flight" },
      { label: "Deliverables", value: "Ortho, DEM, Volumes" },
      { label: "Reporting", value: "Weekly / Monthly" },
    ],
    faqs: [
      { q: "Can we integrate with our GIS?", a: "Yes — outputs are compatible with all major GIS platforms." },
      { q: "Do you provide turnkey monitoring?", a: "Yes — weekly/monthly retainers with online dashboards." },
    ],
  },
  {
    slug: "research",
    title: "Research & Development",
    tagline: "From Concept to Certified Product",
    description: "Innovative UAV platforms engineered and developed in India.",
    image: research,
    matchKey: "research",
    accent: "#06b6d4",
    intro:
      "In-house R&D capability spanning airframe design, avionics, autonomy and payload integration — engineered end-to-end in India.",
    applications: [
      { title: "Custom UAV Development", description: "Bespoke airframes tuned to your mission profile." },
      { title: "Payload Integration", description: "Sensor fusion, gimbals and comms integration." },
      { title: "AI Research", description: "On-board perception, detection and classification." },
      { title: "Autonomous Systems", description: "Full-stack autonomy from planning to control." },
      { title: "Prototype Development", description: "Rapid iteration from CAD to certified prototype." },
    ],
    keyFeatures: [
      { title: "CAD/CFD/FEA", description: "Full digital engineering pipeline." },
      { title: "In-house Prototyping", description: "CNC, 3D print and composite lay-up." },
      { title: "PX4 / ROS 2", description: "Open, extensible autopilot and robotics stack." },
      { title: "Flight Test Range", description: "In-house range for structured flight testing." },
    ],
    industries: ["Startups", "Research Labs", "OEMs", "Universities"],
    specifications: [
      { label: "Design", value: "CAD / CFD / FEA" },
      { label: "Prototyping", value: "CNC / 3D Print / Composite" },
      { label: "Software", value: "PX4 / ROS 2" },
      { label: "Testing", value: "In-house flight range" },
    ],
    faqs: [
      { q: "Do you take on custom projects?", a: "Yes — from concept to certified product." },
      { q: "How long does a typical program take?", a: "3–12 months depending on certification scope." },
    ],
  },
  {
    slug: "training",
    title: "Drone Training",
    tagline: "DGCA Certified Pilots. Enterprise Ready.",
    description: "Professional drone pilot training and enterprise skill development.",
    image: training,
    matchKey: "training",
    accent: "#10b981",
    intro:
      "DGCA-approved RPTO delivering world-class pilot training, instructor certification and enterprise upskilling programs.",
    applications: [
      { title: "DGCA Training", description: "Government-recognized Remote Pilot Certificate program." },
      { title: "Pilot Certification", description: "Small and Medium class ratings on modern platforms." },
      { title: "Industrial Training", description: "Vertical-specific programs for agri, survey, mining." },
      { title: "Corporate Training", description: "Custom curricula built for enterprise teams." },
      { title: "Hands-on Workshops", description: "Weekend and week-long practical skill sessions." },
    ],
    keyFeatures: [
      { title: "DGCA RPTO Approved", description: "Certificate issued via DigitalSky." },
      { title: "Modern Fleet", description: "Latest platforms across all supported classes." },
      { title: "Experienced Instructors", description: "Ex-forces and industry-veteran trainers." },
      { title: "Placement Support", description: "Direct pipeline into partner enterprises." },
    ],
    industries: ["Government", "Enterprise", "Individual Pilots", "Institutions"],
    specifications: [
      { label: "Approval", value: "DGCA RPTO" },
      { label: "Duration", value: "5 – 10 days" },
      { label: "Ratings", value: "Small / Medium" },
      { label: "Certification", value: "Remote Pilot Certificate" },
    ],
    faqs: [
      { q: "Is the certificate government-recognized?", a: "Yes — issued via DigitalSky under DGCA." },
      { q: "Do you help with placement?", a: "Yes — through our enterprise partner network." },
    ],
  },
  {
    slug: "educational",
    title: "Educational Drones",
    tagline: "STEM Learning That Takes Flight",
    description: "STEM learning kits and educational UAV platforms for institutions.",
    image: education,
    matchKey: "educational",
    accent: "#8b5cf6",
    intro:
      "End-to-end drone STEM programs for schools, colleges and Atal Tinkering Labs — from beginner kits to advanced research platforms.",
    applications: [
      { title: "STEM Kits", description: "Age-appropriate build-and-fly experiences for every level." },
      { title: "Robotics", description: "Robotics + drone convergence programs." },
      { title: "Drone Labs", description: "Turnkey drone innovation labs for institutions." },
      { title: "School & College Programs", description: "Curricula aligned with CBSE, AICTE and NEP." },
      { title: "DIY Drone Kits", description: "Self-paced assembly kits for hobbyists and clubs." },
    ],
    keyFeatures: [
      { title: "Curriculum Included", description: "Teacher handbooks, lesson plans and video content." },
      { title: "DGCA Nano/Micro", description: "Compliant with student-flying regulations." },
      { title: "Teacher Training", description: "On-site and online educator upskilling." },
      { title: "Competition Support", description: "Inter-school and inter-college drone events." },
    ],
    industries: ["Schools", "Colleges", "ATL Labs", "Skill Centers"],
    specifications: [
      { label: "Level", value: "Beginner → Advanced" },
      { label: "Contents", value: "Airframe + Electronics + Curriculum" },
      { label: "Support", value: "On-site & Online" },
      { label: "Compliance", value: "DGCA Nano / Micro" },
    ],
    faqs: [
      { q: "Do you supply full labs?", a: "Yes — from kits to full drone innovation labs." },
      { q: "Is teacher training included?", a: "Yes — every lab includes onboarding and refreshers." },
    ],
  },
  {
    slug: "3d-printers",
    title: "3D Printers",
    tagline: "Industrial Additive Manufacturing",
    description: "Industrial & educational 3D printers, prototyping and manufacturing services.",
    image: printers,
    matchKey: "3d",
    accent: "#ff6b00",
    intro:
      "Industrial-grade FDM and resin 3D printers, rapid prototyping services and end-to-end additive manufacturing for R&D, education and production.",
    applications: [
      { title: "Industrial 3D Printers", description: "Large-format FDM and resin platforms for production." },
      { title: "Educational 3D Printers", description: "Safe, plug-and-play printers for classrooms and labs." },
      { title: "Rapid Prototyping", description: "Iterate from CAD to functional prototype in hours." },
      { title: "Product Development", description: "Full-cycle industrial design and validation." },
      { title: "Reverse Engineering", description: "3D scan → mesh → parametric CAD workflows." },
      { title: "Custom Manufacturing", description: "Low-volume production of complex geometries." },
      { title: "3D Printing Services", description: "Print-on-demand FDM, SLA, SLS and more." },
      { title: "Materials & Filaments", description: "PLA, PETG, ABS, TPU, nylon, carbon-fibre composites." },
    ],
    keyFeatures: [
      { title: "Enclosed Chamber", description: "Consistent thermal control for engineering-grade parts." },
      { title: "Multi-Material", description: "Dual-extrusion and soluble-support options." },
      { title: "Cloud Print Management", description: "Fleet management for schools and factories." },
      { title: "In-house Print Farm", description: "24/7 print service backed by our own production." },
    ],
    industries: ["Manufacturing", "Automotive", "Education", "Healthcare"],
    specifications: [
      { label: "Build Volume", value: "Up to 500 × 500 × 600 mm" },
      { label: "Accuracy", value: "±0.05 mm layer" },
      { label: "Materials", value: "PLA / PETG / ABS / TPU / Nylon-CF" },
      { label: "Interface", value: "Touchscreen + Cloud" },
    ],
    faqs: [
      { q: "Do you offer print-on-demand?", a: "Yes — upload your STL and get a quote within hours." },
      { q: "What materials do you support?", a: "PLA, PETG, ABS, TPU, nylon and carbon-fibre composites." },
      { q: "Do you support education pricing?", a: "Yes — dedicated education bundles for schools and colleges." },
    ],
  },
];

export const getCategoryBySlug = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug);
