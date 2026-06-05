// import { toast, Toast } from "react-hot-toast";
// import type { CSSProperties } from "react";
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast"; // assuming react-hot-toast is being used based on t.id

// interface CustomToastProps {
//   t: Toast;
//   title: string;
//   message?: string;
//   type?: "success" | "error" | "info";
//   style?: CSSProperties;
//   iconTheme?: {
//     primary: string;
//     secondary: string;
//   };
// }

// const bgMap = {
//   success: "bg-green-600",
//   error: "bg-red-600",
//   info: "bg-blue-600",
// };



// Clean system icon mapper
const iconMap = {
  success: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />,
  error: <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
  info: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
};

// Subtle border accent for premium dark/light adaptive mode
const borderMap = {
  success: "border-green-500/20 bg-green-500/[0.02]",
  error: "border-red-500/20 bg-red-500/[0.02]",
  warning: "border-amber-500/20 bg-amber-500/[0.02]",
  info: "border-blue-500/20 bg-blue-500/[0.02]",
};

export const CustomToast = ({
  t,
  title,
  message,
  type = "info",
}: {
  t: any;
  title: string;
  message?: string;
  type?: "success" | "error" | "warning" | "info";
}) => {







  return (
    <div
      className={`
        w-full max-w-sm border backdrop-blur-xl rounded-xl shadow-xl p-3.5
        bg-card/90 text-foreground transition-all duration-300 ease-out select-none
        ${borderMap[type as keyof typeof borderMap] || "border-border bg-card/90"}
        ${t?.visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"}
      `}

    >
      <div className="flex items-start gap-3">
        {/* Modern Vector Icon */}
        {iconMap[type]}

        {/* Content Wrapper */}
        <div className="flex-1 space-y-0.5">
          <h4 className="text-xs font-semibold text-foreground tracking-tight">
            {title}
          </h4>
          {message && (
            <p className="text-[11px] text-muted-foreground leading-normal font-normal">
              {message}
            </p>
          )}
        </div>

        {/* Minimal Cross Icon Button */}
        <button
          onClick={() => toast.dismiss(t?.id)}
          className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer group"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};