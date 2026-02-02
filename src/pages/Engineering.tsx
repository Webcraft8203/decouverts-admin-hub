import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { 
  Cog, 
  DraftingCompass, 
  Microscope, 
  Users, 
  Hammer, 
  CheckCircle2, 
  Factory, 
  ShieldCheck, 
  Car, 
  Plane, 
  ShoppingBag,
  FileText,
  Box,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Engineering = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <PublicNavbar />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 px-4 bg-white overflow-hidden">
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
           <div className="max-w-7xl mx-auto relative z-10 text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-widest uppercase mb-6">
                <Cog className="w-3 h-3" />
                Engineering Services
             </div>
             <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
               Engineering & Manufacturing <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Design Support</span>
             </h1>
             <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
               At Decouvertes Future Tech Pvt. Ltd., we help ideas turn into real, manufacturable products. 
               We work closely with startups, manufacturers, and R&D teams to design plastic and metal parts 
               that are practical, reliable, and ready for production.
             </p>
             <div className="flex flex-wrap justify-center gap-4">
               <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 h-12" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>
                 Explore Services
               </Button>
               <Button variant="outline" size="lg" className="rounded-full px-8 h-12" onClick={() => {
                 const message = encodeURIComponent("Hello, I am interested in your Engineering & Manufacturing Design Support services.");
                 window.open(`https://wa.me/919561103435?text=${message}`, '_blank');
               }}>
                 Contact Us
               </Button>
             </div>
           </div>
        </section>

        {/* Philosophy */}
        <section className="py-16 px-4 bg-slate-50 border-y border-slate-200">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Approach</h2>
            <p className="text-lg font-medium text-slate-700 italic">
              "Design it right, validate it early, and make it easy to manufacture."
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section id="services" className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            
            {/* CAD Design */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
              <div className="order-2 md:order-1">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                  <DraftingCompass className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">CAD Design & Manufacturing Drawings</h2>
                <p className="text-slate-600 mb-6 text-lg">
                  Good products start with clear design data. We create clean, well-structured CAD models and drawings that manufacturers can understand and build without guesswork.
                </p>
                <ul className="space-y-3">
                  {[
                    "3D part and assembly modelling",
                    "Logical, easy-to-follow assemblies",
                    "Production-ready 2D drawings",
                    "Proper dimensions and tolerances",
                    "GD&T applied based on function",
                    "Drawing checks to avoid confusion"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 md:order-2 bg-slate-100 rounded-3xl p-8 h-full min-h-[300px] flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
                 <FileText className="w-32 h-32 text-slate-300" />
              </div>
            </div>

            {/* Product Design (Plastic & Metal) */}
            <div className="mb-24">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Plastic & Metal Product Design</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">
                  We design components that work in real life — not just in theory.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Plastic */}
                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <CardHeader>
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2 text-orange-600">
                      <Box className="w-5 h-5" />
                    </div>
                    <CardTitle>Plastic Parts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-4">
                      Created with tooling, assembly, and long-term use in mind.
                    </p>
                    <ul className="space-y-2">
                      {[
                        "Injection-moulded component design",
                        "Smart use of ribs, bosses, snap-fits, and clips",
                        "Controlled wall thickness to reduce defects",
                        "Designs that balance strength, cost, and ease of assembly"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                          <span className="text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Metal */}
                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <CardHeader>
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-2 text-slate-600">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <CardTitle>Metal Parts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-4">
                      Built for strength, durability, and manufacturing efficiency.
                    </p>
                    <ul className="space-y-2">
                      {[
                        "Sheet metal components and enclosures",
                        "Machined and fabricated parts",
                        "Welded and bolted assemblies",
                        "Structural parts designed for real operating loads"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                          <span className="text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Validation & Analysis */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
              <div className="bg-indigo-50 rounded-3xl p-8 h-full min-h-[300px] flex items-center justify-center relative overflow-hidden">
                 <Microscope className="w-32 h-32 text-indigo-200" />
              </div>
              <div>
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                  <Microscope className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Plastic Design Validation & Engineering Analysis</h2>
                <p className="text-slate-600 mb-6 text-lg">
                  Before committing to tooling, we help answer the most important question: “Will this part survive real-world use?”
                </p>
                <ul className="space-y-3">
                  {[
                    "Strength and stiffness checks",
                    "Load and deformation evaluation",
                    "Snap-fit and clip performance assessment",
                    "Assembly load and durability considerations"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-slate-500 italic">
                  Result: Fewer tooling changes, smoother production, and more reliable products.
                </p>
              </div>
            </div>

            {/* Core Engineering & Prototype */}
            <div className="grid md:grid-cols-2 gap-8 mb-24">
               <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Core Engineering Support</h3>
                  <p className="text-slate-600 mb-6">
                    Many of our clients treat us as an extension of their engineering team. We stay involved until the design is ready for the shop floor.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Concept feasibility and early-stage engineering input",
                      "Detailed part and assembly design",
                      "Manufacturing documentation",
                      "Fit, tolerance, and assembly checks",
                      "Engineering support during vendor discussions"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
               </div>

               <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 text-amber-600">
                    <Hammer className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Prototype & Pre-Production</h3>
                  <p className="text-slate-600 mb-6">
                    We help bridge the gap between design and manufacturing.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Functional prototypes for plastic and metal parts",
                      "Design improvements based on testing feedback",
                      "Support during design freeze and pilot builds",
                      "Engineering change handling"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
               </div>
            </div>

            {/* Industries */}
            <div className="mb-24">
              <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Industries We Work With</h2>
              <div className="flex flex-wrap justify-center gap-6">
                {[
                  { name: "Automotive", icon: Car },
                  { name: "Industrial Equipment", icon: Factory },
                  { name: "Drones & Advanced Systems", icon: Plane },
                  { name: "Consumer Products", icon: ShoppingBag },
                  { name: "Defence & R&D", icon: ShieldCheck },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center p-6 bg-white rounded-xl border border-slate-100 shadow-sm w-40 hover:shadow-md transition-all">
                    <item.icon className="w-8 h-8 text-slate-700 mb-3" />
                    <span className="text-sm font-semibold text-slate-900 text-center">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="bg-slate-900 rounded-3xl p-8 md:p-16 text-white">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Why Clients Choose Decouvertes</h2>
                <div className="h-1 w-20 bg-blue-500 mx-auto rounded-full"></div>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { title: "Manufacturing Mindset", desc: "We design with manufacturing in mind from day one." },
                  { title: "Early Validation", desc: "We validate before production, not after problems arise." },
                  { title: "Clear Communication", desc: "We communicate clearly and work collaboratively." },
                  { title: "Risk Reduction", desc: "We reduce tooling risk, cost, and development time." },
                  { title: "End-to-End Support", desc: "We support you from concept to production." },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="font-bold text-lg mb-2 text-blue-400">{item.title}</h3>
                    <p className="text-slate-300 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Engineering;
