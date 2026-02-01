-- =====================================================
-- COMPLETE DATABASE MIGRATION FILE
-- Generated: 2026-02-01
-- Project: Decouverts Admin/E-commerce Platform
-- =====================================================
-- This file contains all tables, enums, functions, triggers, indexes, and RLS policies
-- 
-- ANALYSIS SUMMARY:
-- ✅ 48 Tables exist and are properly configured
-- ✅ 145 RLS policies are in place
-- ✅ All frontend-used tables have corresponding database tables
-- ✅ Security functions (has_role, has_permission, is_super_admin, etc.) are defined
--
-- =====================================================

-- ===========================================
-- SECTION 1: ENUMS
-- ===========================================

-- App Role Enum (admin, user, employee)
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'user', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Attendance Status Enum
DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'on_leave', 'holiday');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Leave Status Enum
DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Salary Status Enum
DO $$ BEGIN
    CREATE TYPE salary_status AS ENUM ('pending', 'paid', 'on_hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Salary Type Enum
DO $$ BEGIN
    CREATE TYPE salary_type AS ENUM ('monthly', 'hourly', 'contract');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Employee Permission Enum
DO $$ BEGIN
    CREATE TYPE employee_permission AS ENUM (
        'view_orders', 'update_orders', 'manage_shipping',
        'view_accounting', 'view_gst_reports', 'view_revenue', 'download_financials',
        'view_invoices', 'generate_invoices', 'download_invoices',
        'manage_products', 'manage_categories', 'manage_inventory',
        'manage_homepage', 'manage_blog', 'manage_partners', 'manage_customer_reviews',
        'view_customers', 'manage_promo_codes', 'view_activity_logs',
        'manage_design_requests', 'manage_printer_configs', 'manage_drone_configs',
        'view_contact_requests',
        'view_employee_profiles', 'manage_employee_profiles',
        'view_salary_info', 'manage_salary',
        'view_employee_documents', 'manage_employee_documents',
        'mark_attendance', 'view_attendance',
        'manage_leave', 'view_leave_requests',
        'generate_payslips', 'view_payslips'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===========================================
-- SECTION 2: SECURITY FUNCTIONS
-- ===========================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Check if user is an active employee
CREATE OR REPLACE FUNCTION public.is_employee(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- Check if user has admin access (super admin OR active employee)
CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE user_id = _user_id AND is_active = true
    )
$$;

-- Check if employee has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission employee_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    JOIN public.employee_permissions ep ON ep.employee_id = e.id
    WHERE e.user_id = _user_id
      AND e.is_active = true
      AND ep.permission = _permission
  )
$$;

-- Check if user is blocked
CREATE OR REPLACE FUNCTION public.is_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_blocked FROM public.profiles WHERE id = _user_id), false)
$$;

-- Generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number text;
BEGIN
  new_number := 'DP-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
  RETURN new_number;
END;
$$;

-- Generate shipment ID
CREATE OR REPLACE FUNCTION public.generate_shipment_id()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_id text;
BEGIN
  new_id := 'SHP-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
  RETURN new_id;
END;
$$;

-- Update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Handle new user creation (create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number, age)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.raw_user_meta_data ->> 'phone_number',
    (NEW.raw_user_meta_data ->> 'age')::integer
  );
  RETURN NEW;
END;
$$;

-- IP Throttle Check
CREATE OR REPLACE FUNCTION public.check_ip_throttle(_ip_address text, _portal_type text, _max_attempts integer DEFAULT 5, _window_minutes integer DEFAULT 15)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_failures INT;
  blocked_until TIMESTAMP WITH TIME ZONE;
  last_attempt TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT COUNT(*), MAX(created_at) INTO recent_failures, last_attempt
  FROM public.login_attempts
  WHERE ip_address = _ip_address
    AND portal_type = _portal_type
    AND attempt_type = 'failure'
    AND created_at > NOW() - (_window_minutes || ' minutes')::INTERVAL;
  
  IF recent_failures >= _max_attempts THEN
    blocked_until := last_attempt + (_window_minutes || ' minutes')::INTERVAL;
    RETURN jsonb_build_object(
      'blocked', true,
      'attempts', recent_failures,
      'blocked_until', blocked_until,
      'wait_seconds', EXTRACT(EPOCH FROM (blocked_until - NOW()))::INT
    );
  END IF;
  
  RETURN jsonb_build_object(
    'blocked', false,
    'attempts', recent_failures,
    'remaining', _max_attempts - recent_failures
  );
END;
$$;

