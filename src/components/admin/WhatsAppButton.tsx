import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface OrderDetails {
  order_number: string;
  total_amount: number;
  status: string;
  courier_name?: string | null;
  tracking_id?: string | null;
  tracking_url?: string | null;
  expected_delivery_date?: string | null;
  shipping_address?: {
    full_name?: string;
    phone?: string;
  } | null;
}

const getWhatsAppMessage = (order: OrderDetails): string => {
  const customerName = order.shipping_address?.full_name || "Customer";
  const orderId = order.order_number;
  const amount = order.total_amount.toLocaleString();

  const messages: Record<string, string> = {
    confirmed: `Hello ${customerName},

Your order #${orderId} has been confirmed ✅
Order Amount: ₹${amount}

Thank you,
Decouverts Plus`,

    packing: `Hello ${customerName},

Your order #${orderId} is packed 📦
It will be shipped shortly.

– Decouverts Plus`,

    shipped: `Hello ${customerName},

Your order #${orderId} has been shipped 🚚

Courier: ${order.courier_name || "N/A"}
Tracking ID: ${order.tracking_id || "N/A"}
Expected Delivery: ${order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}

${order.tracking_url ? `Track here:\n${order.tracking_url}` : ""}

– Decouverts Plus`,

    "waiting-for-pickup": `Hello ${customerName},

Your order #${orderId} is ready for pickup 📦

Please coordinate with our team for collection.

– Decouverts Plus`,

    "out-for-delivery": `Hello ${customerName},

Your order #${orderId} is out for delivery today 🛵
Please be available to receive it.

– Decouverts Plus`,

    delivered: `Hello ${customerName},

Your order #${orderId} has been delivered successfully 🎉
Thank you for choosing Decouverts Plus!

– Team Decouverts Plus`,

    cancelled: `Hello ${customerName},

Your order #${orderId} has been cancelled.
For support, please contact us.

– Decouverts Plus`,

    pending: `Hello ${customerName},

Your order #${orderId} is pending confirmation.
Order Amount: ₹${amount}

We will update you once confirmed.

– Decouverts Plus`,
  };

  return messages[order.status] || messages.pending;
};

const getButtonLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: "Send Pending Message",
    confirmed: "Send Confirmation",
    packing: "Send Packed Update",
    shipped: "Send Shipping Details",
    "waiting-for-pickup": "Send Pickup Ready",
    "out-for-delivery": "Send Out for Delivery",
    delivered: "Send Delivery Confirmation",
    cancelled: "Send Cancellation",
  };
  return labels[status] || "Send WhatsApp Message";
};

interface WhatsAppButtonProps {
  order: OrderDetails;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const WhatsAppButton = ({ order, variant = "outline", size = "sm", className }: WhatsAppButtonProps) => {
  const handleClick = () => {
    const phone = order.shipping_address?.phone?.replace(/\D/g, "") || "";
    
    // Handle Indian phone numbers
    let formattedPhone = phone;
    if (phone.length === 10) {
      formattedPhone = `91${phone}`;
    } else if (phone.startsWith("0")) {
      formattedPhone = `91${phone.slice(1)}`;
    }
    
    const message = encodeURIComponent(getWhatsAppMessage(order));
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    
    window.open(whatsappUrl, "_blank");
  };

  if (!order.shipping_address?.phone) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`text-green-600 hover:text-green-700 hover:bg-green-50 ${className}`}
    >
      <MessageCircle className="w-4 h-4 mr-1" />
      {getButtonLabel(order.status)}
    </Button>
  );
};
