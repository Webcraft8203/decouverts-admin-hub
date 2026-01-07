import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Factory, Printer, Plane, ArrowRight, ShieldCheck, Cpu, Scale, Award, Settings, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Manufacturing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#F7F9FC] to-[#EEF2F7] font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-slate-200/60">
        {/* Abstract Industrial Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
             style={{ 
               backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }}>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-2xl relative">
              {/* Decorative blur behind text */}
              <div className="absolute -inset-4 bg-white/40 backdrop-blur-sm rounded-3xl -z-10 shadow-sm border border-white/50 opacity-0 md:opacity-100" />

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold tracking-widest uppercase mb-6 shadow-sm">
                <Factory className="w-3 h-3" />
                Industrial Division
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
                Manufacturing <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600">Excellence</span>
              </h1>
              
              <p className="text-xl md:text-2xl font-medium text-slate-700 mb-6">
                Advanced Industrial Solutions
              </p>
              
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed mb-8 font-medium">
                Precision manufacturing solutions built for reliability, scalability, and real-world industrial deployment. We engineer the future of production.
              </p>

              <div className="flex flex-wrap gap-4">
                 <Button 
                    onClick={() => document.getElementById('offerings')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-slate-900 hover:bg-slate-800 hover:shadow-orange-500/20 text-white h-12 px-8 rounded-lg shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-0.5"
                  >
                    Explore Solutions
                  </Button>
              </div>
            </div>

            {/* Right Visual - Abstract Industrial Composition */}
            <div className="relative hidden lg:block h-[500px] w-full">
               {/* Decorative Elements simulating a blueprint/schematic view */}
               <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 to-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden">
                  {/* Grid overlay inside card */}
                  <div className="absolute inset-0 opacity-[0.05]" 
                       style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                  </div>

                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Settings className="w-40 h-40 text-slate-900 animate-[spin_60s_linear_infinite]" />
                  </div>
                  <div className="absolute bottom-0 left-0 p-8 opacity-5">
                    <Cpu className="w-32 h-32 text-slate-900" />
                  </div>
                  
                  {/* Central Graphic */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-80 h-80">
                      {/* Pulsing Ring */}
                      <div className="absolute inset-0 border border-orange-500/20 rounded-full animate-ping opacity-20 duration-[3s]"></div>
                      <div className="absolute inset-4 border border-slate-200 rounded-full"></div>
                      
                      {/* Rotating Orbit */}
                      <div className="absolute inset-[-20px] border border-dashed border-slate-300 rounded-full animate-[spin_20s_linear_infinite]"></div>
                      
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-32 h-32 bg-white rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] flex items-center justify-center border border-slate-100">
                            <Factory className="w-16 h-16 text-slate-800" />
                        </div>
                      </div>

                      {/* Floating badges */}
                      <div className="absolute top-0 right-0 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 animate-bounce duration-[4000ms]">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Printer className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-900">DFT Series</div>
                            <div className="text-[10px] text-slate-500 font-medium">Ready to deploy</div>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-10 left-0 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 animate-bounce duration-[5000ms] delay-700">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Plane className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-900">Drone Sys</div>
                            <div className="text-[10px] text-slate-500 font-medium">Tactical Grade</div>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Manufacturing Offerings */}
      <section id="offerings" className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Core Capabilities</h2>
             <div className="h-1 w-20 bg-orange-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Card 1: DFT Series */}
            <Card className="border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-orange-500/30 transition-all duration-500 bg-white/80 backdrop-blur-md overflow-hidden group rounded-[24px] relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-slate-50/50 opacity-50"></div>
              <CardContent className="p-0 flex flex-col h-full relative z-10">
                <div className="p-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-8">
                      <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                        <Printer className="w-8 h-8 text-orange-600" />
                      </div>
                      <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Additive Mfg
                      </div>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                    DFT Series
                  </h3>
                  <p className="text-sm font-medium text-orange-600 mb-6 uppercase tracking-wide">Industrial 3D Printers</p>
                  
                  <div className="h-px w-full bg-gradient-to-r from-slate-200 to-transparent mb-6"></div>

                  <p className="text-slate-600 mb-8 leading-relaxed text-lg font-medium">
                    Configurable, industrial-grade 3D printing systems designed for precision manufacturing, R&D, and production environments.
                  </p>
                  
                  <div className="space-y-4 mb-12 flex-grow">
                    {[
                      "Large-format & industrial build volumes",
                      "High-precision mechanical systems",
                      "Multi-material capability",
                      "Designed & manufactured in India"
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 group/item">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0 group-hover/item:text-orange-600 transition-colors" />
                        <span className="text-slate-700 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => navigate("/printer-configuration")} 
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white h-14 px-8 text-base rounded-xl shadow-lg shadow-slate-900/10 group-hover:shadow-orange-500/20 group-hover:translate-y-[-2px] transition-all"
                  >
                    Explore DFT Series
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Drone Systems */}
            <Card className="border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-blue-500/30 transition-all duration-500 bg-white/80 backdrop-blur-md overflow-hidden group rounded-[24px] relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-slate-50/50 opacity-50"></div>
              <CardContent className="p-0 flex flex-col h-full relative z-10">
                <div className="p-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-8">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                        <Plane className="w-8 h-8 text-slate-700" />
                      </div>
                      <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Aerospace
                      </div>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                    Drone Systems
                  </h3>
                  <p className="text-sm font-medium text-blue-600 mb-6 uppercase tracking-wide">Manufacturing Platform</p>

                  <div className="h-px w-full bg-gradient-to-r from-slate-200 to-transparent mb-6"></div>
                  
                  <p className="text-slate-600 mb-8 leading-relaxed text-lg font-medium">
                    Custom-built drone platforms engineered for surveillance, industrial, and strategic applications.
                  </p>
                  
                  <div className="space-y-4 mb-12 flex-grow">
                    {[
                      "Custom airframe & payload integration",
                      "Industrial & government-focused use cases",
                      "Emphasis on reliability and control systems",
                      "Indigenous design & development"
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 group/item">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0 group-hover/item:text-blue-600 transition-colors" />
                        <span className="text-slate-700 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => navigate("/drone-configuration")} 
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white h-14 px-8 text-base rounded-xl shadow-lg shadow-slate-900/10 group-hover:shadow-blue-500/20 group-hover:translate-y-[-2px] transition-all"
                  >
                    Explore Drone Systems
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 px-4 bg-white border-t border-slate-100 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-16 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <div className="text-orange-600 font-bold tracking-wider uppercase text-sm mb-2">Why Choose Us</div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Industrial Advantage</h2>
            </div>
            <p className="text-slate-500 max-w-md text-lg">
                Engineered for performance, built for scale. Our manufacturing standards meet the highest industrial requirements.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Precision Engineering", icon: Cpu, desc: "Micron-level accuracy in every component." },
              { title: "Industrial Quality", icon: ShieldCheck, desc: "Rigorous testing for 24/7 reliability." },
              { title: "Indigenous IP", icon: Award, desc: "100% owned design and development." },
              { title: "Scalable Production", icon: Scale, desc: "From prototype to mass manufacturing." },
            ].map((item, i) => (
              <div key={i} className="flex flex-col p-8 rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 opacity-50"></div>
                
                <div className="w-14 h-14 rounded-xl bg-orange-50/50 border border-orange-100/50 flex items-center justify-center text-orange-600 shadow-sm mb-6 group-hover:scale-110 group-hover:bg-orange-50 transition-all relative z-10">
                  <item.icon className="w-7 h-7" />
                </div>
                
                <h4 className="font-bold text-slate-900 text-xl mb-3 relative z-10">{item.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed relative z-10 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Manufacturing;
