import { useEffect, useRef } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { BreadcrumbSchema } from "@/components/SEOSchemas";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import {
  Target, Cpu, Rocket, Globe,
  Lightbulb, Award, Zap, ArrowRight, CheckCircle2,
  Microscope, Factory, ShieldCheck, BadgeCheck,
  Printer, Plane, PenTool, Search, Hammer, Package, Layers, Settings, Download, FileText,
  type LucideIcon,
} from "lucide-react";
import { motion, useInView, animate } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const Counter = ({ from, to, suffix = "" }: { from: number; to: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView && ref.current) {
      const controls = animate(from, to, {
        duration: 2.5,
        ease: "easeOut",
        onUpdate(value) {
          if (ref.current) {
            ref.current.textContent = Math.floor(value).toString() + suffix;
          }
        },
      });
      return () => controls.stop();
    }
  }, [from, to, inView, suffix]);

  return <span ref={ref}>{from}{suffix}</span>;
};

/* ---------- Shared vocabulary: eyebrow label ---------- */
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-3">
    <span className="h-px w-10 bg-primary" />
    <span className="text-primary font-semibold tracking-[0.2em] text-xs uppercase">{children}</span>
    <span className="h-px w-10 bg-primary" />
  </span>
);

/* ---------- Shared vocabulary: spec panel card ---------- */
const SpecCard = ({
  index,
  icon: Icon,
  title,
  description,
  accent = false,
}: {
  index?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: boolean;
}) => (
  <motion.div
    variants={fadeInUp}
    whileHover={{ y: -4 }}
    className="group relative rounded-lg hairline bg-card elevation-1 p-7 transition-all duration-300 hover:elevation-2 hover:border-primary/30 overflow-hidden"
  >
    {accent && <span className="absolute top-0 left-7 right-7 h-[2px] bg-primary/70" />}
    <div className="flex items-start justify-between mb-6">
      <div className="w-12 h-12 rounded-md hairline bg-background flex items-center justify-center group-hover:border-primary/40 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      {index && (
        <span className="font-display text-xs tracking-[0.2em] text-muted-foreground tabular-nums">
          {index}
        </span>
      )}
    </div>
    <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
  </motion.div>
);

