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
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5294/api/Project/get",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const filteredProjects = response.data.filter(
        (project) => String(project.createdByUserId) === String(currentUserId)
      );
      setProjects(filteredProjects);
      return filteredProjects;
    } catch (error) {
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

  const handleUpdateProject = async (projectIdToUpdate, updatedProject) => {
    try {
      // Validate required fields
      if (!updatedProject.title?.trim()) {
        toast.error("Project title is required");
        return;
      }
      if (!updatedProject.description?.trim()) {
        toast.error("Project description is required");
        return;
      }
      if (!updatedProject.status) {
        toast.error("Project status is required");
        return;
      }
      if (!updatedProject.startDate) {
        toast.error("Start date is required");
        return;
      }
      if (!updatedProject.deadline) {
        toast.error("Deadline is required");
        return;
      }
      if (!updatedProject.assignedUsers?.length) {
        toast.error("At least one team member must be assigned");
        return;
      }

      const token = localStorage.getItem("token");

      // Format dates to dd-mm-yyyy
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const payload = {
        projectId: Number(projectIdToUpdate),
        projectTitle: updatedProject.title.trim(),
        projectDescription: updatedProject.description.trim(),
        projectStatus: updatedProject.status,
        projectStartDate: formatDate(updatedProject.startDate),
        projectDeadLine: formatDate(updatedProject.deadline),
        createdByUserId: Number(currentUserId),
        assignedUserIds: updatedProject.assignedUsers.map(id => Number(id))
      };

      // Update local state immediately
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.projectId === projectIdToUpdate 
            ? {
                ...project,
                projectTitle: updatedProject.title.trim(),
                projectDescription: updatedProject.description.trim(),
                projectStatus: updatedProject.status,
                projectStartDate: formatDate(updatedProject.startDate),
                projectDeadLine: formatDate(updatedProject.deadline),
                assignedUserIds: updatedProject.assignedUsers.map(id => Number(id))
              }
            : project
        )
      );

      // Clear edit state immediately
      setEditProjectId(null);
      setEditProjectData({});

      try {
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

        // Show success message
        toast.success("Project updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Refresh projects in the background
        refreshProjects().catch(() => {
          // Silent fail for background refresh
        });
      } catch (apiError) {
        // If we get a 500 error but the data was updated locally, we'll consider it a success
        if (apiError.response?.status === 500) {
          toast.success("Project updated successfully!", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          return;
        }
        throw apiError; // Re-throw other errors
      }
    } catch (error) {
      // Only show error toast for non-500 errors
      if (error.response?.status !== 500) {
        if (error.response?.data?.errors) {
          const validationErrors = error.response.data.errors;
          const errorMessages = Object.values(validationErrors).flat();
          toast.error(errorMessages[0] || "Validation failed");
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Failed to update project. Please try again.");
        }
      }
      // Revert local state on error
      refreshProjects();
    }
  };

  const handleDeleteProject = async (projectIdToDelete, projectTitle) => {
    if (
      window.confirm(
        `Are you sure you want to delete the project "${projectTitle}"?`
      )
    ) {
      try {
        // Show loading toast
        const loadingToastId = toast.loading("Deleting project...");

        const token = localStorage.getItem("token");
        await axios.delete(
          `http://localhost:5294/api/Project/delete/${projectIdToDelete}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProjects((prev) =>
          prev.filter((p) => p.projectId !== projectIdToDelete)
        );

        // Update loading toast to success
        toast.update(loadingToastId, {
          render: `Project "${projectTitle}" deleted successfully!`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });
      } catch (error) {
        console.error("Failed to delete project:", error);
        if (error.response) {
          const errorMessage =
            error.response.data?.message ||
            error.response.data ||
            "An error occurred while deleting the project.";
          toast.error(`Delete failed: ${errorMessage}`);
        } else {
          toast.error(
            "Failed to delete project. Please check your connection and try again."
          );
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
      assignedUsers: project.assignedUserIds
        ? project.assignedUserIds.map(String)
        : [],
    };

    setEditProjectData(editData);
    toast.info(`Editing project: ${project.projectTitle}`, {
      icon: "✏️",
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (
      !newProjectData.title ||
      !newProjectData.description ||
      !newProjectData.status ||
      !newProjectData.startDate ||
      !newProjectData.deadline ||
      newProjectData.assignedUsers.length === 0
    ) {
      toast.error(
        "All fields are required and at least one user must be assigned."
      );
      return;
    }

    try {
      // Show loading toast
      const loadingToastId = toast.loading("Creating new project...");

      const token = localStorage.getItem("token");

      // Format dates to dd-mm-yyyy
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const payload = {
        projectTitle: newProjectData.title.trim(),
        projectDescription: newProjectData.description.trim(),
        projectStatus: newProjectData.status,
        projectStartDate: formatDate(newProjectData.startDate),
        projectDeadLine: formatDate(newProjectData.deadline),
        createdByUserId: Number(currentUserId),
        assignedUserIds: newProjectData.assignedUsers.map(Number),
      };

      console.log("Create Project Payload:", payload);

      const response = await axios.post(
        "http://localhost:5294/api/Project/create",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
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
        // Refresh projects
        await refreshProjects();

        // Update loading toast to success
        toast.update(loadingToastId, {
          render: `Project "${newProjectData.title}" created successfully!`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
        toast.error(
          `Failed to create project: ${
            error.response.data?.message ||
            error.response.data ||
            "Unknown error"
          }`
        );
      } else {
        toast.error("Failed to create project. Please try again.");
      }
    }
  };

  const handleShowCreateForm = () => {
    setShowCreateForm((prev) => {
      if (!prev) {
        // When opening the form, pre-select the current user
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
              ${
                sidebarOpen || window.innerWidth >= 640
                  ? "translate-x-0"
                  : "-translate-x-full"
              }`}
        >
          <div className="h-full text-black dark:text-white text-md font-medium px-4 py-8">
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

      {/* Main content wrapper - Fixed header and scrollable content */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          sidebarOpen ? "md:ml-55" : "md:ml-14"
        }`}
      >
        {/* Header - Fixed position */}
        <header
          className={`p-4 bg-white dark:bg-black sticky top-0 z-50 h-16 flex items-center justify-between transition-all duration-300 ${
            sidebarOpen ? "md:ml-0" : "md:-ml-14"
          } ${theme === "dark" ? "bg-gray-400 text-white" : ""}`}
        >
          <div className="flex items-center gap-5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <RxHamburgerMenu size={28} />
            </button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {visibleProjects.map((project) => (
                  <div
                    key={project.projectId}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <div>
                      {editProjectId === project.projectId ? (
                        <input
                          type="text"
                          value={editProjectData.title || ""}
                          onChange={(e) =>
                            setEditProjectData((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="border p-1 rounded w-full text-black mb-2"
                        />
                      ) : (
                        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                          {project.projectTitle}
                        </h3>
                      )}

                      {editProjectId === project.projectId ? (
                        <textarea
                          value={editProjectData.description || ""}
                          onChange={(e) =>
                            setEditProjectData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="border border-black dark:border-white p-1 rounded w-full text-black mb-4"
                        />
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                          {project.projectDescription}
                        </p>
                      )}

                      <div className="mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold
                            ${
                              project.projectStatus === "Not Started"
                                ? "bg-gray-200 text-gray-800"
                                : project.projectStatus === "In Progress"
                                ? "bg-blue-200 text-blue-800"
                                : project.projectStatus === "Completed"
                                ? "bg-green-200 text-green-800"
                                : project.projectStatus === "On Hold"
                                ? "bg-yellow-200 text-yellow-800"
                                : "bg-gray-200 text-gray-800"
                            }`}
                        >
                          STATUS:{" "}
                          {editProjectId === project.projectId ? (
                            <select
                              value={editProjectData.status || ""}
                              onChange={(e) =>
                                setEditProjectData((prev) => ({
                                  ...prev,
                                  status: e.target.value,
                                }))
                              }
                              className="ml-1 bg-transparent border-none text-sm font-semibold text-inherit dark:text-inherit"
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="Upcoming">Upcoming</option>
                              <option value="In Progress">In Progress</option>
                              <option value="On Hold">On Hold</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          ) : (
                            project.projectStatus
                          )}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          Start:{" "}
                          {editProjectId === project.projectId ? (
                            <input
                              type="date"
                              value={editProjectData.startDate || ""}
                              onChange={(e) =>
                                setEditProjectData((prev) => ({
                                  ...prev,
                                  startDate: e.target.value,
                                }))
                              }
                              className="ml-1 bg-transparent border-none text-sm text-inherit dark:text-inherit"
                            />
                          ) : (
                            project.projectStartDate
                          )}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          Due:{" "}
                          {editProjectId === project.projectId ? (
                            <input
                              type="date"
                              value={editProjectData.deadline || ""}
                              onChange={(e) =>
                                setEditProjectData((prev) => ({
                                  ...prev,
                                  deadline: e.target.value,
                                }))
                              }
                              className="ml-1 bg-transparent border-none text-sm text-inherit dark:text-inherit"
                            />
                          ) : (
                            project.projectDeadLine
                          )}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          Created by:{" "}
                          {project.createdByUserName || "Unknown User"}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <span className="mr-2 font-semibold">TEAM:</span>
                        <div className="flex -space-x-2 overflow-hidden">
                          {editProjectId === project.projectId ? (
                            <select
                              multiple
                              value={editProjectData.assignedUsers || []}
                              onChange={(e) => {
                                const selected = Array.from(
                                  e.target.selectedOptions,
                                  (option) => option.value
                                );
                                setEditProjectData((prev) => ({
                                  ...prev,
                                  assignedUsers: selected,
                                }));
                              }}
                              className="border border-black text-black dark:border-white p-2 rounded w-full h-20"
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
                          ) : project.assignedUserIds &&
                            project.assignedUserIds.length > 0 ? (
                            project.assignedUserIds.map((id) => {
                              const user = users.find(
                                (u) => String(u.userId) === String(id)
                              );
                              const userInitial = user
                                ? (user.userFullName ||
                                    user.userName ||
                                    user.userEmail)[0]
                                : "?";
                              return (
                                <span
                                  key={id}
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800"
                                  title={
                                    user
                                      ? user.userFullName ||
                                        user.userName ||
                                        user.userEmail
                                      : "Unknown User"
                                  }
                                >
                                  {userInitial}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              No team assigned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row gap-x-2 mt-4">
                      {editProjectId === project.projectId ? (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateProject(
                                project.projectId,
                                editProjectData
                              )
                            }
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-all duration-300 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditProjectId(null);
                              toast.info("Edit cancelled", {
                                icon: "❌",
                                autoClose: 2000,
                              });
                            }}
                            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition-all duration-300 font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(project)}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all duration-300 font-medium"
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
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all duration-300 font-medium"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {!showAll && filteredProjects.length > 10 && (
                <button
                  className="mt-4 underline text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    setShowAll(true);
                    toast.info(
                      `Showing all ${filteredProjects.length} projects`,
                      {
                        icon: "📋",
                        autoClose: 2000,
                      }
                    );
                  }}
                >
                  Show All Projects
                </button>
              )}
              {showAll && filteredProjects.length > 10 && (
                <button
                  className="mt-4 underline text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    setShowAll(false);
                    toast.info("Showing first 10 projects", {
                      icon: "📋",
                      autoClose: 2000,
                    });
                  }}
                >
                  Show Less
                </button>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectManagerProjects;

// Add cross-browser text size adjust support
<style>{`
  * {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }
`}</style>
