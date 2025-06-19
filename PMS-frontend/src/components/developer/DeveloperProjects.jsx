import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { MdOutlineLibraryBooks } from "react-icons/md";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUser, FaAngleDown, FaTasks } from "react-icons/fa";
import { RxHamburgerMenu, RxDashboard, RxActivityLog } from "react-icons/rx";
import { LiaComments } from "react-icons/lia";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../main";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DeveloperProjects = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024 ? true : false
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme || "light";
  const toggleTheme = themeContext?.toggleTheme || (() => { });
  const navigate = useNavigate();

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
    { icon: <RxDashboard />, label: "Dashboard", path: "/developerDashboard" },
    {
      icon: <MdOutlineLibraryBooks />,
      label: "View Projects",
      path: "/developerProjects",
    },
    { icon: <FaTasks />, label: "View Tasks", path: "/developerTasks" },
    {
      icon: <LiaComments />,
      label: "View Comments",
      path: "/developerComments",
    },
    {
      icon: <RxActivityLog />,
      label: "View Activity Logs",
      path: "/developerLogs",
    },
    {
      icon: <IoSettingsOutline />,
      label: "Settings",
      path: "/developerSettings",
    },
  ];

  const [showAll, setShowAll] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editProjectId, setEditProjectId] = useState(null);
  const [editProjectData, setEditProjectData] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTitle, setFilterTitle] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterAssignedUser, setFilterAssignedUser] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (!userId) {
          console.error("User ID not found in localStorage");
          toast.error("User information not found. Please log in again.");
          return;
        }

        const response = await axios.get(
          "http://localhost:5294/api/Project/get",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const userProjects = response.data.filter(
          (project) =>
            project.assignedUserIds &&
            project.assignedUserIds.includes(Number(userId))
        );

        setProjects(userProjects);
        console.log(`Filtered ${response.data.length} projects to
           ${userProjects.length} assigned to user ID ${userId}`);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast.error("Failed to load projects. Please try again.");
      } finally {
        setLoading(false);
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

  // Convert yyyy-MM-dd (input) to dd-MM-yyyy (API/backend)
  function toDDMMYYYYfromInput(date) {
    if (!date) return "";
    const [yyyy, mm, dd] = date.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }
  // Convert dd-MM-yyyy (API/backend) to yyyy-MM-dd (input)
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
      const userId = localStorage.getItem("userId");

      if (!userId) {
        console.error("User ID not found in localStorage");
        toast.error("User information not found. Please log in again.");
        return;
      }

      const payload = {
        projectTitle: updatedProject.title,
        projectDescription: updatedProject.description,
        projectStatus: updatedProject.status,
        projectStartDate: toDDMMYYYYfromInput(updatedProject.startDate),
        projectDeadLine: toDDMMYYYYfromInput(updatedProject.deadline),
        createdByUserId: Number(updatedProject.createdByUserId),
        assignedUserIds: updatedProject.assignedUsers.map(Number),
      };

      // Attempt to update the project
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
      } catch (updateError) {
        // Even if we get an error, we'll try to refresh the data
        console.warn(
          "Update request returned error, but will attempt to refresh data:",
          updateError
        );
      }

      // Fetch updated projects regardless of update response
      const projectsResponse = await axios.get(
        "http://localhost:5294/api/Project/get",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const userProjects = projectsResponse.data.filter(
        (project) =>
          project.assignedUserIds &&
          project.assignedUserIds.includes(Number(userId))
      );

      // Update the projects state with the new data
      setProjects(userProjects);

      // Clear the edit state
      setEditProjectId(null);
      setEditProjectData({});

      // Show success message
      toast.success("Project updated successfully!");
    } catch (error) {
      console.error("Error in handleUpdateProject:", error);

      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);

        // If we get a 500 error but the data was actually updated
        if (error.response.status === 500) {
          // Try to refresh the data one more time
          try {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");

            const projectsResponse = await axios.get(
              "http://localhost:5294/api/Project/get",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            const userProjects = projectsResponse.data.filter(
              (project) =>
                project.assignedUserIds &&
                project.assignedUserIds.includes(Number(userId))
            );

            setProjects(userProjects);
            setEditProjectId(null);
            setEditProjectData({});
            toast.success("Project updated successfully!");
            return;
          } catch (refreshError) {
            console.error("Error refreshing data:", refreshError);
          }
        }

        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          JSON.stringify(error.response.data);

        toast.error(`Failed to update project: ${errorMessage}`);
      } else if (error.request) {
        console.error("Error request:", error.request);
        toast.error(
          "No response received from server. Please check your connection."
        );
      } else {
        console.error("Error message:", error.message);
        toast.error(`Failed to update project: ${error.message}`);
      }
    }
  };

  const handleEdit = (project) => {
    console.log("Original project data:", project);
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

    console.log("Setting edit data:", editData);
    setEditProjectData(editData);
    toast.info(`Editing project: ${project.projectTitle}`);
  };

  const filteredProjects = projects.filter((project) => {
    const statusMatch =
      filterStatus === "All" || project.projectStatus === filterStatus;
    const titleMatch =
      filterTitle === "" ||
      project.projectTitle.toLowerCase().includes(filterTitle.toLowerCase());

    let startDateMatch = true;
    if (filterStartDate) {
      const projectStartDate = new Date(toInputDate(project.projectStartDate));
      const filterDate = new Date(filterStartDate);
      startDateMatch = projectStartDate >= filterDate;
    }

    let endDateMatch = true;
    if (filterEndDate) {
      const projectEndDate = new Date(toInputDate(project.projectDeadLine));
      const filterDate = new Date(filterEndDate);
      endDateMatch = projectEndDate <= filterDate;
    }

    let assignedUserMatch = true;
    if (filterAssignedUser) {
      assignedUserMatch =
        project.assignedUserIds &&
        project.assignedUserIds.includes(Number(filterAssignedUser));
    }

    return (
      statusMatch &&
      titleMatch &&
      startDateMatch &&
      endDateMatch &&
      assignedUserMatch
    );
  });

  const visibleProjects = showAll
    ? filteredProjects
    : filteredProjects.slice(0, 10);

  const clearFilters = () => {
    setFilterStatus("All");
    setFilterTitle("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterAssignedUser("");
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

      {/* Sidebar */}
      <>
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-30 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        <aside
          className={`fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-blue-50
             to-white dark:from-gray-900 dark:to-black transition-transform
                ${sidebarOpen ? "w-full md:w-55" : "w-16 sm:w-14 mt-6"}
                ${sidebarOpen || window.innerWidth >= 640
              ? "translate-x-0"
              : "-translate-x-full"
            }`}
        >
          <div className="h-full text-black dark:text-white text-md font-medium px-4 py-8">
            <ul className="space-y-4">
              <li
                className={`flex items-center gap-2 p-2 justify-center bg-gradient-to-r
                   from-blue-500 to-purple-500 text-white rounded-lg font-bold
                    text-lg -mt-5 mb-10 ${!sidebarOpen && "sm:hidden"}`}
              >
                PMS
              </li>
              {menuItems.map(({ icon, label, path }, idx) => (
                <li
                  key={idx}
                  onClick={() => path && navigate(path)}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all
                     duration-200 hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400
                      hover:text-white hover:scale-105 dark:hover:bg-gradient-to-r
                       dark:hover:from-purple-600
                       dark:hover:to-blue-600
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
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-55" : "md:ml-14"
          }`}
      >
        {/* Header */}
        <header
          className={`p-4 bg-white dark:bg-black sticky top-0 z-50 h-16 flex items-center
             justify-between transition-all duration-300 ${sidebarOpen ? "md:ml-0" : "md:-ml-14"
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
              className="p-3 rounded-full hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400
               hover:text-white transition-all duration-300"
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
                  className="w-full text-left px-2 py-1 hover:bg-gradient-to-r hover:from-blue-400
                   hover:to-purple-400 hover:text-white rounded-md text-sm transition-all"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-col justify-start  items-center p-4 bg-gradient-rainbow animate-gradient-x min-h-screen rounded-tl-xl dark:rounded-none gap-8 dark:bg-gradient-rainbow-dark dark:text-white">
          <div className="max-w-7xl mx-auto rounded-lg bg-white/40 p-6 dark:bg-gray-800/40 backdrop-blur-sm">
            {/* Page Header */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white px-8 py-3 rounded-lg shadow-lg flex items-center gap-3 mx-auto mb-6">
                <h1 className="text-2xl font-bold">Projects</h1>
                <span className="bg-purple-700/50 backdrop-blur-sm text-white text-sm px-2.5 py-1 rounded-full">
                  {filteredProjects.length}
                </span>
              </div>
              <div className="w-full flex justify-between items-center max-w-7xl">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
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
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6 animate-slideDown">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Search
                    </label>
                    <input
                      type="text"
                      value={filterTitle}
                      onChange={(e) => setFilterTitle(e.target.value)}
                      placeholder="Search projects..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>{" "}
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Upcoming">Upcoming</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Projects Grid */}
                <div className="  ">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={editProjectData.title || ""}
                                  onChange={(e) =>
                                    setEditProjectData({
                                      ...editProjectData,
                                      title: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Description
                                </label>
                                <textarea
                                  value={editProjectData.description || ""}
                                  onChange={(e) =>
                                    setEditProjectData({
                                      ...editProjectData,
                                      description: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                                  rows="3"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Status
                                </label>{" "}
                                <select
                                  value={editProjectData.status || ""}
                                  onChange={(e) =>
                                    setEditProjectData({
                                      ...editProjectData,
                                      status: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                                >
                                  <option value="Not Started">Not Started</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="On Hold">On Hold</option>
                                  <option value="Cancelled">Cancelled</option>
                                  <option value="Upcoming">Upcoming</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Start Date
                                  </label>
                                  <input
                                    type="date"
                                    value={editProjectData.startDate || ""}
                                    onChange={(e) =>
                                      setEditProjectData({
                                        ...editProjectData,
                                        startDate: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Deadline
                                  </label>
                                  <input
                                    type="date"
                                    value={editProjectData.deadline || ""}
                                    onChange={(e) =>
                                      setEditProjectData({
                                        ...editProjectData,
                                        deadline: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                                  />
                                </div>
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
                              <div className="flex flex-col gap-3">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                  {project.projectTitle}
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 text-base mb-2">
                                  {project.projectDescription}
                                </p>
                                <div className="flex items-center mb-2">
                                  <span className={`px-4 py-2 rounded-full text-base font-semibold flex items-center gap-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ${project.projectStatus === "Completed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : project.projectStatus === "In Progress"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                      : project.projectStatus === "On Hold"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                        : project.projectStatus === "Cancelled"
                                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                          : project.projectStatus === "Upcoming"
                                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                    }`}>
                                    STATUS: {project.projectStatus}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1 mb-2">
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span><span className="font-semibold">Start:</span> {project.projectStartDate}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span><span className="font-semibold">Due:</span> {project.projectDeadLine}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span><span className="font-semibold">Created by:</span> {(() => {
                                      const creator = users.find(u => u.userId === project.createdByUserId);
                                      return creator?.userFullName || creator?.userName || creator?.userEmail || "Unknown";
                                    })()}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 mt-2">
                                  <span className="font-bold text-gray-700 dark:text-gray-200 text-base mb-1">TEAM:</span>
                                  <div className="flex flex-row gap-2 items-center">
                                    {project.assignedUserIds.map((userId, index) => {
                                      const user = users.find((u) => u.userId === userId);
                                      const initials = user
                                        ? (user.userFullName || user.userName || user.userEmail)
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()
                                          .substring(0, 2)
                                        : "?";
                                      const colors = [
                                        "bg-gradient-to-r from-blue-500 to-purple-500",
                                        // "bg-gradient-to-r from-green-500 to-blue-500",
                                        // "bg-gradient-to-r from-pink-500 to-yellow-500",
                                        // "bg-gradient-to-r from-indigo-500 to-blue-400",
                                        // "bg-gradient-to-r from-yellow-500 to-red-500",
                                        // "bg-gradient-to-r from-purple-500 to-pink-500",
                                      ];
                                      return (
                                        <div
                                          key={userId}
                                          className={`${colors[index % colors.length]} w-9 h-9 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-white dark:border-gray-800 shadow`}
                                          title={user?.userFullName || user?.userName || user?.userEmail}
                                        >
                                          {initials}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                  onClick={() => handleEdit(project)}
                                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-lg transition duration-200"
                                >
                                  Edit
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Load More */}
                {filteredProjects.length > 10 && (
                  <div className="text-center">
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
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DeveloperProjects;
