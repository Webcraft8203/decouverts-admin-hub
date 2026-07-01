import agriculture from "@/assets/categories/agriculture.jpg";
import survey from "@/assets/categories/survey.jpg";
import surveillance from "@/assets/categories/surveillance.jpg";
import defence from "@/assets/categories/defence.jpg";
import mining from "@/assets/categories/mining.jpg";
import research from "@/assets/categories/research.jpg";
import training from "@/assets/categories/training.jpg";
import education from "@/assets/categories/education.jpg";

export interface CategoryDef {
  slug: string;
  title: string;
  description: string;
  image: string;
  intro: string;
  applications: { title: string; description: string }[];
  industries: string[];
  specifications: { label: string; value: string }[];
  faqs: { q: string; a: string }[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: "agriculture",
    title: "Agriculture",
    description:
      "Precision spraying, crop health monitoring and smart farming solutions.",
    image: agriculture,
    intro:
      "Purpose-built agricultural UAV platforms for precision spraying, crop health analytics and end-to-end smart farming operations across India.",
    applications: [
      { title: "Precision Spraying", description: "Uniform pesticide and fertilizer application with variable-rate control." },
      { title: "Crop Health Analytics", description: "NDVI/multispectral mapping to detect stress before it spreads." },
      { title: "Field Scouting", description: "Rapid situational awareness across hundreds of acres." },
      { title: "Yield Estimation", description: "Data-driven forecasting for planning and logistics." },
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
    ],
  },
  {
    slug: "survey",
    title: "Survey & Mapping",
    description: "High-accuracy aerial surveying, mapping and GIS intelligence.",
    image: survey,
    intro:
      "Photogrammetry and LiDAR-ready UAV systems delivering survey-grade accuracy for infrastructure, urban planning and natural resources.",
    applications: [
      { title: "Topographic Survey", description: "Centimeter-level DEMs and contour maps." },
      { title: "Corridor Mapping", description: "Highways, railways, transmission lines and pipelines." },
      { title: "Urban Planning", description: "3D city models and orthomosaics for GIS." },
      { title: "Volumetrics", description: "Precise stockpile and earthwork calculations." },
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
    ],
  },
  {
    slug: "surveillance",
    title: "Surveillance",
    description: "Real-time aerial intelligence for security, inspection and monitoring.",
    image: surveillance,
    intro:
      "Persistent aerial surveillance platforms with EO/IR payloads for critical infrastructure, perimeter security and industrial inspection.",
    applications: [
      { title: "Perimeter Security", description: "Automated patrol missions with anomaly detection." },
      { title: "Asset Inspection", description: "Refineries, towers, dams and transmission lines." },
      { title: "Event Monitoring", description: "Real-time crowd and traffic intelligence." },
      { title: "Rapid Response", description: "First-look aerial imagery for incident commanders." },
    ],
    industries: ["Energy", "Public Safety", "Ports", "Enterprise Security"],
    specifications: [
      { label: "Payload", value: "EO/IR gimbal" },
      { label: "Zoom", value: "30× optical" },
      { label: "Endurance", value: "45–90 min" },
      { label: "Link Range", value: "Up to 15 km" },
    ],
    faqs: [{ q: "Can it operate at night?", a: "Yes, thermal payloads support 24/7 operations." }],
  },
  {
    slug: "defence",
    title: "Defence",
    description: "Mission-ready UAV platforms built for defence and homeland security.",
    image: defence,
    intro:
      "Indigenous defence UAV systems engineered for ISR, tactical operations and homeland security under India's Make-in-India initiative.",
    applications: [
      { title: "ISR", description: "Intelligence, surveillance and reconnaissance." },
      { title: "Border Patrol", description: "Long-endurance persistent overwatch." },
      { title: "Search & Rescue", description: "Rapid deployment in hostile terrain." },
      { title: "Logistics", description: "Autonomous supply drops to forward positions." },
    ],
    industries: ["Armed Forces", "Paramilitary", "Homeland Security", "Coast Guard"],
    specifications: [
      { label: "Class", value: "Micro / Mini / Small UAS" },
      { label: "Endurance", value: "60 min – 6 hrs" },
      { label: "Comms", value: "Encrypted AES-256" },
      { label: "MTOW", value: "2 – 25 kg" },
    ],
    faqs: [{ q: "Are systems indigenously designed?", a: "Yes — designed, built and supported in India." }],
  },
  {
    slug: "mining",
    title: "Mining",
    description: "Stockpile measurement, volumetric analysis and mining inspections.",
    image: mining,
    intro:
      "Mining-grade drone workflows for volumetrics, haul-road planning and safety inspections across open-pit and quarry operations.",
    applications: [
      { title: "Stockpile Volumetrics", description: "Weekly volume reports with audit-grade accuracy." },
      { title: "Pit Progression", description: "Track excavation vs. plan over time." },
      { title: "Haul Road Analysis", description: "Slope and grade optimization." },
      { title: "Safety Inspection", description: "Highwall and bench monitoring." },
    ],
    industries: ["Coal", "Iron Ore", "Cement", "Aggregates"],
    specifications: [
      { label: "Accuracy", value: "±2 cm PPK" },
      { label: "Coverage", value: "Up to 300 ha / flight" },
      { label: "Deliverables", value: "Ortho, DEM, Volumes" },
      { label: "Reporting", value: "Weekly / Monthly" },
    ],
    faqs: [{ q: "Can we integrate with our GIS?", a: "Yes — outputs are compatible with all major GIS platforms." }],
  },
  {
    slug: "research",
    title: "Research & Development",
    description: "Innovative UAV platforms engineered and developed in India.",
    image: research,
    intro:
      "In-house R&D capability spanning airframe design, avionics, autonomy and payload integration — engineered end-to-end in India.",
    applications: [
      { title: "Airframe Design", description: "Composite and additive manufacturing." },
      { title: "Avionics", description: "Custom flight controllers and firmware." },
      { title: "Autonomy Stack", description: "Perception, planning and control." },
      { title: "Payload Integration", description: "Sensor fusion for bespoke missions." },
    ],
    industries: ["Startups", "Research Labs", "OEMs", "Universities"],
    specifications: [
      { label: "Design", value: "CAD / CFD / FEA" },
      { label: "Prototyping", value: "CNC / 3D Print / Composite" },
      { label: "Software", value: "PX4 / ROS 2" },
      { label: "Testing", value: "In-house flight range" },
    ],
    faqs: [{ q: "Do you take on custom projects?", a: "Yes — from concept to certified product." }],
  },
  {
    slug: "training",
    title: "Training",
    description: "Professional drone pilot training and enterprise skill development.",
    image: training,
    intro:
      "DGCA-approved RPTO delivering world-class pilot training, instructor certification and enterprise upskilling programs.",
    applications: [
      { title: "Small Class Rating", description: "DGCA-approved 5–7 day program." },
      { title: "Instructor Certification", description: "Train-the-trainer pathway." },
      { title: "Enterprise Programs", description: "Custom curricula for teams." },
      { title: "Recurrent Training", description: "Skill refreshers and audits." },
    ],
    industries: ["Government", "Enterprise", "Individual Pilots", "Institutions"],
    specifications: [
      { label: "Approval", value: "DGCA RPTO" },
      { label: "Duration", value: "5 – 10 days" },
      { label: "Ratings", value: "Small / Medium" },
      { label: "Certification", value: "Remote Pilot Certificate" },
    ],
    faqs: [{ q: "Is the certificate government-recognized?", a: "Yes — issued via DigitalSky under DGCA." }],
  },
  {
    slug: "education",
    title: "Educational Drones",
    description: "STEM learning kits and educational UAV platforms for institutions.",
    image: education,
    intro:
      "End-to-end drone STEM programs for schools, colleges and Atal Tinkering Labs — from beginner kits to advanced research platforms.",
    applications: [
      { title: "Assembly Kits", description: "Hands-on build and fly experience." },
      { title: "Curriculum", description: "Aligned with CBSE / AICTE / NEP." },
      { title: "Teacher Training", description: "Empower educators with drone literacy." },
      { title: "Competitions", description: "Inter-school and inter-college events." },
    ],
    industries: ["Schools", "Colleges", "ATL Labs", "Skill Centers"],
    specifications: [
      { label: "Level", value: "Beginner → Advanced" },
      { label: "Contents", value: "Airframe + Electronics + Curriculum" },
      { label: "Support", value: "On-site & Online" },
      { label: "Compliance", value: "DGCA Nano / Micro" },
    ],
    faqs: [{ q: "Do you supply full labs?", a: "Yes — from kits to full drone innovation labs." }],
  },
];

export const getCategoryBySlug = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug);
