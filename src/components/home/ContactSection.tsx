import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, Phone, User, MessageSquare, Send, CheckCircle, MapPin, Building2 } from "lucide-react";
import { useFormRateLimit } from "@/hooks/useFormRateLimit";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().trim().min(10, "Phone must be at least 10 digits").max(15, "Phone too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000, "Message too long"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const contactInfo = [
  {
    icon: Mail,
    label: "Email Us",
    value: "hello@decouvertes.in",
  },
  {
    icon: Phone,
    label: "Call Us",
    value: "+91 9561103435",
  },
  {
    icon: MapPin,
    label: "Visit Us",
    value: "A-414, Gera's Imperium Gateway, Near Nashik Phata Flyover, Opp. Bhosari Metro Station, Kasarwadi, Pimpri-Chinchwad, Pune, Maharashtra 411034",
  }
];

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { checkRateLimit, recordSubmission, isChecking } = useFormRateLimit("contact");

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    // Check rate limit before submission
    const allowed = await checkRateLimit();
    if (!allowed) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("contact_requests").insert({
        name: data.name,
        phone: data.phone,
        email: data.email,
        message: data.message,
      });

      if (error) throw error;

      await recordSubmission(true);
      setIsSubmitted(true);
      form.reset();
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Error submitting contact form:", error);
      await recordSubmission(false);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className="py-20 md:py-28 px-4 bg-white border-t border-border" id="contact-section">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card rounded-lg p-12 border border-border">
            <div className="w-20 h-20 rounded-md border border-border bg-background flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Message Sent</h2>
            <p className="text-muted-foreground text-lg mb-8">
              We have received your message and will contact you shortly.
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-md"
            >
              Send Another Message
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 px-4 bg-white border-t border-border" id="contact-section">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-primary" />
            <p className="text-primary font-semibold tracking-[0.2em] text-xs uppercase">Get In Touch</p>
            <span className="h-px w-10 bg-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
            Contact Us
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Reach out for drone inquiries, mission planning, or strategic partnerships.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">Let's Take Flight Together</h3>
              <p className="text-muted-foreground leading-relaxed">
                Whether you need a surveillance UAV, a custom payload integration, or a fleet for
                mission-critical operations, our drone team is here to help bring your program to life.
              </p>
            </div>

            <div className="space-y-4">
              {contactInfo.map((info) => (
                <div
                  key={info.label}
                  className="flex items-center gap-5 p-5 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors duration-200"
                >
                  <div className="w-12 h-12 rounded-md border border-border bg-background flex items-center justify-center shrink-0">
                    <info.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{info.label}</p>
                    <p className="font-semibold text-foreground text-lg">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 flex items-center gap-3 text-muted-foreground text-sm font-medium">
              <Building2 className="w-5 h-5 text-primary/60" />
              <p>Serving drone operators and defence customers across India.</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card rounded-lg p-8 lg:p-10 border border-border relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-primary" />
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-semibold">Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your full name"
                            className="bg-secondary/50 border-border focus:border-primary focus:ring-primary/20 h-12 rounded-md"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 font-semibold">Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your phone number"
                            className="bg-secondary/50 border-border focus:border-primary focus:ring-primary/20 h-12 rounded-md"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80 font-semibold">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          className="bg-secondary/50 border-border focus:border-primary focus:ring-primary/20 h-12 rounded-md"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80 font-semibold">Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your project..."
                          className="min-h-[150px] resize-none bg-secondary/50 border-border focus:border-primary focus:ring-primary/20 rounded-md p-4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-base font-semibold transition-colors duration-200"
                  disabled={isSubmitting || isChecking}
                >
                  {isSubmitting || isChecking ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
