export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          admin_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          note_text: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          note_text: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          note_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_reviews: {
        Row: {
          company_name: string
          created_at: string
          customer_name: string
          designation: string | null
          display_order: number
          id: string
          image_description: string
          image_title: string
          photo_url: string | null
          rating: number | null
          review_text: string
          status: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          customer_name: string
          designation?: string | null
          display_order?: number
          id?: string
          image_description: string
          image_title: string
          photo_url?: string | null
          rating?: number | null
          review_text: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          customer_name?: string
          designation?: string | null
          display_order?: number
          id?: string
          image_description?: string
          image_title?: string
          photo_url?: string | null
          rating?: number | null
          review_text?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      design_payments: {
        Row: {
          amount: number
          created_at: string
          design_request_id: string
          id: string
          payment_status: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          design_request_id: string
          id?: string
          payment_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          design_request_id?: string
          id?: string
          payment_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_payments_design_request_id_fkey"
            columns: ["design_request_id"]
            isOneToOne: false
            referencedRelation: "design_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      design_requests: {
        Row: {
          admin_notes: string | null
          converted_to_order: boolean
          created_at: string
          description: string | null
          file_name: string | null
          file_url: string
          final_amount: number | null
          id: string
          price_locked: boolean
          quantity: number
          quoted_amount: number | null
          size: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          converted_to_order?: boolean
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_url: string
          final_amount?: number | null
          id?: string
          price_locked?: boolean
          quantity?: number
          quoted_amount?: number | null
          size?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          converted_to_order?: boolean
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_url?: string
          final_amount?: number | null
          id?: string
          price_locked?: boolean
          quantity?: number
          quoted_amount?: number | null
          size?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drone_configurations: {
        Row: {
          admin_notes: string | null
          belongs_to_organization: boolean
          created_at: string
          custom_autonomy_level: boolean | null
          custom_camera_type: boolean | null
          custom_communication_range: boolean | null
          custom_control: string | null
          custom_encryption: boolean | null
          custom_encryption_level: boolean | null
          custom_endurance_payload: boolean | null
          custom_environmental_resistance: boolean | null
          custom_flight_time: string | null
          custom_frame: string | null
          custom_frame_size_type: boolean | null
          custom_payload_camera: boolean | null
          custom_payload_communication: boolean | null
          custom_payload_sensor: boolean | null
          custom_range: string | null
          designation: string | null
          drone_category: string
          email: string
          fpv_model: string | null
          full_name: string
          id: string
          ind_model: string | null
          organization_name: string | null
          organization_type: string | null
          phone_number: string
          status: string
          surv_model: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          belongs_to_organization?: boolean
          created_at?: string
          custom_autonomy_level?: boolean | null
          custom_camera_type?: boolean | null
          custom_communication_range?: boolean | null
          custom_control?: string | null
          custom_encryption?: boolean | null
          custom_encryption_level?: boolean | null
          custom_endurance_payload?: boolean | null
          custom_environmental_resistance?: boolean | null
          custom_flight_time?: string | null
          custom_frame?: string | null
          custom_frame_size_type?: boolean | null
          custom_payload_camera?: boolean | null
          custom_payload_communication?: boolean | null
          custom_payload_sensor?: boolean | null
          custom_range?: string | null
          designation?: string | null
          drone_category: string
          email: string
          fpv_model?: string | null
          full_name: string
          id?: string
          ind_model?: string | null
          organization_name?: string | null
          organization_type?: string | null
          phone_number: string
          status?: string
          surv_model?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          belongs_to_organization?: boolean
          created_at?: string
          custom_autonomy_level?: boolean | null
          custom_camera_type?: boolean | null
          custom_communication_range?: boolean | null
          custom_control?: string | null
          custom_encryption?: boolean | null
          custom_encryption_level?: boolean | null
          custom_endurance_payload?: boolean | null
          custom_environmental_resistance?: boolean | null
          custom_flight_time?: string | null
          custom_frame?: string | null
          custom_frame_size_type?: boolean | null
          custom_payload_camera?: boolean | null
          custom_payload_communication?: boolean | null
          custom_payload_sensor?: boolean | null
          custom_range?: string | null
          designation?: string | null
          drone_category?: string
          email?: string
          fpv_model?: string | null
          full_name?: string
          id?: string
          ind_model?: string | null
          organization_name?: string | null
          organization_type?: string | null
          phone_number?: string
          status?: string
          surv_model?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_images: {
        Row: {
          alt_text: string | null
          category: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          is_featured: boolean
          project_id: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          alt_text?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          is_featured?: boolean
          project_id?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          alt_text?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          is_featured?: boolean
          project_id?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      homepage_notifications: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          section_key: string
          section_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          section_key: string
          section_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          section_key?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_settings: {
        Row: {
          business_address: string
          business_city: string
          business_country: string
          business_email: string
          business_gstin: string
          business_logo_url: string | null
          business_name: string
          business_phone: string
          business_pincode: string
          business_state: string
          created_at: string
          default_gst_rate: number
          id: string
          invoice_prefix: string
          platform_fee_percentage: number
          platform_fee_taxable: boolean
          terms_and_conditions: string
          updated_at: string
        }
        Insert: {
          business_address?: string
          business_city?: string
          business_country?: string
          business_email?: string
          business_gstin?: string
          business_logo_url?: string | null
          business_name?: string
          business_phone?: string
          business_pincode?: string
          business_state?: string
          created_at?: string
          default_gst_rate?: number
          id?: string
          invoice_prefix?: string
          platform_fee_percentage?: number
          platform_fee_taxable?: boolean
          terms_and_conditions?: string
          updated_at?: string
        }
        Update: {
          business_address?: string
          business_city?: string
          business_country?: string
          business_email?: string
          business_gstin?: string
          business_logo_url?: string | null
          business_name?: string
          business_phone?: string
          business_pincode?: string
          business_state?: string
          created_at?: string
          default_gst_rate?: number
          id?: string
          invoice_prefix?: string
          platform_fee_percentage?: number
          platform_fee_taxable?: boolean
          terms_and_conditions?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          buyer_gstin: string | null
          buyer_state: string | null
          cgst_amount: number | null
          client_address: string | null
          client_email: string | null
          client_name: string
          created_at: string
          created_by: string | null
          delivery_date: string | null
          gst_breakdown: Json | null
          id: string
          igst_amount: number | null
          invoice_number: string
          invoice_type: string | null
          is_final: boolean | null
          is_igst: boolean | null
          items: Json
          notes: string | null
          order_id: string | null
          pdf_url: string | null
          platform_fee: number | null
          platform_fee_tax: number | null
          seller_state: string | null
          sgst_amount: number | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_gstin?: string | null
          buyer_state?: string | null
          cgst_amount?: number | null
          client_address?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string
          created_by?: string | null
          delivery_date?: string | null
          gst_breakdown?: Json | null
          id?: string
          igst_amount?: number | null
          invoice_number: string
          invoice_type?: string | null
          is_final?: boolean | null
          is_igst?: boolean | null
          items?: Json
          notes?: string | null
          order_id?: string | null
          pdf_url?: string | null
          platform_fee?: number | null
          platform_fee_tax?: number | null
          seller_state?: string | null
          sgst_amount?: number | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          buyer_gstin?: string | null
          buyer_state?: string | null
          cgst_amount?: number | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          delivery_date?: string | null
          gst_breakdown?: Json | null
          id?: string
          igst_amount?: number | null
          invoice_number?: string
          invoice_type?: string | null
          is_final?: boolean | null
          is_igst?: boolean | null
          items?: Json
          notes?: string | null
          order_id?: string | null
          pdf_url?: string | null
          platform_fee?: number | null
          platform_fee_tax?: number | null
          seller_state?: string | null
          sgst_amount?: number | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number
          total_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_price: number
          quantity?: number
          total_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          buyer_gstin: string | null
          courier_name: string | null
          created_at: string
          delivered_at: string | null
          design_request_id: string | null
          discount_amount: number | null
          expected_delivery_date: string | null
          final_invoice_url: string | null
          gst_breakdown: Json | null
          id: string
          invoice_url: string | null
          notes: string | null
          order_number: string
          order_type: string
          payment_id: string | null
          payment_status: string | null
          proforma_invoice_url: string | null
          promo_code_id: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_amount: number
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          tracking_id: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_id?: string | null
          buyer_gstin?: string | null
          courier_name?: string | null
          created_at?: string
          delivered_at?: string | null
          design_request_id?: string | null
          discount_amount?: number | null
          expected_delivery_date?: string | null
          final_invoice_url?: string | null
          gst_breakdown?: Json | null
          id?: string
          invoice_url?: string | null
          notes?: string | null
          order_number: string
          order_type?: string
          payment_id?: string | null
          payment_status?: string | null
          proforma_invoice_url?: string | null
          promo_code_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_id?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_id?: string | null
          buyer_gstin?: string | null
          courier_name?: string | null
          created_at?: string
          delivered_at?: string | null
          design_request_id?: string | null
          discount_amount?: number | null
          expected_delivery_date?: string | null
          final_invoice_url?: string | null
          gst_breakdown?: Json | null
          id?: string
          invoice_url?: string | null
          notes?: string | null
          order_number?: string
          order_type?: string
          payment_id?: string | null
          payment_status?: string | null
          proforma_invoice_url?: string | null
          promo_code_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_id?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "user_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_design_request_id_fkey"
            columns: ["design_request_id"]
            isOneToOne: false
            referencedRelation: "design_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_description: string
          image_title: string
          logo_url: string
          partner_name: string
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_description: string
          image_title: string
          logo_url: string
          partner_name: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_description?: string
          image_title?: string
          logo_url?: string
          partner_name?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      printer_configurations: {
        Row: {
          accuracy_tier: string
          active_chamber_heating: boolean | null
          admin_notes: string | null
          advanced_material_training: boolean | null
          amc_plan: string | null
          ams_4_color: boolean | null
          ams_8_color: boolean | null
          ams_filament_dryer: boolean | null
          ams_type: string
          base_model: string
          bed_heating: string
          bed_surface: string
          belongs_to_organization: boolean
          cad_slicer_training: boolean | null
          calibration_kit: boolean | null
          cf_gf_filled: boolean | null
          created_at: string
          designation: string | null
          electronics_tier: string
          email: string
          emergency_stop: boolean | null
          engineering_polymers: boolean | null
          extruder_count: string
          filament_dryer: boolean | null
          full_name: string
          hardened_nozzle: boolean | null
          hepa_carbon_filter: boolean | null
          high_flow_setup: boolean | null
          id: string
          large_bed_reinforcement: boolean | null
          max_nozzle_temp: string
          motion_tier: string
          multi_chamber_dryer: boolean | null
          multi_material: boolean | null
          noise_reduction_panels: boolean | null
          nylon_pa: boolean | null
          organization_name: string | null
          organization_type: string | null
          panel_material: string
          pellet_extruder: boolean | null
          phone_number: string
          printer_stand: boolean | null
          spare_nozzle_kit: boolean | null
          spool_capacity: string | null
          status: string
          supported_colors: string
          tool_storage: boolean | null
          tpu_flexible: boolean | null
          updated_at: string
        }
        Insert: {
          accuracy_tier: string
          active_chamber_heating?: boolean | null
          admin_notes?: string | null
          advanced_material_training?: boolean | null
          amc_plan?: string | null
          ams_4_color?: boolean | null
          ams_8_color?: boolean | null
          ams_filament_dryer?: boolean | null
          ams_type: string
          base_model: string
          bed_heating: string
          bed_surface: string
          belongs_to_organization?: boolean
          cad_slicer_training?: boolean | null
          calibration_kit?: boolean | null
          cf_gf_filled?: boolean | null
          created_at?: string
          designation?: string | null
          electronics_tier: string
          email: string
          emergency_stop?: boolean | null
          engineering_polymers?: boolean | null
          extruder_count: string
          filament_dryer?: boolean | null
          full_name: string
          hardened_nozzle?: boolean | null
          hepa_carbon_filter?: boolean | null
          high_flow_setup?: boolean | null
          id?: string
          large_bed_reinforcement?: boolean | null
          max_nozzle_temp: string
          motion_tier: string
          multi_chamber_dryer?: boolean | null
          multi_material?: boolean | null
          noise_reduction_panels?: boolean | null
          nylon_pa?: boolean | null
          organization_name?: string | null
          organization_type?: string | null
          panel_material: string
          pellet_extruder?: boolean | null
          phone_number: string
          printer_stand?: boolean | null
          spare_nozzle_kit?: boolean | null
          spool_capacity?: string | null
          status?: string
          supported_colors: string
          tool_storage?: boolean | null
          tpu_flexible?: boolean | null
          updated_at?: string
        }
        Update: {
          accuracy_tier?: string
          active_chamber_heating?: boolean | null
          admin_notes?: string | null
          advanced_material_training?: boolean | null
          amc_plan?: string | null
          ams_4_color?: boolean | null
          ams_8_color?: boolean | null
          ams_filament_dryer?: boolean | null
          ams_type?: string
          base_model?: string
          bed_heating?: string
          bed_surface?: string
          belongs_to_organization?: boolean
          cad_slicer_training?: boolean | null
          calibration_kit?: boolean | null
          cf_gf_filled?: boolean | null
          created_at?: string
          designation?: string | null
          electronics_tier?: string
          email?: string
          emergency_stop?: boolean | null
          engineering_polymers?: boolean | null
          extruder_count?: string
          filament_dryer?: boolean | null
          full_name?: string
          hardened_nozzle?: boolean | null
          hepa_carbon_filter?: boolean | null
          high_flow_setup?: boolean | null
          id?: string
          large_bed_reinforcement?: boolean | null
          max_nozzle_temp?: string
          motion_tier?: string
          multi_chamber_dryer?: boolean | null
          multi_material?: boolean | null
          noise_reduction_panels?: boolean | null
          nylon_pa?: boolean | null
          organization_name?: string | null
          organization_type?: string | null
          panel_material?: string
          pellet_extruder?: boolean | null
          phone_number?: string
          printer_stand?: boolean | null
          spare_nozzle_kit?: boolean | null
          spool_capacity?: string | null
          status?: string
          supported_colors?: string
          tool_storage?: boolean | null
          tpu_flexible?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          availability_status: string
          category_id: string | null
          created_at: string
          description: string | null
          gst_percentage: number
          id: string
          images: string[] | null
          is_highlighted: boolean
          name: string
          price: number
          stock_quantity: number
          updated_at: string
          video_url: string | null
        }
        Insert: {
          availability_status?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          gst_percentage?: number
          id?: string
          images?: string[] | null
          is_highlighted?: boolean
          name: string
          price?: number
          stock_quantity?: number
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          availability_status?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          gst_percentage?: number
          id?: string
          images?: string[] | null
          is_highlighted?: boolean
          name?: string
          price?: number
          stock_quantity?: number
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          age: number | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_blocked: boolean
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string
          age?: number | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_blocked?: boolean
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string
          age?: number | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount_amount: number | null
          max_uses: number
          min_order_amount: number | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number
          min_order_amount?: number | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number
          min_order_amount?: number | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      quotation_messages: {
        Row: {
          created_at: string
          design_request_id: string
          id: string
          is_read: boolean
          message_text: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          created_at?: string
          design_request_id: string
          id?: string
          is_read?: boolean
          message_text: string
          sender_id: string
          sender_role: string
        }
        Update: {
          created_at?: string
          design_request_id?: string
          id?: string
          is_read?: boolean
          message_text?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_messages_design_request_id_fkey"
            columns: ["design_request_id"]
            isOneToOne: false
            referencedRelation: "design_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_negotiations: {
        Row: {
          created_at: string
          design_request_id: string
          id: string
          message: string | null
          proposed_amount: number
          sender_id: string
          sender_role: string
        }
        Insert: {
          created_at?: string
          design_request_id: string
          id?: string
          message?: string | null
          proposed_amount: number
          sender_id: string
          sender_role: string
        }
        Update: {
          created_at?: string
          design_request_id?: string
          id?: string
          message?: string | null
          proposed_amount?: number
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_negotiations_design_request_id_fkey"
            columns: ["design_request_id"]
            isOneToOne: false
            referencedRelation: "design_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_material_ledger: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          new_quantity: number
          note: string | null
          previous_quantity: number
          quantity_change: number
          raw_material_id: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          new_quantity: number
          note?: string | null
          previous_quantity: number
          quantity_change: number
          raw_material_id: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          new_quantity?: number
          note?: string | null
          previous_quantity?: number
          quantity_change?: number
          raw_material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_material_ledger_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_material_usage: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          quantity_used: number
          raw_material_id: string
          reference_id: string | null
          reference_note: string | null
          usage_type: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          quantity_used: number
          raw_material_id: string
          reference_id?: string | null
          reference_note?: string | null
          usage_type?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          quantity_used?: number
          raw_material_id?: string
          reference_id?: string | null
          reference_note?: string | null
          usage_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_material_usage_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          availability_status: string
          cost_per_unit: number | null
          created_at: string
          description: string | null
          id: string
          min_quantity: number
          name: string
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          availability_status?: string
          cost_per_unit?: number | null
          created_at?: string
          description?: string | null
          id?: string
          min_quantity?: number
          name: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          availability_status?: string
          cost_per_unit?: number | null
          created_at?: string
          description?: string | null
          id?: string
          min_quantity?: number
          name?: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean | null
          label: string
          phone: string
          postal_code: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean | null
          label?: string
          phone: string
          postal_code: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          label?: string
          phone?: string
          postal_code?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