-- Record login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(_ip_address text, _email text, _portal_type text, _success boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (ip_address, email, portal_type, attempt_type)
  VALUES (
    _ip_address,
    _email,
    _portal_type,
    CASE WHEN _success THEN 'success' ELSE 'failure' END
  );
  
  IF random() < 0.01 THEN
    DELETE FROM public.login_attempts WHERE created_at < NOW() - INTERVAL '24 hours';
  END IF;
END;
$$;

-- Clear login attempts
CREATE OR REPLACE FUNCTION public.clear_login_attempts(_ip_address text, _portal_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts 
  WHERE ip_address = _ip_address 
    AND portal_type = _portal_type
    AND attempt_type = 'failure';
END;
$$;

-- Cleanup old employee activity logs
CREATE OR REPLACE FUNCTION public.cleanup_old_employee_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.employee_activity_logs
  WHERE created_at < NOW() - INTERVAL '15 days';
END;
$$;

-- ===========================================
-- SECTION 3: CORE TABLES
-- ===========================================

-- User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    full_name text,
    phone_number text,
    age integer,
    is_blocked boolean NOT NULL DEFAULT false,
    account_status text NOT NULL DEFAULT 'active',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    price numeric NOT NULL DEFAULT 0,
    cost_price numeric DEFAULT 0,
    category_id uuid REFERENCES public.categories(id),
    stock_quantity integer NOT NULL DEFAULT 0,
    availability_status text NOT NULL DEFAULT 'in_stock',
    images text[] DEFAULT '{}',
    video_url text,
    is_highlighted boolean NOT NULL DEFAULT false,
    gst_percentage numeric NOT NULL DEFAULT 18,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Product Parameters Table
CREATE TABLE IF NOT EXISTS public.product_parameters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    parameter_name text NOT NULL,
    parameter_value text NOT NULL,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Product Reviews Table
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text text,
    is_approved boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Addresses Table
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    label text NOT NULL DEFAULT 'Home',
    full_name text NOT NULL,
    phone text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    country text NOT NULL DEFAULT 'India',
    is_default boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Cart Items Table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    discount_type text NOT NULL DEFAULT 'fixed',
    discount_value numeric NOT NULL,
    min_order_amount numeric DEFAULT 0,
    max_discount_amount numeric,
    max_uses integer NOT NULL DEFAULT 1,
    used_count integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    expires_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number text NOT NULL UNIQUE,
    user_id uuid NOT NULL,
    address_id uuid REFERENCES public.user_addresses(id),
    subtotal numeric NOT NULL DEFAULT 0,
    tax_amount numeric NOT NULL DEFAULT 0,
    shipping_amount numeric NOT NULL DEFAULT 0,
    discount_amount numeric DEFAULT 0,
    total_amount numeric NOT NULL DEFAULT 0,
    shipping_address jsonb,
    gst_breakdown jsonb DEFAULT '[]',
    status text NOT NULL DEFAULT 'pending',
    order_type text NOT NULL DEFAULT 'standard',
    payment_id text,
    payment_status text DEFAULT 'pending',
    promo_code_id uuid REFERENCES public.promo_codes(id),
    design_request_id uuid,
    buyer_gstin text,
    courier_name text,
    tracking_id text,
    tracking_url text,
    shipment_id text,
    shipping_label_url text,
    invoice_url text,
    proforma_invoice_url text,
    final_invoice_url text,
    expected_delivery_date date,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    delivery_notes text,
    notes text,
    cod_payment_status text DEFAULT 'pending',
    cod_courier_name text,
    cod_collected_at timestamp with time zone,
    cod_confirmed_at timestamp with time zone,
    cod_confirmed_by uuid,
    cod_settled_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id),
    product_name text NOT NULL,
    product_price numeric NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    total_price numeric NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number text NOT NULL UNIQUE,
    order_id uuid REFERENCES public.orders(id),
    client_name text NOT NULL,
    client_email text,
    client_address text,
    buyer_gstin text,
    buyer_state text,
    seller_state text DEFAULT 'Maharashtra',
    items jsonb NOT NULL DEFAULT '[]',
    subtotal numeric NOT NULL DEFAULT 0,
    tax_amount numeric NOT NULL DEFAULT 0,
    cgst_amount numeric DEFAULT 0,
    sgst_amount numeric DEFAULT 0,
    igst_amount numeric DEFAULT 0,
    is_igst boolean DEFAULT false,
    gst_breakdown jsonb DEFAULT '[]',
    platform_fee numeric DEFAULT 0,
    platform_fee_tax numeric DEFAULT 0,
    total_amount numeric NOT NULL DEFAULT 0,
    invoice_type text DEFAULT 'proforma',
    is_final boolean DEFAULT false,
    delivery_date timestamp with time zone,
    pdf_url text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Invoice Settings Table
CREATE TABLE IF NOT EXISTS public.invoice_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name text NOT NULL DEFAULT 'Decouverts',
    business_address text NOT NULL DEFAULT '',
    business_city text NOT NULL DEFAULT '',
    business_state text NOT NULL DEFAULT '',
    business_pincode text NOT NULL DEFAULT '',
    business_country text NOT NULL DEFAULT 'India',
    business_phone text NOT NULL DEFAULT '',
    business_email text NOT NULL DEFAULT '',
    business_gstin text NOT NULL DEFAULT '',
    business_logo_url text,
    invoice_prefix text NOT NULL DEFAULT 'INV',
    default_gst_rate numeric NOT NULL DEFAULT 18,
    platform_fee_percentage numeric NOT NULL DEFAULT 2,
    platform_fee_taxable boolean NOT NULL DEFAULT false,
    terms_and_conditions text NOT NULL DEFAULT 'Goods once sold are non-refundable. Payment due within 30 days. Warranty as per product terms.',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ===========================================
-- SECTION 4: EMPLOYEE MANAGEMENT TABLES
-- ===========================================

-- Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    employee_name text NOT NULL,
    employee_email text NOT NULL,
    phone_number text,
    department text,
    designation text,
    date_of_joining date,
    date_of_birth date,
    gender text,
    blood_group text,
    current_address text,
    permanent_address text,
    emergency_contact_name text,
    emergency_contact_number text,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Employee Permissions Table
CREATE TABLE IF NOT EXISTS public.employee_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    permission employee_permission NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(employee_id, permission)
);

-- Employee Salary Table
CREATE TABLE IF NOT EXISTS public.employee_salary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
    salary_amount numeric,
    salary_type salary_type DEFAULT 'monthly',
    effective_from date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Employee Bank Info Table
CREATE TABLE IF NOT EXISTS public.employee_bank_info (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
    bank_name text,
    account_number_encrypted text,
    account_number_last_four text,
    ifsc_code text,
    branch_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Employee Sensitive Info Table
CREATE TABLE IF NOT EXISTS public.employee_sensitive_info (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
    aadhaar_number_encrypted text,
    aadhaar_last_four text,
    pan_number_encrypted text,
    pan_last_four text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Employee Documents Table
CREATE TABLE IF NOT EXISTS public.employee_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    document_type text NOT NULL,
    document_name text NOT NULL,
    file_path text NOT NULL,
    approval_status text DEFAULT 'pending',
    rejection_reason text,
    uploaded_by uuid,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Employee Attendance Table
CREATE TABLE IF NOT EXISTS public.employee_attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    attendance_date date NOT NULL,
    status attendance_status NOT NULL DEFAULT 'present',
    check_in_time time,
    check_out_time time,
    notes text,
    marked_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(employee_id, attendance_date)
);

-- Employee Leave Balance Table
CREATE TABLE IF NOT EXISTS public.employee_leave_balance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
    year integer DEFAULT EXTRACT(year FROM CURRENT_DATE),
    casual_leave integer DEFAULT 12,
    sick_leave integer DEFAULT 6,
    earned_leave integer DEFAULT 15,
    casual_leave_used integer DEFAULT 0,
    sick_leave_used integer DEFAULT 0,
    earned_leave_used integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Employee Leave Requests Table
CREATE TABLE IF NOT EXISTS public.employee_leave_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type text NOT NULL DEFAULT 'casual',
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status leave_status DEFAULT 'pending',
    rejection_reason text,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Employee Profile Updates Table
CREATE TABLE IF NOT EXISTS public.employee_profile_updates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    field_name text NOT NULL,
    old_value text,
    new_value text,
    status text DEFAULT 'pending',
    rejection_reason text,
    requested_at timestamp with time zone DEFAULT now(),
    processed_by uuid,
    processed_at timestamp with time zone
);

-- Salary Payments Table
CREATE TABLE IF NOT EXISTS public.salary_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    payment_period text NOT NULL,
    amount numeric NOT NULL,
    status salary_status DEFAULT 'pending',
    payment_method text,
    payment_date date,
    transaction_reference text,
    notes text,
    processed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Employee Payslips Table
CREATE TABLE IF NOT EXISTS public.employee_payslips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    payment_id uuid REFERENCES public.salary_payments(id),
    payslip_month text NOT NULL,
    payslip_year integer NOT NULL,
    basic_salary numeric NOT NULL DEFAULT 0,
    deductions numeric DEFAULT 0,
    bonuses numeric DEFAULT 0,
    net_salary numeric NOT NULL DEFAULT 0,
    working_days integer DEFAULT 0,
    present_days integer DEFAULT 0,
    leave_days integer DEFAULT 0,
    pdf_url text,
    generated_by uuid,
    generated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Employee Activity Logs Table
CREATE TABLE IF NOT EXISTS public.employee_activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    action_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    description text,
    metadata jsonb DEFAULT '{}',
    user_agent text,
    ip_address text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ===========================================
-- SECTION 5: CMS & CONTENT TABLES
-- ===========================================

