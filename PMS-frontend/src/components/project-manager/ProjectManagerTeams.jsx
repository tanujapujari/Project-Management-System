import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdOutlineLibraryBooks,
} from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { LiaComments } from "react-icons/lia";
import { FaUser, FaAngleDown, FaTasks, FaProjectDiagram } from "react-icons/fa";
import { RxHamburgerMenu, RxDashboard, RxActivityLog } from "react-icons/rx";
import { FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../main";
const ProjectManagerTeams = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024 ? true : false
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
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
  }, []);

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
    { icon: <IoSettingsOutline />, label: "Settings" },
  ];
  const [showAll, setShowAll] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5294/AdminUser/all-users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Filter only developers
        const developers = response.data.filter(
          (user) => user.userRole === "Developer"
        );
        setUsers(developers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, []);

  const visibleUsers = showAll ? users : users.slice(0, 10);

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
                  key={idx}
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
          {/* Insert dashboard widgets or charts here */}

          <div className="w-full p-6 space-y-4 bg-white/40 dark:bg-black/50 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                <FiUsers className="w-6 h-6" />
                <h1 className="text-2xl font-bold">Developers</h1>
              </button>
            </div>
            <section className="w-full">
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border border-black dark:border-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      <th className="border border-black dark:border-white p-2">
                        ID
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Name
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Email
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-medium">
                    {visibleUsers.map((user, index) => (
                      <tr
                        key={user.userId}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-blue-50"
                        } hover:bg-blue-100 dark:bg-black/50 dark:hover:bg-purple-800/30`}
                      >
                        <td className="border border-black dark:border-white p-2">
                          {user.userId}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {user.userFullName}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {user.userEmail}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {user.userRole}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!showAll && users.length > 10 && (
                  <button
                    className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300"
                    onClick={() => setShowAll(true)}
                  >
                    Show All Developers
                  </button>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectManagerTeams;
