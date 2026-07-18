"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { forgotPassword } from "@/lib/forget-password";

export default function ForgotPasswordPage() {
  const [email, setEmail]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch {
      // setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ────────────────────────────────────────────────────────
  if (submitted) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Check your inbox</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          If <strong className="text-foreground">{email}</strong> is registered,
          you'll receive a reset link shortly.
        </p>

        {/* ── Helpful hints ── */}
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-left space-y-2">
          <p className="text-sm font-medium text-foreground">Didn't get an email?</p>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you typed the right email</li>
            <li>• You may have signed up with Google — try the button below</li>
            <li>• You may not have an account yet —{" "}
              <Link href="/signup" className="text-primary hover:underline">
                create one here
              </Link>
            </li>
          </ul>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}

  // ── Form state ───────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Forgot your password?</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background
                         text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full h-11 rounded-lg font-semibold text-white
                       bg-primary hover:bg-primary/90 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

      </div>
    </div>
  );
}