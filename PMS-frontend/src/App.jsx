import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginForm from "./components/sign-up-in-form/LoginForm";
import RegisterForm from "./components/sign-up-in-form/RegisterForm";
import ForgotPassword from "./components/password/ForgotPassword";
import ResetPassword from "./components/password/ResetPassword";
import AdminDashboard from "./components/admin/AdminDashboard";
import ViewAllActivityLogs from "./components/admin/ViewAllActivityLogs";
import ProjectManagerDashboard from "./components/project-manager/ProjectManagerDashboard";
import DeveloperDashboard from "./components/developer/DeveloperDashboard";
import ProjectManagerProjects from "./components/project-manager/ProjectManagerProjects";
import AdminComments from "./components/admin/AdminComments";
import AdminTasks from "./components/admin/AdminTasks";
import AdminProjects from "./components/admin/AdminProjects";
import AdminUsers from "./components/admin/AdminUsers";
import ProjectManagerTasks from "./components/project-manager/ProjectManagerTasks";
import ProjectManagerComments from "./components/project-manager/ProjectManagerComments";
import ProjectManagerLogs from "./components/project-manager/ProjectManagerLogs";
import DeveloperLogs from "./components/developer/DeveloperLogs";
import DeveloperComments from "./components/developer/DeveloperComments";
import DeveloperProjects from "./components/developer/DeveloperProjects";
import DeveloperTasks from "./components/developer/DeveloperTasks";
import ProjectManagerTeams from "./components/project-manager/ProjectManagerTeams";
import Settings from "./components/Settings";
import DeveloperSettings from "./components/developer/DeveloperSettings";
import PMSettings from "./components/project-manager/PMSettings";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/resetPassword" element={<ResetPassword />} />
        <Route path="/adminDashboard" element={<AdminDashboard />} />
        <Route path="/allUsers" element={<AdminUsers />} />
        <Route path="/allProjects" element={<AdminProjects />} />
        <Route path="/allTasks" element={<AdminTasks />} />
        <Route path="/allComments" element={<AdminComments />} />
        <Route
          path="/projectManagerDashboard"
          element={<ProjectManagerDashboard />}
        />
        <Route
          path="/projectManagerProjects"
          element={<ProjectManagerProjects />}
        />
        <Route path="/projectManagerTasks" element={<ProjectManagerTasks />} />
        <Route
          path="/projectManagerComments"
          element={<ProjectManagerComments />}
        />
        <Route path="/projectManagerTeams" element={<ProjectManagerTeams />} />
        <Route path="/projectManagerLogs" element={<ProjectManagerLogs />} />
        <Route path="/developerDashboard" element={<DeveloperDashboard />} />
        <Route path="/developerLogs" element={<DeveloperLogs />} />
        <Route path="/developerComments" element={<DeveloperComments />} />
        <Route path="/developerProjects" element={<DeveloperProjects />} />
        <Route path="/developerTasks" element={<DeveloperTasks />} />
        <Route path="/allLogs" element={<ViewAllActivityLogs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/projectManagerSettings" element={<PMSettings />} />
        <Route path="/developerSettings" element={<DeveloperSettings />} />
      </Routes>
    </Router>
  );
}

export default App;
