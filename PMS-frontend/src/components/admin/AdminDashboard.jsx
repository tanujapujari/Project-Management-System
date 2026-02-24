import React, { useState, useEffect, useContext } from "react";
import {
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdOutlineLibraryBooks,
} from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUser, FaAngleDown, FaTasks, FaProjectDiagram } from "react-icons/fa";
import { LiaComments } from "react-icons/lia";
import { RxHamburgerMenu, RxDashboard, RxActivityLog } from "react-icons/rx";
import { FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../main";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const getTimeAgo = (timestamp) => {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
  } catch (error) {
    console.error("Error calculating time ago:", error);
    return "";
  }
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  try {
    if (
      typeof timestamp === "string" &&
      /^\d{2}-\d{2}-\d{4}$/.test(timestamp)
    ) {
      return timestamp;
    }

    if (
      typeof timestamp === "string" &&
      timestamp.includes("-") &&
      timestamp.split("-").length === 3
    ) {
      return timestamp;
    }

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return timestamp.toString();
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  } catch (error) {
    return timestamp.toString();
  }
};

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024 ? true : false
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [role, setRole] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userName, setUserName] = useState("");
  const [fullText, setFullText] = useState("");
  const [summaryData, setSummaryData] = useState({
    projects: {
      total: 0,
      completed: 0,
      inProgress: 0,
      onHold: 0,
      notStarted: 0,
      cancelled: 0,
    },
    users: {
      total: 0,
      admin: 0,
      projectManager: 0,
      developer: 0,
    },
    tasks: {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
    },
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [completionRate, setCompletionRate] = useState(0);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedName = localStorage.getItem("userName");
    if (storedRole) {
      setRole(storedRole);
    }
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 18) return "Good Afternoon";
      return "Good Evening";
    };

    const greeting = getGreeting();
    const newFullText = `${greeting}, ${userName || "User"}`;
    setFullText(newFullText);
    setDisplayText("");
    setCurrentIndex(0);
  }, [userName]);

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + fullText[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 150);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullText]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          navigate("/login");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [projectsRes, usersRes, tasksRes, activitiesRes] =
          await Promise.all([
            fetch("http://localhost:5294/api/Project/get", { headers }),
            fetch("http://localhost:5294/AdminUser/all-users", { headers }),
            fetch("http://localhost:5294/Task/get", { headers }),
            fetch("http://localhost:5294/ActivityLog/get", { headers }),
          ]);

        if (
          projectsRes.status === 401 ||
          usersRes.status === 401 ||
          tasksRes.status === 401 ||
          activitiesRes.status === 401
        ) {
          console.error("Authentication token expired or invalid");
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (
          !projectsRes.ok ||
          !usersRes.ok ||
          !tasksRes.ok ||
          !activitiesRes.ok
        ) {
          throw new Error("Failed to fetch data from one or more endpoints");
        }

        const projects = await projectsRes.json();
        const users = await usersRes.json();
        const tasks = await tasksRes.json();
        const activities = await activitiesRes.json();

        const totalProjects = projects.length;
        const completedProjects = projects.filter(
          (p) => p.projectStatus === "Completed"
        ).length;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(
          (t) => t.taskStatus === "completed"
        ).length;

        const projectCompletionRate =
          totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
        const taskCompletionRate =
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const calculatedCompletionRate = Math.round(
          (projectCompletionRate + taskCompletionRate) / 2
        );

        setSummaryData({
          projects: {
            total: projects.length,
            completed: projects.filter((p) => p.projectStatus === "Completed")
              .length,
            inProgress: projects.filter(
              (p) => p.projectStatus === "In Progress"
            ).length,
            onHold: projects.filter((p) => p.projectStatus === "On Hold")
              .length,
            notStarted: projects.filter(
              (p) => p.projectStatus === "Not Started"
            ).length,
            cancelled: projects.filter((p) => p.projectStatus === "Cancelled")
              .length,
          },
          users: {
            total: users.length,
            admin: users.filter((u) => u.userRole === "Admin").length,
            projectManager: users.filter(
              (u) => u.userRole === "Project Manager"
            ).length,
            developer: users.filter((u) => u.userRole === "Developer").length,
          },
          tasks: {
            total: tasks.length,
            completed: tasks.filter((t) => t.taskStatus === "completed").length,
            inProgress: tasks.filter((t) => t.taskStatus === "in progress")
              .length,
            pending: tasks.filter((t) => t.taskStatus === "pending").length,
          },
        });

        const processedActivities = activities
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5)
          .map((activity) => {
            let user = activity.userName || "Unknown User";
            const action = activity.activityAction || "performed an action";
            let formattedDetails = "";

            if (action.includes("Project")) {
              const projectTitle = activity.projectTitle || "Untitled Project";
              formattedDetails = `Project: "${projectTitle}"`;
            } else if (action.includes("Task")) {
              const taskTitle = activity.taskTitle || "Untitled Task";
              const projectTitle = activity.projectTitle || "Untitled Project";
              formattedDetails = `Task: "${taskTitle}" in Project: "${projectTitle}"`;
            } else if (action.includes("Comment")) {
              const target = activity.taskTitle
                ? `on task "${activity.taskTitle}" in project "${activity.projectTitle}"`
                : activity.projectTitle
                ? `on project "${activity.projectTitle}"`
                : "";
              formattedDetails = `Comment ${target}`;
            }

            return {
              ...activity,
              user: user,
              action: action,
              formattedDetails: formattedDetails,
              timeAgo: getTimeAgo(new Date(activity.timestamp)),
              timestamp: activity.activityTime,
            };
          });

        setRecentActivities(processedActivities);
        setCompletionRate(calculatedCompletionRate);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

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
    { icon: <IoSettingsOutline />, label: "Settings", path: "/settings" },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: theme === "dark" ? "white" : "black",
          font: {
            size: 12,
          },
        },
      },
    },
  };

  const getChartData = (data, labels, backgroundColor) => ({
    labels,
    datasets: [
      {
        data: Object.values(data),
        backgroundColor,
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  });

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
          className={`fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-white to-blue-200 dark:from-gray-900 dark:to-black transition-transform
          ${sidebarOpen ? "w-full md:w-55" : "w-16 sm:w-14 mt-6"}
          ${
            sidebarOpen || window.innerWidth >= 640
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
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
                  key={`menu-${idx}-${label}`}
                  onClick={() => path && navigate(path)}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all duration-200
                    hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:text-white
                    dark:hover:bg-gradient-to-r dark:hover:from-purple-600 dark:hover:to-blue-600 hover:scale-105
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
              className="hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:text-white p-3 rounded-full transition-all"
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
              <button className="bg-gradient-to-r from-blue-400 to-purple-400 text-white p-3 rounded-full hover:from-blue-500 hover:to-purple-500 transition-all duration-300">
                <FaUser size={18} />
              </button>
              <div className="flex flex-col">
                <span className="font-semibold">{userName || "Guest"}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {role}
                </span>
              </div>
              <FaAngleDown
                className={`transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {dropdownOpen && (
              <div className="absolute right-0 top-14 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 w-32 border border-gray-200 dark:border-gray-700">
                <button
                  className="w-full text-left px-2 py-1 hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:text-white rounded-md text-sm transition-all duration-300"
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
          <div className="w-full max-w-7xl mx-auto p-8 space-y-8">
            {/* Typewriter Section */}
            <div className="bg-white/40 dark:bg-black/50 rounded-xl shadow-lg backdrop-blur-sm p-8">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <h1
                    className={`text-4xl font-bold ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    <span className="inline-block">
                      {displayText}
                      <span
                        className={`inline-block w-0.5 h-8 ${
                          theme === "dark" ? "bg-white" : "bg-black"
                        } ml-1 animate-blink`}
                      ></span>
                    </span>
                  </h1>
                </div>
              </div>
            </div>

            {/* Summary Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Projects Summary */}
              <div className="bg-white/40 dark:bg-black/50 rounded-xl shadow-lg backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaProjectDiagram className="text-2xl text-blue-500" />
                  <h2
                    className={`text-xl font-semibold ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    Projects Summary
                  </h2>
                </div>
                <div className="h-48">
                  <Doughnut
                    data={getChartData(
                      {
                        completed: summaryData.projects.completed,
                        inProgress: summaryData.projects.inProgress,
                        onHold: summaryData.projects.onHold,
                        notStarted: summaryData.projects.notStarted,
                        cancelled: summaryData.projects.cancelled,
                      },
                      [
                        "Completed",
                        "In Progress",
                        "On Hold",
                        "Not Started",
                        "Cancelled",
                      ],
                      [
                        "#22C55E", // Green for Completed
                        "#3B82F6", // Blue for In Progress
                        "#F59E0B", // Amber for On Hold
                        "#6366F1", // Indigo for Not Started
                        "#EF4444", // Red for Cancelled
                      ]
                    )}
                    options={chartOptions}
                  />
                </div>
                <div className="mt-4 text-center">
                  <p
                    className={`text-lg font-medium ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    Total Projects: {summaryData.projects.total}
                  </p>
                </div>
              </div>

              {/* Users Summary */}
              <div className="bg-white/40 dark:bg-black/50 rounded-xl shadow-lg backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FiUsers className="text-2xl text-purple-500" />
                  <h2
                    className={`text-xl font-semibold ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    Users Summary
                  </h2>
                </div>
                <div className="h-48">
                  <Doughnut
                    data={getChartData(
                      {
                        admin: summaryData.users.admin,
                        projectManager: summaryData.users.projectManager,
                        developer: summaryData.users.developer,
                      },
                      ["Admin", "Project Manager", "Developer"],
                      [
                        "#8B5CF6", // Purple for Admin
                        "#3B82F6", // Blue for Project Manager
                        "#10B981", // Green for Developer
                      ]
                    )}
                    options={chartOptions}
                  />
                </div>
                <div className="mt-4 text-center">
                  <p
                    className={`text-lg font-medium ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    Total Users: {summaryData.users.total}
                  </p>
                </div>
              </div>

              {/* Tasks Summary */}
              <div className="bg-white/40 dark:bg-black/50 rounded-xl shadow-lg backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaTasks className="text-2xl text-green-500" />
                  <h2
                    className={`text-xl font-semibold ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    Tasks Summary
                  </h2>
                </div>
                <div className="h-48">
                  <Doughnut
                    data={getChartData(
                      {
                        completed: summaryData.tasks.completed,
                        inProgress: summaryData.tasks.inProgress,
                        pending: summaryData.tasks.pending,
                      },
                      ["Completed", "In Progress", "Pending"],
                      [
                        "#10B981", // Green for Completed
                        "#3B82F6", // Blue for In Progress
                        "#EF4444", // Red for Pending
                      ]
                    )}
                    options={chartOptions}
                  />
                </div>
                <div className="mt-4 text-center">
                  <p
                    className={`text-lg font-medium ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    Total Tasks: {summaryData.tasks.total}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Interactive Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Recent Activities Widget */}
              <div className="bg-white/40 dark:bg-black/50 rounded-xl shadow-lg backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <RxActivityLog className="text-2xl text-indigo-500" />
                  <h2
                    className={`text-xl font-semibold ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    Recent Activities
                  </h2>
                </div>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div
                        key={`activity-${activity.activityLogId || index}`}
                        className="flex items-start gap-3 p-3 bg-white/20 dark:bg-black/20 rounded-lg hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300"
                      >
                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <p
                            className={`${
                              theme === "dark" ? "text-white" : "text-black"
                            } font-medium`}
                          >
                            <span className="font-semibold">
                              {activity.user}
                            </span>{" "}
                            {activity.action}
                          </p>
                          <p
                            className={`${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-600"
                            } text-sm`}
                          >
                            {activity.formattedDetails || activity.details}
                          </p>
                          <p
                            className={`${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            } text-xs mt-1`}
                          >
                            {formatTimestamp(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p
                        className={`${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        No recent activities
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats Widget */}
              <div className="bg-white/40 dark:bg-black/50 rounded-xl shadow-lg backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaProjectDiagram className="text-2xl text-blue-500" />
                  <h2
                    className={`text-xl font-semibold ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    Quick Stats
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 dark:bg-black/20 p-4 rounded-lg hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300">
                    <p
                      className={`${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      } text-sm`}
                    >
                      Completion Rate
                    </p>
                    <p
                      className={`${
                        theme === "dark" ? "text-white" : "text-black"
                      } text-2xl font-bold`}
                    >
                      {completionRate}%
                    </p>
                    <div className="w-full bg-gray-600 h-2 rounded-full mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-white/20 dark:bg-black/20 p-4 rounded-lg hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300">
                    <p
                      className={`${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      } text-sm`}
                    >
                      Active Projects
                    </p>
                    <p
                      className={`${
                        theme === "dark" ? "text-white" : "text-black"
                      } text-2xl font-bold`}
                    >
                      {summaryData.projects.inProgress}
                    </p>
                    <p
                      className={`${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      } text-xs mt-1`}
                    >
                      Out of {summaryData.projects.total}
                    </p>
                  </div>
                  <div className="bg-white/20 dark:bg-black/20 p-4 rounded-lg hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300">
                    <p
                      className={`${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      } text-sm`}
                    >
                      Team Members
                    </p>
                    <p
                      className={`${
                        theme === "dark" ? "text-white" : "text-black"
                      } text-2xl font-bold`}
                    >
                      {summaryData.users.developer +
                        summaryData.users.projectManager}
                    </p>
                    <p
                      className={`${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      } text-xs mt-1`}
                    >
                      Active developers & managers
                    </p>
                  </div>
                  <div className="bg-white/20 dark:bg-black/20 p-4 rounded-lg hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300">
                    <p
                      className={`${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      } text-sm`}
                    >
                      Pending Tasks
                    </p>
                    <p
                      className={`${
                        theme === "dark" ? "text-white" : "text-black"
                      } text-2xl font-bold`}
                    >
                      {summaryData.tasks.pending}
                    </p>
                    <p
                      className={`${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      } text-xs mt-1`}
                    >
                      Tasks in pending status
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
