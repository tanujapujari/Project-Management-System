import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import React, { Suspense, lazy } from "react";
import LoginForm from "./components/sign-up-in-form/LoginForm";
import RegisterForm from "./components/sign-up-in-form/RegisterForm";
import ForgotPassword from "./components/password/ForgotPassword";
import ResetPassword from "./components/password/ResetPassword";

const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const ViewAllActivityLogs = lazy(() => import("./components/admin/ViewAllActivityLogs"));
const ProjectManagerDashboard = lazy(() => import("./components/project-manager/ProjectManagerDashboard"));
const DeveloperDashboard = lazy(() => import("./components/developer/DeveloperDashboard"));
const ProjectManagerProjects = lazy(() => import("./components/project-manager/ProjectManagerProjects"));
const AdminComments = lazy(() => import("./components/admin/AdminComments"));
const AdminTasks = lazy(() => import("./components/admin/AdminTasks"));
const AdminProjects = lazy(() => import("./components/admin/AdminProjects"));
const AdminUsers = lazy(() => import("./components/admin/AdminUsers"));
const ProjectManagerTasks = lazy(() => import("./components/project-manager/ProjectManagerTasks"));
const ProjectManagerComments = lazy(() => import("./components/project-manager/ProjectManagerComments"));
const ProjectManagerLogs = lazy(() => import("./components/project-manager/ProjectManagerLogs"));
const DeveloperLogs = lazy(() => import("./components/developer/developerLogs"));
const DeveloperComments = lazy(() => import("./components/developer/developerComments"));
const DeveloperProjects = lazy(() => import("./components/developer/developerProjects"));
const DeveloperTasks = lazy(() => import("./components/developer/developerTasks"));
const ProjectManagerTeams = lazy(() => import("./components/project-manager/ProjectManagerTeams"));
const Settings = lazy(() => import("./components/Settings"));
const DeveloperSettings = lazy(() => import("./components/developer/DeveloperSettings"));
const PMSettings = lazy(() => import("./components/project-manager/PMSettings"));

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</div>}>
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
          <Route path="/projectManagerDashboard" element={<ProjectManagerDashboard />} />
          <Route path="/projectManagerProjects" element={<ProjectManagerProjects />} />
          <Route path="/projectManagerTasks" element={<ProjectManagerTasks />} />
          <Route path="/projectManagerComments" element={<ProjectManagerComments />} />
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
      </Suspense>
    </Router>
  );
}

export default App;
