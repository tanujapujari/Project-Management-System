import React, { useEffect, useState, useContext, useCallback } from "react";
import { MdOutlineLibraryBooks } from "react-icons/md";
import axios from "axios";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUser, FaAngleDown, FaTasks } from "react-icons/fa";
import { RxHamburgerMenu, RxDashboard, RxActivityLog } from "react-icons/rx";
import { LiaComments } from "react-icons/lia";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../main";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProjectManagerProjects = () => {
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
    {
      icon: <IoSettingsOutline />,
      label: "Settings",
      path: "/projectManagerSettings",
    },
  ];

  const [showAll, setShowAll] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editProjectId, setEditProjectId] = useState(null);
  const [editProjectData, setEditProjectData] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterTitle, setFilterTitle] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignedUser, setFilterAssignedUser] = useState("");
  const [newProjectData, setNewProjectData] = useState({
    title: "",
    description: "",
    status: "",
    startDate: "",
    deadline: "",
    createdByUserId: "",
    assignedUsers: [],
  });
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [developers, setDevelopers] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setCurrentUserId(userId);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5294/AdminUser/all-users",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const developersList = response.data.filter(
        (user) => user.userRole?.toLowerCase() === "developer"
      );
      setDevelopers(developersList);
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    try {
      console.log("Fetching projects from API...");
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5294/api/Project/get",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("API response received:", response.data.length, "projects");
      const filteredProjects = response.data.filter(
        (project) => String(project.createdByUserId) === String(currentUserId)
      );
      console.log(
        "Filtered projects for current user:",
        filteredProjects.length,
        "projects"
      );
      setProjects(filteredProjects);
      console.log("Projects state updated");
      return filteredProjects;
    } catch (error) {
      console.error("Failed to refresh projects:", error);
      throw error;
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      refreshProjects();
      fetchUsers();
    }
  }, [currentUserId, refreshProjects, fetchUsers]);

  function toInputDate(date) {
    if (!date) return "";
    const [dd, mm, yyyy] = date.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }

  // Helper to ensure dd-MM-yyyy format for backend
  const toDDMMYYYY = (dateStr) => {
    if (!dateStr) return "";
    let parts = dateStr.split("-");
    if (parts[0].length === 4) {
      // yyyy-MM-dd
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else if (parts[2].length === 4) {
      // already dd-MM-yyyy
      return dateStr;
    }
    return dateStr;
  };

  const handleUpdateProject = async (projectIdToUpdate, updatedProject) => {
    if (
      !updatedProject.title ||
      !updatedProject.description ||
      !updatedProject.status ||
      !updatedProject.startDate ||
      !updatedProject.deadline ||
      !updatedProject.assignedUsers ||
      updatedProject.assignedUsers.length === 0
    ) {
      toast.error("All fields are required and at least one user must be assigned.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        projectId: Number(projectIdToUpdate),
        projectTitle: updatedProject.title.trim(),
        projectDescription: updatedProject.description.trim(),
        projectStatus: updatedProject.status,
        projectStartDate: toDDMMYYYY(updatedProject.startDate),
        projectDeadLine: toDDMMYYYY(updatedProject.deadline),
        createdByUserId: Number(currentUserId),
        assignedUserIds: updatedProject.assignedUsers.map(Number)
      };
      await axios.put(
        `http://localhost:5294/api/Project/update/${projectIdToUpdate}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Refresh projects and update state
      const updatedProjects = await refreshProjects();
      setProjects(updatedProjects);
      setEditProjectId(null);
      setEditProjectData({});
      toast.success("Project updated successfully!");
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data || "An error occurred while updating the project.";
        toast.error(`Failed to update project: ${errorMessage}`);
      } else if (error.request) {
        toast.error("No response received from server. Please check your connection.");
      } else {
        toast.error("Failed to update project. Please try again.");
      }
    }
  };

  const handleDeleteProject = async (projectIdToDelete, projectTitle) => {
    if (window.confirm(`Are you sure you want to delete the project "${projectTitle}"?`)) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `http://localhost:5294/api/Project/delete/${projectIdToDelete}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProjects((prev) => prev.filter((p) => p.projectId !== projectIdToDelete));
        toast.success("Project deleted successfully!");
      } catch (error) {
        if (error.response) {
          const errorMessage = error.response.data?.message || error.response.data || "An error occurred while deleting the project.";
          toast.error(`Delete failed: ${errorMessage}`);
        } else {
          toast.error("Failed to delete project. Please check your connection and try again.");
        }
      }
    }
  };

  const handleEdit = (project) => {
    setEditProjectId(project.projectId);
    setSidebarOpen(false);
    const editData = {
      title: project.projectTitle,
      description: project.projectDescription,
      status: project.projectStatus,
      startDate: toInputDate(project.projectStartDate),
      deadline: toInputDate(project.projectDeadLine),
      createdByUserId: currentUserId,
      assignedUsers: project.assignedUserIds ? project.assignedUserIds.map(String) : [],
    };
    setEditProjectData(editData);
    toast.info(`Editing project: ${project.projectTitle}`);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (
      !newProjectData.title ||
      !newProjectData.description ||
      !newProjectData.status ||
      !newProjectData.startDate ||
      !newProjectData.deadline ||
      !newProjectData.assignedUsers ||
      newProjectData.assignedUsers.length === 0
    ) {
      toast.error("All fields are required and at least one user must be assigned.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        projectTitle: newProjectData.title.trim(),
        projectDescription: newProjectData.description.trim(),
        projectStatus: newProjectData.status,
        projectStartDate: toDDMMYYYY(newProjectData.startDate),
        projectDeadLine: toDDMMYYYY(newProjectData.deadline),
        createdByUserId: Number(currentUserId),
        assignedUserIds: newProjectData.assignedUsers.map(Number),
      };
      await axios.post(
        "http://localhost:5294/api/Project/create",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setShowCreateForm(false);
      setNewProjectData({
        title: "",
        description: "",
        status: "Not Started",
        startDate: "",
        deadline: "",
        createdByUserId: currentUserId,
        assignedUsers: [],
      });
      await refreshProjects();
      toast.success("Project created successfully!");
    } catch (error) {
      if (error.response) {
        toast.error(`Failed to create project: ${error.response.data?.message || error.response.data || "Unknown error"}`);
      } else {
        toast.error("Failed to create project. Please try again.");
      }
    }
  };

  const handleShowCreateForm = () => {
    setShowCreateForm((prev) => {
      if (!prev) {
        setNewProjectData((prevData) => ({
          ...prevData,
          createdByUserId: currentUserId,
        }));
        toast.info("Create a new project");
      }
      return !prev;
    });
  };

  const clearFilters = () => {
    setFilterTitle("");
    setFilterStatus("");
    setFilterAssignedUser("");
    toast.info("Filters cleared");
  };

  // Apply filters to projects
  const filteredProjects = projects.filter((project) => {
    // Filter by title
    if (
      filterTitle &&
      !project.projectTitle.toLowerCase().includes(filterTitle.toLowerCase())
    ) {
      return false;
    }

    // Filter by status
    if (filterStatus && project.projectStatus !== filterStatus) {
      return false;
    }

    // Filter by assigned user
    if (
      filterAssignedUser &&
      (!project.assignedUserIds ||
        !project.assignedUserIds.includes(Number(filterAssignedUser)))
    ) {
      return false;
    }

    return true;
  });

  // Determine which projects to show based on showAll flag
  const visibleProjects = showAll
    ? filteredProjects
    : filteredProjects.slice(0, 10);

  const handleEditInputChange = (field, value) => {
    setEditProjectData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen flex">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === "dark" ? "dark" : "light"}
      />
      {/* Sidebar - Fixed position */}
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
              ${sidebarOpen || window.innerWidth >= 640
              ? "translate-x-0"
              : "-translate-x-full"
            }`}
        >
          <div className="h-full text-black dark:text-white text-md font-medium px-4 py-8">
            <ul className="space-y-4">
              <li
                className={`flex items-center gap-2 p-2 justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold text-lg -mt-5 mb-10 ${!sidebarOpen && "sm:hidden"
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
                    className={`whitespace-nowrap ${!sidebarOpen && "hidden sm:hidden"
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

      {/* Main content wrapper - Fixed header and scrollable content */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-55" : "md:ml-14"
          }`}
      >
        {/* Header - Fixed position */}
        <header
          className={`p-4 bg-white dark:bg-black sticky top-0 z-50 h-16 flex items-center justify-between transition-all duration-300 ${sidebarOpen ? "md:ml-0" : "md:-ml-14"
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

        {/* Main content - Scrollable */}
        <main className="flex flex-col justify-start items-center p-4 bg-gradient-rainbow animate-gradient-x min-h-screen rounded-tl-xl dark:rounded-none gap-8 dark:bg-gradient-rainbow-dark dark:text-white">
          {/* Insert dashboard widgets or charts here */}

          <div className="w-full p-6 space-y-4 bg-white/40 dark:bg-black/50 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                <MdOutlineLibraryBooks className="w-6 h-6" />
                <h1 className="text-2xl font-bold">All Projects</h1>
              </button>
            </div>
            <div className="flex justify-between mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white px-6 py-2 rounded-lg shadow-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 font-medium"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              <button
                onClick={handleShowCreateForm}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium"
              >
                {showCreateForm ? "Close" : "Create Project"}
              </button>
            </div>

            {/* Filters Section */}
            {showFilters && (
              <div className="space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 text-black dark:text-white p-6 rounded-lg mb-4 shadow-lg">
                <h2 className="text-center text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
                  Filter Projects
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Filter by Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={filterTitle}
                      onChange={(e) => setFilterTitle(e.target.value)}
                      placeholder="Search by title..."
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    />
                  </div>

                  {/* Filter by Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    >
                      <option value="">All Statuses</option>
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>

                  {/* Filter by Assigned User */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assigned Developer
                    </label>
                    <select
                      value={filterAssignedUser}
                      onChange={(e) => setFilterAssignedUser(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    >
                      <option value="">All Developers</option>
                      {developers.map((developer) => (
                        <option key={developer.userId} value={developer.userId}>
                          {developer.userFullName ||
                            developer.userName ||
                            developer.userEmail}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="flex justify-center mt-4">
                  <button
                    onClick={clearFilters}
                    className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
            {showCreateForm && (
              <form
                onSubmit={handleCreateProject}
                className="space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 text-black dark:text-white p-6 rounded-lg mb-4 shadow-lg"
              >
                <div>
                  <h2 className="text-center text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                    Create new Project
                  </h2>
                  <label
                    htmlFor="projectTitle"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Title
                  </label>
                  <input
                    id="projectTitle"
                    name="projectTitle"
                    type="text"
                    value={newProjectData.title}
                    onChange={(e) =>
                      setNewProjectData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="projectDescription"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="projectDescription"
                    name="projectDescription"
                    value={newProjectData.description}
                    onChange={(e) =>
                      setNewProjectData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  ></textarea>
                </div>
                <div>
                  <label
                    htmlFor="projectStatus"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="projectStatus"
                    name="projectStatus"
                    value={newProjectData.status}
                    onChange={(e) =>
                      setNewProjectData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="projectStartDate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    id="projectStartDate"
                    name="projectStartDate"
                    type="date"
                    value={newProjectData.startDate}
                    onChange={(e) =>
                      setNewProjectData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="projectDeadline"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Deadline
                  </label>
                  <input
                    id="projectDeadline"
                    name="projectDeadline"
                    type="date"
                    value={newProjectData.deadline}
                    onChange={(e) =>
                      setNewProjectData((prev) => ({
                        ...prev,
                        deadline: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full  bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="projectCreatedBy"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Created By
                  </label>
                  <input
                    id="projectCreatedBy"
                    name="projectCreatedBy"
                    type="text"
                    value={
                      users.find(
                        (user) => String(user.userId) === String(currentUserId)
                      )?.userFullName || ""
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-gray-100 dark:bg-gray-700"
                    readOnly
                  />
                </div>
                <div>
                  <label
                    htmlFor="projectAssignedUsers"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Assigned Users (Developers)
                  </label>
                  <select
                    id="projectAssignedUsers"
                    name="projectAssignedUsers"
                    multiple
                    value={newProjectData.assignedUsers}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      );
                      setNewProjectData((prev) => ({
                        ...prev,
                        assignedUsers: selected,
                      }));
                    }}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full h-32 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    {developers.map((developer) => (
                      <option key={developer.userId} value={developer.userId}>
                        {developer.userFullName ||
                          developer.userName ||
                          developer.userEmail}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Hold Ctrl (Windows) or Command (Mac) to select multiple
                    developers. Select at least one developer.
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium"
                >
                  Create
                </button>
              </form>
            )}
            {/* Project Count */}
            <div className="flex justify-between items-center mt-4 px-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Showing {visibleProjects.length} of {filteredProjects.length}{" "}
                filtered projects
                {filteredProjects.length !== projects.length &&
                  ` (filtered from ${projects.length} total)`}
              </p>
            </div>

            <section className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleProjects.map((project) => (
                  <div
                    key={project.projectId}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="p-6">
                      {editProjectId === project.projectId ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Title
                            </label>
                            <input
                              id="editTitle"
                              name="editTitle"
                              type="text"
                              value={editProjectData.title || ""}
                              onChange={(e) =>
                                handleEditInputChange("title", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                            />
                          </div>

                          <div>
                            <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Description
                            </label>
                            <textarea
                              id="editDescription"
                              name="editDescription"
                              value={editProjectData.description || ""}
                              onChange={(e) =>
                                handleEditInputChange("description", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                              rows="3"
                            />
                          </div>

                          <div>
                            <label htmlFor="editStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Status
                            </label>
                            <select
                              id="editStatus"
                              name="editStatus"
                              value={editProjectData.status || ""}
                              onChange={(e) =>
                                handleEditInputChange("status", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="Upcoming">Upcoming</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="On Hold">On Hold</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="editStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Start Date
                            </label>
                            <input
                              id="editStartDate"
                              name="editStartDate"
                              type="date"
                              value={editProjectData.startDate || ""}
                              onChange={(e) =>
                                handleEditInputChange("startDate", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                            />
                          </div>

                          <div>
                            <label htmlFor="editDeadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Deadline
                            </label>
                            <input
                              id="editDeadline"
                              name="editDeadline"
                              type="date"
                              value={editProjectData.deadline || ""}
                              onChange={(e) =>
                                handleEditInputChange("deadline", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="editAssignedUsers"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                              Assigned Users
                            </label>
                            <select
                              id="editAssignedUsers"
                              name="editAssignedUsers"
                              multiple
                              value={editProjectData.assignedUsers || []}
                              onChange={(e) => {
                                const selected = Array.from(
                                  e.target.selectedOptions,
                                  (option) => option.value
                                );
                                handleEditInputChange("assignedUsers", selected);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                            >
                              {developers.map((developer) => (
                                <option
                                  key={developer.userId}
                                  value={developer.userId}
                                >
                                  {developer.userFullName ||
                                    developer.userName ||
                                    developer.userEmail}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Hold Ctrl/Cmd to select multiple users
                            </p>
                          </div>

                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={() =>
                                handleUpdateProject(
                                  project.projectId,
                                  editProjectData
                                )
                              }
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => {
                                setEditProjectId(null);
                                setEditProjectData({});
                              }}
                              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {project.projectTitle}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${project.projectStatus === "Completed"
                                ? "bg-green-100 text-green-800"
                                : project.projectStatus === "In Progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : project.projectStatus === "Upcoming"
                                    ? "bg-purple-100 text-purple-800"
                                    : project.projectStatus === "On Hold"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : project.projectStatus === "Cancelled"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {project.projectStatus}
                            </span>
                          </div>

                          <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                            {project.projectDescription}
                          </p>

                          <div className="space-y-3 mb-4">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <span className="w-24">Start Date:</span>
                              <span>{project.projectStartDate}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <span className="w-24">Due Date:</span>
                              <span>{project.projectDeadLine}</span>
                            </div>
                          </div>

                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Team Members
                            </h4>
                            <div className="flex -space-x-2 overflow-hidden">
                              {project.assignedUserIds.map((userId, index) => {
                                const user = users.find(
                                  (u) => u.userId === userId
                                );
                                const initials = user
                                  ? (
                                    user.userFullName ||
                                    user.userName ||
                                    user.userEmail
                                  )
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .substring(0, 2)
                                  : "??";

                                const colors = [
                                  "bg-blue-500",
                                  "bg-green-500",
                                  "bg-purple-500",
                                  "bg-yellow-500",
                                  "bg-red-500",
                                  "bg-indigo-500",
                                ];

                                return (
                                  <div
                                    key={userId}
                                    className={`${colors[index % colors.length]
                                      } w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white dark:border-gray-800`}
                                    title={
                                      user?.userFullName ||
                                      user?.userName ||
                                      user?.userEmail
                                    }
                                  >
                                    {initials}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => handleEdit(project)}
                              className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-lg transition duration-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteProject(
                                  project.projectId,
                                  project.projectTitle
                                )
                              }
                              className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-lg transition duration-200"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Show More/Less Button */}
              {filteredProjects.length > 10 && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    {showAll
                      ? "Show Less"
                      : `Show All ${filteredProjects.length} Projects`}
                  </button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectManagerProjects;