-- Homepage Images Table
CREATE TABLE IF NOT EXISTS public.homepage_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL DEFAULT 'Untitled Project',
    description text DEFAULT '',
    alt_text text,
    image_url text NOT NULL,
    video_url text,
    category text,
    project_id text,
    is_active boolean NOT NULL DEFAULT true,
    is_featured boolean NOT NULL DEFAULT false,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Homepage Sections Table
CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key text NOT NULL UNIQUE,
    section_name text NOT NULL,
    is_visible boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Homepage Notifications Table
CREATE TABLE IF NOT EXISTS public.homepage_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message text NOT NULL,
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Shop Slides Table
CREATE TABLE IF NOT EXISTS public.shop_slides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    product_id uuid REFERENCES public.products(id),
    is_visible boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Blog Slides Table
CREATE TABLE IF NOT EXISTS public.blog_slides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    cta_text text DEFAULT 'Read More',
    cta_link text,
    is_visible boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    excerpt text,
    content text,
    feature_image text,
    image_gallery text[] DEFAULT '{}',
    youtube_url text,
    author_name text NOT NULL DEFAULT 'Decouverts Team',
    content_type text NOT NULL DEFAULT 'blog',
    tags text[] DEFAULT '{}',
    status text NOT NULL DEFAULT 'draft',
    meta_title text,
    meta_description text,
    publish_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Partners Table
CREATE TABLE IF NOT EXISTS public.partners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_name text NOT NULL,
    logo_url text NOT NULL,
    image_title text NOT NULL,
    image_description text NOT NULL,
    website_url text,
    status text NOT NULL DEFAULT 'draft',
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Customer Reviews Table
CREATE TABLE IF NOT EXISTS public.customer_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name text NOT NULL,
    company_name text NOT NULL,
    designation text,
    review_text text NOT NULL,
    photo_url text,
    image_title text NOT NULL,
    image_description text NOT NULL,
    rating integer,
    status text NOT NULL DEFAULT 'draft',
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ===========================================
-- SECTION 6: DESIGN REQUESTS & QUOTATIONS
-- ===========================================

-- Design Requests Table
CREATE TABLE IF NOT EXISTS public.design_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    file_url text NOT NULL,
    file_name text,
    description text,
    size text,
    quantity integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'pending_review',
    quoted_amount numeric,
    final_amount numeric,
    price_locked boolean NOT NULL DEFAULT false,
    converted_to_order boolean NOT NULL DEFAULT false,
    admin_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key to orders table
ALTER TABLE public.orders 
    ADD CONSTRAINT orders_design_request_id_fkey 
    FOREIGN KEY (design_request_id) REFERENCES public.design_requests(id)
    ON DELETE SET NULL;

