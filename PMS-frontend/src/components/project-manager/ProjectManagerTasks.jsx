import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdOutlineLibraryBooks,
} from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { LiaComments } from "react-icons/lia";
import { FaUser, FaAngleDown, FaTasks } from "react-icons/fa";
import { RxHamburgerMenu, RxDashboard, RxActivityLog } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../main";

const ProjectManagerTasks = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024 ? true : false,
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
    {
      icon: <IoSettingsOutline />,
      label: "Settings",
      path: "/projectManagerSettings",
    },
  ];
  const [showAll, setShowAll] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskData, setEditTaskData] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    projectId: "",
  });
  const [newTaskData, setNewTaskData] = useState({
    taskTitle: "",
    taskDescription: "",
    taskStatus: "pending",
    taskPriority: "medium",
    projectId: "",
    assignedUserId: "",
    createdAt: "",
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [userProjects, setUserProjects] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      try {
        const response = await axios.get("http://localhost:5294/Task/get", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTasks(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else {
          console.error("Failed to fetch tasks:", error);
        }
      }
    };

    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      try {
        const response = await axios.get(
          "http://localhost:5294/AdminUser/all-users",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUsers(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else {
          console.error("Failed to fetch users:", error);
        }
      }
    };

    const fetchProjects = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/Project/get`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const currentUserId = parseInt(localStorage.getItem("userId"));

        const userCreatedProjects = response.data.filter(
          (project) => project.createdByUserId === currentUserId,
        );

        const userAssignedProjects = response.data.filter(
          (project) =>
            project.assignedUsers &&
            project.assignedUsers.includes(currentUserId),
        );

        const combinedProjects = [...userCreatedProjects];
        userAssignedProjects.forEach((project) => {
          if (
            !combinedProjects.some((p) => p.projectId === project.projectId)
          ) {
            combinedProjects.push(project);
          }
        });

        setProjects(response.data);
        setUserProjects(combinedProjects);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else {
          console.error("Failed to fetch projects:", error);
        }
      }
    };

    fetchTasks();
    fetchUsers();
    fetchProjects();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const isUserProject = userProjects.some(
      (project) => project.projectId === task.projectId,
    );
    if (!isUserProject) return false;
    if (filters.status && task.taskStatus !== filters.status) return false;
    if (filters.priority && task.taskPriority !== filters.priority)
      return false;
    if (filters.projectId && task.projectId !== parseInt(filters.projectId))
      return false;

    return true;
  });

  const visibleTasks = showAll ? filteredTasks : filteredTasks.slice(0, 10);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      projectId: "",
    });
  };

  const handleUpdateTask = async (taskIdToUpdate, updatedTask) => {
    try {
      const token = localStorage.getItem("token");
      let formattedDate = updatedTask.createdAt;
      if (formattedDate) {
        const parts = formattedDate.split("-");
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // yyyy-mm-dd -> dd-mm-yyyy
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else if (parts[2].length === 4) {
            // already dd-mm-yyyy, do nothing
          } else {
            // fallback: just use as is
          }
        }
      }
      const payload = {
        taskTitle: updatedTask.taskTitle,
        taskDescription: updatedTask.taskDescription,
        taskStatus: updatedTask.taskStatus,
        taskPriority: updatedTask.taskPriority,
        projectId: Number(updatedTask.projectId),
        assignedUserId: Number(updatedTask.assignedUserId),
        createdAt: formattedDate,
      };

      console.log("Updating task with payload:", payload);

      const response = await axios.put(
        `http://localhost:5294/Task/update/${taskIdToUpdate}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("Update response:", response.data); // Debug log

      // Refresh tasks from backend to reflect update
      const tasksResponse = await axios.get("http://localhost:5294/Task/get", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasksResponse.data);
      setEditTaskId(null);
      setEditTaskData({});
    } catch (error) {
      console.error("Failed to update task:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
        alert(`Failed to update task: ${error.response.data || error.message}`);
      } else if (error.request) {
        console.error("Error request:", error.request);
        alert(
          "No response received from server. Please check your connection.",
        );
      } else {
        console.error("Error message:", error.message);
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleDeleteTask = async (taskIdToDelete) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `http://localhost:5294/Task/delete/${taskIdToDelete}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setTasks((prev) =>
          prev.filter((task) => task.taskItemId !== taskIdToDelete),
        );
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  const handleEdit = (task) => {
    setEditTaskId(task.taskItemId);
    setEditTaskData({
      taskTitle: task.taskTitle,
      taskDescription: task.taskDescription,
      taskStatus: task.taskStatus,
      taskPriority: task.taskPriority,
      assignedUserId: task.assignedUserId,
      projectId: task.projectId,
      createdAt: task.createdAt,
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...newTaskData,
        assignedUserId: Number(newTaskData.assignedUserId),
        projectId: Number(newTaskData.projectId),
      };
      console.log("Payload:", payload);
      const response = await axios.post(
        "http://localhost:5294/Task/create",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setTasks((prev) => [...prev, response.data]);
      setShowCreateForm(false);
      setNewTaskData({
        taskTitle: "",
        taskDescription: "",
        taskStatus: "pending",
        taskPriority: "medium",
        projectId: "",
        assignedUserId: "",
        createdAt: "",
      });
    } catch (error) {
      alert("Failed to create task");
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
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
               sidebarOpen || window.innerWidth >= 640 ?
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
          {/* Insert dashboard widgets or charts here */}

          <div className="w-full p-6 space-y-4 bg-white/40 dark:bg-black/50 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                <FaTasks className="w-6 h-6" />
                <h1 className="text-2xl font-bold">All Tasks</h1>
              </button>
            </div>

            <div className="flex justify-between mb-4">
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white px-6 py-2 rounded-lg shadow-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 font-medium"
              >
                {showFilters ?
                  <>
                    <span className="text-lg">×</span>
                    Hide Filters
                  </>
                : <>
                    <span className="text-lg"></span>
                    Show Filters
                  </>
                }
              </button>

              <button
                onClick={() => setShowCreateForm((v) => !v)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium"
              >
                {showCreateForm ?
                  <>
                    <span className="text-lg">×</span>
                    Close
                  </>
                : <>
                    <span className="text-lg">+</span>
                    Create Task
                  </>
                }
              </button>
            </div>

            {showFilters && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 text-black dark:text-white p-6 rounded-lg mb-4 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    Filter Tasks
                  </h2>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Clear All Filters
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={filters.priority}
                      onChange={handleFilterChange}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project
                    </label>
                    <select
                      name="projectId"
                      value={filters.projectId}
                      onChange={handleFilterChange}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">All Projects</option>
                      {userProjects.map((project) => (
                        <option
                          key={project.projectId}
                          value={project.projectId}
                        >
                          {project.projectTitle}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            {showCreateForm && (
              <form
                onSubmit={handleCreateTask}
                className="space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 text-black dark:text-white p-6 rounded-lg mb-4 shadow-lg"
              >
                <div>
                  <h2 className="text-center text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                    Create new Task
                  </h2>
                  <label
                    htmlFor="taskTitle"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Title
                  </label>
                  <input
                    id="taskTitle"
                    name="taskTitle"
                    type="text"
                    value={newTaskData.taskTitle}
                    onChange={(e) =>
                      setNewTaskData((prev) => ({
                        ...prev,
                        taskTitle: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="taskDescription"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="taskDescription"
                    name="taskDescription"
                    value={newTaskData.taskDescription}
                    onChange={(e) =>
                      setNewTaskData((prev) => ({
                        ...prev,
                        taskDescription: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  ></textarea>
                </div>
                <div>
                  <label
                    htmlFor="taskStatus"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="taskStatus"
                    name="taskStatus"
                    value={newTaskData.taskStatus}
                    onChange={(e) =>
                      setNewTaskData((prev) => ({
                        ...prev,
                        taskStatus: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="taskPriority"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Priority
                  </label>
                  <select
                    id="taskPriority"
                    name="taskPriority"
                    value={newTaskData.taskPriority}
                    onChange={(e) =>
                      setNewTaskData((prev) => ({
                        ...prev,
                        taskPriority: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="projectId"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Project
                  </label>
                  <select
                    id="projectId"
                    name="projectId"
                    value={newTaskData.projectId}
                    onChange={(e) =>
                      setNewTaskData((prev) => ({
                        ...prev,
                        projectId: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select Project</option>
                    {userProjects.map((project) => (
                      <option key={project.projectId} value={project.projectId}>
                        {project.projectTitle}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="assignedUserId"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Assign To
                  </label>
                  <select
                    id="assignedUserId"
                    name="assignedUserId"
                    value={newTaskData.assignedUserId}
                    onChange={(e) =>
                      setNewTaskData((prev) => ({
                        ...prev,
                        assignedUserId: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.userFullName || user.userName || user.userEmail}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="createdAt"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Created At
                  </label>
                  <input
                    id="createdAt"
                    name="createdAt"
                    type="date"
                    value={(() => {
                      if (!newTaskData.createdAt) return "";
                      const parts = newTaskData.createdAt.split("-");
                      if (parts.length === 3) {
                        if (parts[0].length === 4) {
                          return newTaskData.createdAt;
                        } else {
                          return `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                      }
                      return newTaskData.createdAt;
                    })()}
                    onChange={(e) => {
                      const [yyyy, mm, dd] = e.target.value.split("-");
                      setNewTaskData((prev) => ({
                        ...prev,
                        createdAt: `${dd}-${mm}-${yyyy}`,
                      }));
                    }}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium"
                >
                  Create
                </button>
              </form>
            )}

            <section className="w-full">
              <div className="p-4 overflow-x-auto">
                {filteredTasks.length === 0 ?
                  <div className="text-center py-8 bg-white/40 dark:bg-black/50 rounded-lg">
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                      No tasks match your current filters.
                    </p>
                    {(filters.status ||
                      filters.priority ||
                      filters.projectId) && (
                      <button
                        onClick={clearFilters}
                        className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                : <table className="w-full text-left border border-black dark:border-white">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <th className="border border-black dark:border-white p-2">
                          ID
                        </th>
                        <th className="border border-black dark:border-white p-2">
                          Title
                        </th>
                        <th className="border border-black dark:border-white p-2">
                          Description
                        </th>
                        <th className="border border-black dark:border-white p-2">
                          Status
                        </th>
                        <th className="border border-black dark:border-white p-2">
                          Priority
                        </th>
                        <th className="border border-black dark:border-white p-2">
                          Created At
                        </th>
                        <th className="border border-black dark:border-white p-2">
                          Project
                        </th>
                        <th className="border border-black dark:border-white p-2">
                          Assigned User
                        </th>
                        <th className="border border-black dark:border-white p-2">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="font-medium">
                      {visibleTasks.map((task, index) => (
                        <tr
                          key={task.taskItemId}
                          className={`${
                            index % 2 === 0 ? "bg-white" : "bg-blue-50"
                          } hover:bg-blue-100 dark:bg-black/50 dark:hover:bg-purple-800/30`}
                        >
                          <td className="border border-black dark:border-white p-2">
                            {task.taskItemId}
                          </td>
                          <td className="border border-black dark:border-white p-2">
                            {editTaskId === task.taskItemId ?
                              <input
                                type="text"
                                value={editTaskData.taskTitle || ""}
                                onChange={(e) =>
                                  setEditTaskData((prev) => ({
                                    ...prev,
                                    taskTitle: e.target.value,
                                  }))
                                }
                                className="border border-gray-300 dark:border-gray-600 p-1 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            : task.taskTitle}
                          </td>
                          <td className="border border-black dark:border-white p-2">
                            {editTaskId === task.taskItemId ?
                              <input
                                type="text"
                                value={editTaskData.taskDescription || ""}
                                onChange={(e) =>
                                  setEditTaskData((prev) => ({
                                    ...prev,
                                    taskDescription: e.target.value,
                                  }))
                                }
                                className="border border-gray-300 dark:border-gray-600 p-1 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            : task.taskDescription}
                          </td>
                          <td className="border border-black dark:border-white p-2">
                            {editTaskId === task.taskItemId ?
                              <select
                                value={editTaskData.taskStatus || ""}
                                onChange={(e) =>
                                  setEditTaskData((prev) => ({
                                    ...prev,
                                    taskStatus: e.target.value,
                                  }))
                                }
                                className="border border-gray-300 dark:border-gray-600 p-1 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              >
                                <option value="">Select Status</option>
                                <option value="pending">Pending</option>
                                <option value="in progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            : capitalizeFirstLetter(task.taskStatus)}
                          </td>
                          <td className="border border-black dark:border-white p-2">
                            {editTaskId === task.taskItemId ?
                              <select
                                value={editTaskData.taskPriority || ""}
                                onChange={(e) =>
                                  setEditTaskData((prev) => ({
                                    ...prev,
                                    taskPriority: e.target.value,
                                  }))
                                }
                                className="border border-gray-300 dark:border-gray-600 p-1 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              >
                                <option value="">Select Priority</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            : capitalizeFirstLetter(task.taskPriority)}
                          </td>
                          <td className="border border-black dark:border-white p-2">
                            {editTaskId === task.taskItemId ?
                              <input
                                type="date"
                                value={(() => {
                                  if (!editTaskData.createdAt) return "";
                                  const parts =
                                    editTaskData.createdAt.split("-");
                                  if (parts.length === 3) {
                                    if (parts[0].length === 4) {
                                      return editTaskData.createdAt;
                                    } else {
                                      return `${parts[2]}-${parts[1]}-${parts[0]}`;
                                    }
                                  }
                                  return editTaskData.createdAt;
                                })()}
                                onChange={(e) => {
                                  const [yyyy, mm, dd] =
                                    e.target.value.split("-");
                                  setEditTaskData((prev) => ({
                                    ...prev,
                                    createdAt: `${dd}-${mm}-${yyyy}`,
                                  }));
                                }}
                                className="border border-gray-300 dark:border-gray-600 p-1 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            : task.createdAtFormatted || ""}
                          </td>
                          <td className="border border-black dark:border-white p-2">
                            {editTaskId === task.taskItemId ?
                              <select
                                value={editTaskData.projectId || ""}
                                onChange={(e) =>
                                  setEditTaskData((prev) => ({
                                    ...prev,
                                    projectId: e.target.value,
                                  }))
                                }
                                className="border border-gray-300 dark:border-gray-600 p-1 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              >
                                <option value="">Select Project</option>
                                {userProjects.map((project) => (
                                  <option
                                    key={project.projectId}
                                    value={project.projectId}
                                  >
                                    {project.projectTitle}
                                  </option>
                                ))}
                              </select>
                            : projects.find(
                                (p) => p.projectId === task.projectId,
                              )?.projectTitle || task.projectId
                            }
                          </td>
                          <td className="border border-black dark:border-white p-2">
                            {editTaskId === task.taskItemId ?
                              <select
                                value={editTaskData.assignedUserId || ""}
                                onChange={(e) =>
                                  setEditTaskData((prev) => ({
                                    ...prev,
                                    assignedUserId: e.target.value,
                                  }))
                                }
                                className="border border-gray-300 dark:border-gray-600 p-1 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              >
                                <option value="">Select User</option>
                                {users.map((user) => (
                                  <option key={user.userId} value={user.userId}>
                                    {user.userFullName ||
                                      user.userName ||
                                      user.userEmail}
                                  </option>
                                ))}
                              </select>
                            : users.find(
                                (u) => u.userId === task.assignedUserId,
                              )?.userFullName ||
                              users.find(
                                (u) => u.userId === task.assignedUserId,
                              )?.userName ||
                              users.find(
                                (u) => u.userId === task.assignedUserId,
                              )?.userEmail ||
                              task.assignedUserId
                            }
                          </td>
                          <td className="border border-black dark:border-white p-2">
                            <div className="flex flex-row gap-x-2">
                              {editTaskId === task.taskItemId ?
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateTask(
                                        task.taskItemId,
                                        editTaskData,
                                      )
                                    }
                                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded hover:from-green-600 hover:to-green-700 transition-all duration-300"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditTaskId(null)}
                                    className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1 rounded hover:from-gray-500 hover:to-gray-600 transition-all duration-300"
                                  >
                                    Cancel
                                  </button>
                                </>
                              : <>
                                  <button
                                    onClick={() => handleEdit(task)}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteTask(task.taskItemId)
                                    }
                                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded hover:from-red-600 hover:to-red-700 transition-all duration-300"
                                  >
                                    Delete
                                  </button>
                                </>
                              }
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
                {!showAll && filteredTasks.length > 10 && (
                  <button
                    className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300"
                    onClick={() => setShowAll(true)}
                  >
                    Show All Tasks
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

export default ProjectManagerTasks;
