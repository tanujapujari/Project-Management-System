import React, { useEffect, useState, useContext } from "react";
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

  useEffect(() => {
    const fetchProjects = async () => {
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
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };
    const fetchUsers = async () => {
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
    };

    if (currentUserId) {
      fetchProjects();
      fetchUsers();
    }
  }, [currentUserId]);
  function toInputDate(date) {
    if (!date) return "";
    const [dd, mm, yyyy] = date.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }

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
      toast.error(
        "All fields are required and at least one user must be assigned."
      );
      return;
    }

    try {
      // Show loading toast
      const loadingToastId = toast.loading("Updating project...");

      const token = localStorage.getItem("token");
      const payload = {
        projectId: projectIdToUpdate,
        projectTitle: updatedProject.title,
        projectDescription: updatedProject.description,
        projectStatus: updatedProject.status,
        projectStartDate: updatedProject.startDate,
        projectDeadLine: updatedProject.deadline,
        createdByUserId: Number(currentUserId),
        assignedUserIds: updatedProject.assignedUsers.map(Number),
      };

      console.log("Update Project Payload:", payload);
      console.log("Updating Project ID:", projectIdToUpdate);

      const response = await axios.put(
        `http://localhost:5294/api/Project/update/${projectIdToUpdate}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const projectsResponse = await axios.get(
          "http://localhost:5294/api/Project/get",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const filteredProjects = projectsResponse.data.filter(
          (project) => String(project.createdByUserId) === String(currentUserId)
        );
        setProjects(filteredProjects);
        setEditProjectId(null);
        setEditProjectData({});

        toast.update(loadingToastId, {
          render: `Project "${updatedProject.title}" updated successfully!`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data ||
          "An error occurred while updating the project. Please try again.";
        toast.error(`Update failed: ${errorMessage}`);
      } else {
        toast.error(
          "Failed to update project. Please check your connection and try again."
        );
      }
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
    setEditProjectData({
      title: project.projectTitle,
      description: project.projectDescription,
      status: project.projectStatus,
      startDate: toInputDate(project.projectStartDate),
      deadline: toInputDate(project.projectDeadLine),
      createdByUserId: currentUserId,
      assignedUsers: project.assignedUserIds
        ? project.assignedUserIds.map(String)
        : [],
    });
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

    // Validation
    if (
      !newProjectData.title ||
      !newProjectData.description ||
      !newProjectData.status ||
      !newProjectData.startDate ||
      !newProjectData.deadline ||
      !newProjectData.assignedUsers ||
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
      const payload = {
        projectTitle: newProjectData.title,
        projectDescription: newProjectData.description,
        projectStatus: newProjectData.status,
        projectStartDate: newProjectData.startDate,
        projectDeadLine: newProjectData.deadline,
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
        const projectsResponse = await axios.get(
          "http://localhost:5294/api/Project/get",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Filter projects to show only those created by the current user
        const filteredProjects = projectsResponse.data.filter(
          (project) => String(project.createdByUserId) === String(currentUserId)
        );
        setProjects(filteredProjects);

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
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border border-black dark:border-white">
                  <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <tr>
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
                        Start Date
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Deadline
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Created By
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Assigned Users
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-medium ">
                    {visibleProjects.map((project, index) => (
                      <tr
                        key={project.projectId}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-blue-50"
                        } hover:bg-blue-100 dark:bg-black/50 dark:hover:bg-purple-800/30`}
                      >
                        <td className="border border-black dark:border-white p-2">
                          {project.projectId}
                        </td>
                        <td className="border border-black dark:border-white p-2">
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
                              className="border p-1 rounded w-full text-black"
                            />
                          ) : (
                            project.projectTitle
                          )}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {editProjectId === project.projectId ? (
                            <textarea
                              value={editProjectData.description || ""}
                              onChange={(e) =>
                                setEditProjectData((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="border border-black dark:border-white p-1 rounded w-full text-black"
                            />
                          ) : (
                            project.projectDescription
                          )}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {editProjectId === project.projectId ? (
                            <select
                              value={editProjectData.status || ""}
                              onChange={(e) =>
                                setEditProjectData((prev) => ({
                                  ...prev,
                                  status: e.target.value,
                                }))
                              }
                              className="border border-black text-black dark:border-white p-2"
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
                        </td>
                        <td className="border border-black dark:border-white p-2">
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
                              className="border border-black text-black dark:border-white p-2"
                            />
                          ) : (
                            project.projectStartDate
                          )}
                        </td>
                        <td className="border border-black dark:border-white p-2">
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
                              className="border border-black text-black dark:border-white p-2"
                            />
                          ) : (
                            project.projectDeadLine
                          )}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {editProjectId === project.projectId ? (
                            <input
                              type="text"
                              value={currentUserId}
                              className="border border-black text-black dark:border-white p-2"
                              readOnly
                            />
                          ) : (
                            project.createdByUserName || "Unknown User"
                          )}
                        </td>
                        <td className="border border-black dark:border-white p-2">
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
                              className="border border-black text-black dark:border-white p-2 rounded w-full h-32"
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
                            project.assignedUserIds
                              .map((id) => {
                                const user = users.find(
                                  (u) => String(u.userId) === String(id)
                                );
                                return user
                                  ? user.userFullName ||
                                      user.userName ||
                                      user.userEmail
                                  : "Unknown User";
                              })
                              .join(", ")
                          ) : (
                            "No users assigned"
                          )}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          <div className="flex flex-row gap-x-2">
                            {editProjectId === project.projectId ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateProject(
                                      project.projectId,
                                      editProjectData
                                    )
                                  }
                                  className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
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
                                  className="bg-gray-400 text-white p-1 rounded hover:bg-gray-500"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEdit(project)}
                                  className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
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
                                  className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectManagerProjects;