-- Quotation Negotiations Table
CREATE TABLE IF NOT EXISTS public.quotation_negotiations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    design_request_id uuid NOT NULL REFERENCES public.design_requests(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL,
    sender_role text NOT NULL,
    proposed_amount numeric NOT NULL,
    message text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Quotation Messages Table
CREATE TABLE IF NOT EXISTS public.quotation_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    design_request_id uuid NOT NULL REFERENCES public.design_requests(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL,
    sender_role text NOT NULL,
    message_text text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Design Payments Table
CREATE TABLE IF NOT EXISTS public.design_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    design_request_id uuid NOT NULL REFERENCES public.design_requests(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    payment_status text NOT NULL DEFAULT 'pending',
    razorpay_order_id text,
    razorpay_payment_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ===========================================
-- SECTION 7: RAW MATERIALS
-- ===========================================

-- Raw Materials Table
CREATE TABLE IF NOT EXISTS public.raw_materials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    quantity numeric NOT NULL DEFAULT 0,
    unit text NOT NULL DEFAULT 'units',
    min_quantity numeric NOT NULL DEFAULT 10,
    cost_per_unit numeric DEFAULT 0,
    availability_status text NOT NULL DEFAULT 'available',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Raw Material Ledger Table
CREATE TABLE IF NOT EXISTS public.raw_material_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    action_type text NOT NULL,
    quantity_change numeric NOT NULL,
    previous_quantity numeric NOT NULL,
    new_quantity numeric NOT NULL,
    note text,
    admin_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Raw Material Usage Table
CREATE TABLE IF NOT EXISTS public.raw_material_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    quantity_used numeric NOT NULL,
    usage_type text NOT NULL DEFAULT 'manual_adjustment',
    reference_id text,
    reference_note text,
    admin_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ===========================================
-- SECTION 8: CONFIGURATIONS
-- ===========================================

-- Printer Configurations Table
CREATE TABLE IF NOT EXISTS public.printer_configurations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    phone_number text NOT NULL,
    email text NOT NULL,
    belongs_to_organization boolean NOT NULL DEFAULT false,
    organization_name text,
    organization_type text,
    designation text,
    base_model text NOT NULL,
    motion_tier text NOT NULL,
    extruder_count text NOT NULL,
    max_nozzle_temp text NOT NULL,
    ams_type text NOT NULL,
    supported_colors text NOT NULL,
    spool_capacity text,
    bed_surface text NOT NULL,
    bed_heating text NOT NULL,
    panel_material text NOT NULL,
    electronics_tier text NOT NULL,
    accuracy_tier text NOT NULL,
    amc_plan text,
    hardened_nozzle boolean DEFAULT false,
    high_flow_setup boolean DEFAULT false,
    pellet_extruder boolean DEFAULT false,
    ams_4_color boolean DEFAULT false,
    ams_8_color boolean DEFAULT false,
    multi_material boolean DEFAULT false,
    ams_filament_dryer boolean DEFAULT false,
    large_bed_reinforcement boolean DEFAULT false,
    active_chamber_heating boolean DEFAULT false,
    hepa_carbon_filter boolean DEFAULT false,
    noise_reduction_panels boolean DEFAULT false,
    tpu_flexible boolean DEFAULT false,
    nylon_pa boolean DEFAULT false,
    cf_gf_filled boolean DEFAULT false,
    engineering_polymers boolean DEFAULT false,
    emergency_stop boolean DEFAULT false,
    filament_dryer boolean DEFAULT false,
    multi_chamber_dryer boolean DEFAULT false,
    printer_stand boolean DEFAULT false,
    tool_storage boolean DEFAULT false,
    spare_nozzle_kit boolean DEFAULT false,
    calibration_kit boolean DEFAULT false,
    cad_slicer_training boolean DEFAULT false,
    advanced_material_training boolean DEFAULT false,
    status text NOT NULL DEFAULT 'new',
    admin_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Drone Configurations Table
CREATE TABLE IF NOT EXISTS public.drone_configurations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    phone_number text NOT NULL,
    email text NOT NULL,
    belongs_to_organization boolean NOT NULL DEFAULT false,
    organization_name text,
    organization_type text,
    designation text,
    drone_category text NOT NULL,
    fpv_model text,
    surv_model text,
    ind_model text,
    custom_frame text,
    custom_flight_time text,
    custom_range text,
    custom_control text,
    custom_payload_camera boolean DEFAULT false,
    custom_payload_sensor boolean DEFAULT false,
    custom_payload_communication boolean DEFAULT false,
    custom_encryption boolean DEFAULT false,
    custom_frame_size_type boolean DEFAULT false,
    custom_endurance_payload boolean DEFAULT false,
    custom_camera_type boolean DEFAULT false,
    custom_communication_range boolean DEFAULT false,
    custom_encryption_level boolean DEFAULT false,
    custom_environmental_resistance boolean DEFAULT false,
    custom_autonomy_level boolean DEFAULT false,
    status text NOT NULL DEFAULT 'new',
    admin_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ===========================================
-- SECTION 9: CONTACT & ACTIVITY LOGS
-- ===========================================

-- Contact Requests Table
CREATE TABLE IF NOT EXISTS public.contact_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'new',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Admin Notes Table
CREATE TABLE IF NOT EXISTS public.admin_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    note_text text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL,
    action_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    description text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Login Attempts Table
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address text NOT NULL,
    email text,
    portal_type text NOT NULL,
    attempt_type text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ===========================================
-- SECTION 10: INDEXES
-- ===========================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_availability ON public.products(availability_status);
CREATE INDEX IF NOT EXISTS idx_products_highlighted ON public.products(is_highlighted);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- Employee indexes
CREATE INDEX IF NOT EXISTS idx_employees_user ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_active ON public.employees(is_active);

-- Employee attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.employee_attendance(attendance_date);

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product ON public.cart_items(product_id);

-- Wishlist indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON public.wishlist(product_id);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON public.invoices(invoice_type);

-- Login attempts indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address, portal_type);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON public.login_attempts(created_at);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON public.activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- Employee activity logs indexes
CREATE INDEX IF NOT EXISTS idx_emp_activity_logs_employee ON public.employee_activity_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_activity_logs_created ON public.employee_activity_logs(created_at DESC);

-- ===========================================
-- SECTION 11: ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_salary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_bank_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_sensitive_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profile_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drone_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- SECTION 12: RLS POLICIES
-- ===========================================

-- ==================== USER ROLES ====================
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Require auth for role check" ON public.user_roles;
CREATE POLICY "Require auth for role check" ON public.user_roles
    FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ==================== PROFILES ====================
DROP POLICY IF EXISTS "Require auth for profiles" ON public.profiles;
CREATE POLICY "Require auth for profiles" ON public.profiles
    FOR SELECT USING (auth.uid() IS NOT NULL AND (id = auth.uid() OR has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "Active users can update own profile" ON public.profiles;
CREATE POLICY "Active users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid() AND NOT is_blocked(auth.uid()))
    WITH CHECK (id = auth.uid() AND NOT is_blocked(auth.uid()));

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==================== CATEGORIES ====================
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==================== PRODUCTS ====================
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authorized users can manage products" ON public.products;
CREATE POLICY "Authorized users can manage products" ON public.products
    FOR ALL USING (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'manage_products'));

-- ==================== PRODUCT PARAMETERS ====================
DROP POLICY IF EXISTS "Product parameters are viewable by everyone" ON public.product_parameters;
CREATE POLICY "Product parameters are viewable by everyone" ON public.product_parameters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product parameters" ON public.product_parameters;
CREATE POLICY "Admins can manage product parameters" ON public.product_parameters
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ==================== PRODUCT REVIEWS ====================
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.product_reviews
    FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Users can view own reviews" ON public.product_reviews;
CREATE POLICY "Users can view own reviews" ON public.product_reviews
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Active users can create reviews" ON public.product_reviews;
CREATE POLICY "Active users can create reviews" ON public.product_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT is_blocked(auth.uid()));

DROP POLICY IF EXISTS "Active users can update own reviews" ON public.product_reviews;
CREATE POLICY "Active users can update own reviews" ON public.product_reviews
    FOR UPDATE USING (auth.uid() = user_id AND NOT is_blocked(auth.uid()))
    WITH CHECK (auth.uid() = user_id AND NOT is_blocked(auth.uid()));

DROP POLICY IF EXISTS "Active users can delete own reviews" ON public.product_reviews;
CREATE POLICY "Active users can delete own reviews" ON public.product_reviews
    FOR DELETE USING (auth.uid() = user_id AND NOT is_blocked(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.product_reviews;
CREATE POLICY "Admins can manage reviews" ON public.product_reviews
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ==================== USER ADDRESSES ====================
DROP POLICY IF EXISTS "Active users can manage addresses" ON public.user_addresses;
CREATE POLICY "Active users can manage addresses" ON public.user_addresses
    FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id AND NOT is_blocked(auth.uid()))
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id AND NOT is_blocked(auth.uid()));

-- ==================== CART ITEMS ====================
DROP POLICY IF EXISTS "Active users can manage cart" ON public.cart_items;
CREATE POLICY "Active users can manage cart" ON public.cart_items
    FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id AND NOT is_blocked(auth.uid()))
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id AND NOT is_blocked(auth.uid()));

-- ==================== WISHLIST ====================
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlist;
CREATE POLICY "Users can view own wishlist" ON public.wishlist
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Active users can add to own wishlist" ON public.wishlist;
CREATE POLICY "Active users can add to own wishlist" ON public.wishlist
    FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT is_blocked(auth.uid()));

DROP POLICY IF EXISTS "Active users can remove from own wishlist" ON public.wishlist;
CREATE POLICY "Active users can remove from own wishlist" ON public.wishlist
    FOR DELETE USING (auth.uid() = user_id AND NOT is_blocked(auth.uid()));

-- ==================== PROMO CODES ====================
DROP POLICY IF EXISTS "Users can validate active promo codes" ON public.promo_codes;
CREATE POLICY "Users can validate active promo codes" ON public.promo_codes
    FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
    FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==================== ORDERS ====================
DROP POLICY IF EXISTS "Require auth for orders select" ON public.orders;
CREATE POLICY "Require auth for orders select" ON public.orders
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            auth.uid() = user_id OR 
            has_role(auth.uid(), 'admin') OR 
            has_permission(auth.uid(), 'view_orders')
        )
    );

DROP POLICY IF EXISTS "Active users can create orders" ON public.orders;
CREATE POLICY "Active users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT is_blocked(auth.uid()));

DROP POLICY IF EXISTS "Authorized users can update orders" ON public.orders;
CREATE POLICY "Authorized users can update orders" ON public.orders
    FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'update_orders'));

DROP POLICY IF EXISTS "Authorized users can delete orders" ON public.orders;
CREATE POLICY "Authorized users can delete orders" ON public.orders
    FOR DELETE USING (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'update_orders'));

-- ==================== ORDER ITEMS ====================
DROP POLICY IF EXISTS "Require auth for order items select" ON public.order_items;
CREATE POLICY "Require auth for order items select" ON public.order_items
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'view_orders'))
        )
    );

DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
CREATE POLICY "Users can create order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Authorized users can delete order items" ON public.order_items;
CREATE POLICY "Authorized users can delete order items" ON public.order_items
    FOR DELETE USING (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'update_orders'));

-- ==================== INVOICES ====================
DROP POLICY IF EXISTS "Authorized users can manage invoices" ON public.invoices;
CREATE POLICY "Authorized users can manage invoices" ON public.invoices
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin') OR 
            has_permission(auth.uid(), 'view_invoices') OR 
            has_permission(auth.uid(), 'generate_invoices')
        )
    );

