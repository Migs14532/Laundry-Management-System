import React, { useState } from "react";
import { ChevronLeft, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
  setErrorMessage("");
  setLoading(true);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginData.email,
    password: loginData.password,
  });

  if (error) {
    setErrorMessage(error.message);
    setLoading(false);
    return;
  }

  const user = data.user;
  if (!user) {
    setErrorMessage("Something went wrong. Please try again.");
    setLoading(false);
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    setErrorMessage("Failed to retrieve user profile.");
    setLoading(false);
    return;
  }

  setLoading(false);

  if (profile.role === "admin") {
    navigate("/admin-dashboard");
  } else {
    navigate("/customer-dashboard");
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center px-4 py-8">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-8 relative">
          <button
            onClick={() => navigate("/")}
            className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-full transition-all duration-200 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-center pt-4">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-blue-100 text-sm">Sign in to continue your journey</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={loginData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={loginData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-base font-semibold rounded-xl 
              hover:from-blue-700 hover:to-blue-600 transform hover:scale-[1.02] active:scale-[0.98] 
              transition-all duration-200 shadow-lg shadow-blue-200 
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>


          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}