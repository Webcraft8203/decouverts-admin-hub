import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Phone, MapPin, ChevronDown, 
  CreditCard, FileText, Truck, ShieldCheck, Settings,
  X, HelpCircle, Wrench, Layers, Plane, AlertTriangle, Copyright, Heart, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// --- Help Center Component ---

export const HelpCenterDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full sm:rounded-2xl p-0 gap-0 bg-white overflow-hidden border-none shadow-2xl duration-300">
        <VisuallyHidden>
          <DialogTitle>Help Center</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="bg-slate-950 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-xl font-bold mb-2">How can we help you?</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our dedicated engineering support team is here to assist with technical queries and consultations.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 bg-slate-50/50">
          <a href="mailto:hello@decouvertes.com" className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:border-primary/30 hover:shadow-md transition-all group">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Email Support</h3>
              <p className="text-slate-500 text-xs mt-0.5">hello@decouvertes.com</p>
              <span className="text-[10px] text-blue-600 font-medium mt-1.5 inline-block">Response within 24h</span>
            </div>
          </a>

          <a href="tel:+919561103435" className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:border-primary/30 hover:shadow-md transition-all group">
            <div className="p-2.5 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Phone Support</h3>
              <p className="text-slate-500 text-xs mt-0.5">+91 9561103435</p>
              <span className="text-[10px] text-green-600 font-medium mt-1.5 inline-block">Mon-Sat, 9AM - 7PM IST</span>
            </div>
          </a>

          <div className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-xl">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Office</h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Megapolis Springs, Phase 3, Hinjawadi Rajiv Gandhi Infotech Park, Pune, Maharashtra, India
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Careers Dialog Component ---

export const CareersDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full sm:rounded-2xl p-0 gap-0 bg-white overflow-hidden border-none shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>Careers at Decouverts</DialogTitle>
        </VisuallyHidden>

        <div className="relative overflow-hidden bg-slate-950 p-8 text-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
            
            <div className="relative z-10 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
                <Briefcase className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="relative z-10 text-xl font-bold text-white mb-1">Join Our Team</h2>
            <p className="relative z-10 text-slate-400 text-sm">Build the future of manufacturing with us</p>
        </div>

        <div className="p-8 space-y-6 text-center">
            <p className="text-slate-600 leading-relaxed">
                We are always looking for talented engineers, designers, and innovators. 
                While we don't have specific openings listed here right now, we'd love to hear from you.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-2">Please send your resume and portfolio to:</p>
                <a 
                    href="mailto:careers@decouvertes.com" 
                    className="text-lg font-bold text-primary hover:underline"
                >
                    careers@decouvertes.com
                </a>
            </div>

            <button 
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-colors"
            >
                Close
            </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Made in India Dialog Component ---

export const MadeInIndiaDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full sm:rounded-2xl p-0 gap-0 bg-white overflow-hidden border-none shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>Proudly Made in India</DialogTitle>
        </VisuallyHidden>

        {/* Header with Tricolor Gradient */}
        <div className="relative overflow-hidden bg-slate-50 p-8 text-center border-b border-slate-100">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-white to-green-500" />
            
            <motion.div 
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
                className="relative z-10 mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg border border-slate-100"
            >
                <span className="text-5xl filter drop-shadow-sm">🇮🇳</span>
            </motion.div>
            
            <motion.h2 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 text-2xl font-bold text-slate-900 mb-1"
            >
                Proudly Indian
            </motion.h2>
            <motion.p 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative z-10 text-slate-500 font-medium text-sm"
            >
                Innovating for the World
            </motion.p>
        </div>

        <div className="p-6 space-y-6">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-4 text-center"
            >
                <p className="text-sm text-slate-600 leading-relaxed">
                    Decouverts is built on the foundation of <strong>Atmanirbhar Bharat</strong>. 
                    We design, engineer, and manufacture advanced industrial technologies right here in Pune, India.
                </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 text-center"
                >
                    <div className="text-orange-600 font-bold text-xl mb-1">100%</div>
                    <div className="text-xs text-slate-600 font-medium uppercase tracking-wide">Indigenous R&D</div>
                </motion.div>
                <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="p-4 bg-green-50/50 rounded-xl border border-green-100 text-center"
                >
                    <div className="text-green-600 font-bold text-xl mb-1">Global</div>
                    <div className="text-xs text-slate-600 font-medium uppercase tracking-wide">Standards</div>
                </motion.div>
            </div>

            <motion.button 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-all hover:shadow-lg hover:shadow-slate-900/20 flex items-center justify-center gap-2 group"
            >
                <Heart className="w-4 h-4 text-red-500 fill-red-500 group-hover:scale-110 transition-transform" /> 
                Jai Hind
            </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Copyright Dialog Component ---

