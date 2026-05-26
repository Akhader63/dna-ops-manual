import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SetPassword from './pages/SetPassword';
import VerifyEmail from './pages/VerifyEmail';
import TwoFactorSetup from './pages/TwoFactorSetup';
import TwoFactorVerify from './pages/TwoFactorVerify';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import ManualBuilder from './pages/ManualBuilder';
import TransactionDetail from './pages/TransactionDetail';
import UseCaseDetail from './pages/UseCaseDetail';
import RoleSetup from './pages/RoleSetup';
import RoadmapGenerator from './pages/RoadmapGenerator';
import ManualPreview from './pages/ManualPreview';
import SharedManual from './pages/SharedManual';
import ProjectTracker from './pages/ProjectTracker';
import IssuesTracker from './pages/IssuesTracker';
import SettingsIndex from './pages/SettingsIndex';
import SettingsGeneral from './pages/settings/SettingsGeneral';
import SettingsUsers from './pages/settings/SettingsUsers';
import SettingsVariables from './pages/settings/SettingsVariables';
import SettingsModules from './pages/settings/SettingsModules';
import SettingsNotifications from './pages/settings/SettingsNotifications';
import SettingsAuditLog from './pages/settings/SettingsAuditLog';
import SettingsSMTP from './pages/settings/SettingsSMTP';
import SettingsModuleLibrary from './pages/settings/SettingsModuleLibrary';
import SettingsApprovalGateways from './pages/settings/SettingsApprovalGateways';
import Profile from './pages/Profile';
import DebugAuth from './pages/DebugAuth';
import EnvCheck from './pages/EnvCheck';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/debug-auth" element={<DebugAuth />} />
        <Route path="/env-check" element={<EnvCheck />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/2fa-setup" element={<TwoFactorSetup />} />
        <Route path="/2fa-verify" element={<TwoFactorVerify />} />
        <Route path="/shared/:token" element={<SharedManual />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/manual-builder" element={<ManualBuilder />} />
            <Route path="/transactions/:id" element={<TransactionDetail />} />
            <Route path="/use-cases/:id" element={<UseCaseDetail />} />
            <Route path="/role-setup" element={<RoleSetup />} />
            <Route path="/roadmap-generator" element={<RoadmapGenerator />} />
            <Route path="/manual-preview" element={<ManualPreview />} />
            <Route path="/project-tracker" element={<ProjectTracker />} />
            <Route path="/issues-tracker" element={<IssuesTracker />} />

            {/* Settings Routes */}
            <Route path="/settings" element={<SettingsIndex />} />
            <Route path="/settings/general" element={<SettingsGeneral />} />
            <Route path="/settings/users" element={<SettingsUsers />} />
            <Route path="/settings/variables" element={<SettingsVariables />} />
            <Route path="/settings/modules" element={<SettingsModules />} />
            <Route path="/settings/notifications" element={<SettingsNotifications />} />
            <Route path="/settings/audit-log" element={<SettingsAuditLog />} />
            <Route path="/settings/smtp" element={<SettingsSMTP />} />
            <Route path="/settings/module-library" element={<SettingsModuleLibrary />} />
            <Route path="/settings/approval-gateways" element={<SettingsApprovalGateways />} />

            {/* Redirects for old routes */}
            <Route path="/module-library" element={<Navigate to="/settings/module-library" replace />} />
            <Route path="/approval-gateways" element={<Navigate to="/settings/approval-gateways" replace />} />

            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}
