"use client";
import React, { useState } from "react";
import { Mail, Lock, LoaderCircle, } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { GoogleIcon } from "@/components/Overlay/Svg";
import { loginUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { showErrorToast, showSuccessToast } from "@/components/Toast/showToast";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { z } from "zod";
import { handleGoogleLogin } from "@/lib/auth";
import EdikitButton from "@/components/ShimmerButton/ShimmerButton";

// Zod Schema for Login Form
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormData, boolean>>>({});

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  // Clear error when user starts typing
  const handleFieldChange = (field: keyof LoginFormData, value: string) => {
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
    setTouched({ email: true, password: true });

    // Validate with Zod
    const validation = loginSchema.safeParse(formData);

    if (!validation.success) {
      // Extract errors from Zod
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await loginUser(
        formData.email,
        formData.password,
        dispatch
      );
      console.log("Login successful:", response);
      router.push("/dashboard");
      showSuccessToast("Logged in successfully!");
    } catch (error: any) {
      showErrorToast("Login failed", error.response?.data?.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" flex items-center justify-center p-4 sm:p-8 bg-background overflow-hidden">
      <main className="w-full max-w-[1040px] bg-[#1F1F1F] rounded-[2rem] flex flex-col md:flex-row overflow-hidden min-h-[500px]">

        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          <div className="w-full max-w-[400px] mx-auto">
            {/* Header */}
            <div className="space-y-3 mb-8">
              {/* <div className="h-10 flex items-center justify-start mb-6">
                <Image src="/logo.png" alt="Logo" width={100} height={40} className="object-contain" />
              </div> */}
              <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight leading-tight text-center">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground text-center">
                Log in to your Edikit account to continue
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
                <div className="w-full border-t border-white/10 " />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-[#1F1F1F] px-4 text-muted-foreground uppercase tracking-wider">
                  Or
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
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
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleFieldChange("password", e.target.value)}
                    className={`w-full h-11 pl-10 pr-3 text-sm rounded-xl border ${errors.password ? "border-red-500" : "border-border"
                      } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${errors.password ? "focus:ring-red-500" : "focus:ring-ring"
                      }`}
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-red-500">{errors.password}</p>
                )}
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
                    "Sign In"
                  )}
                </EdikitButton>
              </div>
            </form>

            {/* Sign Up Link */}
            <p className="text-start text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div> 
        </div>

        {/* Right Side - Image */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center relative">
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            <Image
              src="/auth.png"
              alt="Authentication visual"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

      </main>
    </div>
  );
};

export default Login;