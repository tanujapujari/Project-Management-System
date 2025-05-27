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
  const toggleTheme = themeContext?.toggleTheme || (() => {});

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
      console.log("Status before payload:", updatedProject.status);
      console.log("Status type:", typeof updatedProject.status);
      console.log("Status length:", updatedProject.status.length);
      console.log(
        "Status char codes:",
        Array.from(updatedProject.status).map((c) => c.charCodeAt(0))
      );

      const payload = {
        projectTitle: updatedProject.title,
        projectDescription: updatedProject.description,
        projectStatus: updatedProject.status,
        projectStartDate: toDDMMYYYYfromInput(updatedProject.startDate),
        projectDeadLine: toDDMMYYYYfromInput(updatedProject.deadline),
        createdByUserId: Number(updatedProject.createdByUserId),
        assignedUserIds: updatedProject.assignedUsers.map(Number),
      };
      console.log("Update Project Payload:", payload);

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

      const projectsResponse = await axios.get(
        "http://localhost:5294/api/Project/get",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProjects(projectsResponse.data);
      setEditProjectId(null);
      setEditProjectData({});
    } catch (error) {
      console.error("Update project error:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        toast.error(
          "Failed to update project: " +
            (error.response.data?.message ||
              JSON.stringify(error.response.data))
        );
      } else {
        toast.error("Failed to update project: " + error.message);
      }
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

  const handleEdit = (project) => {
    console.log("Original project status:", project.projectStatus);
    setEditProjectId(project.projectId);
    setSidebarOpen(false);
    const editData = {
      title: project.projectTitle,
      description: project.projectDescription,
      status: project.projectStatus,
      startDate: toInputDate(project.projectStartDate),
      deadline: toInputDate(project.projectDeadLine),
      createdByUserId: project.createdByUserId,
      assignedUsers: project.assignedUserIds
        ? project.assignedUserIds.map(String)
        : [],
    };
    console.log("Setting edit data with status:", editData.status);
    setEditProjectData(editData);
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

  const filteredCount = filteredProjects.length;
  const totalCount = projects.length;

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
                className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white px-4 py-2 rounded-lg shadow-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 font-medium"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>

              <button
                onClick={() => setShowCreateForm((v) => !v)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium"
              >
                {showCreateForm ? (
                  <>
                    <span className="text-lg">×</span>
                    Close
                  </>
                ) : (
                  <>
                    <span className="text-lg">+</span>
                    Create Project
                  </>
                )}
              </button>
            </div>

            {/* Filter Section */}
            {showFilters && (
              <div className="mb-6 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Filter Projects
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Title Filter */}
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

                  {/* Status Filter */}
                  <div>
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
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Start Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date (After)
                    </label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    />
                  </div>

                  {/* End Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deadline (Before)
                    </label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    />
                  </div>

                  {/* Assigned User Filter */}
                  <div>
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
                  <div className="flex items-end">
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
            {showCreateForm && (
              <form
                onSubmit={handleCreateProject}
                className="space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 text-black dark:text-white p-6 rounded-lg mb-4 shadow-lg"
              >
                <div>
                  <h2 className="text-center text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                    Create new Project
                  </h2>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={newProjectData.deadline}
                    onChange={(e) =>
                      setNewProjectData((prev) => ({
                        ...prev,
                        deadline: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Created By
                  </label>
                  <select
                    value={newProjectData.createdByUserId}
                    onChange={(e) =>
                      setNewProjectData((prev) => ({
                        ...prev,
                        createdByUserId: e.target.value,
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assigned Users
                  </label>
                  <select
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
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    {users.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.userFullName || user.userName || user.userEmail}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Hold Ctrl (Windows) or Command (Mac) to select multiple
                    developers
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
                  <tbody className="font-medium">
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
                              className="border p-1 rounded w-full text-black"
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
                              className="border p-1 rounded w-full text-black"
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
                              className="border p-1 rounded w-full text-black"
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
                              className="border p-1 rounded w-full text-black"
                            />
                          ) : (
                            project.projectDeadLine
                          )}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {editProjectId === project.projectId ? (
                            <select
                              value={editProjectData.createdByUserId || ""}
                              onChange={(e) =>
                                setEditProjectData((prev) => ({
                                  ...prev,
                                  createdByUserId: e.target.value,
                                }))
                              }
                              className="border p-1 rounded w-full text-black"
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
                          ) : (
                            (() => {
                              const user = users.find(
                                (u) =>
                                  String(u.userId) ===
                                  String(project.createdByUserId)
                              );
                              return user
                                ? user.userFullName ||
                                    user.userName ||
                                    user.userEmail
                                : project.createdByUserId;
                            })()
                          )}
                        </td>
                        <td className="border border-black dark:border-white p-2 ">
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
                              className="border p-1 rounded w-full text-black"
                            >
                              {users.map((user) => (
                                <option key={user.userId} value={user.userId}>
                                  {user.userFullName ||
                                    user.userName ||
                                    user.userEmail}
                                </option>
                              ))}
                            </select>
                          ) : (
                            (project.assignedUserIds || [])
                              .map((id) => {
                                const user = users.find(
                                  (u) => String(u.userId) === String(id)
                                );
                                return user
                                  ? user.userFullName ||
                                      user.userName ||
                                      user.userEmail
                                  : id;
                              })
                              .join(", ")
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
                                  onClick={() => setEditProjectId(null)}
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
                                    handleDeleteProject(project.projectId)
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
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center">
                  <div className="text-gray-600 dark:text-gray-300 mb-2 sm:mb-0">
                    {filterStatus ||
                    filterStartDate ||
                    filterEndDate ||
                    filterAssignedUser ||
                    filterTitle ? (
                      <span>
                        Showing{" "}
                        <span className="font-semibold">{filteredCount}</span>{" "}
                        filtered projects out of{" "}
                        <span className="font-semibold">{totalCount}</span>{" "}
                        total
                        {!showAll &&
                          filteredCount > 10 &&
                          " (displaying first 10)"}
                      </span>
                    ) : (
                      <span>
                        Showing{" "}
                        <span className="font-semibold">{totalCount}</span>{" "}
                        projects
                        {!showAll &&
                          totalCount > 10 &&
                          " (displaying first 10)"}
                      </span>
                    )}
                  </div>

                  {!showAll && filteredProjects.length > 10 && (
                    <button
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      onClick={() => setShowAll(true)}
                    >
                      Show All {filteredCount} Projects
                    </button>
                  )}

                  {showAll && filteredProjects.length > 10 && (
                    <button
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      onClick={() => setShowAll(false)}
                    >
                      Show Less
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminProjects;
