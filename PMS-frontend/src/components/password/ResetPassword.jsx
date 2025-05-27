import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { LuEyeOff, LuEye } from "react-icons/lu";
import axios from "axios";

const ResetPassword = () => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  const handleReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please enter both passwords.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError("Invalid reset link.  Token is missing.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5294/api/Password/reset-password", // Backend endpoint
        {
          token,
          newPassword,
        }
      );
      setMessage(response.data || "Password reset successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      if (err.response) {
        setError(err.response.data || "Failed to reset password.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-200 flex items-center
      bg-gradient-rainbow bg-[length:200%_200%] animate-gradient-x 
    justify-center"
    >
      <div className="flex flex-col justify-center p-6 bg-white max-w-md rounded-lg w-full">
        <h1 className="text-3xl font-semibold text-center">
          Reset your Password
        </h1>
        <h2 className="text-center mt-4">
          Enter your new password below to change your password
        </h2>
        <form
          id="resetPswForm"
          onSubmit={handleReset}
          className="mt-6 flex flex-col gap-3"
        >
          <div className="relative">
            <label htmlFor="newPsw" className="text-md font-medium">
              New Password
            </label>
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Choose your New Password"
              className="border p-2 text-black rounded-md mt-2 text-medium text-lg w-full"
              required
            />
            <span
              className="absolute top-12 right-4 text-black cursor-pointer"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <LuEye /> : <LuEyeOff />}
            </span>
          </div>
          <div className="relative">
            <label
              htmlFor="confirmPassword"
              className="text-md mt-4 font-medium"
            >
              Re-enter your new Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter your Confrim Password"
              className="border p-2 text-black rounded-md mt-2 text-medium w-full text-lg"
              required
            />
            <span
              className="absolute top-12 right-4 text-black cursor-pointer"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <LuEye /> : <LuEyeOff />}
            </span>
          </div>
          <button
            type="submit"
            className="bg-black hover:bg-gray-800 mt-5 cursor-pointer p-2 rounded-lg text-white text-lg font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>

          {message && (
            <p className="text-green-600 mt-2 text-center bg-green-100 p-2 rounded-lg">
              {message}
            </p>
          )}
          {error && (
            <p className="text-red-600 mt-2 text-center bg-red-100 p-2 rounded-lg">
              {error}
            </p>
          )}
          <Link
            to="/login"
            className="text-blue-500 font-semibold mt-3 text-lg text-center"
          >
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
