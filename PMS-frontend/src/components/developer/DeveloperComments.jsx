import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DeveloperComments = () => {
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== "undefined" && window.innerWidth >= 1024 ? true : false
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [comments, setComments] = useState([]);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editContent, setEditContent] = useState({
    commentContent: "",
    taskItemId: "",
    projectId: "",
    commentedById: "",
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCommentData, setNewCommentData] = useState({
    commentContent: "",
    taskItemId: "",
    projectId: "",
    commentedById: "",
    createdAt: new Date().toISOString(),
  });

  // Filter states
  const [filterContent, setFilterContent] = useState("");
  const [filterTask, setFilterTask] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [commentType, setCommentType] = useState("task");

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

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedUserName = localStorage.getItem("userName");
    const storedUserId = localStorage.getItem("userId");

    if (storedRole) {
      setRole(storedRole);
    }

    if (storedUserName) {
      setUserName(storedUserName);
    }

    // Set initial commentedById if we have userId
    if (storedUserId) {
      setNewCommentData((prev) => ({
        ...prev,
        commentedById: storedUserId,
      }));
    }
  }, []);

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
        const formattedUsers = response.data.map((user) => ({
          ...user,
          userFullName: user.userFullName || user.userName || "No name",
          userEmail: user.userEmail || "No email",
          userRole: user.userRole || "No role",
          department: user.department || "No department",
        }));
        setUsers(formattedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to fetch users");
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5294/Task/get", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const formattedTasks = response.data.map((task) => ({
          ...task,
          taskTitle: task.taskTitle || "Untitled",
          taskDescription: task.taskDescription || "No description",
          taskPriority: task.taskPriority || "Not set",
          taskStatus: task.taskStatus || "Not set",
        }));
        setTasks(formattedTasks);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        toast.error("Failed to fetch tasks");
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5294/api/Project/get",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProjects(response.data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        if (error.response) {
          console.error("Error response:", error.response.data);
          console.error("Status code:", error.response.status);
          toast.error(
            `Failed to fetch projects: ${error.response.status} - ${error.response.data}`
          );
        } else if (error.request) {
          console.error("No response received:", error.request);
          toast.error("Failed to fetch projects: No response received");
        } else {
          console.error("Error setting up request:", error.message);
          toast.error(`Failed to fetch projects: ${error.message}`);
        }
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5294/Comment/get-all",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setComments(response.data);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
        toast.error("Failed to fetch comments");
      }
    };
    fetchComments();
  }, []);

  useEffect(() => {
    const currentUser = users.find((user) => user.userName === userName);
    if (currentUser) {
      setNewCommentData((prev) => ({
        ...prev,
        commentedById: String(currentUser.userId),
      }));
    }
  }, [userName, users]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("User information not found. Please log in again.");
      return;
    }
    if (
      !newCommentData.commentContent ||
      (commentType === "task" && !newCommentData.taskItemId) ||
      (commentType === "project" && !newCommentData.projectId)
    ) {
      toast.warning("Please fill in all fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      let taskItemId = null;
      let projectId = null;

      if (commentType === "task" && newCommentData.taskItemId) {
        taskItemId = parseInt(newCommentData.taskItemId);
        if (isNaN(taskItemId)) {
          toast.error("Invalid task ID");
          return;
        }
      }

      if (commentType === "project" && newCommentData.projectId) {
        projectId = parseInt(newCommentData.projectId);
        if (isNaN(projectId)) {
          toast.error("Invalid project ID");
          return;
        }
      }

      let createdAt;
      try {
        const date = newCommentData.createdAt
          ? new Date(newCommentData.createdAt)
          : new Date();

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        createdAt = `${day}-${month}-${year}`;
      } catch (error) {
        console.error("Date formatting error:", error);
        toast.error("Invalid date format");
        return;
      }

      const payload = {
        commentContent: newCommentData.commentContent.trim(),
        taskItemId: taskItemId,
        projectId: projectId,
        commentedById: parseInt(userId),
        commentedByName: userName,
        createdAt: createdAt,
      };

      console.log("Sending payload:", payload);

      await axios.post("http://localhost:5294/Comment/create", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setShowCreateForm(false);
      setNewCommentData({
        commentContent: "",
        taskItemId: "",
        projectId: "",
        commentedById: userId,
        createdAt: new Date().toISOString(),
      });

      const commentsResponse = await axios.get(
        "http://localhost:5294/Comment/get-all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments(commentsResponse.data);
      toast.success("Comment created successfully!");
    } catch (error) {
      console.error("Create comment error:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        toast.error(
          "Failed to create comment: " + (error.response.data || error.message)
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        toast.error("No response from server. Please check your connection.");
      } else {
        console.error("Error setting up request:", error.message);
        toast.error("Failed to create comment: " + error.message);
      }
    }
  };

  const handleUpdateComment = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        commentContent: editContent.commentContent,
        taskItemId: editContent.taskItemId
          ? Number(editContent.taskItemId)
          : null,
        projectId: editContent.projectId ? Number(editContent.projectId) : null,
        commentedById: Number(editContent.commentedById),
      };

      await axios.put(
        `http://localhost:5294/Comment/update/${editCommentId}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const response = await axios.get(
        "http://localhost:5294/Comment/get-all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments(response.data);

      setEditCommentId(null);
      setEditContent({
        commentContent: "",
        taskItemId: "",
        projectId: "",
        commentedById: "",
      });
      toast.success("Comment updated successfully!");
    } catch (error) {
      console.error("Update comment error:", error);
      toast.error("Failed to update comment: " + error.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `http://localhost:5294/Comment/delete/${commentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setComments((prev) =>
          prev.filter((comment) => comment.commentId !== commentId)
        );
        toast.success("Comment deleted successfully!");
      } catch (error) {
        console.error("Failed to delete comment:", error);
        toast.error("Failed to delete comment: " + error.message);
      }
    }
  };

  const handleEdit = (comment) => {
    setEditCommentId(comment.commentId);
    setEditContent({
      commentContent: comment.commentContent,
      taskItemId: comment.taskItemId || "",
      projectId: comment.projectId || "",
      commentedById: comment.commentedById,
    });
  };

  const clearFilters = () => {
    setFilterContent("");
    setFilterTask("");
    setFilterProject("");
    setFilterUser("");
    setFilterDate("");
  };

  const getFilteredComments = () => {
    return comments.filter((comment) => {
      const contentMatch =
        filterContent === "" ||
        comment.commentContent
          .toLowerCase()
          .includes(filterContent.toLowerCase());

      const taskMatch =
        filterTask === "" || comment.taskItemId === Number(filterTask);

      const projectMatch =
        filterProject === "" || comment.projectId === Number(filterProject);

      const userMatch =
        filterUser === "" || comment.commentedById === Number(filterUser);

      const dateMatch =
        filterDate === "" ||
        formatDate(comment.createdAt) === formatDate(filterDate);

      return (
        contentMatch && taskMatch && projectMatch && userMatch && dateMatch
      );
    });
  };

  const visibleComments = showAll
    ? getFilteredComments()
    : getFilteredComments().slice(0, 10);

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "N/A";
      if (
        typeof dateString === "string" &&
        dateString.match(/^\d{2}-\d{2}-\d{4}$/)
      ) {
        return dateString;
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Toast Container */}
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
            ${sidebarOpen ? "w-full md:w-55" : "w-16 sm:w-14 mt-6"}`}
        >
          <div className="h-full text-black dark:text-white text-md font-medium px-4 py-8 overflow-y-auto">
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
                    className={`whitespace-nowrap ${!sidebarOpen && "hidden sm:hidden"}`}
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
              <FaAngleDown
                className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""
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
          <div className="w-full p-6 space-y-4 bg-white/40 dark:bg-black/50 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                <MdOutlineLibraryBooks className="w-6 h-6" />
                <h1 className="text-2xl font-bold">All Comments</h1>
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
                    <span className="text-lg">×</span> Close
                  </>
                ) : (
                  <>
                    <span className="text-lg">+</span> Create Comment
                  </>
                )}
              </button>
            </div>

            {/* Filter Section */}
            {showFilters && (
              <div className="mb-6 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Filter Comments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Content Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Comment Content
                    </label>
                    <input
                      type="text"
                      value={filterContent}
                      onChange={(e) => setFilterContent(e.target.value)}
                      placeholder="Search in content..."
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    />
                  </div>

                  {/* Task Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Task
                    </label>
                    <select
                      value={filterTask}
                      onChange={(e) => setFilterTask(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    >
                      <option key="all-tasks" value="">
                        All Tasks
                      </option>
                      {tasks.map((task) => (
                        <option key={task.taskItemId} value={task.taskItemId}>
                          {task.taskTitle}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Project Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project
                    </label>
                    <select
                      value={filterProject}
                      onChange={(e) => setFilterProject(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    >
                      <option key="all-projects" value="">
                        All Projects
                      </option>
                      {projects.length > 0 ? (
                        projects.map((project) => (
                          <option
                            key={project.projectId}
                            value={project.projectId}
                          >
                            {project.projectTitle}{" "}
                            {project.projectStatus &&
                              `(${project.projectStatus})`}
                          </option>
                        ))
                      ) : (
                        <option key="loading-projects-filter" value="" disabled>
                          Loading projects...
                        </option>
                      )}
                    </select>
                  </div>

                  {/* User Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Commented By
                    </label>
                    <select
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    >
                      <option key="all-users" value="">
                        All Users
                      </option>
                      {users.map((user) => (
                        <option key={user.userId} value={user.userId}>
                          {user.userFullName || user.userName || user.userEmail}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Comment Date
                    </label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    />
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex items-end">
                    <button
                      type="button"
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
                onSubmit={handleCreateComment}
                className="space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 text-black dark:text-white p-6 rounded-lg mb-4 shadow-lg"
              >
                <h2 className="text-center text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                  Create Developer Comment
                </h2>

                {/* Comment Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Comment Type
                  </label>
                  <select
                    value={commentType}
                    onChange={(e) => setCommentType(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                  >
                    <option key="task-comment" value="task">
                      Task Comment
                    </option>
                    <option key="project-comment" value="project">
                      Project Comment
                    </option>
                  </select>
                </div>

                {/* Comment Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Comment
                  </label>
                  <textarea
                    value={newCommentData.commentContent}
                    onChange={(e) =>
                      setNewCommentData((prev) => ({
                        ...prev,
                        commentContent: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                    required
                  ></textarea>
                </div>

                {/* Select Task or Project */}
                {commentType === "task" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Related Task
                    </label>
                    <select
                      value={newCommentData.taskItemId}
                      onChange={(e) =>
                        setNewCommentData((prev) => ({
                          ...prev,
                          taskItemId: e.target.value,
                        }))
                      }
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                      required
                    >
                      <option key="select-task" value="">
                        Select Task
                      </option>
                      {tasks.map((task) => (
                        <option key={task.taskItemId} value={task.taskItemId}>
                          {task.taskTitle}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Related Project
                    </label>
                    <select
                      value={newCommentData.projectId}
                      onChange={(e) =>
                        setNewCommentData((prev) => ({
                          ...prev,
                          projectId: e.target.value,
                        }))
                      }
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                      required
                    >
                      <option key="select-project" value="">
                        Select Project
                      </option>
                      {projects.length > 0 ? (
                        projects.map((project) => (
                          <option
                            key={project.projectId}
                            value={project.projectId}
                          >
                            {project.projectTitle}{" "}
                            {project.projectStatus &&
                              `(${project.projectStatus})`}
                          </option>
                        ))
                      ) : (
                        <option key="loading-projects-create" value="" disabled>
                          Loading projects...
                        </option>
                      )}
                    </select>
                    {projects.length === 0 && (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                        No projects available. Please wait or contact your
                        administrator.
                      </p>
                    )}
                  </div>
                )}

                {/* Select User */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Commented By
                  </label>
                  <input
                    type="text"
                    value={userName}
                    readOnly
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                  <input
                    type="hidden"
                    name="commentedById"
                    value={
                      users.find((user) => user.userName === userName)
                        ?.userId || ""
                    }
                  />
                </div>

                {/* Created At - User selectable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Created At
                  </label>
                  <input
                    type="date"
                    value={
                      newCommentData.createdAt
                        ? new Date(newCommentData.createdAt)
                          .toISOString()
                          .split("T")[0]
                        : new Date().toISOString().split("T")[0]
                    }
                    onChange={(e) =>
                      setNewCommentData((prev) => ({
                        ...prev,
                        createdAt: e.target.value,
                      }))
                    }
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select the date for this comment.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium"
                >
                  Submit Comment
                </button>
              </form>
            )}

            <section className="w-full">
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border border-black dark:border-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      <th className="border border-black dark:border-white p-2">
                        ID
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Content
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Type
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Related To
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Author
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Created At
                      </th>
                      <th className="border border-black dark:border-white p-2">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-medium">
                    {visibleComments.map((comment, index) => (
                      <tr
                        key={comment.commentId}
                        className={`${index % 2 === 0 ? "bg-white" : "bg-blue-50"
                          } hover:bg-blue-100 dark:bg-black/50 dark:hover:bg-purple-800/30`}
                      >
                        <td className="border border-black dark:border-white p-2">
                          {comment.commentId}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {editCommentId === comment.commentId ? (
                            <div className="flex gap-2 items-center">
                              <textarea
                                value={editContent.commentContent}
                                onChange={(e) =>
                                  setEditContent((prev) => ({
                                    ...prev,
                                    commentContent: e.target.value,
                                  }))
                                }
                                className="border border-gray-300 dark:border-gray-600 p-1 rounded w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]"
                              />
                              <button
                                onClick={handleUpdateComment}
                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded hover:from-green-600 hover:to-green-700 transition-all duration-300"
                              >
                                Update
                              </button>
                              <button
                                onClick={() => setEditCommentId(null)}
                                className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1 rounded hover:from-gray-500 hover:to-gray-600 transition-all duration-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            comment.commentContent
                          )}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {comment.taskItemId ? "Task" : "Project"}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {comment.taskItemId
                            ? tasks.find(
                              (t) => t.taskItemId === comment.taskItemId
                            )?.taskTitle || "Unknown Task"
                            : projects.find(
                              (p) => p.projectId === comment.projectId
                            )?.projectTitle || "Unknown Project"}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {comment.commentedByName}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {formatDate(comment.createdAt)}
                        </td>
                        <td className="border border-black dark:border-white p-2">
                          {editCommentId !== comment.commentId && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(comment)}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteComment(comment.commentId)
                                }
                                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded hover:from-red-600 hover:to-red-700 transition-all duration-300"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!showAll && getFilteredComments().length > 10 && (
                  <button
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                    onClick={() => setShowAll(true)}
                  >
                    Show All {getFilteredComments().length}{" "}
                    {filterContent || filterProject || filterTask || filterUser
                      ? "Filtered"
                      : ""}{" "}
                    Comments
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

export default DeveloperComments;
