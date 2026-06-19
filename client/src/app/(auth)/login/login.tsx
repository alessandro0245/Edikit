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
      router.push("/");
      showSuccessToast("Logged in successfully!");
    } catch (error: any) {
      showErrorToast("Login failed", error.response?.data?.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-6 sm:py-12 overflow-y-hidden">
  <main className="container mx-auto px-4 w-full">
    <div className="max-w-md mx-auto w-full">
      <div className="p-6 sm:p-8 rounded-xl border border-border bg-card shadow-sm">
        {/* Header - Tightened spacing */}
        <div className="text-center space-y-2 mb-6">
          <div className="h-10 flex items-center justify-center mx-auto mb-2">
            <Image src="/logo.png" alt="Logo" width={100} height={40} className="object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Log in to your Edikit account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className={`w-full h-9 pl-10 pr-3 text-sm rounded-lg border ${
                  errors.email ? "border-red-500" : "border-border"
                } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                  errors.email ? "focus:ring-red-500" : "focus:ring-ring"
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
              <label htmlFor="password" className="text-xs font-medium text-foreground">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                className={`w-full h-9 pl-10 pr-3 text-sm rounded-lg border ${
                  errors.password ? "border-red-500" : "border-border"
                } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                  errors.password ? "focus:ring-red-500" : "focus:ring-ring"
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <EdikitButton
            type="submit"
            disabled={loading}
            variant="primary"
            width="md:w-full sm:w-80 lg:w-96"
            className="mt-2"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <LoaderCircle className="animate-spin h-4 w-4 text-primary-foreground" />
                {/* Signing In... */}
              </div>
            ) : (
              "Sign In"
            )}
          </EdikitButton>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[11px]">
            <span className="bg-card px-2 text-muted-foreground uppercase tracking-wider">
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Login */}
        <div>
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full cursor-pointer inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            <GoogleIcon size={18} />
            Continue with Google
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-xs text-muted-foreground mt-4">
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
  </main>
</div>
  );
};

export default Login;