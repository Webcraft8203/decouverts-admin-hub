import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckEmployeeRequest {
  email: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email }: CheckEmployeeRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required", isEmployee: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Checking employee status for email:", email);

    // Check if email exists in employees table and is active
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("id, employee_name, is_active")
      .eq("employee_email", email.toLowerCase())
      .maybeSingle();

    if (employeeError) {
      console.error("Error checking employee:", employeeError);
      return new Response(
        JSON.stringify({ error: "Failed to verify employee status", isEmployee: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!employeeData) {
      console.log("Employee not found with email:", email);
      return new Response(
        JSON.stringify({ isEmployee: false, message: "Email not registered as an employee" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!employeeData.is_active) {
      console.log("Employee account is deactivated:", email);
      return new Response(
        JSON.stringify({ isEmployee: false, isDeactivated: true, message: "Employee account is deactivated" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Found active employee:", employeeData.employee_name);

    return new Response(
      JSON.stringify({ 
        isEmployee: true, 
        employeeName: employeeData.employee_name 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in check-employee-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message, isEmployee: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});