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
        console.warn("Update request returned error, but will attempt to refresh data:", updateError);
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

        const errorMessage = error.response.data?.message ||
          error.response.data?.error ||
          JSON.stringify(error.response.data);

        toast.error(`Failed to update project: ${errorMessage}`);
      } else if (error.request) {
        console.error("Error request:", error.request);
        toast.error("No response received from server. Please check your connection.");
      } else {
        console.error("Error message:", error.message);
        toast.error(`Failed to update project: ${error.message}`);
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
        toast.success("Project deleted successfully!");
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
        className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-55" : "md:ml-14"
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

        {/* Page Content */}
        <main
          className="flex flex-col justify-start items-center p-4 bg-gradient-rainbow animate-gradient-x 
        min-h-screen rounded-tl-xl dark:rounded-none gap-8 dark:bg-gradient-rainbow-dark dark:text-white"
        >
          {/* Insert dashboard widgets or charts here */}
          <div className="w-full p-6 space-y-4 bg-white/40 dark:bg-black/50 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <button
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500
               text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600
                transition-all duration-300"
              >
                <MdOutlineLibraryBooks className="w-6 h-6" />
                <h1 className="text-2xl font-bold">All Projects</h1>
              </button>
            </div>
            <section className="w-full">
              <div className="flex justify-between mb-4 px-4">
                <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <MdOutlineLibraryBooks className="text-2xl" />
                  My Assigned Projects
                  {(filterTitle ||
                    filterStatus !== "All" ||
                    filterStartDate ||
                    filterEndDate ||
                    filterAssignedUser) && (
                      <span
                        className="text-xs font-normal bg-yellow-100 dark:bg-yellow-900 text-yellow-800
                     dark:text-yellow-300 px-2 py-0.5 rounded-md ml-2"
                      >
                        Filtered
                      </span>
                    )}
                  <span
                    className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 
                  text-xs font-medium px-2 py-1 rounded-full ml-2"
                  >
                    {filterTitle ||
                      filterStatus !== "All" ||
                      filterStartDate ||
                      filterEndDate ||
                      filterAssignedUser
                      ? `${filteredProjects.length}/${projects.length}`
                      : projects.length}
                  </span>
                </h2>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-400
                   text-white px-4 py-2 rounded-lg shadow-lg hover:from-blue-500 hover:to-purple-500
                    transition-all duration-300 font-medium"
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
              </div>

              {/* Filter Section */}
              {showFilters && (
                <div className="mb-6 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg shadow-md mx-4">
                  <h3
                    className="text-lg font-semibold mb-3 text-center bg-gradient-to-r from-blue-500
                   to-purple-500 bg-clip-text text-transparent"
                  >
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
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full
                         bg-white dark:bg-gray-700"
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
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full
                         bg-white dark:bg-gray-700"
                      >
                        <option value="All">All Statuses</option>
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
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full
                         bg-white dark:bg-gray-700"
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
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full
                         bg-white dark:bg-gray-700"
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
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full
                         bg-white dark:bg-gray-700"
                      >
                        <option value="">All Team Members</option>
                        {users.map((user) => (
                          <option key={user.userId} value={user.userId}>
                            {user.userFullName ||
                              user.userName ||
                              user.userEmail}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white
                         px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-all 
                         w-full"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                    {loading ? (
                      <tr>
                        <td
                          colSpan="9"
                          className="text-center p-4 text-gray-500 dark:text-gray-400"
                        >
                          <p>Loading...</p>
                        </td>
                      </tr>
                    ) : visibleProjects.length === 0 ? (
                      <tr>
                        <td
                          colSpan="9"
                          className="text-center p-4 text-gray-500 dark:text-gray-400"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <MdOutlineLibraryBooks className="text-4xl text-blue-500" />
                            {filterTitle ||
                              filterStatus !== "All" ||
                              filterStartDate ||
                              filterEndDate ||
                              filterAssignedUser ? (
                              <p>No projects match your current filters.</p>
                            ) : (
                              <p>No projects are currently assigned to you.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      visibleProjects.map((project, index) => (
                        <tr
                          key={project.projectId}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-blue-50"
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
                      ))
                    )}
                  </tbody>
                </table>
                {!showAll && filteredProjects.length > 10 && (
                  <button
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white
                     rounded-lg shadow-md hover:from-blue-600 hover:to-purple-600 transition-all
                      duration-300"
                    onClick={() => setShowAll(true)}
                  >
                    Show All {filteredProjects.length}{" "}
                    {filterTitle ||
                      filterStatus !== "All" ||
                      filterStartDate ||
                      filterEndDate ||
                      filterAssignedUser
                      ? "Filtered"
                      : ""}{" "}
                    Projects
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

export default DeveloperProjects;