/* ---------- Shared vocabulary: flight-log node (timeline) ---------- */
const FlightLogNode = ({
  year,
  title,
  description,
  active,
}: {
  year: string;
  title: string;
  description: string;
  active: boolean;
}) => (
  <motion.div
    variants={fadeInUp}
    className="relative flex flex-col items-center text-center"
  >
    <div
      className={cn(
        "w-16 h-16 border-2 flex items-center justify-center mb-8 font-display font-bold text-base tabular-nums z-10 transition-all duration-500",
        active
          ? "bg-primary border-primary text-white"
          : "bg-[hsl(var(--dark-surface-elevated))] border-white/10 text-white/70"
      )}
    >
      {year}
    </div>
    <div
      className={cn(
        "w-full rounded-md p-8 border transition-all duration-300 hover:-translate-y-1",
        active ? "bg-white/[0.04] border-primary/30" : "bg-white/[0.02] border-white/10 hover:border-white/20"
      )}
    >
      <h3 className={cn("text-xl font-bold mb-3", active ? "text-primary" : "text-white")}>{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const About = () => {
  usePageSEO({
    title: "About Us | Decouvertes",
    description: "Learn about Decouvertes, India's R&D-driven drone technology company designing next-generation UAV platforms.",
    path: "/about",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/15 selection:text-primary">
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "About Us", url: "/about" }]} />
      <PublicNavbar />

      <main className="flex-1 pt-16 md:pt-20 overflow-hidden">
        {/* Hero Section — light / blueprint */}
        <section className="relative py-20 md:py-28 px-4 bg-background">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                <div className="mb-6 flex justify-center">
                  <Eyebrow>Since 2023</Eyebrow>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight leading-tight">
                  About <span className="text-primary">DECOUVERTES</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
                  Discovering Future Technologies. <br className="hidden md:block" />
                  <span className="font-medium text-foreground">Engineering India's future</span> through indigenous research and innovation.
                </p>
              </motion.div>
            </div>

            {/* Intro Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="rounded-lg hairline bg-card elevation-2 p-8 md:p-12 relative overflow-hidden"
            >
              <span className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-6">Pioneering Indigenous Tech</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We are an Indian research and development–driven technology company dedicated to designing, developing, and manufacturing indigenous, future-ready engineering solutions. Our foundation is built on deep R&D, strong product engineering, and long-term technology ownership, aligned with the national vision of <span className="font-semibold text-foreground">Make in India</span> and <span className="font-semibold text-foreground">Atmanirbhar Bharat</span>.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Indigenous R&D", icon: Lightbulb },
                    { label: "Future Ready", icon: Rocket },
                    { label: "Engineering Driven", icon: Cpu },
                    { label: "Nation First", icon: Globe },
                  ].map((item, i) => (
                    <div key={i} className="rounded-md hairline bg-background p-6 flex flex-col items-center justify-center text-center gap-3 transition-colors hover:border-primary/40">
                      <item.icon className="w-7 h-7 text-primary" />
                      <span className="font-bold text-foreground text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mission, Vision & Philosophy */}
        <section className="py-20 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              <SpecCard
                index="01"
                icon={Target}
                title="Our Mission"
                description="To design, develop, and manufacture indigenous technologies through deep research and engineering excellence, reducing dependency on imports."
                accent
              />
              <SpecCard
                index="02"
                icon={Globe}
                title="Our Vision"
                description="To become a globally recognized Indian R&D company with complete IP ownership in India, fostering national technological sovereignty."
                accent
              />
              <SpecCard
                index="03"
                icon={Lightbulb}
                title="Our Philosophy"
                description={'"Decouvertes" means Discovery. We believe in ethical engineering, responsible innovation, and creating value that stands the test of time.'}
                accent
              />
            </motion.div>
          </div>
        </section>

        {/* Why DECOUVERTES */}
        <section className="py-24 px-4 bg-secondary/40 border-y border-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-5"><Eyebrow>Why Us</Eyebrow></div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why DECOUVERTES?</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Built on the pillars of innovation, integrity, and indigenous engineering.
              </p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                { title: "Indigenous R&D", icon: Microscope, desc: "100% in-house research and development tailored for Indian conditions." },
                { title: "Engineering-First", icon: Cpu, desc: "Solutions driven by core engineering principles, not just assembly." },
                { title: "Industrial-Grade", icon: Factory, desc: "Rugged, reliable systems designed for 24/7 industrial operation." },
                { title: "Long-Term Ownership", icon: ShieldCheck, desc: "Full lifecycle support and ownership of the technology stack." },
                { title: "Made in India", icon: Globe, desc: "Proudly contributing to the Atmanirbhar Bharat initiative." },
                { title: "Quality Assurance", icon: BadgeCheck, desc: "Rigorous testing protocols ensuring global quality standards." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ y: -4 }}
                  className="bg-card p-8 rounded-lg hairline elevation-1 hover:elevation-2 hover:border-primary/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-md hairline bg-background flex items-center justify-center mb-6">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Company Profile Download */}
        <section className="py-24 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="rounded-lg hairline elevation-2 p-8 md:p-12 relative overflow-hidden bg-card"
            >
              <span className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

              <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                <div>
                  <div className="mb-6"><Eyebrow>Corporate Profile</Eyebrow></div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
                    Download Our <br className="hidden md:block" />
                    Company Profile
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    Explore our complete company profile featuring our vision, engineering capabilities, manufacturing expertise, R&D initiatives, products, leadership team, and future roadmap.
                  </p>

                  <ul className="space-y-3 mb-8">
                    {[
                      "Company Overview",
                      "Products & Solutions",
                      "Engineering Capabilities",
                      "Leadership Team",
                      "Future Roadmap"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="font-medium text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <a href="/CompanyProfile.pdf" download="Decouvertes-Company-Profile.pdf" className="inline-block w-full sm:w-auto">
                      <Button className="w-full sm:w-auto bg-foreground hover:bg-foreground/90 text-background h-12 rounded-md px-8 shadow-lg group transition-all">
                        <Download className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                        Download Company Profile
                      </Button>
                    </a>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <FileText className="w-4 h-4" />
                      PDF Document
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex justify-center relative">
                  <motion.div
                    whileHover={{ y: -10 }}
                    className="relative w-full max-w-sm aspect-[3/4] bg-background rounded-md hairline elevation-2 p-6 flex flex-col"
                  >
                    <div className="w-full h-48 bg-secondary/50 rounded-lg mb-6 flex items-center justify-center relative overflow-hidden hairline">
                      <Globe className="w-16 h-16 text-muted-foreground/40" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="h-4 w-3/4 bg-secondary rounded-full"></div>
                      <div className="h-4 w-1/2 bg-secondary rounded-full"></div>
                      <div className="h-4 w-5/6 bg-secondary rounded-full"></div>
                    </div>
                    <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                      <div className="h-8 w-24 bg-primary/5 rounded-lg hairline"></div>
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="absolute -right-5 -top-5 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-display font-bold rotate-12 border-4 border-background text-xs">
                      PDF
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Numbers That Matter */}
        <section className="py-20 px-4 bg-[hsl(var(--dark-surface))] text-white relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
              {[
                { label: "Years of R&D", value: 3, suffix: "+" },
                { label: "Products Developed", value: 30, suffix: "+" },
                { label: "Prototypes Delivered", value: 1000, suffix: "+" },
                { label: "Institutions Served", value: 10, suffix: "+" },
              ].map((item, i) => (
                <div key={i}>
                  <div className="font-display text-4xl md:text-5xl font-bold text-primary mb-2 tabular-nums">
                    <Counter from={0} to={item.value} suffix={item.suffix} />
                  </div>
                  <div className="text-white/50 font-medium">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications & Trust */}
        <section className="py-12 px-4 bg-background border-b border-border">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 items-center">
              {[
                "MSME Registered", "GST Registered", "Make in India", "ISO 9001:2015 Compliant"
              ].map((cert, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-card rounded-full hairline">
                  <BadgeCheck className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm text-foreground">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology & Capability Stack */}
        <section className="py-24 px-4 bg-secondary/40 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-5"><Eyebrow>Capabilities</Eyebrow></div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Technology Stack</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Leveraging advanced tools and indigenous expertise to deliver end-to-end engineering solutions.
              </p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
            >
              {[
                { title: "CAD/CAM", icon: Settings, desc: "Advanced design & manufacturing modeling." },
                { title: "FEA & Simulation", icon: Layers, desc: "Structural & thermal analysis." },
                { title: "Rapid Prototyping", icon: Zap, desc: "Fast-track product development." },
                { title: "3D Printing", icon: Printer, desc: "Industrial additive manufacturing." },
                { title: "Drone Systems", icon: Plane, desc: "UAV design & flight control." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ y: -4 }}
                  className="bg-card p-6 rounded-lg hairline elevation-1 hover:elevation-2 hover:border-primary/30 transition-all text-center"
                >
                  <div className="w-12 h-12 rounded-md hairline bg-background flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Our Engineering Approach */}
        <section className="py-24 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-5"><Eyebrow>Process</Eyebrow></div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Engineering Approach</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A systematic workflow ensuring precision, quality, and innovation at every stage.
              </p>
            </div>

            <div className="relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-7 left-0 w-full h-px bg-border"></div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
                {[
                  { step: "01", title: "Analysis", icon: Search, desc: "Requirement gathering & feasibility study." },
                  { step: "02", title: "Design", icon: PenTool, desc: "CAD modeling & simulation (FEA/CFD)." },
                  { step: "03", title: "Prototyping", icon: Hammer, desc: "Rapid iteration & functional testing." },
                  { step: "04", title: "Validation", icon: CheckCircle2, desc: "Rigorous QA & performance benchmarks." },
                  { step: "05", title: "Delivery", icon: Package, desc: "Manufacturing & final deployment." },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 rounded-md bg-background hairline flex items-center justify-center mb-6 relative z-10">
                      <item.icon className="w-6 h-6 text-foreground" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-[10px] font-display font-bold border-2 border-background">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section — flight log */}
        <section className="py-24 px-4 bg-[hsl(var(--dark-surface))] text-white relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <div className="flex justify-center mb-5"><Eyebrow>Our Journey</Eyebrow></div>
              <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-6">From Concept to Reality</h2>
              <p className="text-white/50 max-w-2xl mx-auto text-lg">
                A timeline of our relentless pursuit of engineering excellence.
              </p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="relative"
            >
              <div className="hidden md:block absolute top-8 left-0 w-full h-px bg-white/10"></div>
              <div className="grid md:grid-cols-3 gap-12">
                <FlightLogNode
                  year="2023"
                  title="Inception"
                  description="Foundation laid. Start of 3D printer R&D and core engineering team formation."
                  active={false}
                />
                <FlightLogNode
                  year="2025"
                  title="Realization"
                  description="R&D completion. Launch of Decouverte Series: DFT 250, 350, 400, 500."
                  active={true}
                />
                <FlightLogNode
                  year="2026"
                  title="Expansion"
                  description="Drone prototype launch & advanced aerospace research initiatives."
                  active={false}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Leadership Section */}
        <section className="py-24 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-5"><Eyebrow>Leadership</Eyebrow></div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-6">Guided by Visionaries</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Our leadership team combines decades of experience with a passion for indigenous innovation.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Mr. Omprakash Soni",
                  role: "Chairperson",
                  image: "/OmprakashSoni.png",
                  bio: "Strategic vision, R&D-first culture, and alignment with national goals."
                },
                {
                  name: "Mr.Shivam Soni",
                  role: "Director",
                  image: "/shivamsoni.png",
                  bio: "Technical leadership driving the development of DFT Series and emerging tech."
                },
                {
                  name: "Ms. Natasha Soni",
                  role: "Director",
                  image: "/natashasoni.png",
                  bio: "Operations, governance, and ensuring scalability with compliance."
                }
              ].map((leader, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="bg-card rounded-lg overflow-hidden hairline elevation-1 hover:elevation-2 hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="h-64 overflow-hidden relative bg-secondary">
                    <img
                      src={leader.image}
                      alt={leader.name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-80"></div>
                    <div className="absolute bottom-0 left-0 p-6 text-white">
                      <p className="text-primary font-display font-bold text-xs uppercase tracking-[0.2em] mb-1">{leader.role}</p>
                      <h3 className="text-2xl font-bold">{leader.name}</h3>
                    </div>
                  </div>
                  <div className="p-8">
                    <p className="text-muted-foreground leading-relaxed">{leader.bio}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="py-24 px-4 bg-secondary/40 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-lg hairline bg-card elevation-1 p-8 md:p-12">
              <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3 justify-center">
                <Rocket className="w-8 h-8 text-primary" />
                Future Roadmap
              </h2>
              <div className="relative border-l-2 border-border ml-3 md:ml-10 space-y-10 pl-8 py-2">
                {[
                  "Expansion of industrial 3D printer portfolio",
                  "Development of government-grade drone systems",
                  "Strengthening IP & patent pipeline",
                  "Advanced manufacturing technologies integration"
                ].map((item, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[41px] top-1 w-4 h-4 border-2 border-background bg-primary/70 shadow-sm"></span>
                    <p className="text-lg font-medium text-foreground">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-8 border-t border-border text-center">
                <Button className="bg-foreground hover:bg-foreground/90 text-background h-12 rounded-md px-8">
                  Partner With Us <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Closing Statement */}
        <section className="py-20 px-4 text-center bg-background border-t border-border">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="w-14 h-14 rounded-md hairline bg-card flex items-center justify-center text-primary mx-auto mb-8">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-6">Decouvertes Future Tech Pvt. Ltd.</h3>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              We are not just building machines; we are building capabilities. <br/>
              Discovering Future Technologies. Engineering for India. Innovating for the Nation.
            </p>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full hairline bg-card">
              <span className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/70" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Made in <span className="text-primary">India</span>
              </span>
            </div>
          </motion.div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
};

export default About;