export const CopyrightDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full sm:rounded-2xl p-0 gap-0 bg-white overflow-hidden border-none shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>Copyright & Intellectual Property</DialogTitle>
        </VisuallyHidden>

        <div className="relative overflow-hidden bg-slate-950 p-8 text-center">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
            
            <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative z-10 mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20"
            >
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </motion.div>
            
            <h2 className="relative z-10 text-xl font-bold text-white mb-1">Copyright Notice</h2>
            <p className="relative z-10 text-slate-400 text-sm">Intellectual Property Rights</p>
        </div>

        <div className="p-6 space-y-5">
            <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                    <Copyright className="w-5 h-5 text-slate-400" />
                </div>
                <div className="space-y-2">
                    <p className="text-sm text-slate-700 font-medium">
                        © {new Date().getFullYear()} Decouverts. All rights reserved.
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        The content, design, graphics, and code on this website are the exclusive intellectual property of Decouverts and are protected by international copyright laws.
                    </p>
                </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-xs text-red-700 leading-relaxed font-medium">
                    Unauthorized reproduction, redistribution, or use of any material from this site is strictly prohibited. Legal action will be taken against infringements.
                </p>
            </div>

            <button 
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-colors"
            >
                I Understand
            </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- FAQ Component ---

const faqData = [
  {
    id: "orders",
    question: "Ordering & Payments",
    answer: "We accept major credit cards, UPI, and bank transfers. For enterprise orders, purchase orders (PO) are accepted subject to credit approval. All transactions are secured with industry-standard encryption.",
    icon: CreditCard
  },
  {
    id: "gst",
    question: "GST & Invoicing",
    answer: "All B2B orders receive a GST-compliant tax invoice. You can enter your GSTIN during checkout or provide it to our sales team for custom quotes to claim input tax credit.",
    icon: FileText
  },
  {
    id: "shipping",
    question: "Shipping & Delivery Timelines",
    answer: "Standard shipping takes 3-5 business days across India. Custom 3D printed parts typically require 5-10 days for production and post-processing before dispatch.",
    icon: Truck
  },
  {
    id: "warranty",
    question: "Warranty & Returns",
    answer: "We offer a standard 1-year warranty on all hardware products. Returns are accepted within 14 days for manufacturing defects. Custom fabricated parts are non-returnable unless defective.",
    icon: ShieldCheck
  },
  {
    id: "custom",
    question: "Custom Product Configuration",
    answer: "Use our online configurators for 3D printers and drones to select specific components. For complex industrial requirements not listed, please request a custom quote via the Help Center.",
    icon: Settings
  },
  {
    id: "support",
    question: "Technical Support & Training",
    answer: "We provide comprehensive technical support and training for all our equipment. On-site installation and training packages are available for industrial 3D printers and drone systems.",
    icon: Wrench
  },
  {
    id: "materials",
    question: "Available Materials",
    answer: "Our manufacturing services cover a wide spectrum of materials including engineering-grade thermoplastics (ABS, Nylon, PC), resins, and high-performance composites like Carbon Fiber PEEK.",
    icon: Layers
  },
  {
    id: "drones",
    question: "Drone Regulations & Compliance",
    answer: "Our drone solutions are designed in accordance with DGCA guidelines. We assist customers with documentation required for UIN generation and operational compliance in India.",
    icon: Plane
  }
];

export const FAQDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [expandedId, setExpandedId] = useState<string | null>("orders");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-full sm:rounded-2xl p-0 gap-0 bg-white overflow-hidden border-none shadow-2xl duration-300 flex flex-col max-h-[90vh]">
        <VisuallyHidden>
          <DialogTitle>Frequently Asked Questions</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between shrink-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-sm mt-1">Common questions about our services and policies.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 bg-slate-50/50">
          <div className="space-y-3">
            {faqData.map((item) => {
              const isExpanded = expandedId === item.id;
              const Icon = item.icon;
              
              return (
                <div 
                  key={item.id}
                  className={cn(
                    "bg-white rounded-xl border transition-all duration-200 overflow-hidden",
                    isExpanded ? "border-primary/30 shadow-sm ring-1 ring-primary/10" : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors shrink-0",
                      isExpanded ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={cn(
                      "flex-1 font-semibold text-sm transition-colors",
                      isExpanded ? "text-slate-900" : "text-slate-700"
                    )}>
                      {item.question}
                    </span>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-slate-400 transition-transform duration-300",
                      isExpanded && "rotate-180 text-primary"
                    )} />
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <div className="px-4 pb-4 pl-[4.5rem] pr-6">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex justify-center">
          <p className="text-xs text-slate-500">
            Still have questions? <button onClick={() => { onClose(); /* Logic to open Help Center could go here */ }} className="text-primary font-medium hover:underline">Contact Support</button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};