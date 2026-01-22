import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LinkEmployeeRequest {
  email: string;
  userId: string;
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

    const { email, userId }: LinkEmployeeRequest = await req.json();

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Email and userId are required", linked: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Attempting to link employee account:", email, "to user:", userId);

    // Find the employee by email
    const { data: employee, error: findError } = await supabase
      .from("employees")
      .select("id, user_id, employee_name, is_active")
      .eq("employee_email", email.toLowerCase())
      .maybeSingle();

    if (findError) {
      console.error("Error finding employee:", findError);
      return new Response(
        JSON.stringify({ error: "Failed to find employee", linked: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!employee) {
      console.log("No employee found with email:", email);
      return new Response(
        JSON.stringify({ error: "Employee not found", linked: false }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!employee.is_active) {
      console.log("Employee account is deactivated:", email);
      return new Response(
        JSON.stringify({ error: "Employee account is deactivated", linked: false }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if already linked to a different user
    if (employee.user_id && employee.user_id !== userId) {
      console.log("Employee already linked to different user:", employee.user_id);
      return new Response(
        JSON.stringify({ error: "Employee account already linked to another user", linked: false }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If already linked to this user, just return success
    if (employee.user_id === userId) {
      console.log("Employee already linked to this user");
      return new Response(
        JSON.stringify({ linked: true, alreadyLinked: true, employeeName: employee.employee_name }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Link the employee to the auth user
    const { error: updateError } = await supabase
      .from("employees")
      .update({ user_id: userId })
      .eq("id", employee.id);

    if (updateError) {
      console.error("Error linking employee:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to link employee account", linked: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Successfully linked employee:", employee.employee_name, "to user:", userId);

    return new Response(
      JSON.stringify({ 
        linked: true, 
        employeeName: employee.employee_name,
        message: "Account linked successfully"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in link-employee-account function:", error);
    return new Response(
      JSON.stringify({ error: error.message, linked: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});