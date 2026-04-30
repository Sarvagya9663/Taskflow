import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import TaskDetail from './pages/TaskDetail';

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center" style={{height:'100vh'}}><div className="spinner"/></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function Public({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"  element={<Public><Login /></Public>} />
          <Route path="/signup" element={<Public><Signup /></Public>} />
          <Route path="/" element={<Private><Layout /></Private>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"       element={<Dashboard />} />
            <Route path="projects"        element={<Projects />} />
            <Route path="projects/:id"    element={<ProjectDetail />} />
            <Route path="tasks/:id"       element={<TaskDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
