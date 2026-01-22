import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Users, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

export default function EmployeeAuth() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // If already logged in, redirect to admin
    if (!authLoading && user) {
      navigate("/admin");
    }
  }, [user, authLoading, navigate]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      // First, check if email belongs to a registered employee
      const { data: checkData, error: checkError } = await supabase.functions.invoke("check-employee-email", {
        body: { email },
      });

      if (checkError) {
        console.error("Error checking employee status:", checkError);
        setError("Failed to verify email. Please try again.");
        toast({
          title: "Error",
          description: "Failed to verify email. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (checkData?.isDeactivated) {
        setError("Your account has been deactivated. Please contact your administrator.");
        toast({
          title: "Account Deactivated",
          description: "Your account has been deactivated. Please contact your administrator.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!checkData?.isEmployee) {
        setError("This email is not registered as an employee.");
        toast({
          title: "Access Denied",
          description: "This email is not registered as an employee.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setEmployeeName(checkData.employeeName || "");

      // Email is verified as employee, send magic link
      const redirectUrl = `https://decouvertsplus.vercel.app/admin`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        if (error.message.includes("rate limit")) {
          setError("Too many requests. Please wait a moment before trying again.");
        } else {
          setError(error.message);
        }
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsSent(true);
        toast({
          title: "Magic Link Sent",
          description: "Check your email for the login link.",
        });
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Back to Home */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Decouverts Plus</h1>
          <p className="text-muted-foreground mt-1">Employee Portal</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">
              {isSent ? "Check Your Email" : "Employee Login"}
            </CardTitle>
            <CardDescription className="text-center">
              {isSent
                ? `We've sent a magic link to ${email}`
                : "Enter your employee email to receive a magic link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSent ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-2">
                  <Mail className="h-6 w-6 text-green-500" />
                </div>
                {employeeName && (
                  <p className="text-sm font-medium text-foreground">
                    Welcome back, {employeeName}!
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Click the link in your email to access the admin dashboard with your assigned permissions.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSent(false);
                    setEmployeeName("");
                  }}
                  className="mt-4"
                >
                  Send another link
                </Button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Employee Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="employee@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            Only registered employees can access this portal.
          </p>
          <p className="text-xs text-muted-foreground">
            Contact your administrator if you don't have access.
          </p>
        </div>
      </div>
    </div>
  );
}