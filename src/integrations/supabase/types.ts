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
      blog_posts: {
        Row: {
          author_name: string
          content: string | null
          content_type: string
          created_at: string
          excerpt: string | null
          feature_image: string | null
          id: string
          image_gallery: string[] | null
          meta_description: string | null
          meta_title: string | null
          publish_date: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          author_name?: string
          content?: string | null
          content_type?: string
          created_at?: string
          excerpt?: string | null
          feature_image?: string | null
          id?: string
          image_gallery?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          publish_date?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          author_name?: string
          content?: string | null
          content_type?: string
          created_at?: string
          excerpt?: string | null
          feature_image?: string | null
          id?: string
          image_gallery?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          publish_date?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      blog_slides: {
        Row: {
          created_at: string
          cta_link: string | null
          cta_text: string | null
          description: string | null
          display_order: number
          id: string
          image_url: string
          is_visible: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_visible?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_visible?: boolean
          title?: string
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
          icon_name: string | null
          id: string
          mission_label: string | null
          name: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          mission_label?: string | null
          name: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          mission_label?: string | null
          name?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          category: string
          certificate_number: string | null
          created_at: string
          description: string | null
          display_order: number
          expiry_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          issue_date: string | null
          issuing_authority: string
          pdf_url: string | null
          status_label: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          certificate_number?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          issue_date?: string | null
          issuing_authority: string
          pdf_url?: string | null
          status_label?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          certificate_number?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          issue_date?: string | null
          issuing_authority?: string
          pdf_url?: string | null
          status_label?: string | null
          title?: string
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
      customer_master: {
        Row: {
          alternate_mobile: string | null
          billing_address: string | null
          city: string | null
          company_name: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          created_by: string | null
          customer_name: string
          customer_type: string
          email: string | null
          gst_number: string | null
          id: string
          last_invoice_date: string | null
          mobile_number: string | null
          notes: string | null
          pan_number: string | null
          pincode: string | null
          shipping_address: string | null
          source: string
          state: string | null
          subscriber_id: string | null
          total_invoices_count: number
          updated_at: string
        }
        Insert: {
          alternate_mobile?: string | null
          billing_address?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          customer_name: string
          customer_type?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          last_invoice_date?: string | null
          mobile_number?: string | null
          notes?: string | null
          pan_number?: string | null
          pincode?: string | null
          shipping_address?: string | null
          source?: string
          state?: string | null
          subscriber_id?: string | null
          total_invoices_count?: number
          updated_at?: string
        }
        Update: {
          alternate_mobile?: string | null
          billing_address?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string
          customer_type?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          last_invoice_date?: string | null
          mobile_number?: string | null
          notes?: string | null
          pan_number?: string | null
          pincode?: string | null
          shipping_address?: string | null
          source?: string
          state?: string | null
          subscriber_id?: string | null
          total_invoices_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_master_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
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
      hero_slides: {
        Row: {
          background_image_url: string | null
          badge_label: string | null
          created_at: string
          description: string | null
          display_order: number
          glow_color: string | null
          id: string
          image_url: string | null
          is_active: boolean
          primary_cta_label: string | null
          primary_cta_link: string | null
          secondary_cta_label: string | null
          secondary_cta_link: string | null
          subtitle: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          background_image_url?: string | null
          badge_label?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          glow_color?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          primary_cta_label?: string | null
          primary_cta_link?: string | null
          secondary_cta_label?: string | null
          secondary_cta_link?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          background_image_url?: string | null
          badge_label?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          glow_color?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          primary_cta_label?: string | null
          primary_cta_link?: string | null
          secondary_cta_label?: string | null
          secondary_cta_link?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
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
      invoice_product_usage: {
        Row: {
          created_at: string
          description: string | null
          gst_rate: number | null
          hsn_code: string | null
          id: string
          invoice_id: string
          line_index: number | null
          product_id: string
          quantity: number
          rate: number
          total: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          gst_rate?: number | null
          hsn_code?: string | null
          id?: string
          invoice_id: string
          line_index?: number | null
          product_id: string
          quantity?: number
          rate?: number
          total?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          gst_rate?: number | null
          hsn_code?: string | null
          id?: string
          invoice_id?: string
          line_index?: number | null
          product_id?: string
          quantity?: number
          rate?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_product_usage_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_product_usage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_master"
            referencedColumns: ["id"]
          },
        ]
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
          category_code: string | null
          cgst_amount: number | null
          client_address: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          converted_to_invoice_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          delivery_date: string | null
          financial_year: string | null
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
          payment_date: string | null
          payment_method: string | null
          payment_notes: string | null
          payment_reference: string | null
          payment_status: string
          pdf_url: string | null
          platform_fee: number | null
          platform_fee_tax: number | null
          proforma_status: string | null
          seller_state: string | null
          serial_number: number | null
          sgst_amount: number | null
          source_proforma_id: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_gstin?: string | null
          buyer_state?: string | null
          category_code?: string | null
          cgst_amount?: number | null
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          financial_year?: string | null
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
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_reference?: string | null
          payment_status?: string
          pdf_url?: string | null
          platform_fee?: number | null
          platform_fee_tax?: number | null
          proforma_status?: string | null
          seller_state?: string | null
          serial_number?: number | null
          sgst_amount?: number | null
          source_proforma_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          buyer_gstin?: string | null
          buyer_state?: string | null
          category_code?: string | null
          cgst_amount?: number | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          financial_year?: string | null
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
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_reference?: string | null
          payment_status?: string
          pdf_url?: string | null
          platform_fee?: number | null
          platform_fee_tax?: number | null
          proforma_status?: string | null
          seller_state?: string | null
          serial_number?: number | null
          sgst_amount?: number | null
          source_proforma_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_converted_to_invoice_id_fkey"
            columns: ["converted_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_source_proforma_id_fkey"
            columns: ["source_proforma_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          email: string | null
          id: string
          ip_address: string
          portal_type: string
        }
        Insert: {
          attempt_type: string
          created_at?: string
          email?: string | null
          id?: string
          ip_address: string
          portal_type: string
        }
        Update: {
          attempt_type?: string
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string
          portal_type?: string
        }
        Relationships: []
      }
      newsletter_sends: {
        Row: {
          content: string
          created_at: string
          id: string
          recipient_count: number
          sent_by: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          recipient_count?: number
          sent_by: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          recipient_count?: number
          sent_by?: string
          subject?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          customer_id: string | null
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          customer_id?: string | null
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          customer_id?: string | null
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_master"
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
          cod_collected_at: string | null
          cod_confirmed_at: string | null
          cod_confirmed_by: string | null
          cod_courier_name: string | null
          cod_payment_status: string | null
          cod_settled_at: string | null
          courier_name: string | null
          created_at: string
          delivered_at: string | null
          delivery_notes: string | null
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
          shipment_id: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_amount: number
          shipping_label_url: string | null
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
          cod_collected_at?: string | null
          cod_confirmed_at?: string | null
          cod_confirmed_by?: string | null
          cod_courier_name?: string | null
          cod_payment_status?: string | null
          cod_settled_at?: string | null
          courier_name?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_notes?: string | null
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
          shipment_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number
          shipping_label_url?: string | null
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
          cod_collected_at?: string | null
          cod_confirmed_at?: string | null
          cod_confirmed_by?: string | null
          cod_courier_name?: string | null
          cod_payment_status?: string | null
          cod_settled_at?: string | null
          courier_name?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_notes?: string | null
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
          shipment_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number
          shipping_label_url?: string | null
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
          is_featured: boolean
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
          is_featured?: boolean
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
          is_featured?: boolean
          logo_url?: string
          partner_name?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      product_360_images: {
        Row: {
          created_at: string
          frame_index: number
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string
          frame_index?: number
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string
          frame_index?: number
          id?: string
          image_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_360_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_accessories: {
        Row: {
          accessory_product_id: string
          accessory_type: string | null
          created_at: string
          display_order: number
          id: string
          product_id: string
        }
        Insert: {
          accessory_product_id: string
          accessory_type?: string | null
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
        }
        Update: {
          accessory_product_id?: string
          accessory_type?: string | null
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_accessories_accessory_product_id_fkey"
            columns: ["accessory_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_accessories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_certifications: {
        Row: {
          cert_name: string
          cert_type: string | null
          created_at: string
          display_order: number
          icon_name: string | null
          id: string
          issued_by: string | null
          product_id: string
        }
        Insert: {
          cert_name: string
          cert_type?: string | null
          created_at?: string
          display_order?: number
          icon_name?: string | null
          id?: string
          issued_by?: string | null
          product_id: string
        }
        Update: {
          cert_name?: string
          cert_type?: string | null
          created_at?: string
          display_order?: number
          icon_name?: string | null
          id?: string
          issued_by?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_certifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_downloads: {
        Row: {
          created_at: string
          display_order: number
          download_type: string
          file_size: number | null
          file_url: string
          id: string
          product_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          download_type?: string
          file_size?: number | null
          file_url: string
          id?: string
          product_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          download_type?: string
          file_size?: number | null
          file_url?: string
          id?: string
          product_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_downloads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_features: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          product_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          product_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          product_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_features_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_highlights: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          label: string
          product_id: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          label: string
          product_id: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          label?: string
          product_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_highlights_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_parameters: {
        Row: {
          created_at: string
          display_order: number
          id: string
          parameter_name: string
          parameter_value: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          parameter_name: string
          parameter_value: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          parameter_name?: string
          parameter_value?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_parameters_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_related: {
        Row: {
          created_at: string
          display_order: number
          id: string
          product_id: string
          related_product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
          related_product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
          related_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_related_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_related_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      product_timeline: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          event_date: string | null
          id: string
          product_id: string
          stage: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          event_date?: string | null
          id?: string
          product_id: string
          stage: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          event_date?: string | null
          id?: string
          product_id?: string
          stage?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_timeline_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          applications: string[]
          availability_status: string
          awards: string[] | null
          blueprint_images: string[] | null
          brand: string | null
          canonical_url: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          featured_order: number
          gallery_360: string[]
          gst_percentage: number
          hsn_code: string | null
          id: string
          images: string[] | null
          industries: string[] | null
          is_bestseller: boolean
          is_coming_soon: boolean
          is_discontinued: boolean
          is_featured: boolean
          is_highlighted: boolean
          is_new_arrival: boolean
          is_pre_order: boolean
          long_description: string | null
          made_in_india: boolean
          mission_ready_score: number | null
          mission_type: string | null
          model_3d_format: string | null
          model_3d_url: string | null
          model_number: string | null
          name: string
          og_image_url: string | null
          platform_count_label: string | null
          price: number
          readiness_breakdown: Json | null
          seo_description: string | null
          seo_keywords: string[]
          seo_title: string | null
          series: string | null
          short_description: string | null
          sku: string | null
          slug: string | null
          step_file_url: string | null
          stl_file_url: string | null
          stock_quantity: number
          updated_at: string
          video_url: string | null
          video_urls: Json | null
        }
        Insert: {
          applications?: string[]
          availability_status?: string
          awards?: string[] | null
          blueprint_images?: string[] | null
          brand?: string | null
          canonical_url?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          featured_order?: number
          gallery_360?: string[]
          gst_percentage?: number
          hsn_code?: string | null
          id?: string
          images?: string[] | null
          industries?: string[] | null
          is_bestseller?: boolean
          is_coming_soon?: boolean
          is_discontinued?: boolean
          is_featured?: boolean
          is_highlighted?: boolean
          is_new_arrival?: boolean
          is_pre_order?: boolean
          long_description?: string | null
          made_in_india?: boolean
          mission_ready_score?: number | null
          mission_type?: string | null
          model_3d_format?: string | null
          model_3d_url?: string | null
          model_number?: string | null
          name: string
          og_image_url?: string | null
          platform_count_label?: string | null
          price?: number
          readiness_breakdown?: Json | null
          seo_description?: string | null
          seo_keywords?: string[]
          seo_title?: string | null
          series?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          step_file_url?: string | null
          stl_file_url?: string | null
          stock_quantity?: number
          updated_at?: string
          video_url?: string | null
          video_urls?: Json | null
        }
        Update: {
          applications?: string[]
          availability_status?: string
          awards?: string[] | null
          blueprint_images?: string[] | null
          brand?: string | null
          canonical_url?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          featured_order?: number
          gallery_360?: string[]
          gst_percentage?: number
          hsn_code?: string | null
          id?: string
          images?: string[] | null
          industries?: string[] | null
          is_bestseller?: boolean
          is_coming_soon?: boolean
          is_discontinued?: boolean
          is_featured?: boolean
          is_highlighted?: boolean
          is_new_arrival?: boolean
          is_pre_order?: boolean
          long_description?: string | null
          made_in_india?: boolean
          mission_ready_score?: number | null
          mission_type?: string | null
          model_3d_format?: string | null
          model_3d_url?: string | null
          model_number?: string | null
          name?: string
          og_image_url?: string | null
          platform_count_label?: string | null
          price?: number
          readiness_breakdown?: Json | null
          seo_description?: string | null
          seo_keywords?: string[]
          seo_title?: string | null
          series?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          step_file_url?: string | null
          stl_file_url?: string | null
          stock_quantity?: number
          updated_at?: string
          video_url?: string | null
          video_urls?: Json | null
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
      products_master: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          default_gst_rate: number
          default_unit_price: number
          description: string | null
          hsn_code: string
          id: string
          invoice_count: number
          last_used_at: string | null
          product_name: string
          product_name_norm: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_gst_rate?: number
          default_unit_price?: number
          description?: string | null
          hsn_code: string
          id?: string
          invoice_count?: number
          last_used_at?: string | null
          product_name: string
          product_name_norm?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_gst_rate?: number
          default_unit_price?: number
          description?: string | null
          hsn_code?: string
          id?: string
          invoice_count?: number
          last_used_at?: string | null
          product_name?: string
          product_name_norm?: string | null
          updated_at?: string
        }
        Relationships: []
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
      shop_slides: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string
          is_visible: boolean
          product_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_visible?: boolean
          product_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_visible?: boolean
          product_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_slides_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      check_ip_throttle: {
        Args: {
          _ip_address: string
          _max_attempts?: number
          _portal_type: string
          _window_minutes?: number
        }
        Returns: Json
      }
      clear_login_attempts: {
        Args: { _ip_address: string; _portal_type: string }
        Returns: undefined
      }
      generate_order_number: { Args: never; Returns: string }
      generate_shipment_id: { Args: never; Returns: string }
      generate_structured_invoice_number: {
        Args: { _category_code: string }
        Returns: {
          category_code: string
          financial_year: string
          invoice_number: string
          serial_number: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      record_login_attempt: {
        Args: {
          _email: string
          _ip_address: string
          _portal_type: string
          _success: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "employee"
      attendance_status:
        | "present"
        | "absent"
        | "half_day"
        | "on_leave"
        | "holiday"
      leave_status: "pending" | "approved" | "rejected"
      salary_status: "pending" | "paid" | "on_hold"
      salary_type: "monthly" | "hourly" | "contract"
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
      app_role: ["admin", "user", "employee"],
      attendance_status: [
        "present",
        "absent",
        "half_day",
        "on_leave",
        "holiday",
      ],
      leave_status: ["pending", "approved", "rejected"],
      salary_status: ["pending", "paid", "on_hold"],
      salary_type: ["monthly", "hourly", "contract"],
    },
  },
} as const
