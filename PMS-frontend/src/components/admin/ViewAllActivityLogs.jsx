import React, { useState, useEffect, useContext } from "react";
import {
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdOutlineLibraryBooks,
} from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUser, FaAngleDown, FaTasks } from "react-icons/fa";
import { LiaComments } from "react-icons/lia";
import { RxHamburgerMenu, RxDashboard, RxActivityLog } from "react-icons/rx";
import { FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../main";
import useWindowWidth from "../../hooks/useWindowWidth";
import axios from "axios";

const ViewAllActivityLogs = () => {
  const width = useWindowWidth();
  const [sidebarOpen, setSidebarOpen] = useState(() => width >= 1024);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedUserName = localStorage.getItem("userName");

    if (storedRole) {
      setRole(storedRole);
    }

    if (storedUserName) {
      setUserName(storedUserName);
    }
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/ActivityLog/get`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setLogs(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch activity logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const menuItems = [
    {
      icon: <RxDashboard />,
      label: "Dashboard",
      path: "/adminDashboard",
    },
    { icon: <FiUsers />, label: "Manage Users", path: "/allUsers" },
    {
      icon: <MdOutlineLibraryBooks />,
      label: "Manage Projects",
      path: "/allProjects",
    },
    { icon: <FaTasks />, label: "Manage Tasks", path: "/allTasks" },
    {
      icon: <LiaComments />,
      label: "Manage Comments",
      path: "/allComments",
    },
    {
      icon: <RxActivityLog />,
      label: "View Activity Logs",
      path: "/allLogs",
    },
    {
      icon: <IoSettingsOutline />,
      label: "Settings",
      path: "/Settings",
    },
  ];

  const getActionText = (log) => {
    const action = log.activityAction || "";
    let actionText = "";

    // Project Actions
    if (action.includes("Project")) {
      const projectTitle = log.projectTitle || "Untitled Project";
      if (action.includes("Created")) {
        actionText = `Created new project "${projectTitle}"`;
      } else if (action.includes("Updated")) {
        actionText = `Updated project "${projectTitle}"`;
      } else if (action.includes("Deleted")) {
        actionText = `Deleted project "${projectTitle}"`;
      } else if (action.includes("Status Updated")) {
        const [, statusChange] = action.split(" - ");
        const [oldStatus, newStatus] = statusChange.split(" to ");
        actionText = `Changed project "${projectTitle}" status from ${oldStatus} to ${newStatus}`;
      } else if (action.includes("Modified")) {
        actionText = `Modified project "${projectTitle}"`;
      } else {
        actionText = `Performed action on project "${projectTitle}"`;
      }
    }
    // Task Actions
    else if (action.includes("Task")) {
      const taskTitle = log.taskTitle || "Untitled Task";
      const projectTitle = log.projectTitle || "Untitled Project";
      if (action.includes("Created")) {
        actionText = `Created new task "${taskTitle}" in project "${projectTitle}"`;
      } else if (action.includes("Updated")) {
        actionText = `Updated task "${taskTitle}" in project "${projectTitle}"`;
      } else if (action.includes("Deleted")) {
        actionText = `Deleted task "${taskTitle}" from project "${projectTitle}"`;
      } else if (action.includes("Status Updated")) {
        const [, statusChange] = action.split(" - ");
        const [oldStatus, newStatus] = statusChange.split(" to ");
        actionText = `Changed task "${taskTitle}" status from ${oldStatus} to ${newStatus} in project "${projectTitle}"`;
      } else if (action.includes("Modified")) {
        actionText = `Modified task "${taskTitle}" in project "${projectTitle}"`;
      } else {
        actionText = `Performed action on task "${taskTitle}" in project "${projectTitle}"`;
      }
    }
    // Comment Actions
    else if (action.includes("Comment")) {
      const target =
        log.taskTitle ?
          `on task "${log.taskTitle}" in project "${log.projectTitle}"`
        : log.projectTitle ? `on project "${log.projectTitle}"`
        : "";

      let specificAction = "Performed an action";

      if (action.includes("Added")) {
        specificAction = "Added";
      } else if (action.includes("Updated")) {
        specificAction = "Updated";
      } else if (action.includes("Deleted")) {
        specificAction = "Deleted";
      } else if (action.includes("Modified")) {
        specificAction = "Modified";
      } else if (action.includes("reacted to comment")) {
        specificAction = "Reacted to";
      } else if (action.includes("resolved comment")) {
        specificAction = "Resolved";
      } else if (action.includes("unresolved comment")) {
        specificAction = "Unresolved";
      }

      actionText = `${specificAction} a comment ${target}`;
    } else {
      actionText = action;
    }

    return actionText || "Unknown Action";
  };

  const getActionColor = (action) => {
    if (!action) return "bg-gray-100 text-gray-800";

    // Project-related actions
    if (action.includes("Project")) {
      if (action.includes("Created")) return "bg-green-100 text-green-800";
      if (action.includes("Updated")) return "bg-blue-100 text-blue-800";
      if (action.includes("Deleted")) return "bg-red-100 text-red-800";
      if (action.includes("Status")) return "bg-purple-100 text-purple-800";
    }

    // Task-related actions
    if (action.includes("Task")) {
      if (action.includes("Created")) return "bg-emerald-100 text-emerald-800";
      if (action.includes("Updated")) return "bg-sky-100 text-sky-800";
      if (action.includes("Deleted")) return "bg-rose-100 text-rose-800";
      if (action.includes("Status")) return "bg-violet-100 text-violet-800";
    }

    // Comment-related actions
    if (action.includes("Comment")) {
      if (action.includes("Added") || action.includes("Created"))
        return "bg-yellow-100 text-yellow-800";
      if (action.includes("Updated")) return "bg-amber-100 text-amber-800";
      if (action.includes("Deleted")) return "bg-orange-100 text-orange-800";
    }

    return "bg-gray-100 text-gray-800";
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
      if (typeof timestamp === "string" && timestamp.includes("-")) {
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
                        ${sidebarOpen ? "w-full md:w-55" : "w-16 sm:w-14 mt-6"}
                        ${
                          sidebarOpen || width >= 640 ?
                            "translate-x-0"
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
                  key={idx}
                  onClick={() => path && navigate(path)}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all duration-200
                                        hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:text-white
                                        dark:hover:bg-gradient-to-r dark:hover:from-purple-600 dark:hover:to-blue-600 hover:scale-105
                                        ${
                                          sidebarOpen ? "w-full" : "w-10 -ml-2"
                                        }`}
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
              className="cursor-pointer "
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
              <FaAngleDown />
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
          <div className="w-full p-6 space-y-4 bg-white/40 dark:bg-black/50 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                <RxActivityLog className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Activity Logs</h1>
              </button>
            </div>
            <section className="w-full">
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border border-black dark:border-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      <th className="border border-black dark:border-white p-2">
                        Time
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Action
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        User
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Project
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-medium">
                    {loading ?
                      <tr>
                        <td
                          colSpan={4}
                          className="border border-black dark:border-white p-2 text-center"
                        >
                          Loading activity logs...
                        </td>
                      </tr>
                    : error ?
                      <tr>
                        <td
                          colSpan={4}
                          className="border border-black dark:border-white p-2 text-center text-red-500"
                        >
                          {error}
                        </td>
                      </tr>
                    : logs.length === 0 ?
                      <tr>
                        <td
                          colSpan={4}
                          className="border border-black dark:border-white p-2 text-center"
                        >
                          No activity logs found.
                        </td>
                      </tr>
                    : logs.map((log, index) => (
                        <tr
                          key={log.activityLogId}
                          className={`${
                            index % 2 === 0 ? "bg-white" : "bg-blue-50"
                          } hover:bg-blue-100 dark:bg-black/50 dark:hover:bg-purple-800/30`}
                        >
                          <td className="border border-black dark:border-white p-2">
                            {formatTimestamp(log.activityTime)}
                          </td>
                          <td className="border border-black dark:border-white p-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(
                                log.activityAction,
                              )}`}
                            >
                              {getActionText(log)}
                            </span>
                          </td>
                          <td className="border border-black dark:border-white p-2">
                            {log.userName}
                          </td>
                          <td className="border border-black dark:border-white p-2">
                            {log.projectTitle}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ViewAllActivityLogs;
