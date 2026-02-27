import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";

// Helper functions
const getActionText = (action, details) => {
  // Add other specific actions as needed
  if (action === "comment") {
    if (details.includes("reacted to comment")) return "reacted to comment";
    if (details.includes("resolved comment")) return "resolved comment";
    if (details.includes("unresolved comment")) return "unresolved comment";
  }
  // Generic action text generation if no specific match
  return action
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
};

const getActionColor = (action) => {
  switch (action) {
    case "created":
      return "green";
    case "deleted":
      return "red";
    case "updated":
      return "blue";
    case "comment":
      return "purple"; // Example color for comments
    case "reacted to comment":
      return "purple";
    case "resolved comment":
      return "green";
    case "unresolved comment":
      return "orange";
    // Add more cases for other actions
    default:
      return "gray";
  }
};

const formatTimestamp = (timestamp) => {
  try {
    // Assuming timestamp is an ISO 8601 string or similar parsable format
    return format(new Date(timestamp), "dd-MM-yyyy");
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Invalid Date";
  }
};

const DeveloperDashboard = () => {
  const [taskSummary, setTaskSummary] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
  });
  const [projectSummary, setProjectSummary] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]); // Add state for projects
  const [tasks, setTasks] = useState([]); // Add state for tasks

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Assuming currentUser is stored here

    if (!token) {
      setError("Authentication token not found. Please log in.");
      setIsLoading(false);
      return;
    }

    try {
      // Fetch projects assigned to the current user
      const projectsResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/projects`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const allProjects = projectsResponse.data;
      // Filter projects to only include those assigned to the current user
      const userProjects = allProjects.filter((project) =>
        project.assignedUserIds.includes(currentUser._id),
      );
      setProjects(userProjects);

      // Fetch tasks assigned to the current user
      const tasksResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/tasks`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const allTasks = tasksResponse.data;
      // Filter tasks to only include those assigned to the current user
      const userTasks = allTasks.filter((task) =>
        task.assignedUserIds.includes(currentUser._id),
      );
      setTasks(userTasks);

      // Fetch activity logs
      const logsResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/activity-logs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Filter logs to include only logs related to projects the user is assigned to
      const projectIds = userProjects.map((project) => project._id);
      const userActivityLogs = logsResponse.data.filter((log) =>
        projectIds.includes(log.projectId),
      );
      setActivityLogs(userActivityLogs);

      // Calculate task summary for user's tasks
      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(
        (task) => task.status === "Completed",
      ).length;
      const inProgressTasks = userTasks.filter(
        (task) => task.status === "In Progress",
      ).length;
      const todoTasks = userTasks.filter(
        (task) => task.status === "To Do",
      ).length;

      setTaskSummary({
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: todoTasks,
      });

      // Calculate project summary for user's projects
      const totalProjects = userProjects.length;
      const completedProjects = userProjects.filter(
        (project) => project.status === "Completed",
      ).length;
      const inProgressProjects = userProjects.filter(
        (project) => project.status === "In Progress",
      ).length;
      const todoProjects = userProjects.filter(
        (project) => project.status === "To Do",
      ).length;

      setProjectSummary({
        total: totalProjects,
        completed: completedProjects,
        inProgress: inProgressProjects,
        todo: todoProjects,
      });
    } catch (err) {
      setError("Failed to fetch data.");
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Developer Dashboard</h2>

      {isLoading && <p>Loading dashboard data...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!isLoading && !error && (
        <>
          {/* Task and Project Summary Widgets */}
          <div className="flex space-x-4 mb-6">
            {/* Task Summary Widget */}
            <div className="bg-white p-4 rounded shadow-md flex-1">
              <h3 className="text-xl font-semibold mb-2">Your Task Summary</h3>
              <p>Total Tasks: {taskSummary.total}</p>
              <p>Completed Tasks: {taskSummary.completed}</p>
              <p>In Progress Tasks: {taskSummary.inProgress}</p>
              <p>To Do Tasks: {taskSummary.todo}</p>
            </div>

            {/* Project Summary Widget */}
            <div className="bg-white p-4 rounded shadow-md flex-1">
              <h3 className="text-xl font-semibold mb-2">
                Your Project Summary
              </h3>
              <p>Total Projects: {projectSummary.total}</p>
              <p>Completed Projects: {projectSummary.completed}</p>
              <p>In Progress Projects: {projectSummary.inProgress}</p>
              <p>To Do Projects: {projectSummary.todo}</p>
            </div>
          </div>

          {/* Recent Activity Widget */}
          <div className="bg-white p-4 rounded shadow-md">
            <h3 className="text-xl font-semibold mb-4">
              Recent Activity (Your Projects)
            </h3>
            {activityLogs.length > 0 ?
              <ul className="divide-y divide-gray-200">
                {activityLogs.map((log) => (
                  <li key={log._id} className="py-3">
                    <p>
                      <span className="font-semibold">
                        {log.user?.username || "Unknown User"}
                      </span>
                      <span
                        className={`ml-1 text-${getActionColor(log.action)}-600`}
                      >
                        {getActionText(log.action, log.details)}
                      </span>
                      <span className="ml-1 font-semibold">
                        {log.projectTitle}
                      </span>
                      <span className="ml-2 text-gray-500 text-sm">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </p>
                    {log.formattedDetails && (
                      <p className="text-gray-600 text-sm mt-1">
                        {log.formattedDetails}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            : <p>No recent activity found for your projects.</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default DeveloperDashboard;
