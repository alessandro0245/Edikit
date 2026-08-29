import { XCircle } from "lucide-react";
import EdikitButton from "@/components/ShimmerButton/ShimmerButton";

export const metadata = {
  title: "Payment Cancelled",
  description: "Your payment has been cancelled",
};

export default function CancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-card px-4">
      <div className="w-full max-w-md">
        {/* Cancel Card */}
        <div className="relative">
          <div className="absolute " />
          <div className="relative bg-card border border-border rounded-2xl p-8 shadow-lg">
            {/* Cancel Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative w-20 h-20 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center animate-pulse">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-3 mb-8">
              <h1 className="text-3xl font-medium text-foreground">
                Payment Cancelled
              </h1>
              <p className="text-muted-foreground text-base">
                Your payment has been cancelled. No charges have been made to
                your account. You can try again or explore other options.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <EdikitButton href="/" variant="primary" width="w-full">
                Back to Home
              </EdikitButton>
              <EdikitButton href="/pricing" width="w-full" variant="secondary">
                Try Again
              </EdikitButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