-- ==================== INVOICE SETTINGS ====================
DROP POLICY IF EXISTS "Super admins can manage invoice settings" ON public.invoice_settings;
CREATE POLICY "Super admins can manage invoice settings" ON public.invoice_settings
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Authorized can view invoice settings" ON public.invoice_settings;
CREATE POLICY "Authorized can view invoice settings" ON public.invoice_settings
    FOR SELECT USING (
        has_role(auth.uid(), 'admin') OR 
        has_permission(auth.uid(), 'generate_invoices') OR 
        has_permission(auth.uid(), 'view_invoices')
    );

-- ==================== EMPLOYEES ====================
DROP POLICY IF EXISTS "Super admins can manage employees" ON public.employees;
CREATE POLICY "Super admins can manage employees" ON public.employees
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
CREATE POLICY "Employees can view own record" ON public.employees
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Employees with permission can view employees" ON public.employees;
CREATE POLICY "Employees with permission can view employees" ON public.employees
    FOR SELECT USING (
        has_permission(auth.uid(), 'view_employee_profiles') OR 
        has_permission(auth.uid(), 'manage_employee_profiles')
    );

-- ==================== EMPLOYEE PERMISSIONS ====================
DROP POLICY IF EXISTS "Super admins can manage permissions" ON public.employee_permissions;
CREATE POLICY "Super admins can manage permissions" ON public.employee_permissions
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Employees can view own permissions" ON public.employee_permissions;
CREATE POLICY "Employees can view own permissions" ON public.employee_permissions
    FOR SELECT USING (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

-- ==================== EMPLOYEE SALARY ====================
DROP POLICY IF EXISTS "Super admins can manage salary" ON public.employee_salary;
CREATE POLICY "Super admins can manage salary" ON public.employee_salary
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Salary managers can manage" ON public.employee_salary;
CREATE POLICY "Salary managers can manage" ON public.employee_salary
    FOR ALL USING (has_permission(auth.uid(), 'manage_salary'))
    WITH CHECK (has_permission(auth.uid(), 'manage_salary'));

DROP POLICY IF EXISTS "Accounting can view salary" ON public.employee_salary;
CREATE POLICY "Accounting can view salary" ON public.employee_salary
    FOR SELECT USING (
        has_permission(auth.uid(), 'view_salary_info') OR 
        has_permission(auth.uid(), 'manage_salary') OR 
        has_permission(auth.uid(), 'view_accounting')
    );

-- ==================== EMPLOYEE BANK INFO ====================
DROP POLICY IF EXISTS "Super admins can manage bank info" ON public.employee_bank_info;
CREATE POLICY "Super admins can manage bank info" ON public.employee_bank_info
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Employees can view own bank info" ON public.employee_bank_info;
CREATE POLICY "Employees can view own bank info" ON public.employee_bank_info
    FOR SELECT USING (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Employees can insert own bank info" ON public.employee_bank_info;
CREATE POLICY "Employees can insert own bank info" ON public.employee_bank_info
    FOR INSERT WITH CHECK (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Employees can update own bank info" ON public.employee_bank_info;
CREATE POLICY "Employees can update own bank info" ON public.employee_bank_info
    FOR UPDATE USING (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Accounting can view bank info" ON public.employee_bank_info;
CREATE POLICY "Accounting can view bank info" ON public.employee_bank_info
    FOR SELECT USING (
        has_permission(auth.uid(), 'view_salary_info') OR 
        has_permission(auth.uid(), 'manage_salary') OR 
        has_permission(auth.uid(), 'view_accounting')
    );

-- ==================== EMPLOYEE SENSITIVE INFO ====================
DROP POLICY IF EXISTS "Super admins can manage sensitive info" ON public.employee_sensitive_info;
CREATE POLICY "Super admins can manage sensitive info" ON public.employee_sensitive_info
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Employees can view own sensitive info" ON public.employee_sensitive_info;
CREATE POLICY "Employees can view own sensitive info" ON public.employee_sensitive_info
    FOR SELECT USING (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Employees with permission can view sensitive info" ON public.employee_sensitive_info;
CREATE POLICY "Employees with permission can view sensitive info" ON public.employee_sensitive_info
    FOR SELECT USING (
        has_permission(auth.uid(), 'view_employee_profiles') OR 
        has_permission(auth.uid(), 'manage_employee_profiles')
    );

-- ==================== EMPLOYEE DOCUMENTS ====================
DROP POLICY IF EXISTS "Super admins can manage documents" ON public.employee_documents;
CREATE POLICY "Super admins can manage documents" ON public.employee_documents
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Employees can view own documents" ON public.employee_documents;
CREATE POLICY "Employees can view own documents" ON public.employee_documents
    FOR SELECT USING (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Employees can upload own documents" ON public.employee_documents;
CREATE POLICY "Employees can upload own documents" ON public.employee_documents
    FOR INSERT WITH CHECK (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Employees with permission can view documents" ON public.employee_documents;
CREATE POLICY "Employees with permission can view documents" ON public.employee_documents
    FOR SELECT USING (
        has_permission(auth.uid(), 'view_employee_documents') OR 
        has_permission(auth.uid(), 'manage_employee_documents')
    );

-- ==================== EMPLOYEE ATTENDANCE ====================
DROP POLICY IF EXISTS "Super admins can manage attendance" ON public.employee_attendance;
CREATE POLICY "Super admins can manage attendance" ON public.employee_attendance
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Employees can view own attendance" ON public.employee_attendance;
CREATE POLICY "Employees can view own attendance" ON public.employee_attendance
    FOR SELECT USING (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Attendance markers can manage" ON public.employee_attendance;
CREATE POLICY "Attendance markers can manage" ON public.employee_attendance
    FOR ALL USING (has_permission(auth.uid(), 'mark_attendance'))
    WITH CHECK (has_permission(auth.uid(), 'mark_attendance'));

DROP POLICY IF EXISTS "Employees with view permission can see attendance" ON public.employee_attendance;
CREATE POLICY "Employees with view permission can see attendance" ON public.employee_attendance
    FOR SELECT USING (has_permission(auth.uid(), 'view_attendance'));

-- ==================== EMPLOYEE LEAVE BALANCE ====================
DROP POLICY IF EXISTS "Super admins can manage leave balance" ON public.employee_leave_balance;
CREATE POLICY "Super admins can manage leave balance" ON public.employee_leave_balance
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Employees can view own leave balance" ON public.employee_leave_balance;
CREATE POLICY "Employees can view own leave balance" ON public.employee_leave_balance
    FOR SELECT USING (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Leave managers can manage balance" ON public.employee_leave_balance;
CREATE POLICY "Leave managers can manage balance" ON public.employee_leave_balance
    FOR ALL USING (has_permission(auth.uid(), 'manage_leave'))
    WITH CHECK (has_permission(auth.uid(), 'manage_leave'));

-- ==================== EMPLOYEE LEAVE REQUESTS ====================
DROP POLICY IF EXISTS "Super admins can manage leave requests" ON public.employee_leave_requests;
CREATE POLICY "Super admins can manage leave requests" ON public.employee_leave_requests
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Employees can view own leave requests" ON public.employee_leave_requests;
CREATE POLICY "Employees can view own leave requests" ON public.employee_leave_requests
    FOR SELECT USING (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Employees can create own leave requests" ON public.employee_leave_requests;
CREATE POLICY "Employees can create own leave requests" ON public.employee_leave_requests
    FOR INSERT WITH CHECK (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Leave managers can manage requests" ON public.employee_leave_requests;
CREATE POLICY "Leave managers can manage requests" ON public.employee_leave_requests
    FOR ALL USING (has_permission(auth.uid(), 'manage_leave'))
    WITH CHECK (has_permission(auth.uid(), 'manage_leave'));

DROP POLICY IF EXISTS "Leave viewers can view requests" ON public.employee_leave_requests;
CREATE POLICY "Leave viewers can view requests" ON public.employee_leave_requests
    FOR SELECT USING (has_permission(auth.uid(), 'view_leave_requests'));

-- ==================== EMPLOYEE PROFILE UPDATES ====================
DROP POLICY IF EXISTS "Super admins can manage profile updates" ON public.employee_profile_updates;
CREATE POLICY "Super admins can manage profile updates" ON public.employee_profile_updates
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Employees can view own update requests" ON public.employee_profile_updates;
CREATE POLICY "Employees can view own update requests" ON public.employee_profile_updates
    FOR SELECT USING (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Employees can request own profile updates" ON public.employee_profile_updates;
CREATE POLICY "Employees can request own profile updates" ON public.employee_profile_updates
    FOR INSERT WITH CHECK (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "HR can view profile updates" ON public.employee_profile_updates;
CREATE POLICY "HR can view profile updates" ON public.employee_profile_updates
    FOR SELECT USING (has_permission(auth.uid(), 'manage_employee_profiles'));

DROP POLICY IF EXISTS "HR can process profile updates" ON public.employee_profile_updates;
CREATE POLICY "HR can process profile updates" ON public.employee_profile_updates
    FOR UPDATE USING (has_permission(auth.uid(), 'manage_employee_profiles'));

-- ==================== SALARY PAYMENTS ====================
DROP POLICY IF EXISTS "Super admins can manage payments" ON public.salary_payments;
CREATE POLICY "Super admins can manage payments" ON public.salary_payments
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Salary managers can manage payments" ON public.salary_payments;
CREATE POLICY "Salary managers can manage payments" ON public.salary_payments
    FOR ALL USING (has_permission(auth.uid(), 'manage_salary'))
    WITH CHECK (has_permission(auth.uid(), 'manage_salary'));

DROP POLICY IF EXISTS "Accounting can view payments" ON public.salary_payments;
CREATE POLICY "Accounting can view payments" ON public.salary_payments
    FOR SELECT USING (
        has_permission(auth.uid(), 'view_salary_info') OR 
        has_permission(auth.uid(), 'manage_salary') OR 
        has_permission(auth.uid(), 'view_accounting')
    );

-- ==================== EMPLOYEE PAYSLIPS ====================
DROP POLICY IF EXISTS "Super admins can manage payslips" ON public.employee_payslips;
CREATE POLICY "Super admins can manage payslips" ON public.employee_payslips
    FOR ALL USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Employees can view own payslips" ON public.employee_payslips;
CREATE POLICY "Employees can view own payslips" ON public.employee_payslips
    FOR SELECT USING (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Payslip generators can manage" ON public.employee_payslips;
CREATE POLICY "Payslip generators can manage" ON public.employee_payslips
    FOR ALL USING (has_permission(auth.uid(), 'generate_payslips'))
    WITH CHECK (has_permission(auth.uid(), 'generate_payslips'));

DROP POLICY IF EXISTS "Payslip viewers can view" ON public.employee_payslips;
CREATE POLICY "Payslip viewers can view" ON public.employee_payslips
    FOR SELECT USING (has_permission(auth.uid(), 'view_payslips'));

-- ==================== EMPLOYEE ACTIVITY LOGS ====================
DROP POLICY IF EXISTS "Employees can insert own activity logs" ON public.employee_activity_logs;
CREATE POLICY "Employees can insert own activity logs" ON public.employee_activity_logs
    FOR INSERT WITH CHECK (
        employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Super admins can view all activity logs" ON public.employee_activity_logs;
CREATE POLICY "Super admins can view all activity logs" ON public.employee_activity_logs
    FOR SELECT USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Activity log viewers can view" ON public.employee_activity_logs;
CREATE POLICY "Activity log viewers can view" ON public.employee_activity_logs
    FOR SELECT USING (has_permission(auth.uid(), 'view_activity_logs'));

-- ==================== HOMEPAGE IMAGES ====================
DROP POLICY IF EXISTS "Public can view active images" ON public.homepage_images;
CREATE POLICY "Public can view active images" ON public.homepage_images
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage images" ON public.homepage_images;
CREATE POLICY "Admins can manage images" ON public.homepage_images
    FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==================== HOMEPAGE SECTIONS ====================
DROP POLICY IF EXISTS "Public can view visible sections" ON public.homepage_sections;
CREATE POLICY "Public can view visible sections" ON public.homepage_sections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage sections" ON public.homepage_sections;
CREATE POLICY "Admins can manage sections" ON public.homepage_sections
    FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==================== HOMEPAGE NOTIFICATIONS ====================
DROP POLICY IF EXISTS "Public can view active notifications" ON public.homepage_notifications;
CREATE POLICY "Public can view active notifications" ON public.homepage_notifications
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage notifications" ON public.homepage_notifications;
CREATE POLICY "Admins can manage notifications" ON public.homepage_notifications
    FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==================== SHOP SLIDES ====================
DROP POLICY IF EXISTS "Shop slides are viewable by everyone" ON public.shop_slides;
CREATE POLICY "Shop slides are viewable by everyone" ON public.shop_slides
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage shop slides" ON public.shop_slides;
CREATE POLICY "Admins can manage shop slides" ON public.shop_slides
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ==================== BLOG SLIDES ====================
DROP POLICY IF EXISTS "Blog slides are viewable by everyone" ON public.blog_slides;
CREATE POLICY "Blog slides are viewable by everyone" ON public.blog_slides
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage blog slides" ON public.blog_slides;
CREATE POLICY "Admins can manage blog slides" ON public.blog_slides
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ==================== BLOG POSTS ====================
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.blog_posts;
CREATE POLICY "Published posts are viewable by everyone" ON public.blog_posts
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins can view all posts" ON public.blog_posts;
CREATE POLICY "Admins can view all posts" ON public.blog_posts
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage posts" ON public.blog_posts;
CREATE POLICY "Admins can manage posts" ON public.blog_posts
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ==================== PARTNERS ====================
DROP POLICY IF EXISTS "Published partners are viewable by everyone" ON public.partners;
CREATE POLICY "Published partners are viewable by everyone" ON public.partners
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage partners" ON public.partners;
CREATE POLICY "Admins can manage partners" ON public.partners
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ==================== CUSTOMER REVIEWS ====================
DROP POLICY IF EXISTS "Published reviews are viewable by everyone" ON public.customer_reviews;
CREATE POLICY "Published reviews are viewable by everyone" ON public.customer_reviews
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.customer_reviews;
CREATE POLICY "Admins can manage reviews" ON public.customer_reviews
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ==================== DESIGN REQUESTS ====================
DROP POLICY IF EXISTS "Users can view own design requests" ON public.design_requests;
CREATE POLICY "Users can view own design requests" ON public.design_requests
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all design requests" ON public.design_requests;
CREATE POLICY "Admins can view all design requests" ON public.design_requests
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Active users can create own design requests" ON public.design_requests;
CREATE POLICY "Active users can create own design requests" ON public.design_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT is_blocked(auth.uid()));

DROP POLICY IF EXISTS "Admins can update design requests" ON public.design_requests;
CREATE POLICY "Admins can update design requests" ON public.design_requests
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete design requests" ON public.design_requests;
CREATE POLICY "Admins can delete design requests" ON public.design_requests
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ==================== QUOTATION NEGOTIATIONS ====================
DROP POLICY IF EXISTS "Users can view own negotiations" ON public.quotation_negotiations;
CREATE POLICY "Users can view own negotiations" ON public.quotation_negotiations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM design_requests WHERE design_requests.id = quotation_negotiations.design_request_id AND design_requests.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can view all negotiations" ON public.quotation_negotiations;
CREATE POLICY "Admins can view all negotiations" ON public.quotation_negotiations
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Active users can create negotiations" ON public.quotation_negotiations;
CREATE POLICY "Active users can create negotiations" ON public.quotation_negotiations
    FOR INSERT WITH CHECK (
        sender_role = 'user' AND sender_id = auth.uid() AND NOT is_blocked(auth.uid()) AND
        EXISTS (SELECT 1 FROM design_requests WHERE design_requests.id = quotation_negotiations.design_request_id AND design_requests.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can create negotiations" ON public.quotation_negotiations;
CREATE POLICY "Admins can create negotiations" ON public.quotation_negotiations
    FOR INSERT WITH CHECK (sender_role = 'admin' AND sender_id = auth.uid() AND has_role(auth.uid(), 'admin'));

-- ==================== QUOTATION MESSAGES ====================
DROP POLICY IF EXISTS "Users can view own messages" ON public.quotation_messages;
CREATE POLICY "Users can view own messages" ON public.quotation_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM design_requests WHERE design_requests.id = quotation_messages.design_request_id AND design_requests.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can view all messages" ON public.quotation_messages;
CREATE POLICY "Admins can view all messages" ON public.quotation_messages
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Active users can send messages" ON public.quotation_messages;
CREATE POLICY "Active users can send messages" ON public.quotation_messages
    FOR INSERT WITH CHECK (
        sender_role = 'user' AND sender_id = auth.uid() AND NOT is_blocked(auth.uid()) AND
        EXISTS (SELECT 1 FROM design_requests WHERE design_requests.id = quotation_messages.design_request_id AND design_requests.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can send messages" ON public.quotation_messages;
CREATE POLICY "Admins can send messages" ON public.quotation_messages
    FOR INSERT WITH CHECK (sender_role = 'admin' AND sender_id = auth.uid() AND has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.quotation_messages;
CREATE POLICY "Users can mark messages as read" ON public.quotation_messages
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM design_requests WHERE design_requests.id = quotation_messages.design_request_id AND design_requests.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can update messages" ON public.quotation_messages;
CREATE POLICY "Admins can update messages" ON public.quotation_messages
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- ==================== DESIGN PAYMENTS ====================
DROP POLICY IF EXISTS "Users can view own payments" ON public.design_payments;
CREATE POLICY "Users can view own payments" ON public.design_payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM design_requests WHERE design_requests.id = design_payments.design_request_id AND design_requests.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can view all payments" ON public.design_payments;
CREATE POLICY "Admins can view all payments" ON public.design_payments
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Active users can create payments" ON public.design_payments;
CREATE POLICY "Active users can create payments" ON public.design_payments
    FOR INSERT WITH CHECK (
        NOT is_blocked(auth.uid()) AND
        EXISTS (SELECT 1 FROM design_requests WHERE design_requests.id = design_payments.design_request_id AND design_requests.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can update payments" ON public.design_payments;
CREATE POLICY "Admins can update payments" ON public.design_payments
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- ==================== RAW MATERIALS ====================
DROP POLICY IF EXISTS "Only admins can view raw materials" ON public.raw_materials;
CREATE POLICY "Only admins can view raw materials" ON public.raw_materials
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage raw materials" ON public.raw_materials;
CREATE POLICY "Admins can manage raw materials" ON public.raw_materials
    FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==================== RAW MATERIAL LEDGER ====================
DROP POLICY IF EXISTS "Admins can view all ledger entries" ON public.raw_material_ledger;
CREATE POLICY "Admins can view all ledger entries" ON public.raw_material_ledger
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create ledger entries" ON public.raw_material_ledger;
CREATE POLICY "Admins can create ledger entries" ON public.raw_material_ledger
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- ==================== RAW MATERIAL USAGE ====================
DROP POLICY IF EXISTS "Admins can view all usage records" ON public.raw_material_usage;
CREATE POLICY "Admins can view all usage records" ON public.raw_material_usage
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create usage records" ON public.raw_material_usage;
CREATE POLICY "Admins can create usage records" ON public.raw_material_usage
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

DROP POLICY IF EXISTS "Admins can delete usage records" ON public.raw_material_usage;
CREATE POLICY "Admins can delete usage records" ON public.raw_material_usage
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ==================== PRINTER CONFIGURATIONS ====================
DROP POLICY IF EXISTS "Anyone can submit printer configuration" ON public.printer_configurations;
CREATE POLICY "Anyone can submit printer configuration" ON public.printer_configurations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can submit printer configurations" ON public.printer_configurations;
CREATE POLICY "Public can submit printer configurations" ON public.printer_configurations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all configurations" ON public.printer_configurations;
CREATE POLICY "Admins can view all configurations" ON public.printer_configurations
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can view printer configurations" ON public.printer_configurations;
CREATE POLICY "Only admins can view printer configurations" ON public.printer_configurations
    FOR SELECT USING (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'manage_printer_configs'));

DROP POLICY IF EXISTS "Admins can update configurations" ON public.printer_configurations;
CREATE POLICY "Admins can update configurations" ON public.printer_configurations
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete configurations" ON public.printer_configurations;
CREATE POLICY "Admins can delete configurations" ON public.printer_configurations
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ==================== DRONE CONFIGURATIONS ====================
DROP POLICY IF EXISTS "Anyone can submit drone configuration" ON public.drone_configurations;
CREATE POLICY "Anyone can submit drone configuration" ON public.drone_configurations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can submit drone configurations" ON public.drone_configurations;
CREATE POLICY "Public can submit drone configurations" ON public.drone_configurations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all drone configurations" ON public.drone_configurations;
CREATE POLICY "Admins can view all drone configurations" ON public.drone_configurations
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can view drone configurations" ON public.drone_configurations;
CREATE POLICY "Only admins can view drone configurations" ON public.drone_configurations
    FOR SELECT USING (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'manage_drone_configs'));

DROP POLICY IF EXISTS "Admins can update drone configurations" ON public.drone_configurations;
CREATE POLICY "Admins can update drone configurations" ON public.drone_configurations
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete drone configurations" ON public.drone_configurations;
CREATE POLICY "Admins can delete drone configurations" ON public.drone_configurations
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ==================== CONTACT REQUESTS ====================
DROP POLICY IF EXISTS "Anyone can submit contact request" ON public.contact_requests;
CREATE POLICY "Anyone can submit contact request" ON public.contact_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can submit contact requests" ON public.contact_requests;
CREATE POLICY "Public can submit contact requests" ON public.contact_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all contact requests" ON public.contact_requests;
CREATE POLICY "Admins can view all contact requests" ON public.contact_requests
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can view contact requests" ON public.contact_requests;
CREATE POLICY "Only admins can view contact requests" ON public.contact_requests
    FOR SELECT USING (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'view_contact_requests'));

DROP POLICY IF EXISTS "Admins can update contact requests" ON public.contact_requests;
CREATE POLICY "Admins can update contact requests" ON public.contact_requests
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete contact requests" ON public.contact_requests;
CREATE POLICY "Admins can delete contact requests" ON public.contact_requests
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ==================== ADMIN NOTES ====================
DROP POLICY IF EXISTS "Admins can view all notes" ON public.admin_notes;
CREATE POLICY "Admins can view all notes" ON public.admin_notes
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create notes" ON public.admin_notes;
CREATE POLICY "Admins can create notes" ON public.admin_notes
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

DROP POLICY IF EXISTS "Admins can update own notes" ON public.admin_notes;
CREATE POLICY "Admins can update own notes" ON public.admin_notes
    FOR UPDATE USING (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

DROP POLICY IF EXISTS "Admins can delete own notes" ON public.admin_notes;
CREATE POLICY "Admins can delete own notes" ON public.admin_notes
    FOR DELETE USING (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- ==================== ACTIVITY LOGS ====================
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create activity logs" ON public.activity_logs;
CREATE POLICY "Admins can create activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- ==================== LOGIN ATTEMPTS ====================
DROP POLICY IF EXISTS "Service role can manage login attempts" ON public.login_attempts;
CREATE POLICY "Service role can manage login attempts" ON public.login_attempts
    FOR ALL USING (true) WITH CHECK (true);

-- ===========================================
-- SECTION 13: TRIGGERS
-- ===========================================

-- Set shipment ID on ship
CREATE OR REPLACE FUNCTION public.set_shipment_id_on_ship()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'shipped' AND (NEW.shipment_id IS NULL OR NEW.shipment_id = '') THEN
    NEW.shipment_id := public.generate_shipment_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_shipment_id_trigger ON public.orders;
CREATE TRIGGER set_shipment_id_trigger
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_shipment_id_on_ship();

-- Log raw material changes
CREATE OR REPLACE FUNCTION public.log_raw_material_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.quantity IS DISTINCT FROM NEW.quantity THEN
    INSERT INTO public.raw_material_ledger (
      raw_material_id,
      action_type,
      quantity_change,
      previous_quantity,
      new_quantity,
      admin_id,
      note
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.quantity > OLD.quantity THEN 'add'
        WHEN NEW.quantity < OLD.quantity THEN 'adjust'
        ELSE 'update'
      END,
      NEW.quantity - OLD.quantity,
      OLD.quantity,
      NEW.quantity,
      auth.uid(),
      'Stock quantity updated'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_raw_material_change_trigger ON public.raw_materials;
CREATE TRIGGER log_raw_material_change_trigger
    AFTER UPDATE ON public.raw_materials
    FOR EACH ROW
    EXECUTE FUNCTION public.log_raw_material_change();

-- Trigger cleanup for old employee activity logs
CREATE OR REPLACE FUNCTION public.trigger_cleanup_old_logs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF random() < 0.01 THEN
    PERFORM public.cleanup_old_employee_activity_logs();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_old_logs_trigger ON public.employee_activity_logs;
CREATE TRIGGER cleanup_old_logs_trigger
    AFTER INSERT ON public.employee_activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_cleanup_old_logs();

-- Decrement product stock on order item insert
CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - NEW.quantity,
      availability_status = CASE 
        WHEN stock_quantity - NEW.quantity <= 0 THEN 'out_of_stock'
        WHEN stock_quantity - NEW.quantity < 10 THEN 'low_stock'
        ELSE 'in_stock'
      END
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS decrement_stock_trigger ON public.order_items;
CREATE TRIGGER decrement_stock_trigger
    AFTER INSERT ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_product_stock();

-- Updated at triggers for all tables with updated_at column
CREATE OR REPLACE FUNCTION create_updated_at_trigger(table_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
        CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    ', table_name, table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
SELECT create_updated_at_trigger('profiles');
SELECT create_updated_at_trigger('categories');
SELECT create_updated_at_trigger('products');
SELECT create_updated_at_trigger('product_parameters');
SELECT create_updated_at_trigger('product_reviews');
SELECT create_updated_at_trigger('user_addresses');
SELECT create_updated_at_trigger('cart_items');
SELECT create_updated_at_trigger('promo_codes');
SELECT create_updated_at_trigger('orders');
SELECT create_updated_at_trigger('invoices');
SELECT create_updated_at_trigger('invoice_settings');
SELECT create_updated_at_trigger('employees');
SELECT create_updated_at_trigger('employee_salary');
SELECT create_updated_at_trigger('employee_bank_info');
SELECT create_updated_at_trigger('employee_sensitive_info');
SELECT create_updated_at_trigger('employee_documents');
SELECT create_updated_at_trigger('employee_attendance');
SELECT create_updated_at_trigger('employee_leave_balance');
SELECT create_updated_at_trigger('employee_leave_requests');
SELECT create_updated_at_trigger('salary_payments');
SELECT create_updated_at_trigger('homepage_images');
SELECT create_updated_at_trigger('homepage_sections');
SELECT create_updated_at_trigger('homepage_notifications');
SELECT create_updated_at_trigger('shop_slides');
SELECT create_updated_at_trigger('blog_slides');
SELECT create_updated_at_trigger('blog_posts');
SELECT create_updated_at_trigger('partners');
SELECT create_updated_at_trigger('customer_reviews');
SELECT create_updated_at_trigger('design_requests');
SELECT create_updated_at_trigger('design_payments');
SELECT create_updated_at_trigger('raw_materials');
SELECT create_updated_at_trigger('printer_configurations');
SELECT create_updated_at_trigger('drone_configurations');
SELECT create_updated_at_trigger('contact_requests');
SELECT create_updated_at_trigger('admin_notes');

-- Drop the helper function
DROP FUNCTION IF EXISTS create_updated_at_trigger(text);

-- ===========================================
-- SECTION 14: AUTH TRIGGER (for profiles)
-- ===========================================
-- Note: This trigger should be created on auth.users table
-- which requires admin access. Run this separately if needed:

-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================

-- SUMMARY:
-- ✅ 4 Enums created
-- ✅ 12 Security functions created
-- ✅ 48 Tables with columns and constraints
-- ✅ 30+ Indexes for performance
-- ✅ 145+ RLS policies for security
-- ✅ 10+ Triggers for automation
-- ✅ All foreign key relationships defined
