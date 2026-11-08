import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Wallet, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const successMessage = location.state?.message;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111312] text-[#F4F6F2] flex">

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#191D1A] border-r border-[#343A36] p-14 flex-col justify-between">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C6F36B] flex items-center justify-center">
            <Wallet size={22} className="text-[#151A0D]" />
          </div>

          <span className="text-xl font-semibold">
            FinTrack AI
          </span>
        </div>

        <div className="max-w-lg">
          <p className="text-[#C6F36B] text-sm font-semibold mb-5">
            YOUR FINANCES. YOUR CONTROL.
          </p>

          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            Make smarter decisions with your money.
          </h1>

          <p className="text-[#A4ADA5] mt-6 text-lg leading-8">
            Track expenses, understand spending patterns and
            make informed financial decisions with intelligent
            insights.
          </p>
        </div>

        <p className="text-sm text-[#737D75]">
          © 2026 FinTrack AI
        </p>

      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-6">

        <div className="w-full max-w-md">

          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-[#C6F36B] flex items-center justify-center">
              <Wallet size={22} className="text-[#151A0D]" />
            </div>

            <span className="text-xl font-semibold">
              FinTrack AI
            </span>
          </div>

          <h2 className="text-3xl font-semibold">
            Welcome back
          </h2>

          <p className="text-[#A4ADA5] mt-2 mb-8">
            Sign in to access your financial dashboard.
          </p>

          {/* Registration success message */}
          {successMessage && (
            <div className="mb-5 rounded-lg border border-[#83C995]/30 bg-[#83C995]/10 p-3 text-sm text-[#83C995]">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-sm mb-2 text-[#A4ADA5]">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#202521] border border-[#343A36] rounded-lg px-4 py-3 pr-12 outline-none focus:border-[#C6F36B] transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A4ADA5] hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="bg-[#F07878]/10 border border-[#F07878]/30 text-[#F07878] rounded-lg p-3 text-sm"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C6F36B] hover:bg-[#D3FF7A] disabled:opacity-60 text-[#151A0D] font-semibold rounded-lg py-3 flex items-center justify-center gap-2 transition"
            >
              {loading ? "Signing in..." : "Sign in"}

              {!loading && <ArrowRight size={18} />}
            </button>

          </form>

          {/* Register link */}
          <p className="text-center text-[#A4ADA5] text-sm mt-8">
            Don't have an account?{" "}

            <Link
              to="/register"
              className="text-[#C6F36B] font-medium hover:underline"
            >
              Create account
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}