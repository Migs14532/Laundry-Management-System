import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center px-4 md:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>
      
      <div className="flex flex-col items-center text-center relative z-10 max-w-3xl">
        {/* Icon/Logo Area */}
        <div className="mb-6 relative">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:rotate-6 transition-transform duration-300">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-4 leading-tight">
          Laundry Management System
        </h1>
        
        {/* Subheading */}
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed">
          Streamline your laundry business with our intuitive management platform. Get started in seconds.
        </p>
        
        {/* CTA Button */}
        <button
          onClick={() => navigate("/signup")}
          className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-blue-200 flex items-center gap-3 cursor-pointer"
        >
          Get Started
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Secondary Action */}
        <p className="mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}