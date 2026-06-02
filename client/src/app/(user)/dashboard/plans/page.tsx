"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { CreditCard,  Zap } from "lucide-react";
import { plans } from "@/utils/constant";
import { handlePayment, cancelSubscription } from "@/lib/payment";
import { useState } from "react";
import { showSuccessToast } from "@/components/Toast/showToast";

export default function ManagePlansPage() {
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch<AppDispatch>();
  const currentPlanType = user?.planType || "FREE";
  const [isCanceling, setIsCanceling] = useState(false);
    
  // Try to find the detailed plan info from constant, if not FREE
  const activePlanDetails = plans.find(p => p.planType.toUpperCase() === currentPlanType.toUpperCase());

  const handleCancelPlan = async () => {
    if (!user?.id && !user?.userId) return;
    setIsCanceling(true);
    try {
      await cancelSubscription(user.userId || user.id, dispatch);
      showSuccessToast("Plan cancelled and downgraded to Free");
    } catch(error) {
      console.log(error);
    } finally {
      setIsCanceling(false);
    }
  };
  const currentPlanIndex = plans.findIndex(p => p.planType.toUpperCase() === currentPlanType.toUpperCase());

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Subscription & Billing</h1>
            <p className="text-muted-foreground">
              Manage your current plan, check billing details, and update your tier.
            </p>
          </div>

          {/* Current Plan Card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden mb-10 shadow-sm">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-background rounded-xl shadow-sm border border-border">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Your Current Plan
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-bold text-foreground">
                      {currentPlanType.toUpperCase()}
                    </span>
                    {currentPlanType.toUpperCase() !== "FREE" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                        Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
                        Free Tier
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {currentPlanType.toUpperCase() === "FREE" 
                      ? "You are currently on the Free plan. Upgrade to unlock more credits and features." 
                      : `You are billed ${activePlanDetails?.price} ${activePlanDetails?.period}.`}
                  </p>
                </div>
              </div>
              
              {currentPlanType.toUpperCase() !== "FREE" && (
                <div className="flex shrink-0">
                  <button
                    onClick={handleCancelPlan}
                    disabled={isCanceling}
                    className="px-5 py-2.5 bg-background border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {isCanceling ? "Cancelling..." : "Cancel Subscription"}
                  </button>
                </div>
              )}
            </div>
            
         
          </div>

          {/* Upgrade / Change Plan Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Change Plan</h2>
            <div className="flex flex-col gap-4">
              {plans.map((plan, index) => {
                const isCurrentPlan = currentPlanType.toUpperCase() === plan.planType.toUpperCase();
                const isUpgrade = currentPlanIndex === -1 ? true : index > currentPlanIndex;
                
                return (
                  <div 
                    key={plan.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-5 sm:p-6 rounded-xl border ${
                      isCurrentPlan 
                        ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/20' 
                        : 'bg-card border-border hover:border-primary/30 transition-colors'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                        {plan.popular && !isCurrentPlan && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
                            Recommended
                          </span>
                        )}
                        {isCurrentPlan && (
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {plan.description}
                      </p>
                      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mt-2">
                         <li className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-500"/> {plan.features[0]}</li>
                         <li className="flex items-center gap-1.5">• {plan.features[3]}</li>
                      </ul>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                      <div className="text-left sm:text-right">
                        <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                        <span className="text-xs text-muted-foreground ml-1">/mo</span>
                      </div>
                      
                      <button
                        disabled={isCurrentPlan}
                        onClick={() => {
                          if (isCurrentPlan) return;
                          handlePayment(plan.id, user?.userId || user?.id);
                        }}
                        className={`w-full sm:w-32.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-primary/70 ${
                          isCurrentPlan
                            ? "bg-secondary text-secondary-foreground"
                            : isUpgrade
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-background border border-border text-foreground hover:bg-accent"
                        }`}
                      >
                        {isCurrentPlan ? "Active" : isUpgrade ? "Upgrade" : "Downgrade"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}