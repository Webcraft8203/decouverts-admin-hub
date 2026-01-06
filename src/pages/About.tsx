import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Check, Target, Cpu, BookOpen, Rocket, Shield, Globe, Lightbulb, Award } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-primary/20">
      <PublicNavbar />
      
      <main className="flex-1 pt-16 md:pt-20 overflow-hidden">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 px-4 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-slate-50"></div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide mb-6 border border-blue-100">
                EST. 2023
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                ABOUT <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">DECOUVERTS</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 font-light max-w-3xl mx-auto leading-relaxed">
                Discovering Future Technologies. <br className="hidden md:block" />
                <span className="font-medium text-slate-800">Engineering India’s future</span> through indigenous research and innovation.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Company Overview */}
        <section className="py-20 px-4 max-w-6xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">Decouvertes Future Tech Pvt. Ltd.</h2>
                <div className="h-1 w-20 bg-blue-600 mb-6 rounded-full"></div>
                <p className="text-lg text-slate-600 leading-relaxed text-justify">
                  We are an Indian research and development–driven technology company dedicated to designing, developing, and manufacturing indigenous, future-ready engineering solutions. Our foundation is built on deep R&D, strong product engineering, and long-term technology ownership, aligned with the national vision of <span className="font-semibold text-slate-900">Make in India</span> and <span className="font-semibold text-slate-900">Atmanirbhar Bharat</span>.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Indigenous R&D", icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50" },
                  { label: "Future Ready", icon: Rocket, color: "text-blue-500", bg: "bg-blue-50" },
                  { label: "Engineering", icon: Cpu, color: "text-indigo-500", bg: "bg-indigo-50" },
                  { label: "Nation First", icon: Globe, color: "text-emerald-500", bg: "bg-emerald-50" },
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-transform hover:scale-105`}>
                    <item.icon className={`w-8 h-8 ${item.color}`} />
                    <span className="font-semibold text-slate-700 text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* R&D Journey Timeline */}
        <section className="py-20 px-4 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
             <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="absolute left-0 bottom-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Research, Engineering & Manufacturing</h2>
              <p className="text-slate-400">Our journey from concept to industrial reality</p>
            </div>

            <div className="relative">
              {/* Desktop Horizontal Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -translate-y-1/2"></div>
              
              <div className="grid md:grid-cols-3 gap-8 md:gap-4">
                {[
                  { year: "2023", title: "Inception", desc: "Start of 3D printer R&D and core engineering team formation." },
                  { year: "2025", title: "Realization", desc: "R&D completion. Launch of Decouverte Series: DFT 250, 350, 400, 500.", highlight: true },
                  { year: "2026", title: "Expansion", desc: "Drone prototype launch & advanced aerospace research." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    className="relative flex flex-col items-center text-center group"
                  >
                    <div className={`w-16 h-16 rounded-full border-4 ${item.highlight ? 'border-blue-500 bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'border-slate-700 bg-slate-800 group-hover:border-blue-500'} flex items-center justify-center z-10 transition-colors duration-300 mb-6`}>
                      <span className="font-bold text-lg">{item.year}</span>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700 w-full hover:bg-slate-800 transition-colors">
                      <h3 className="text-xl font-bold text-blue-400 mb-2">{item.title}</h3>
                      <p className="text-slate-300 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Skill Development & Drone R&D Grid */}
        <section className="py-20 px-4 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Skill Development */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-lg text-green-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Skill Development</h2>
              </div>
              <ul className="space-y-4">
                {[
                  "Hands-on industry-oriented programs",
                  "Focus on real machines & tools",
                  "100% placement record",
                  "Bridging academia ↔ industry"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Drone R&D */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  <Rocket className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Drone & Aerospace</h2>
              </div>
              <p className="text-slate-600 mb-4">
                Expansion during 2025–2026 with the first drone prototype scheduled for 2026.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  "Surveillance", "Security", "Infrastructure", "Strategic Alignment"
                ].map((tag, i) => (
                  <span key={i} className="px-3 py-2 bg-slate-50 text-slate-600 text-sm font-medium rounded-lg border border-slate-100 text-center">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Philosophy</h2>
              <h3 className="text-5xl font-black text-slate-100 absolute top-4 right-4 -z-10 select-none">DISCOVERY</h3>
              
              <div className="text-2xl font-serif italic text-blue-600 mb-6">"Decouvertes" = Discovery</div>
              
              <p className="text-lg text-slate-600 mb-8">
                We focus on Research, Experimentation, and Engineering excellence. Our long-term goal is to ensure IP & patents remain in India, fostering national ownership & global competitiveness.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 px-4 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl text-white shadow-xl shadow-blue-200"
            >
              <Target className="w-12 h-12 mb-6 text-blue-200" />
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-blue-100 text-lg leading-relaxed">
                To design, develop, and manufacture indigenous technologies through deep research and engineering excellence.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50"
            >
              <Globe className="w-12 h-12 mb-6 text-indigo-600" />
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                To become a globally recognized Indian R&D company with complete IP ownership in India.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Core Focus Areas */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Core Focus Areas</h2>
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
            >
              {[
                { title: "Industrial 3D Printers", icon: Cpu },
                { title: "R&D Product Dev", icon: Lightbulb },
                { title: "Drone Systems", icon: Rocket },
                { title: "Skill Training", icon: BookOpen },
                { title: "Indigenous IP", icon: Shield }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  variants={fadeInUp}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all text-center flex flex-col items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="font-semibold text-slate-700 text-sm">{item.title}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Leadership */}
        <section className="py-20 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Leadership & Directors</h2>
            <p className="text-slate-500">Guided by visionaries committed to Indian innovation</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                name: "Mr. Omprakash Soni", 
                role: "Chairperson", 
                desc: "Strategic vision, R&D-first culture, Make in India alignment." 
              },
              { 
                name: "Mr. Soni", 
                role: "Director", 
                desc: "Technical leadership, DFT Series development, Drones & emerging tech." 
              },
              { 
                name: "Ms. Natasha Soni", 
                role: "Director", 
                desc: "Operations & governance, Process efficiency, Compliance & scalability." 
              }
            ].map((leader, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{leader.name}</h3>
                <p className="text-blue-600 font-medium text-sm mb-4 uppercase tracking-wider">{leader.role}</p>
                <p className="text-slate-600 text-sm leading-relaxed">{leader.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Governance & Ethics */}
        <section className="py-16 px-4 bg-slate-900 text-white">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-400" />
                Governance & Ethics
              </h2>
              <p className="text-slate-400 mb-6">
                We believe in ethical engineering and responsible innovation. Our processes are structured to ensure quality, safety, and transparency at every level.
              </p>
            </div>
            <div className="md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["Ethical Engineering", "Responsible Innovation", "Quality & Safety", "Transparency"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <Check className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Decouvertes & Roadmap */}
        <section className="py-20 px-4 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Why Decouvertes */}
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Why Decouvertes?</h2>
              <div className="space-y-4">
                {[
                  "100% Indigenous R&D",
                  "Designed & Developed in India",
                  "Patent & IP Ownership Focus",
                  "Product-First Engineering",
                  "Industry & Government-Ready"
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Award className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-800">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Roadmap */}
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Future Roadmap</h2>
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-8 py-2">
                {[
                  "Expansion of 3D printer portfolio",
                  "Government drone systems",
                  "IP & patent pipeline",
                  "Advanced manufacturing technologies"
                ].map((item, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-600 shadow-sm"></span>
                    <p className="text-lg font-medium text-slate-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Closing Statement */}
        <section className="py-24 px-4 text-center bg-gradient-to-b from-slate-50 to-white border-t border-slate-100">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Decouvertes Future Tech Pvt. Ltd.</h3>
            <p className="text-slate-500 mb-8 max-w-2xl mx-auto">
              Discovering Future Technologies. Engineering for India. Innovating for the Nation.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-orange-50 text-orange-700 rounded-full font-bold border border-orange-100">
              <span>Jai Hind</span>
              <span className="text-xl">🇮🇳</span>
            </div>
          </motion.div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
};

export default About;