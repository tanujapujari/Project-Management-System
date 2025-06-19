import React, { useEffect, useState, useContext } from "react";
import { MdOutlineLibraryBooks } from "react-icons/md";
import axios from "axios";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUser, FaAngleDown, FaTasks } from "react-icons/fa";
import { RxHamburgerMenu, RxDashboard, RxActivityLog } from "react-icons/rx";
import { FiUsers } from "react-icons/fi";
import { LiaComments } from "react-icons/lia";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../main";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminProjects = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024 ? true : false
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme || "light";
  const toggleTheme = themeContext?.toggleTheme || (() => { });

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

  const [showAll, setShowAll] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editProjectId, setEditProjectId] = useState(null);
  const [editProjectData, setEditProjectData] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
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

  const [filterStatus, setFilterStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterAssignedUser, setFilterAssignedUser] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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
        setProjects(response.data);
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
        setUsers(response.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchProjects();
    fetchUsers();
  }, []);

  function toDDMMYYYYfromInput(date) {
    if (!date) return "";
    const [yyyy, mm, dd] = date.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }
  function toInputDate(date) {
    if (!date) return "";
    const [dd, mm, yyyy] = date.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }

  const handleEdit = (project) => {
    const toInputDate = (dateStr) => {
      if (!dateStr) return "";
      const [dd, mm, yyyy] = dateStr.split("-");
      return `${yyyy}-${mm}-${dd}`;
    };
    const editData = {
      title: project.projectTitle,
      description: project.projectDescription,
      status: project.projectStatus,
      startDate: toInputDate(project.projectStartDate),
      deadline: toInputDate(project.projectDeadLine),
      createdByUserId: project.createdByUserId,
      assignedUsers: project.assignedUserIds || [],
    };
    setEditProjectData(editData);
    setEditProjectId(project.projectId);
    setSidebarOpen(false);
    toast.info(`Editing project: ${project.projectTitle}`);
  };

  const handleUpdateProject = async (projectIdToUpdate, updatedProject) => {
    if (
      !updatedProject.title ||
      !updatedProject.description ||
      !updatedProject.status ||
      !updatedProject.startDate ||
      !updatedProject.deadline ||
      !updatedProject.createdByUserId ||
      !updatedProject.assignedUsers ||
      updatedProject.assignedUsers.length === 0
    ) {
      toast.error(
        "All fields are required and at least one user must be assigned."
      );
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Send dates as dd-MM-yyyy
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

      const startDate = toDDMMYYYY(updatedProject.startDate);
      const deadline = toDDMMYYYY(updatedProject.deadline);

      // Validate dates
      const startDateObj = new Date(updatedProject.startDate);
      const deadlineObj = new Date(updatedProject.deadline);

      if (deadlineObj <= startDateObj) {
        toast.error("Project deadline must be after start date");
        return;
      }

      // Ensure assignedUsers is an array of numbers
      const assignedUserIds = Array.isArray(updatedProject.assignedUsers)
        ? updatedProject.assignedUsers.map((id) => Number(id))
        : [Number(updatedProject.assignedUsers)];

      const payload = {
        projectId: Number(projectIdToUpdate),
        projectTitle: updatedProject.title.trim(),
        projectDescription: updatedProject.description.trim(),
        projectStatus: updatedProject.status,
        projectStartDate: startDate,
        projectDeadLine: deadline,
        createdByUserId: Number(updatedProject.createdByUserId),
        assignedUserIds: assignedUserIds,
      };

      console.log("Update Project Payload:", payload);

      // First update the project
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

      console.log("Update response:", response.data);

      // Show success message
      toast.success("Project updated successfully!");

      // Reset edit mode immediately
      setEditProjectId(null);
      setEditProjectData({});

      // Fetch updated data
      const projectsResponse = await axios.get(
        "http://localhost:5294/api/Project/get",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the projects list with fresh data
      setProjects(projectsResponse.data);
    } catch (error) {
      console.error("Update project error:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        const errorMessage = error.response.data?.errors
          ? Object.values(error.response.data.errors).flat().join(", ")
          : error.response.data?.message || "Failed to update project";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to update project: " + error.message);
      }
    }
  };

  // Add this function to handle input changes in edit mode
  const handleEditInputChange = (field, value) => {
    setEditProjectData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Update the table cell rendering for edit mode
  const renderEditCell = (field, value, type = "text") => {
    switch (type) {
      case "text":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleEditInputChange(field, e.target.value)}
            className="border p-1 rounded w-full text-black"
          />
        );
      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => handleEditInputChange(field, e.target.value)}
            className="border p-1 rounded w-full text-black"
          />
        );
      case "date":
        return (
          <input
            type="date"
            value={value || ""}
            onChange={(e) => handleEditInputChange(field, e.target.value)}
            className="border p-1 rounded w-full text-black"
          />
        );
      case "select":
        return (
          <select
            value={value || ""}
            onChange={(e) => handleEditInputChange(field, e.target.value)}
            className="border p-1 rounded w-full text-black"
          >
            <option value="Not Started">Not Started</option>
            <option value="Upcoming">Upcoming</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        );
      case "userSelect":
        return (
          <select
            value={value || ""}
            onChange={(e) => handleEditInputChange(field, e.target.value)}
            className="border p-1 rounded w-full text-black"
          >
            <option value="">Select User</option>
            {users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.userFullName || user.userName || user.userEmail}
              </option>
            ))}
          </select>
        );
      case "multiSelect":
        return (
          <select
            multiple
            value={value || []}
            onChange={(e) => {
              const selected = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              handleEditInputChange(field, selected);
            }}
            className="border p-1 rounded w-full text-black"
          >
            {users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.userFullName || user.userName || user.userEmail}
              </option>
            ))}
          </select>
        );
      default:
        return value;
    }
  };

  const handleDeleteProject = async (projectIdToDelete) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
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
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    }
  };

  const clearFilters = () => {
    setFilterStatus("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterAssignedUser("");
    setFilterTitle("");
  };

  const getFilteredProjects = () => {
    return projects.filter((project) => {
      if (filterStatus && project.projectStatus !== filterStatus) {
        return false;
      }

      if (
        filterTitle &&
        !project.projectTitle.toLowerCase().includes(filterTitle.toLowerCase())
      ) {
        return false;
      }

      if (filterStartDate) {
        const projectStartDate = new Date(
          toInputDate(project.projectStartDate)
        );
        const filterDate = new Date(filterStartDate);
        if (projectStartDate < filterDate) {
          return false;
        }
      }

      if (filterEndDate) {
        const projectEndDate = new Date(toInputDate(project.projectDeadLine));
        const filterDate = new Date(filterEndDate);
        if (projectEndDate > filterDate) {
          return false;
        }
      }

      if (
        filterAssignedUser &&
        !project.assignedUserIds.includes(Number(filterAssignedUser))
      ) {
        return false;
      }

      return true;
    });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      console.log("Status before payload:", newProjectData.status);
      console.log("Status type:", typeof newProjectData.status);
      console.log("Status length:", newProjectData.status.length);
      console.log(
        "Status char codes:",
        Array.from(newProjectData.status).map((c) => c.charCodeAt(0))
      );

      const payload = {
        projectTitle: newProjectData.title,
        projectDescription: newProjectData.description,
        projectStatus: newProjectData.status,
        projectStartDate: toDDMMYYYYfromInput(newProjectData.startDate),
        projectDeadLine: toDDMMYYYYfromInput(newProjectData.deadline),
        createdByUserId: Number(newProjectData.createdByUserId),
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
      console.log("Create response:", response.data);
      toast.success("Project created successfully!");

      setShowCreateForm(false);
      setNewProjectData({
        title: "",
        description: "",
        status: "",
        startDate: "",
        deadline: "",
        createdByUserId: "",
        assignedUsers: [],
      });
      const projectsResponse = await axios.get(
        "http://localhost:5294/api/Project/get",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProjects(projectsResponse.data);
    } catch (error) {
      console.error("Create project error:", error);

      try {
        const token = localStorage.getItem("token");
        const checkResponse = await axios.get(
          "http://localhost:5294/api/Project/get",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const projectExists = checkResponse.data.some(
          (p) => p.projectTitle === newProjectData.title
        );

        if (projectExists) {
          console.log("Project appears to have been created despite the error");
          toast.success("Project created successfully!");

          setShowCreateForm(false);
          setNewProjectData({
            title: "",
            description: "",
            status: "",
            startDate: "",
            deadline: "",
            createdByUserId: "",
            assignedUsers: [],
          });

          setProjects(checkResponse.data);
        }
      } catch (checkError) {
        console.error("Error checking if project was created:", checkError);
      }

      if (error.response) {
        console.error("Error response:", error.response.data);
        const errorMessage =
          typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(error.response.data);
        if (
          errorMessage &&
          (errorMessage.includes("Violation of PRIMARY KEY constraint") ||
            errorMessage.includes("duplicate key"))
        ) {
          try {
            const token = localStorage.getItem("token");
            console.log("Retrying project creation after primary key error...");

            const retryPayload = {
              projectTitle: newProjectData.title,
              projectDescription: newProjectData.description,
              projectStatus: newProjectData.status,
              projectStartDate: toDDMMYYYYfromInput(newProjectData.startDate),
              projectDeadLine: toDDMMYYYYfromInput(newProjectData.deadline),
              createdByUserId: Number(newProjectData.createdByUserId),
              assignedUserIds: newProjectData.assignedUsers.map(Number),
            };

            const retryResponse = await axios.post(
              "http://localhost:5294/api/Project/create",
              retryPayload,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            console.log("Retry successful:", retryResponse.data);

            toast.success("Project created successfully!");

            setShowCreateForm(false);
            setNewProjectData({
              title: "",
              description: "",
              status: "",
              startDate: "",
              deadline: "",
              createdByUserId: "",
              assignedUsers: [],
            });

            const projectsResponse = await axios.get(
              "http://localhost:5294/api/Project/get",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            setProjects(projectsResponse.data);
            return;
          } catch (retryError) {
            console.error("Retry also failed:", retryError);
            toast.error(
              "Failed to create project even after retry. Please try again later."
            );
          }
        } else {
          let errorMsg = "Failed to create project";

          if (typeof error.response.data === "string") {
            errorMsg += ": " + error.response.data;
          } else if (error.response.data?.message) {
            errorMsg += ": " + error.response.data.message;
          } else if (error.response.data) {
            try {
              errorMsg += ": " + JSON.stringify(error.response.data);
            } catch (e) {
              errorMsg += " (Unable to parse error details)";
            }
          }

          toast.error(errorMsg);
        }
      } else {
        toast.error("Failed to create project: " + error.message);
      }
    }
  };

  const filteredProjects = getFilteredProjects();

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

      {/* Main content wrapper */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-55" : "md:ml-14"
          }`}
      >
        {/* Header */}
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
              className="hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:text-white p-3 rounded-full transition-all"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {theme === "dark" ? (
                <MdOutlineLightMode size={18} aria-hidden="true" />
              ) : (
                <MdOutlineDarkMode size={18} aria-hidden="true" />
              )}
            </button>

            <div
              className="flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-all"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              role="button"
              tabIndex={0}
              aria-label="User menu"
              title="User menu"
            >
              <button
                className="bg-gradient-to-r from-blue-400 to-purple-400 text-white p-3 rounded-full"
                aria-label="User profile"
                title="User profile"
              >
                <FaUser size={18} aria-hidden="true" />
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
                className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""
                  }`}
                aria-hidden="true"
              />
            </div>

            {dropdownOpen && (
              <div
                className="absolute right-0 top-14 bg-white dark:bg-black shadow-md rounded-md p-2 w-32"
                role="menu"
                aria-label="User menu options"
              >
                <button
                  className="w-full text-left px-2 py-1 hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:text-white rounded-md text-sm transition-all"
                  onClick={handleLogout}
                  aria-label="Logout"
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-h-screen bg-gradient-rainbow animate-gradient-x rounded-tl-xl dark:bg-gradient-rainbow-dark dark:rounded-none p-6">
          <div
            className="max-w-7xl mx-auto p-6  bg-white/40 dark:bg-black/50 rounded-lg flex items-center
           flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-xl shadow-lg w-80 flex items-center justify-center mb-8 relative">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h1 className="text-2xl font-bold">All Projects</h1>
                <span className="bg-white/20 text-white text-sm px-2.5 py-1 rounded-full">
                  {filteredProjects.length}
                </span>
              </div>
            </div>{" "}
            {/* Action Buttons */}
            <div className="flex justify-between max-w-9xl mx-auto mb-8 px-4 w-full">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200 flex items-center gap-2 shadow-md"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>

              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition duration-200 flex items-center gap-2 shadow-md"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Project
              </button>
            </div>

            {/* Filter Section */}
            {showFilters && (
              <div className="mb-6 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Filter Projects
                </h3>
                <div className="flex gap-4">
                  {/* Title Filter */}
                  <div className="w-[20%]">
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

                  {/* Status Filter */}
                  <div className="w-[15%]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    >
                      <option value="">All Statuses</option>
                      <option value="Not Started">Not Started</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Start Date Filter */}
                  <div className="w-[15%]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    />
                  </div>

                  {/* End Date Filter */}
                  <div className="w-[15%]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    />
                  </div>

                  {/* Assigned User Filter */}
                  <div className="w-[20%]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assigned User
                    </label>
                    <select
                      value={filterAssignedUser}
                      onChange={(e) => setFilterAssignedUser(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    >
                      <option value="">All Users</option>
                      {users.map((user) => (
                        <option key={user.userId} value={user.userId}>
                          {user.userFullName || user.userName || user.userEmail}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="w-[15%] flex items-end">
                    <button
                      onClick={clearFilters}
                      className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-all w-full"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Create Project Form */}
            {showCreateForm && (
              <form
                onSubmit={handleCreateProject}
                className="w-full space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 text-black dark:text-white p-6 rounded-lg mb-4 shadow-lg"
              >
                <div className="w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                      Create New Project
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                      title="Close form"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {/* Project Title */}
                    <div>
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
                          setNewProjectData({
                            ...newProjectData,
                            title: e.target.value,
                          })
                        }
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    {/* Status */}
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
                          setNewProjectData({
                            ...newProjectData,
                            status: e.target.value,
                          })
                        }
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Select Status</option>
                        <option value="Not Started">Not Started</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Start Date */}
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
                          setNewProjectData({
                            ...newProjectData,
                            startDate: e.target.value,
                          })
                        }
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    {/* Deadline */}
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
                          setNewProjectData({
                            ...newProjectData,
                            deadline: e.target.value,
                          })
                        }
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    {/* Created By */}
                    <div>
                      <label
                        htmlFor="createdByUserId"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Created By
                      </label>
                      <select
                        id="createdByUserId"
                        name="createdByUserId"
                        value={newProjectData.createdByUserId}
                        onChange={(e) =>
                          setNewProjectData({
                            ...newProjectData,
                            createdByUserId: e.target.value,
                          })
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

                    {/* Assigned Users */}
                    <div>
                      <label
                        htmlFor="assignedUsers"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Assigned Users
                      </label>
                      <select
                        id="assignedUsers"
                        name="assignedUsers"
                        multiple
                        value={newProjectData.assignedUsers}
                        onChange={(e) =>
                          setNewProjectData({
                            ...newProjectData,
                            assignedUsers: Array.from(
                              e.target.selectedOptions,
                              (option) => option.value
                            ),
                          })
                        }
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      >
                        {users.map((user) => (
                          <option key={user.userId} value={user.userId}>
                            {user.userFullName || user.userName || user.userEmail}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Hold Ctrl/Cmd to select multiple users
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-4">
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
                        setNewProjectData({
                          ...newProjectData,
                          description: e.target.value,
                        })
                      }
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      rows="3"
                      required
                    ></textarea>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleProjects.map((project) => (
                <div
                  key={project.projectId}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col p-6 transition-transform duration-200 hover:scale-[1.02]"
                >
                  {editProjectId === project.projectId ? (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        handleUpdateProject(project.projectId, editProjectData);
                      }}
                      className="w-full"
                    >
                      {/* Title */}
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Title</label>
                        <input
                          type="text"
                          value={editProjectData.title}
                          onChange={e => handleEditInputChange('title', e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                      {/* Description */}
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description</label>
                        <textarea
                          value={editProjectData.description}
                          onChange={e => handleEditInputChange('description', e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          rows={2}
                          required
                        />
                      </div>
                      {/* Status */}
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Status</label>
                        <select
                          value={editProjectData.status}
                          onChange={e => handleEditInputChange('status', e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="Upcoming">Upcoming</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      {/* Start Date */}
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={editProjectData.startDate}
                          onChange={e => handleEditInputChange('startDate', e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                      {/* Deadline */}
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Deadline</label>
                        <input
                          type="date"
                          value={editProjectData.deadline}
                          onChange={e => handleEditInputChange('deadline', e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                      {/* Created By */}
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Created By</label>
                        <select
                          value={editProjectData.createdByUserId}
                          onChange={e => handleEditInputChange('createdByUserId', e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        >
                          {users.map(user => (
                            <option key={user.userId} value={user.userId}>
                              {user.userFullName || user.userName || user.userEmail}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Assigned Users */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Assigned Users</label>
                        <select
                          multiple
                          value={editProjectData.assignedUsers}
                          onChange={e => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            handleEditInputChange('assignedUsers', selected);
                          }}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        >
                          {users.map(user => (
                            <option key={user.userId} value={user.userId}>
                              {user.userFullName || user.userName || user.userEmail}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple users</p>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex gap-4 w-full mt-auto">
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-lg transition duration-200"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditProjectId(null); setEditProjectData({}); }}
                          className="flex-1 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold text-lg transition duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Title */}
                      <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                        {project.projectTitle}
                      </h3>
                      {/* Description */}
                      <p className="text-gray-700 dark:text-gray-200 mb-4">
                        {project.projectDescription}
                      </p>
                      {/* Status Badge */}
                      <div className="mb-4 flex">
                        <span className={`px-4 py-2 rounded-full font-semibold text-base ${project.projectStatus === "Completed"
                            ? "bg-green-200 text-green-900"
                            : project.projectStatus === "In Progress"
                              ? "bg-blue-200 text-blue-900"
                              : project.projectStatus === "Upcoming"
                                ? "bg-purple-200 text-purple-900"
                                : project.projectStatus === "On Hold"
                                  ? "bg-yellow-200 text-yellow-900"
                                  : project.projectStatus === "Cancelled"
                                    ? "bg-red-200 text-red-900"
                                    : "bg-gray-200 text-gray-900"
                          }`}>{`STATUS: ${project.projectStatus}`}</span>
                      </div>
                      {/* Dates and Created By */}
                      <div className="mb-4 w-full space-y-2">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span>Start: {project.projectStartDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span>Due: {project.projectDeadLine}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span>Created by: {project.createdByUserName}</span>
                        </div>
                      </div>
                      {/* Team */}
                      <div className="mb-6 w-full flex items-center gap-3">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">TEAM:</span>
                        {project.assignedUserIds && project.assignedUserIds.length > 0 ? (
                          <div className="flex -space-x-2 overflow-hidden">
                            {project.assignedUserIds.map((id) => {
                              const user = users.find(u => String(u.userId) === String(id));
                              const userInitial = user ? (user.userFullName || user.userName || user.userEmail)[0] : "?";
                              const userName = user ? (user.userFullName || user.userName || user.userEmail) : "Unknown User";
                              return (
                                <span
                                  key={id}
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800 shadow-md"
                                  title={userName}
                                >
                                  {userInitial}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">No team assigned</span>
                        )}
                      </div>
                      {/* Action Buttons */}
                      <div className="flex gap-4 w-full mt-auto">
                        <button
                          onClick={() => handleEdit(project)}
                          className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-lg transition duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.projectId)}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-lg transition duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            {/* Show More/Less Button */}
            {filteredProjects.length > 10 && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg transition duration-200"
                >
                  {showAll ? "Show Less" : "Show More"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminProjects;
