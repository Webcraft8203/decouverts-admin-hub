import { cn } from "@/lib/utils";
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Timer, 
  Truck, 
  PackageCheck, 
  XCircle 
} from "lucide-react";

interface OrderTimelineProps {
  currentStatus: string;
  className?: string;
}

const statusSteps = [
  { value: "pending", label: "Pending", icon: Timer },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle },
  { value: "packing", label: "Packing", icon: Package },
  { value: "waiting-for-pickup", label: "Pickup", icon: Timer },
  { value: "shipped", label: "Shipped", icon: Truck },
  { value: "out-for-delivery", label: "Out for Delivery", icon: Truck },
  { value: "delivered", label: "Delivered", icon: PackageCheck },
];

export function OrderTimeline({ currentStatus, className }: OrderTimelineProps) {
  if (currentStatus === "cancelled") {
    return (
      <div className={cn("flex items-center gap-2 text-destructive", className)}>
        <XCircle className="w-5 h-5" />
        <span className="font-medium">Order Cancelled</span>
      </div>
    );
  }

  const currentIndex = statusSteps.findIndex(s => s.value === currentStatus);

  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto pb-2", className)}>
      {statusSteps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.value} className="flex items-center">
            <div className="flex flex-col items-center min-w-[60px]">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 text-center",
                  isCurrent && "font-medium text-primary",
                  isCompleted && "text-green-600",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < statusSteps.length - 1 && (
              <div
                className={cn(
                  "w-6 h-0.5 mx-1 mt-[-16px]",
                  index < currentIndex ? "bg-green-500" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
