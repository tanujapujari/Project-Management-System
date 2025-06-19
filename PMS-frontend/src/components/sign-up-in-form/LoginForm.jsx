import React, { useState } from "react";
import { MdOutlineEmail } from "react-icons/md";
import { LuEyeOff, LuEye } from "react-icons/lu";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const roles = ["Admin", "Project Manager", "Developer"];
const LoginForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const CardHeightClass = message ? "h-132" : "h-130";
  const ImgHeightClass = message ? "h-132" : " h-130";

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validate form inputs
    if (!userEmail) {
      setMessage("Please enter your email address.");
      setIsSuccess(false);
      return;
    }

    if (!userPassword) {
      setMessage("Please enter your password.");
      setIsSuccess(false);
      return;
    }

    if (!userRole) {
      setMessage("Please select your role.");
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      console.log("Attempting login with:", {
        UserEmail: userEmail,
        UserRole: userRole,
        // Don't log the actual password
        Password: "********"
      });

      const response = await axios.post(
        "http://localhost:5294/api/Auth/login",
        {
          UserEmail: userEmail.trim(),
          Password: userPassword,
          UserRole: userRole.trim(),
        },
        {
          // Add timeout to prevent hanging requests
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const {
        message: successMessage,
        accessToken,
        refreshToken,
        userId,
        userName,
        userRole: roleFromServer,
      } = response.data;

      console.log("Login successful:", {
        userId,
        userName,
        userRole: roleFromServer,
        // Don't log the actual tokens
        accessToken: "********",
        refreshToken: "********"
      });

      setMessage(successMessage || "Login Successful!");
      setIsSuccess(true);

      // Store user data in localStorage
      localStorage.setItem("token", accessToken);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userName", userName);
      localStorage.setItem("userRole", roleFromServer);
      localStorage.setItem("refreshToken", refreshToken);

      // Navigate to appropriate dashboard based on role
      setTimeout(() => {
        switch (roleFromServer) {
          case "Admin":
            navigate("/adminDashboard");
            break;
          case "Project Manager":
            navigate("/projectManagerDashboard");
            break;
          case "Developer":
            navigate("/developerDashboard");
            break;
          default:
            alert("Unknown role");
        }
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);

      // Handle different types of errors
      if (error.code === "ECONNABORTED") {
        setMessage("Login request timed out. Please try again.");
      } else if (!error.response) {
        setMessage("Cannot connect to the server. Please check your internet connection.");
      } else if (error.response.status === 401) {
        setMessage(error.response.data.message || "Invalid email, password, or role. Please try again.");
      } else if (error.response.status === 400) {
        setMessage(error.response.data.message || "Invalid login details. Please check your information.");
      } else if (error.response.status >= 500) {
        setMessage("Server error. Please try again later.");
      } else {
        setMessage(error.response?.data?.message || "Login failed. Please check your credentials.");
      }

      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen md:p-6 bg-gradient-rainbow bg-[length:200%_200%] animate-gradient-x flex items-center justify-center">
      <div
        className={`grid-cols-2 bg-white rounded-2xl md:w-full md:grid max-w-5xl ${CardHeightClass} sm:w-100`}
      >
        <div className="p-8 flex flex-col justify-center">
          <h1 className="md:text-right text-center font-bold md:text-xl text-2xl underline">
            Login
          </h1>
          <h2 className="md:text-right text-center text-md font-semibold">
            Welcome Back!
          </h2>
          <h2 className="md:text-right text-center text-md font-semibold">
            Please Login to your Account
          </h2>

          <form
            onSubmit={handleLogin}
            id="loginForm"
            className="flex flex-col gap-1.5 mt-8"
          >
            <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="email"
                id="login-email"
                name="email"
                placeholder="Enter your Email Address"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="rounded-lg p-2 bg-violet-300 w-full text-sm font-medium placeholder:text-white"
                required
              />
              <span className="absolute top-2.5 right-4 text-black">
                <MdOutlineEmail />
              </span>
            </div>

            <label className="text-sm font-medium">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="login-password"
                name="password"
                placeholder="Enter your Password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                className="rounded-lg p-2 placeholder:text-white w-full text-sm font-medium bg-violet-300"
                required
              />
              <span
                className="absolute top-2.5 right-4 text-black cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <LuEye /> : <LuEyeOff />}
              </span>
            </div>

            <Link
              to="/forgotPassword"
              className="text-blue-500 text-sm text-right font-semibold"
            >
              Forgot Password?
            </Link>
            <label className="block text-sm font-medium">Role <span className="text-red-500">*</span></label>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 bg-violet-300 text-sm font-medium rounded-lg text-left flex justify-between items-center"
                style={{ color: selectedRole ? 'black' : 'white' }}
              >
                {selectedRole || "Select your Role"}
                {isOpen ? (
                  <FaChevronUp className="ml-4 text-black" />
                ) : (
                  <FaChevronDown className="ml-4 text-black" />
                )}
              </button>
              {isOpen && (
                <ul className="absolute mt-1 w-full bg-violet-100 rounded-lg shadow z-10">
                  {roles.map((role, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSelectedRole(role);
                        setUserRole(role);
                        setIsOpen(false);
                      }}
                      className="px-4 py-2 hover:bg-black hover:text-white border-b border-gray-300 last:border-b-0 cursor-pointer transition"
                    >
                      {role}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              className={`bg-black mt-4 text-white rounded-lg p-2 cursor-pointer
               hover:bg-gray-800 transition duration-300 ease-in-out ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              disabled={isLoading}
            >
              {isLoading ? "Logging In..." : "Login"}
            </button>

            {message && (
              <div
                className={`text-center font-semibold text-md mt-2 p-1 rounded-lg  ${isSuccess
                  ? "text-green-600 bg-green-100"
                  : "text-red-600 bg-red-100"
                  }`}
              >
                {message}
              </div>
            )}

            <div className="flex justify-center items-center ">
              <h2>Don't have an account yet?</h2>
              <Link to="/register" className="text-blue-500 font-semibold ml-1">
                Register Now
              </Link>
            </div>
          </form>
        </div>
        <div
          className={`bg-[url(/src/assets/login-register-bg.png)] hidden gap-7 md:flex bg-cover ${ImgHeightClass} rounded-2xl rounded-l-none bg-no-repeat bg-center flex flex-col justify-center items-center`}
        >
          <h1 className="text-5xl font-bold font-serif text-center bg-white text-transparent bg-clip-text animate-pulse drop-shadow-2xl">
            Welcome Back to Project Management System
          </h1>
          <p className="text-center text-white max-w-md mb-2 text-justify text-sm font-semibold">
            The Project Management System helps you organize, track, and collaborate on projects efficiently. Log in to manage tasks, assign team members, monitor progress, and keep your projects on schedule. Whether you're an admin, manager, or developer, this platform streamlines your workflow and boosts productivity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
