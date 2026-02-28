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
import useWindowWidth from "../../hooks/useWindowWidth";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { BsGraphUp, BsCalendarEvent } from "react-icons/bs";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
);

const ProjectManagerDashboard = () => {
  const width = useWindowWidth();
  const [sidebarOpen, setSidebarOpen] = useState(() => width >= 1024);
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
      upcoming: 0,
      cancelled: 0,
    },
    users: {
      total: 0,
      admin: 0,
      projectManager: 0,
      developer: 0,
      client: 0,
      assignedDevelopers: 0,
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
  const [teamPerformance, setTeamPerformance] = useState({
    labels: [],
    datasets: [
      {
        label: "Projects Completed",
        data: [],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 1,
      },
    ],
  });
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const cleanup = () => {
    setDisplayText("");
    setCurrentIndex(0);
    setFullText("");
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

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedName = localStorage.getItem("userName");
    if (storedRole) {
      setRole(storedRole);
    }
    if (storedName) {
      setUserName(storedName);
    }

    return () => {
      cleanup();
    };
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

    return () => {
      cleanup();
    };
  }, [userName]);

  useEffect(() => {
    let timeoutId;
    if (currentIndex < fullText.length) {
      timeoutId = setTimeout(() => {
        setDisplayText((prev) => prev + fullText[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 150);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentIndex, fullText]);

  useEffect(() => {
    let isMounted = true;
    let intervalId;

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
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/Project/get`, {
              headers,
            }),
            fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/AdminUser/all-users`,
              {
                headers,
              },
            ),
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/Task/get`, {
              headers,
            }),
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ActivityLog/get`, {
              headers,
            }),
          ]);

        if (!isMounted) return;

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

        const currentUserId = parseInt(localStorage.getItem("userId"));

        const userProjects = projects.filter(
          (project) => project.createdByUserId === currentUserId,
        );
        const developers = users.filter(
          (user) =>
            user.userRole === "Developer" &&
            userProjects.some((project) =>
              project.assignedUserIds.includes(user.userId),
            ),
        );
        const developerPerformance = developers.map((developer) => {
          const assignedProjects = userProjects.filter((project) =>
            project.assignedUserIds.includes(developer.userId),
          );
          const completedProjects = assignedProjects.filter(
            (project) => project.projectStatus === "Completed",
          ).length;

          return {
            name:
              developer.userFullName ||
              developer.userName ||
              developer.userEmail,
            completed: completedProjects,
            total: assignedProjects.length,
          };
        });

        setTeamPerformance({
          labels: developerPerformance.map((dev) => dev.name),
          datasets: [
            {
              label: "Projects Completed",
              data: developerPerformance.map((dev) => dev.completed),
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgb(75, 192, 192)",
              borderWidth: 1,
            },
          ],
        });

        const totalProjects = userProjects.length;
        const completedProjects = userProjects.filter(
          (p) => p.projectStatus === "Completed",
        ).length;
        const totalTasks = tasks.filter((task) =>
          userProjects.some((project) => project.projectId === task.projectId),
        ).length;
        const completedTasks = tasks.filter(
          (t) =>
            t.taskStatus === "completed" &&
            userProjects.some((project) => project.projectId === t.projectId),
        ).length;

        const projectCompletionRate =
          totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
        const taskCompletionRate =
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const calculatedCompletionRate = Math.round(
          (projectCompletionRate + taskCompletionRate) / 2,
        );

        setSummaryData({
          projects: {
            total: totalProjects,
            completed: completedProjects,
            inProgress: userProjects.filter(
              (p) => p.projectStatus === "In Progress",
            ).length,
            onHold: userProjects.filter((p) => p.projectStatus === "On Hold")
              .length,
            notStarted: userProjects.filter(
              (p) => p.projectStatus === "Not Started",
            ).length,
            upcoming: userProjects.filter((p) => p.projectStatus === "Upcoming")
              .length,
            cancelled: userProjects.filter(
              (p) => p.projectStatus === "Cancelled",
            ).length,
          },
          users: {
            total: users.length,
            admin: users.filter((u) => u.userRole === "Admin").length,
            projectManager: users.filter(
              (u) => u.userRole === "Project Manager",
            ).length,
            developer: users.filter((u) => u.userRole === "Developer").length,
            client: users.filter((u) => u.userRole === "Client").length,
            assignedDevelopers: developers.length,
          },
          tasks: {
            total: totalTasks,
            completed: completedTasks,
            inProgress: tasks.filter(
              (t) =>
                t.taskStatus === "in progress" &&
                userProjects.some(
                  (project) => project.projectId === t.projectId,
                ),
            ).length,
            pending: tasks.filter(
              (t) =>
                t.taskStatus === "pending" &&
                userProjects.some(
                  (project) => project.projectId === t.projectId,
                ),
            ).length,
          },
        });
        const processedActivities = activities
          .filter((activity) =>
            userProjects.some(
              (project) => project.projectTitle === activity.projectTitle,
            ),
          )
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
              const target =
                activity.taskTitle ?
                  `on task "${activity.taskTitle}" in project "${activity.projectTitle}"`
                : activity.projectTitle ?
                  `on project "${activity.projectTitle}"`
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
    intervalId = setInterval(fetchAllData, 30000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [navigate]);

  // Helper function to format time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const menuItems = [
    {
      icon: <RxDashboard />,
      label: "Dashboard",
      path: "/projectManagerDashboard",
    },

    {
      icon: <FiUsers />,
      label: "Manage Developers",
      path: "/projectManagerTeams",
    },
    {
      icon: <MdOutlineLibraryBooks />,
      label: "Manage Projects",
      path: "/projectManagerProjects",
    },
    { icon: <FaTasks />, label: "Manage Tasks", path: "/projectManagerTasks" },
    {
      icon: <LiaComments />,
      label: "Manage Comments",
      path: "/projectManagerComments",
    },
    {
      icon: <RxActivityLog />,
      label: "View Activity Logs",
      path: "/projectManagerLogs",
    },
    {
      icon: <IoSettingsOutline />,
      label: "Settings",
      path: "/projectManagerSettings",
    },
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
            ${sidebarOpen || width >= 640 ? "translate-x-0" : "-translate-x-full"}`}
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
              className="p-3 rounded-full hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:text-white transition-all duration-300"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ?
                <MdOutlineLightMode size={18} />
              : <MdOutlineDarkMode size={18} />}
            </button>

            <div
              className="flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-all"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <button className="bg-gradient-to-r from-blue-400 to-purple-400 text-white p-3 rounded-full hover:from-blue-500 hover:to-purple-500 transition-all duration-300">
                <FaUser size={18} />
              </button>
              <div className="flex flex-col items-start leading-tight">
                <span className="font-semibold">{userName || "Guest"}</span>
                <span className="text-xs text-gray-500 dark:text-gray-300">
                  {role || "Role Unknown"}
                </span>
              </div>

              <FaAngleDown />
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
                    My Created Projects
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
                        upcoming: summaryData.projects.upcoming,
                        cancelled: summaryData.projects.cancelled,
                      },
                      [
                        "Completed",
                        "In Progress",
                        "On Hold",
                        "Not Started",
                        "Upcoming",
                        "Cancelled",
                      ],
                      [
                        "#22C55E", // Green for Completed
                        "#3B82F6", // Blue for In Progress
                        "#F59E0B", // Amber for On Hold
                        "#6366F1", // Indigo for Not Started
                        "#8B5CF6", // Purple for Upcoming
                        "#EF4444", // Red for Cancelled
                      ],
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
                    Total Projects Created: {summaryData.projects.total}
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
                    Developers Summary
                  </h2>
                </div>
                <div className="h-48">
                  <Doughnut
                    data={getChartData(
                      {
                        active: summaryData.users.developer,
                        onProject: summaryData.users.assignedDevelopers,
                      },
                      ["Active", "On Project"],
                      [
                        "#10B981", // Green for Active
                        "#3B82F6", // Blue for On Project
                      ],
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
                    Total Developers: {summaryData.users.developer}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-white/20 dark:bg-black/20 p-2 rounded-lg">
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Active
                      </p>
                      <p
                        className={`text-lg font-semibold ${
                          theme === "dark" ? "text-white" : "text-black"
                        }`}
                      >
                        {summaryData.users.developer}
                      </p>
                    </div>
                    <div className="bg-white/20 dark:bg-black/20 p-2 rounded-lg">
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        On Project
                      </p>
                      <p
                        className={`text-lg font-semibold ${
                          theme === "dark" ? "text-white" : "text-black"
                        }`}
                      >
                        {summaryData.users.assignedDevelopers}
                      </p>
                    </div>
                  </div>
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
                      ],
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

            {/* New Interactive Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team Performance Widget */}
              <div className="bg-white/40 dark:bg-black/50 rounded-xl shadow-lg backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BsGraphUp className="text-2xl text-green-500" />
                  <h2
                    className={`text-xl font-semibold ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    Developer Performance
                  </h2>
                </div>
                <div className="h-64">
                  <Line
                    data={teamPerformance}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                          labels: {
                            color: theme === "dark" ? "white" : "black",
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const label = context.dataset.label || "";
                              const value = context.parsed.y;
                              return `${label}: ${value} projects`;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: "Projects Completed",
                            color: theme === "dark" ? "white" : "black",
                          },
                          grid: {
                            color:
                              theme === "dark" ?
                                "rgba(255, 255, 255, 0.1)"
                              : "rgba(0, 0, 0, 0.1)",
                          },
                          ticks: {
                            color: theme === "dark" ? "white" : "black",
                            stepSize: 1,
                          },
                        },
                        x: {
                          title: {
                            display: true,
                            text: "Developers",
                            color: theme === "dark" ? "white" : "black",
                          },
                          grid: {
                            color:
                              theme === "dark" ?
                                "rgba(255, 255, 255, 0.1)"
                              : "rgba(0, 0, 0, 0.1)",
                          },
                          ticks: {
                            color: theme === "dark" ? "white" : "black",
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

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
                  {recentActivities.length > 0 ?
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
                              theme === "dark" ? "text-gray-300" : (
                                "text-gray-600"
                              )
                            } text-sm`}
                          >
                            {activity.formattedDetails || activity.details}
                          </p>
                          <p
                            className={`${
                              theme === "dark" ? "text-gray-400" : (
                                "text-gray-500"
                              )
                            } text-xs mt-1`}
                          >
                            {formatTimestamp(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  : <div className="text-center py-6">
                      <p
                        className={`${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        No recent activities
                      </p>
                    </div>
                  }
                </div>
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
        </main>
      </div>
    </div>
  );
};

export default ProjectManagerDashboard;
