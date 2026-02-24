import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:5294/api/Password/forgot-password",
        { userEmail: email }
      );
      setMessage(response.data);
    } catch (error) {
      if (error.response) {
        setError(error.response.data);
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
          Forgot your Password
        </h1>
        <h2 className="text-left mt-4">
          Please enter the email address you'd like your information to sent to
        </h2>
        <form
          onSubmit={handleRequestReset}
          id="forgotPswForm"
          className="mt-6 flex flex-col"
        >
          <label htmlFor="email" className="text-md font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your Email Address"
            className="border p-2 text-black rounded-md mt-2 text-medium text-lg"
            required
          />
          <button
            type="submit"
            className="bg-black hover:bg-gray-800 mt-5 cursor-pointer p-2 rounded-lg text-white text-lg font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Request Reset Link"}
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

export default ForgotPassword;
