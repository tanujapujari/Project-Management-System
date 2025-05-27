import React, { useEffect, useState, useContext } from "react";
import {
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdOutlineLibraryBooks,
  MdOutlineAccountCircle,
  MdOutlineEmail,
  MdOutlineMemory,
  MdOutlineSpeed,
  MdOutlineStorage,
  MdOutlineNetworkCheck,
  MdOutlineTimer,
  MdOutlineRefresh,
} from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUser, FaAngleDown, FaTasks, FaSave } from "react-icons/fa";
import { LiaComments } from "react-icons/lia";
import { RxHamburgerMenu, RxDashboard, RxActivityLog } from "react-icons/rx";
import { FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../main";

const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== "undefined" && window.innerWidth >= 1024 ? true : false
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);

  // Settings states
  const [activeTab, setActiveTab] = useState("account");
  const [userProfile, setUserProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const menuItems = [
    { icon: <RxDashboard />, label: "Dashboard", path: "/adminDashboard" },
    { icon: <FiUsers />, label: "Manage Users", path: "/allUsers" },
    {
      icon: <MdOutlineLibraryBooks />,
      label: "Manage Projects",
      path: "/allProjects",
    },
    { icon: <FaTasks />, label: "Manage Tasks", path: "/allTasks" },
    { icon: <LiaComments />, label: "Manage Comments", path: "/allComments" },
    { icon: <RxActivityLog />, label: "View Activity Logs", path: "/allLogs" },
    { icon: <IoSettingsOutline />, label: "Settings" },
  ];

  useEffect(() => {
    // Load user data from localStorage
    const storedRole = localStorage.getItem("userRole");
    const storedUserName = localStorage.getItem("userName");

    if (storedRole) setRole(storedRole);
    if (storedUserName) setUserName(storedUserName);
    // Fetch user profile data
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");

      if (!token || !userId) {
        setErrorMessage("Authentication required. Please log in again.");
        return;
      }

      // Since we don't have a specific endpoint for getting a single user,
      // we'll use the stored information from localStorage
      setUserProfile({
        fullName: localStorage.getItem("userName") || "",
        email: localStorage.getItem("userEmail") || "",
        phone: localStorage.getItem("phone") || "",
        position: localStorage.getItem("position") || userRole || "",
      });
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setErrorMessage("Failed to load user profile. Please try again later.");
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Since we don't have a specific endpoint for updating user profiles,
      // we'll just update the localStorage values for now
      localStorage.setItem("userName", userProfile.fullName);
      localStorage.setItem("userEmail", userProfile.email);
      localStorage.setItem("phone", userProfile.phone);
      localStorage.setItem("position", userProfile.position);

      // Update the state variables
      setUserName(userProfile.fullName);

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <>
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-30 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        <aside
          className={`fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black transition-transform
            ${sidebarOpen ? "w-full md:w-55" : "w-16 sm:w-14 mt-6"}`}
        >
          <div className="h-full text-black dark:text-white text-md font-medium px-4 py-8 overflow-y-auto">
            <ul className="space-y-4">
              <li
                className={`flex items-center gap-2 p-2 justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold text-lg -mt-5 mb-10 ${
                  !sidebarOpen && "sm:hidden"
                }`}
              >
                PMS
              </li>
              {menuItems.map(({ icon, label, path }, idx) => (
                <li
                  key={idx}
                  onClick={() => path && navigate(path)}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all duration-200
                      hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:text-white hover:scale-105
                      dark:hover:bg-gradient-to-r dark:hover:from-purple-600 dark:hover:to-blue-600
                      ${sidebarOpen ? "w-full" : "w-10 -ml-2"}`}
                >
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <span
                    className={`whitespace-nowrap ${
                      !sidebarOpen && "hidden sm:hidden"
                    }`}
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </>

      {/* Main content wrapper */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          sidebarOpen ? "md:ml-55" : "md:ml-14"
        }`}
      >
        {/* Header */}
        <header
          className={`p-4 bg-white dark:bg-black sticky top-0 z-50 h-16 flex items-center justify-between transition-all duration-300 ${
            sidebarOpen ? "md:ml-0" : "md:-ml-14"
          } ${theme === "dark" ? "bg-gray-400 text-white" : ""}`}
        >
          <div className="flex items-center gap-5">
            <RxHamburgerMenu
              size={28}
              className="cursor-pointer"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            />
          </div>
          <div className="flex items-center gap-3 relative">
            <button
              className="p-3 rounded-full hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:text-white transition-all duration-300"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <MdOutlineLightMode size={18} />
              ) : (
                <MdOutlineDarkMode size={18} />
              )}
            </button>

            <div
              className="flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-all"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <button className="bg-gradient-to-r from-blue-400 to-purple-400 text-white p-3 rounded-full">
                <FaUser size={18} />
              </button>
              <div className="flex flex-col">
                <span className="font-semibold dark:text-white text-sm">
                  {userName || "User"}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {role || "Guest"}
                </span>
              </div>
              <FaAngleDown
                className={`transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {dropdownOpen && (
              <div className="absolute right-0 top-14 bg-white dark:bg-black shadow-md rounded-md p-2 w-32">
                <button
                  className="w-full text-left px-2 py-1 hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:text-white rounded-md text-sm transition-all"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex flex-col justify-start items-center p-4 bg-gradient-rainbow animate-gradient-x min-h-screen rounded-tl-xl dark:rounded-none gap-8 dark:bg-gradient-rainbow-dark dark:text-white">
          <div className="w-full max-w-6xl p-6 bg-white/40 dark:bg-black/50 rounded-lg shadow-lg">
            <div className="flex items-center justify-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
                <IoSettingsOutline className="text-blue-500" />
                Settings
              </h1>
            </div>

            {/* Success and Error Messages */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md border border-green-200 dark:bg-green-800/30 dark:text-green-300 dark:border-green-700/50">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200 dark:bg-red-800/30 dark:text-red-300 dark:border-red-700/50">
                {errorMessage}
              </div>
            )}

            {/* Settings Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("account")}
                className={`px-4 py-2 font-medium rounded-t-lg transition-all ${
                  activeTab === "account"
                    ? "text-white"
                    : "hover:bg-blue-100 dark:hover:bg-blue-900/30"
                }`}
                style={{
                  backgroundColor:
                    activeTab === "account" ? "#3b82f6" : "transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  <MdOutlineAccountCircle />
                  Account
                </div>
              </button>
            </div>

            {/* Account Settings */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">
                  Profile Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={userProfile.fullName}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          fullName: e.target.value,
                        })
                      }
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={userProfile.email}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          email: e.target.value,
                        })
                      }
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={userProfile.phone}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          phone: e.target.value,
                        })
                      }
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={userProfile.position}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          position: e.target.value,
                        })
                      }
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium mb-4">
                    Display Preferences
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
                    <div className="flex items-center gap-3">
                      {theme === "dark" ? (
                        <MdOutlineDarkMode className="text-xl text-blue-500" />
                      ) : (
                        <MdOutlineLightMode className="text-xl text-blue-500" />
                      )}
                      <div>
                        <h3 className="font-medium">Theme</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {theme === "dark"
                            ? "Dark mode is enabled"
                            : "Light mode is enabled"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="px-4 py-2 text-white rounded-md transition-colors bg-blue-500 hover:bg-blue-600"
                    >
                      Toggle Theme
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 text-white px-6 py-2 rounded-lg shadow-md transition-all duration-300 bg-blue-500 hover:bg-blue-600"
                  >
                    <FaSave />
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
