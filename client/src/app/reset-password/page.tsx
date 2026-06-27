"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { resetPassword } from "@/lib/forget-password";

// ── Password input with show/hide toggle ─────────────────────────────────────

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 pr-10 rounded-lg border border-border bg-background
                   text-foreground placeholder:text-muted-foreground
                   focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground
                   hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ── Strength indicator ────────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "Contains a number",     pass: /\d/.test(password) },
    { label: "Contains uppercase",    pass: /[A-Z]/.test(password) },
  ];

  if (!password) return null;

  return (
    <ul className="space-y-1 mt-2">
      {checks.map(({ label, pass }) => (
        <li key={label} className={`flex items-center gap-2 text-xs ${pass ? "text-green-500" : "text-muted-foreground"}`}>
          <CheckCircle className={`w-3.5 h-3.5 ${pass ? "text-green-500" : "text-muted-foreground/40"}`} />
          {label}
        </li>
      ))}
    </ul>
  );
}

// ── Main form (needs Suspense because of useSearchParams) ─────────────────────

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      setSuccess(true);
      // Redirect to login after 2.5s
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
    setError(err?.response?.data?.message ?? "Something went wrong. Please try again.")
    } finally {
      setLoading(false);
    }
  };

  // ── No token in URL ───────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-500 font-medium">Invalid or missing reset link.</p>
        <Link
          href="/forgot-password"
          className="text-sm text-primary hover:underline font-medium"
        >
          Request a new one →
        </Link>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Password updated!</h2>
        <p className="text-muted-foreground text-sm">
          Redirecting you to login...
        </p>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          New password
        </label>
        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="Min. 8 characters"
        />
        <PasswordStrength password={password} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Confirm new password
        </label>
        <PasswordInput
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat your password"
        />
        {confirm && password !== confirm && (
          <p className="text-xs text-red-500 mt-1">Passwords don't match.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || !password || !confirm}
        className="w-full h-11 rounded-lg font-semibold text-white
                   bg-primary hover:bg-primary/90 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
          <p className="text-muted-foreground text-sm">
            Choose a strong password for your Edikit account.
          </p>
        </div>

        <Suspense fallback={
          <p className="text-center text-muted-foreground text-sm">Loading...</p>
        }>
          <ResetPasswordForm />
        </Suspense>

      </div>
    </div>
  );
}