import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8 || password.length > 128) {
      setError("Password must contain between 8 and 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register(fullName.trim(), email.trim(), password);

      navigate("/login", {
        replace: true,
        state: {
          message: "Account created successfully. Please sign in.",
        },
      });
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to create your account. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111312] text-[#F4F6F2] flex">

      <div className="hidden lg:flex lg:w-1/2 bg-[#191D1A] border-r border-[#343A36] p-14 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C6F36B] flex items-center justify-center">
            <Wallet size={22} className="text-[#151A0D]" />
          </div>
          <span className="text-xl font-semibold">FinTrack AI</span>
        </div>

        <div className="max-w-lg">
          <p className="text-[#C6F36B] text-sm font-semibold mb-5">
            START YOUR FINANCIAL JOURNEY
          </p>

          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            Understand your money. Build better habits.
          </h1>

          <p className="text-[#A4ADA5] mt-6 text-lg leading-8">
            Bring your income, expenses, budgets and financial
            insights together in one intelligent workspace.
          </p>
        </div>

        <p className="text-sm text-[#737D75]">
          © 2026 FinTrack AI
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#C6F36B] flex items-center justify-center">
              <Wallet size={22} className="text-[#151A0D]" />
            </div>
            <span className="text-xl font-semibold">FinTrack AI</span>
          </div>

          <h2 className="text-3xl font-semibold">
            Create your account
          </h2>

          <p className="text-[#A4ADA5] mt-2 mb-8">
            Get started with your personal finance workspace.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm mb-2 text-[#A4ADA5]">
                Full name
              </label>

              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-[#202521] border border-[#343A36] rounded-lg px-4 py-3 outline-none focus:border-[#C6F36B] transition"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-[#A4ADA5]">
                Email address
              </label>

              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#202521] border border-[#343A36] rounded-lg px-4 py-3 outline-none focus:border-[#C6F36B] transition"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-[#A4ADA5]">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-[#202521] border border-[#343A36] rounded-lg px-4 py-3 pr-12 outline-none focus:border-[#C6F36B] transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A4ADA5] hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-[#A4ADA5]">
                Confirm password
              </label>

              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full bg-[#202521] border border-[#343A36] rounded-lg px-4 py-3 outline-none focus:border-[#C6F36B] transition"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="bg-[#F07878]/10 border border-[#F07878]/30 text-[#F07878] rounded-lg p-3 text-sm"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C6F36B] hover:bg-[#D3FF7A] disabled:opacity-60 text-[#151A0D] font-semibold rounded-lg py-3 flex items-center justify-center gap-2 transition"
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight size={18} />}
            </button>

          </form>

          <p className="text-center text-[#A4ADA5] text-sm mt-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#C6F36B] font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}