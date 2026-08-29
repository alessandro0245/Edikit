"use client";

import { Check } from "lucide-react";
import { handlePayment } from "@/lib/payment";
import { plans } from "@/utils/constant";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import ShimmerButton from "@/components/ShimmerButton/ShimmerButton";

export default function Pricing() {
  const user = useSelector((state: RootState) => state.user.user);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground/20 selection:text-foreground py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-sm font-medium text-muted-foreground mb-2 tracking-normal">
            Pricing
          </p>
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-foreground mb-4">
            Choose the perfect plan for you
          </h1>
          <p className="text-muted-foreground text-base font-normal">
            Get started for free. Upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards Grid mapped from constant.ts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const isCurrentPlan = Boolean(
              user && user.planType && user.planType.toLowerCase() === plan.planType.toLowerCase()
            );

            return (
              <div
                key={plan.name}
                className={`flex flex-col justify-between p-6 rounded-2xl transition-all duration-200 ${plan.popular
                    ? "bg-[#1F1F1F] border border-border relative"
                    : "bg-transparent border border-transparent"
                  }`}
              >
                <div>
                  {/* Plan Header */}
                  <div className="h-6 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground">
                      {plan.name}
                    </h3>
                    {plan.popular && (
                      <span className="bg-primary text-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full leading-none">
                        POPULAR
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mt-3">
                    <div className="flex items-baseline text-foreground">
                      <span className="text-3xl sm:text-4xl font-bold tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-base font-normal ml-1 text-foreground">
                        /{plan.period === "per month" ? "month" : plan.period}
                      </span>
                    </div>
                    <p className="text-foreground text-sm mt-3 min-h-[40px] leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Divider */}
                  <div
                    className={`my-6 border-t ${plan.popular ? "border-border" : "border-border"
                      }`}
                  />

                  {/* Features List */}
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 text-[13px] text-foreground"
                      >
                        <Check
                          className={`w-4 h-4 text-muted-foreground shrink-0 ${plan.popular ? "stroke-[2.2]" : "stroke-[1.75]"
                            }`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="mt-8 pt-2">
                  <ShimmerButton
                    disabled={isCurrentPlan}
                    onClick={() => {
                      if (isCurrentPlan) return;
                      handlePayment(plan.id, user?.userId || user?.id);
                    }}
                    variant={plan.popular ? "primary" : "secondary"}
                    borderWeight="subtle"
                    compact
                    size="lg"
                    width="w-full"
                  >
                    {isCurrentPlan ? "Current Plan" : plan.cta}
                  </ShimmerButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
