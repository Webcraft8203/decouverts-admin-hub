import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, Scale, Lock, RefreshCcw, Truck, Shield, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export type PolicyKey = "terms" | "privacy" | "refund" | "shipping" | "warranty" | "disclaimer";

interface PolicySection {
  heading?: string;
  content: string[];
  bullets?: string[];
}

interface PolicyData {
  title: string;
  lastUpdated: string;
  icon: React.ElementType;
  sections: PolicySection[];
}

const legalContent: Record<PolicyKey, PolicyData> = {
  terms: {
    title: "Terms & Conditions",
    lastUpdated: "January 15, 2024",
    icon: Scale,
    sections: [
      {
        content: ["Welcome to Decouverts. By accessing our website and using our services, you agree to comply with and be bound by the following terms and conditions of use."]
      },
      {
        heading: "1. Service Usage",
        content: ["Our services, including 3D printing, engineering, and drone configuration, are provided for professional and educational use. You agree to use these services only for lawful purposes and in accordance with all applicable laws and regulations."],
      },
      {
        heading: "2. Intellectual Property",
        content: ["All content included on this site, such as text, graphics, logos, button icons, images, and software, is the property of Decouverts or its content suppliers and protected by international copyright laws."],
      },
      {
        heading: "3. User Account",
        content: ["If you use this site, you are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer."],
      }
    ]
  },
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "January 10, 2024",
    icon: Lock,
    sections: [
      {
        content: ["At Decouverts, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information."]
      },
      {
        heading: "Information We Collect",
        content: ["We collect information you provide directly to us, such as when you create an account, make a purchase, or request a quote."],
        bullets: [
          "Name and contact information",
          "Billing and shipping details",
          "Design files and technical specifications",
          "Communication history"
        ]
      },
      {
        heading: "How We Use Your Information",
        content: ["We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you."]
      }
    ]
  },
  refund: {
    title: "Refund & Cancellation",
    lastUpdated: "December 20, 2023",
    icon: RefreshCcw,
    sections: [
      {
        heading: "Custom Orders",
        content: ["Due to the custom nature of 3D printing and engineering services, orders cannot be cancelled once production has begun. Refunds are only provided in cases of manufacturing defects or significant deviation from approved specifications."]
      },
      {
        heading: "Standard Products",
        content: ["For non-custom items (e.g., standard drone parts), we accept returns within 14 days of delivery, provided the items are unused and in original packaging."],
      },
      {
        heading: "Processing Refunds",
        content: ["Approved refunds will be processed within 5-7 business days to the original method of payment."]
      }
    ]
  },
  shipping: {
    title: "Shipping & Delivery",
    lastUpdated: "January 05, 2024",
    icon: Truck,
    sections: [
      {
        heading: "Delivery Timelines",
        content: ["Delivery times vary based on the service type and order volume."],
        bullets: [
          "Standard Products: 3-5 business days",
          "Custom 3D Printing: 5-10 business days (production + shipping)",
          "Engineering Services: As per project agreement"
        ]
      },
      {
        heading: "International Shipping",
        content: ["We ship globally. International customers are responsible for any customs duties or taxes applicable in their country."]
      }
    ]
  },
  warranty: {
    title: "Warranty Policy",
    lastUpdated: "November 15, 2023",
    icon: Shield,
    sections: [
      {
        heading: "Product Warranty",
        content: ["We warrant that our products will be free from defects in material and workmanship for a period of 30 days from the date of delivery for custom parts, and 1 year for standard electronic components."]
      },
      {
        heading: "Exclusions",
        content: ["This warranty does not cover damage resulting from misuse, accident, modification, or improper installation."],
      }
    ]
  },
  disclaimer: {
    title: "Disclaimer",
    lastUpdated: "January 01, 2024",
    icon: AlertCircle,
    sections: [
      {
        content: ["The information provided on this website is for general informational purposes only. While we strive to keep the information up to date and correct, we make no representations or warranties of any kind about the completeness, accuracy, reliability, suitability, or availability with respect to the website or the information, products, services, or related graphics contained on the website."]
      },
      {
        heading: "Engineering Advice",
        content: ["Any technical advice or engineering consultation provided is based on the information supplied by the client. Decouverts is not liable for issues arising from incomplete or inaccurate initial data."]
      }
    ]
  }
};

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  policyKey: string | null;
}

export const LegalModal = ({ isOpen, onClose, policyKey }: LegalModalProps) => {
  const policy = policyKey && policyKey in legalContent 
    ? legalContent[policyKey as PolicyKey] 
    : null;

  if (!policy) return null;

  const Icon = policy.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] p-0 gap-0 bg-white border-none shadow-2xl rounded-2xl overflow-hidden flex flex-col duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
        <VisuallyHidden>
          <DialogTitle>{policy.title}</DialogTitle>
        </VisuallyHidden>

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {policy.title}
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Last updated: {policy.lastUpdated}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div className="space-y-8 max-w-none">
            {policy.sections.map((section, index) => (
              <div key={index} className="space-y-3">
                {section.heading && (
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {section.heading}
                  </h3>
                )}
                
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-sm leading-relaxed text-slate-600">
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <ul className="space-y-2 mt-2">
                    {section.bullets.map((bullet, bIndex) => (
                      <li key={bIndex} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Footer Note */}
            <div className="pt-8 mt-8 border-t border-slate-100">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  This document is legally binding. If you have any questions regarding these policies, 
                  please contact our legal team at <a href="mailto:legal@decouverts.com" className="text-primary hover:underline">legal@decouverts.com</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};