-- =====================================================
-- DATABASE ROLLBACK MIGRATION (down.sql)
-- Generated: 2026-02-01
-- Project: Decouverts Admin/E-commerce Platform
-- =====================================================
-- WARNING: This will DELETE ALL DATA in these tables!
-- Use with extreme caution in production!
-- =====================================================

-- ===========================================
-- SECTION 1: DROP TRIGGERS
-- ===========================================

DROP TRIGGER IF EXISTS set_shipment_id_trigger ON public.orders;
DROP TRIGGER IF EXISTS log_raw_material_change_trigger ON public.raw_materials;
DROP TRIGGER IF EXISTS cleanup_old_logs_trigger ON public.employee_activity_logs;
DROP TRIGGER IF EXISTS decrement_stock_trigger ON public.order_items;

-- Drop all updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_product_parameters_updated_at ON public.product_parameters;
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON public.product_reviews;
DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON public.user_addresses;
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON public.promo_codes;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
DROP TRIGGER IF EXISTS update_invoice_settings_updated_at ON public.invoice_settings;
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
DROP TRIGGER IF EXISTS update_employee_salary_updated_at ON public.employee_salary;
DROP TRIGGER IF EXISTS update_employee_bank_info_updated_at ON public.employee_bank_info;
DROP TRIGGER IF EXISTS update_employee_sensitive_info_updated_at ON public.employee_sensitive_info;
DROP TRIGGER IF EXISTS update_employee_documents_updated_at ON public.employee_documents;
DROP TRIGGER IF EXISTS update_employee_attendance_updated_at ON public.employee_attendance;
DROP TRIGGER IF EXISTS update_employee_leave_balance_updated_at ON public.employee_leave_balance;
DROP TRIGGER IF EXISTS update_employee_leave_requests_updated_at ON public.employee_leave_requests;
DROP TRIGGER IF EXISTS update_salary_payments_updated_at ON public.salary_payments;
DROP TRIGGER IF EXISTS update_homepage_images_updated_at ON public.homepage_images;
DROP TRIGGER IF EXISTS update_homepage_sections_updated_at ON public.homepage_sections;
DROP TRIGGER IF EXISTS update_homepage_notifications_updated_at ON public.homepage_notifications;
DROP TRIGGER IF EXISTS update_shop_slides_updated_at ON public.shop_slides;
DROP TRIGGER IF EXISTS update_blog_slides_updated_at ON public.blog_slides;
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
DROP TRIGGER IF EXISTS update_partners_updated_at ON public.partners;
DROP TRIGGER IF EXISTS update_customer_reviews_updated_at ON public.customer_reviews;
DROP TRIGGER IF EXISTS update_design_requests_updated_at ON public.design_requests;
DROP TRIGGER IF EXISTS update_design_payments_updated_at ON public.design_payments;
DROP TRIGGER IF EXISTS update_raw_materials_updated_at ON public.raw_materials;
DROP TRIGGER IF EXISTS update_printer_configurations_updated_at ON public.printer_configurations;
DROP TRIGGER IF EXISTS update_drone_configurations_updated_at ON public.drone_configurations;
DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON public.contact_requests;
DROP TRIGGER IF EXISTS update_admin_notes_updated_at ON public.admin_notes;

-- ===========================================
-- SECTION 2: DROP TABLES (in dependency order)
-- ===========================================

-- Activity & Logs
DROP TABLE IF EXISTS public.login_attempts CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.admin_notes CASCADE;
DROP TABLE IF EXISTS public.employee_activity_logs CASCADE;

-- Contact & Configurations
DROP TABLE IF EXISTS public.contact_requests CASCADE;
DROP TABLE IF EXISTS public.drone_configurations CASCADE;
DROP TABLE IF EXISTS public.printer_configurations CASCADE;

-- Raw Materials
DROP TABLE IF EXISTS public.raw_material_usage CASCADE;
DROP TABLE IF EXISTS public.raw_material_ledger CASCADE;
DROP TABLE IF EXISTS public.raw_materials CASCADE;

