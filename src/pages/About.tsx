import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { 
  Check, Target, Cpu, BookOpen, Rocket, Shield, Globe, 
  Lightbulb, Award, Zap, Users, ArrowRight, CheckCircle2 
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

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

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-orange-100 selection:text-orange-900">
      <PublicNavbar />
      
      <main className="flex-1 pt-16 md:pt-20 overflow-hidden">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 px-4 overflow-hidden bg-slate-50">
           {/* Background patterns */}
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
           <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(249,115,22,0.1),transparent)]"></div>
           
           <div className="max-w-7xl mx-auto relative z-10">
             <div className="text-center max-w-4xl mx-auto mb-16">
               <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                 <span className="inline-block py-1 px-3 rounded-full bg-orange-50 text-orange-600 text-xs font-bold tracking-widest uppercase mb-6 border border-orange-100">
                   Since 2023
                 </span>
                 <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                   About <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">Decouverts</span>
                 </h1>
                 <p className="text-xl md:text-2xl text-slate-600 font-light leading-relaxed">
                   Discovering Future Technologies. <br className="hidden md:block" />
                   <span className="font-medium text-slate-900">Engineering India’s future</span> through indigenous research and innovation.
                 </p>
               </motion.div>
             </div>

             {/* Intro Card */}
             <motion.div 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.7 }}
               className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden"
             >
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
               <div className="grid md:grid-cols-2 gap-12 items-center">
                 <div>
                   <h2 className="text-3xl font-bold text-slate-900 mb-6">Pioneering Indigenous Tech</h2>
                   <p className="text-lg text-slate-600 leading-relaxed text-justify">
                     We are an Indian research and development–driven technology company dedicated to designing, developing, and manufacturing indigenous, future-ready engineering solutions. Our foundation is built on deep R&D, strong product engineering, and long-term technology ownership, aligned with the national vision of <span className="font-semibold text-slate-900">Make in India</span> and <span className="font-semibold text-slate-900">Atmanirbhar Bharat</span>.
                   </p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   {[
                     { label: "Indigenous R&D", icon: Lightbulb, color: "text-amber-600", bg: "bg-amber-50" },
                     { label: "Future Ready", icon: Rocket, color: "text-blue-600", bg: "bg-blue-50" },
                     { label: "Engineering Driven", icon: Cpu, color: "text-indigo-600", bg: "bg-indigo-50" },
                     { label: "Nation First", icon: Globe, color: "text-emerald-600", bg: "bg-emerald-50" },
                   ].map((item, i) => (
                     <div key={i} className={`${item.bg} p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-transform hover:scale-105 border border-transparent hover:border-slate-200`}>
                       <item.icon className={`w-8 h-8 ${item.color}`} />
                       <span className="font-bold text-slate-800 text-sm">{item.label}</span>
                     </div>
                   ))}
                 </div>
               </div>
             </motion.div>
           </div>
        </section>

        {/* Mission, Vision & Philosophy */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
             <div className="grid md:grid-cols-3 gap-8">
               {/* Mission */}
               <motion.div 
                 whileHover={{ y: -5 }}
                 className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-200 relative overflow-hidden group"
               >
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Target className="w-32 h-32" />
                 </div>
                 <div className="relative z-10">
                   <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                     <Target className="w-6 h-6 text-white" />
                   </div>
                   <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                   <p className="text-blue-100 leading-relaxed">
                     To design, develop, and manufacture indigenous technologies through deep research and engineering excellence, reducing dependency on imports.
                   </p>
                 </div>
               </motion.div>

               {/* Vision */}
               <motion.div 
                 whileHover={{ y: -5 }}
                 className="p-8 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-200 relative overflow-hidden group"
               >
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Globe className="w-32 h-32" />
                 </div>
                 <div className="relative z-10">
                   <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                     <Globe className="w-6 h-6 text-white" />
                   </div>
                   <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                   <p className="text-orange-100 leading-relaxed">
                     To become a globally recognized Indian R&D company with complete IP ownership in India, fostering national technological sovereignty.
                   </p>
                 </div>
               </motion.div>

               {/* Philosophy */}
               <motion.div 
                 whileHover={{ y: -5 }}
                 className="p-8 rounded-3xl bg-slate-900 text-white shadow-lg shadow-slate-400 relative overflow-hidden group"
               >
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Lightbulb className="w-32 h-32" />
                 </div>
                 <div className="relative z-10">
                   <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                     <Lightbulb className="w-6 h-6 text-white" />
                   </div>
                   <h3 className="text-2xl font-bold mb-4">Our Philosophy</h3>
                   <p className="text-slate-400 leading-relaxed">
                     "Decouvertes" means Discovery. We believe in ethical engineering, responsible innovation, and creating value that stands the test of time.
                   </p>
                 </div>
               </motion.div>
             </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-24 px-4 bg-slate-900 text-white overflow-hidden relative">
           {/* Background effects */}
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900 via-transparent to-slate-900"></div>

           <div className="max-w-7xl mx-auto relative z-10">
             <div className="text-center mb-20">
               <span className="text-orange-500 font-bold tracking-widest uppercase text-sm">Our Journey</span>
               <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-6">From Concept to Reality</h2>
               <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                 A timeline of our relentless pursuit of engineering excellence.
               </p>
             </div>

             <div className="relative">
               {/* Connecting Line (Desktop) */}
               <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-800"></div>
               
               <div className="grid md:grid-cols-3 gap-12">
                 {[
                   { year: "2023", title: "Inception", desc: "Foundation laid. Start of 3D printer R&D and core engineering team formation.", active: false },
                   { year: "2025", title: "Realization", desc: "R&D completion. Launch of Decouverte Series: DFT 250, 350, 400, 500.", active: true },
                   { year: "2026", title: "Expansion", desc: "Drone prototype launch & advanced aerospace research initiatives.", active: false }
                 ].map((item, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, y: 30 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.2 }}
                     className="relative flex flex-col items-center text-center group"
                   >
                     <div className={`w-24 h-24 rounded-full border-8 ${item.active ? 'border-orange-500/30 bg-orange-600 shadow-[0_0_30px_rgba(249,115,22,0.4)]' : 'border-slate-800 bg-slate-800 group-hover:border-orange-500/20'} flex items-center justify-center z-10 transition-all duration-500 mb-8`}>
                       <span className="font-bold text-xl md:text-2xl">{item.year}</span>
                     </div>
                     <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 w-full hover:bg-slate-800 transition-all hover:-translate-y-1 hover:border-orange-500/30">
                       <h3 className={`text-xl font-bold mb-3 ${item.active ? 'text-orange-400' : 'text-white'}`}>{item.title}</h3>
                       <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                     </div>
                   </motion.div>
                 ))}
               </div>
             </div>
           </div>
        </section>

        {/* Leadership Section */}
        <section className="py-24 px-4 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-orange-600 font-bold tracking-widest uppercase text-sm bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Leadership</span>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-4 mb-6">Guided by Visionaries</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                Our leadership team combines decades of experience with a passion for indigenous innovation.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  name: "Mr. Omprakash Soni", 
                  role: "Chairperson", 
                  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces",
                  bio: "Strategic vision, R&D-first culture, and alignment with national goals." 
                },
                { 
                  name: "Mr. Soni", 
                  role: "Director", 
                  image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces",
                  bio: "Technical leadership driving the development of DFT Series and emerging tech." 
                },
                { 
                  name: "Ms. Natasha Soni", 
                  role: "Director", 
                  image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces",
                  bio: "Operations, governance, and ensuring scalability with compliance." 
                }
              ].map((leader, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-100 group"
                >
                  <div className="h-64 overflow-hidden relative bg-slate-200">
                    <img 
                      src={leader.image} 
                      alt={leader.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60"></div>
                    <div className="absolute bottom-0 left-0 p-6 text-white">
                      <p className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">{leader.role}</p>
                      <h3 className="text-2xl font-bold">{leader.name}</h3>
                    </div>
                  </div>
                  <div className="p-8">
                    <p className="text-slate-600 leading-relaxed">{leader.bio}</p>
                    <div className="mt-6 pt-6 border-t border-slate-100 flex gap-4">
                      {/* Social icons placeholders */}
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
                        <Globe className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Decouvertes & Roadmap */}
        <section className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Why Decouvertes */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Why Choose Decouvertes?</h2>
                <div className="space-y-6">
                  {[
                    { title: "100% Indigenous R&D", desc: "Designed & Developed in India, for the world." },
                    { title: "Patent & IP Ownership", desc: "Focus on creating intellectual property within the nation." },
                    { title: "Product-First Engineering", desc: "Solutions built for reliability and industrial scale." },
                    { title: "Industry & Government Ready", desc: "Compliant with strategic and industrial standards." }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-5"
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0 mt-1">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                        <p className="text-slate-600">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Roadmap */}
              <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100">
                <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <Rocket className="w-8 h-8 text-orange-600" />
                  Future Roadmap
                </h2>
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-10 pl-8 py-2">
                  {[
                    "Expansion of industrial 3D printer portfolio",
                    "Development of government-grade drone systems",
                    "Strengthening IP & patent pipeline",
                    "Advanced manufacturing technologies integration"
                  ].map((item, i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-slate-300 shadow-sm"></span>
                      <p className="text-lg font-medium text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-10 pt-8 border-t border-slate-200">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl">
                    Partner With Us <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Closing Statement */}
        <section className="py-20 px-4 text-center bg-gradient-to-b from-white to-slate-50 border-t border-slate-100">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-8 rotate-3">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-6">Decouvertes Future Tech Pvt. Ltd.</h3>
            <p className="text-slate-600 text-lg mb-10 leading-relaxed">
              We are not just building machines; we are building capabilities. <br/>
              Discovering Future Technologies. Engineering for India. Innovating for the Nation.
            </p>
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-white rounded-full shadow-lg border border-slate-100">
              <span className="font-bold text-slate-900 tracking-widest uppercase">Jai Hind</span>
              <span className="text-2xl">🇮🇳</span>
            </div>
          </motion.div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
};

export default About;
