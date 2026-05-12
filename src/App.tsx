import { HashRouter, Routes, Route } from 'react-router-dom';
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
import ManualBuilder from './pages/ManualBuilder';
import ModuleLibrary from './pages/ModuleLibrary';
import TransactionDetail from './pages/TransactionDetail';
import UseCaseDetail from './pages/UseCaseDetail';
import ApprovalGateways from './pages/ApprovalGateways';
import RoleSetup from './pages/RoleSetup';
import RoadmapGenerator from './pages/RoadmapGenerator';
import ManualPreview from './pages/ManualPreview';
import SharedManual from './pages/SharedManual';
import ProjectTracker from './pages/ProjectTracker';
import IssuesTracker from './pages/IssuesTracker';
import Settings from './pages/Settings';
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
            <Route path="/manual-builder" element={<ManualBuilder />} />
            <Route path="/module-library" element={<ModuleLibrary />} />
            <Route path="/transactions/:id" element={<TransactionDetail />} />
            <Route path="/use-cases/:id" element={<UseCaseDetail />} />
            <Route path="/approval-gateways" element={<ApprovalGateways />} />
            <Route path="/role-setup" element={<RoleSetup />} />
            <Route path="/roadmap-generator" element={<RoadmapGenerator />} />
            <Route path="/manual-preview" element={<ManualPreview />} />
            <Route path="/project-tracker" element={<ProjectTracker />} />
            <Route path="/issues-tracker" element={<IssuesTracker />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}
