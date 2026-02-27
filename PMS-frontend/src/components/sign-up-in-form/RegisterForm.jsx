import React, { useState } from "react";
import { MdOutlineEmail } from "react-icons/md";
import { LuEyeOff, LuEye } from "react-icons/lu";
import { FaChevronDown, FaChevronUp, FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const roles = ["Admin", "Project Manager", "Developer"];
const RegisterForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const CardHeightClass = message ? "lg:h-133" : "lg:h-130";
  const ImgHeightClass = message ? "lg:h-133" : " lg:h-130";
  const CardPaddingClass = message ? "p-5" : "p-8";

  const handleRegisteration = async (e) => {
    e.preventDefault();

    if (!userName || !userEmail || !userPassword || !userRole) {
      setMessage("Please fill in all the details");
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/Auth/register`,
        {
          UserName: userName,
          UserEmail: userEmail,
          Password: userPassword,
          UserRole: userRole,
        },
      );

      const { message: successMessage } = response.data;

      setMessage(successMessage || "Registeration Successfull!");
      setIsSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      if (error.response) {
        console.error("Register error:", error.response.data?.message);
        console.log("HTTP Status Code:", error.response.status);

        if (error.response.status === 400) {
          if (
            error.response.data?.message?.includes("Username already exists")
          ) {
            setMessage("Username already taken. Choose another.");
          } else if (
            error.response.data?.message?.includes("Email already exists")
          ) {
            setMessage("Email already exists.");
          } else {
            setMessage(
              error.response.data?.message ||
                "Registration failed. Please check your credentials.",
            );
          }
        } else {
          setMessage("Registration failed. Please try again later.");
        }
      } else if (error.request) {
        console.error("No response received from server:", error.request);
        setMessage("Server is unreachable. Please try again later.");
      } else {
        console.error("Error setting up request:", error.message);
        setMessage("Unexpected error occurred.");
      }

      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen md:p-6 bg-gradient-rainbow bg-[length:200%_200%] animate-gradient-x flex items-center justify-center">
      <div
        className={`md:grid grid-cols-2 bg-white rounded-2xl md:w-full sm:w-100 max-w-5xl ${CardHeightClass}`}
      >
        <div
          className={`bg-[url(/src/assets/login-register-bg.png)] bg-cover hidden md:flex rounded-2xl rounded-r-none bg-no-repeat bg-center ${ImgHeightClass} justify-center items-center`}
        >
          <h1 className="text-5xl font-bold font-serif text-center bg-white text-transparent bg-clip-text animate-pulse drop-shadow-2xl">
            Welcome for Registration
          </h1>
        </div>

        <div className={`${CardPaddingClass} flex flex-col justify-center`}>
          <h1 className="md:text-left text-center font-bold md:text-xl text-2xl underline">
            Register
          </h1>
          <h2 className="md:text-left text-center text-md font-semibold">
            Create Your Account!
          </h2>
          <h2 className="md:text-left text-center text-md font-semibold">
            Join us and get started
          </h2>

          <form
            onSubmit={handleRegisteration}
            id="registerForm"
            className="flex flex-col gap-1.5 mt-8"
          >
            <label className="text-sm font-medium">Username</label>
            <div className="relative">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Choose your Username"
                className="rounded-lg p-2 bg-violet-300 w-full text-sm font-medium placeholder:text-white"
                required
              />
              <span className="absolute top-2.5 right-4 text-black">
                <FaUser />
              </span>
            </div>

            <label className="text-sm font-semibold">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="Enter your Password"
                className="rounded-lg p-2 placeholder:text-white w-full text-sm font-medium bg-violet-300"
                required
              />
              <span
                className="absolute top-2.5 right-4 text-black cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ?
                  <LuEye />
                : <LuEyeOff />}
              </span>
            </div>

            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Enter your Email Address"
                className="rounded-lg p-2 placeholder:text-white w-full text-sm font-medium bg-violet-300"
                required
              />
              <span className="absolute top-2.5 right-4 text-black">
                <MdOutlineEmail />
              </span>
            </div>

            <label className="block text-sm font-medium">Role</label>
            <div className="relative w-full">
              <button
                type="button"
                value={userRole}
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 bg-violet-300 text-white text-sm font-medium rounded-lg text-left flex justify-between items-center"
              >
                {selectedRole || "Select your Role"}
                {isOpen ?
                  <FaChevronUp className="ml-2 text-black" />
                : <FaChevronDown className="ml-2 text-black" />}
              </button>
              {isOpen && (
                <ul className="absolute mt-1 w-full bg-violet-100 rounded-lg shadow z-10">
                  {roles.map((role, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSelectedRole(role);
                        setIsOpen(false);
                        setUserRole(role);
                      }}
                      className="px-2 hover:bg-black hover:text-white cursor-pointer 
                      transition border-b border-gray-300 last:border-b-0"
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
               hover:bg-gray-800 transition duration-300 ease-in-out ${
                 isLoading ? "cursor-not-allowed" : ""
               }`}
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register"}
            </button>

            {message && (
              <div
                className={`text-center font-semibold p-1 mt-2 rounded-lg ${
                  isSuccess ?
                    "text-green-600 bg-green-100"
                  : "text-red-600 bg-red-100"
                }`}
              >
                {message}
              </div>
            )}
            <div className="flex justify-center items-center">
              <h2>Already have an account?</h2>
              <Link to="/login" className="text-blue-500 font-semibold ml-1">
                Login Here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
