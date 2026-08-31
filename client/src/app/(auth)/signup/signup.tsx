"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, LoaderCircle, Check, X } from "lucide-react";
import Image from "next/image";
import { GoogleIcon } from "@/components/Overlay/Svg";
import { signupUser, handleGoogleLogin } from "@/lib/auth";
import EdikitButton from "@/components/ShimmerButton/ShimmerButton";
import { useRouter } from "next/navigation";
import { showErrorToast, showSuccessToast } from "@/components/Toast/showToast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { z } from "zod";

// Zod Schema for Signup Form
const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

const signupSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .refine((val) => GMAIL_REGEX.test(val.trim()), {
      message: "Only Gmail addresses (@gmail.com) are allowed",
    }),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

type SignupFormData = z.infer<typeof signupSchema>;



// Password validation criteria
const passwordCriteria = [
  { label: "At least 8 characters", test: (pwd: string) => pwd.length >= 8 },
  { label: "One uppercase letter", test: (pwd: string) => /[A-Z]/.test(pwd) },
  { label: "One lowercase letter", test: (pwd: string) => /[a-z]/.test(pwd) },
  { label: "One number", test: (pwd: string) => /[0-9]/.test(pwd) },
];

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignupFormData, boolean>>>({});

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Clear error when user starts typing
  const handleFieldChange = (field: keyof SignupFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setTouched({ ...touched, [field]: true });

    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Mark all fields as touched
    setTouched({ fullName: true, email: true, password: true });

    const sanitizedData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    };

    // Validate with Zod
    const validation = signupSchema.safeParse(sanitizedData);

    if (!validation.success) {
      // Extract errors from Zod
      const fieldErrors: Partial<Record<keyof SignupFormData, string>> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof SignupFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    // Record consent in iubenda Consent Database
    if (typeof window !== "undefined" && (window as any)._iub?.cons_instructions) {
      (window as any)._iub.cons_instructions.push(["submit", {
        writeOnLocalStorage: false,
        form: { selector: document.getElementById("signup-form") },
        consent: {
          legal_notices: [{ identifier: "privacy_policy" }],
          subject: { email: sanitizedData.email, full_name: sanitizedData.fullName },
        },
      }]);
    }

    try {
      const response = await signupUser(
        sanitizedData.fullName,
        sanitizedData.email,
        sanitizedData.password,
        dispatch
      );
      console.log(response);
      showSuccessToast("Signup successful", "Your account has been created.");
      router.push("/dashboard");
      console.log("Signup successful:", response);
    } catch (error: any) {
      setLoading(false);
      showErrorToast("Signup failed", error.response?.data?.message);
      console.error("Signup failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-background overflow-y-auto">
      <main className="w-full max-w-[550px] bg-background rounded-[2rem]  flex flex-col md:flex-row overflow-hidden min-h-[600px]">
        
        {/* Left Side - Form */}
        <div className="w-full md:w-full p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          <div className="w-full max-w-[400px] mx-auto">
            {/* Header */}
            <div className="space-y-3 mb-8">
              {/* <div className="h-10 flex items-center justify-start mb-6">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div> */}
              <h1 className="text-2xl sm:text-3xl text-center
                font-medium text-foreground tracking-tight leading-tight">
                You&rsquo;re one click away from your best looking videos
              </h1>
              <p className="text-sm text-muted-foreground text-center">
                Try Edikit for free. No credit card required.
              </p>
            </div>

            {/* Social Login */}
            <div>
              <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full cursor-pointer inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
              >
                <GoogleIcon size={18} />
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-background px-4 text-muted-foreground uppercase tracking-wider">
                  Or
                </span>
              </div>
            </div>

            {/* Sign Up Form */}
            <form id="signup-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => handleFieldChange("fullName", e.target.value)}
                    className={`w-full h-11 pl-10 pr-3 text-sm rounded-xl border ${errors.fullName ? "border-red-500" : "border-border"
                      } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${errors.fullName ? "focus:ring-red-500" : "focus:ring-ring"
                      }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-[11px] text-red-500">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@gmail.com"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className={`w-full h-11 pl-10 pr-3 text-sm rounded-xl border ${errors.email ? "border-red-500" : "border-border"
                      } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${errors.email ? "focus:ring-red-500" : "focus:ring-ring"
                      }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleFieldChange("password", e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className={`w-full h-11 pl-10 pr-3 text-sm rounded-xl border ${errors.password ? "border-red-500" : "border-border"
                      } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${errors.password ? "focus:ring-red-500" : "focus:ring-ring"
                      }`}
                  />
                </div>

                {/* Password Requirements */}
                {(isPasswordFocused || (formData.password.length > 0 && !passwordCriteria.every(c => c.test(formData.password)))) && (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1.5 transition-all duration-300">
                    {passwordCriteria.map((criterion, index) => {
                      const isValid = criterion.test(formData.password);
                      const showCheck = formData.password.length > 0;

                      return (
                        <div key={index} className="flex items-center gap-1.5 text-[11px]">
                          {showCheck ? (
                            isValid ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-red-500" />
                            )
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/50" />
                          )}
                          <span className={showCheck && isValid ? "text-green-500" : "text-muted-foreground"}>
                            {criterion.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {errors.password && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Terms */}
              <div className="pt-1">
                <p className="text-xs text-muted-foreground leading-normal">
                  By signing up, you agree to Edikit's{" "}
                  <Link href="https://www.iubenda.com/privacy-policy/82026734" className="text-primary hover:underline font-medium">
                    Terms of Service
                  </Link>{" "}and acknowledge the{" "}
                  <Link href="https://www.iubenda.com/privacy-policy/82026734/cookie-policy" className="text-primary hover:underline font-medium">
                    Privacy Statement
                  </Link>.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <EdikitButton
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  width="w-full"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoaderCircle className="animate-spin h-5 w-5 text-primary-foreground" />
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </EdikitButton>
              </div>
            </form>

            {/* Login Link */}
            <p className="text-start text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Image */}
       {/* <div className="hidden md:flex md:w-1/2 items-center justify-center relative">
                <div className="relative w-full h-full rounded-2xl overflow-hidden">
                  <Image
                    src="/auth.png"
                    alt="Authentication visual"
                    fill
                    className="object-cover object-[20%]"
                    priority
                  />
                </div>
        </div> */}

      </main>
    </div>
  );
}