-- Design Requests & Quotations
DROP TABLE IF EXISTS public.design_payments CASCADE;
DROP TABLE IF EXISTS public.quotation_messages CASCADE;
DROP TABLE IF EXISTS public.quotation_negotiations CASCADE;
DROP TABLE IF EXISTS public.design_requests CASCADE;

-- CMS & Content
DROP TABLE IF EXISTS public.customer_reviews CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.blog_slides CASCADE;
DROP TABLE IF EXISTS public.shop_slides CASCADE;
DROP TABLE IF EXISTS public.homepage_notifications CASCADE;
DROP TABLE IF EXISTS public.homepage_sections CASCADE;
DROP TABLE IF EXISTS public.homepage_images CASCADE;

-- Employee Management
DROP TABLE IF EXISTS public.employee_payslips CASCADE;
DROP TABLE IF EXISTS public.salary_payments CASCADE;
DROP TABLE IF EXISTS public.employee_profile_updates CASCADE;
DROP TABLE IF EXISTS public.employee_leave_requests CASCADE;
DROP TABLE IF EXISTS public.employee_leave_balance CASCADE;
DROP TABLE IF EXISTS public.employee_attendance CASCADE;
DROP TABLE IF EXISTS public.employee_documents CASCADE;
DROP TABLE IF EXISTS public.employee_sensitive_info CASCADE;
DROP TABLE IF EXISTS public.employee_bank_info CASCADE;
DROP TABLE IF EXISTS public.employee_salary CASCADE;
DROP TABLE IF EXISTS public.employee_permissions CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;

-- Orders & Commerce
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.invoice_settings CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.promo_codes CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.user_addresses CASCADE;
DROP TABLE IF EXISTS public.product_reviews CASCADE;
DROP TABLE IF EXISTS public.product_parameters CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Core
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- ===========================================
-- SECTION 3: DROP FUNCTIONS
-- ===========================================

DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
DROP FUNCTION IF EXISTS public.is_employee(uuid);
DROP FUNCTION IF EXISTS public.has_admin_access(uuid);
DROP FUNCTION IF EXISTS public.has_permission(uuid, employee_permission);
DROP FUNCTION IF EXISTS public.is_blocked(uuid);
DROP FUNCTION IF EXISTS public.generate_order_number();
DROP FUNCTION IF EXISTS public.generate_shipment_id();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.check_ip_throttle(text, text, integer, integer);
DROP FUNCTION IF EXISTS public.record_login_attempt(text, text, text, boolean);
DROP FUNCTION IF EXISTS public.clear_login_attempts(text, text);
DROP FUNCTION IF EXISTS public.cleanup_old_employee_activity_logs();
DROP FUNCTION IF EXISTS public.set_shipment_id_on_ship();
DROP FUNCTION IF EXISTS public.log_raw_material_change();
DROP FUNCTION IF EXISTS public.trigger_cleanup_old_logs();
DROP FUNCTION IF EXISTS public.decrement_product_stock();
DROP FUNCTION IF EXISTS public.log_permission_change();
DROP FUNCTION IF EXISTS public.log_role_change();
DROP FUNCTION IF EXISTS public.log_employee_status_change();
DROP FUNCTION IF EXISTS public.log_salary_change();
DROP FUNCTION IF EXISTS public.validate_order_status_transition();
DROP FUNCTION IF EXISTS public.log_invoice_creation();
DROP FUNCTION IF EXISTS public.validate_payment_status_change();
DROP FUNCTION IF EXISTS public.validate_cod_payment_confirmation();

-- ===========================================
-- SECTION 4: DROP ENUMS
-- ===========================================

DROP TYPE IF EXISTS public.employee_permission CASCADE;
DROP TYPE IF EXISTS public.salary_type CASCADE;
DROP TYPE IF EXISTS public.salary_status CASCADE;
DROP TYPE IF EXISTS public.leave_status CASCADE;
DROP TYPE IF EXISTS public.attendance_status CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ===========================================
-- ROLLBACK COMPLETE
-- ===========================================
