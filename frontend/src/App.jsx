import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/Toast';
import { Sidebar } from './components/Layout';
import LoginPage            from './pages/LoginPage';
import DashboardPage        from './pages/DashboardPage';
import TeacherProjectsPage  from './pages/TeacherProjectsPage';
import TeacherPlanningPage  from './pages/TeacherPlanningPage';
import TeacherGroupsPage    from './pages/TeacherGroupsPage';
import StudentProjectsPage  from './pages/StudentProjectsPage';
import StudentGroupsPage    from './pages/StudentGroupsPage';
import { StudentSoutenancePage, StudentSchedulePage, StudentNewsPage } from './pages/StudentStaticPages';
import './index.css';

function Shell({ children }) {
  return (
    <div className="shell">
      <Sidebar/>
      <div className="main">{children}</div>
    </div>
  );
}

function Guard({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div className="spinner"/>
    </div>
  );
  if (!user) return <Navigate to="/login" replace/>;
  if (role && user.role !== role && user.role !== 'admin')
    return <Navigate to="/dashboard" replace/>;
  return children;
}

const T = ({c}) => <Guard role="teacher"><Shell>{c}</Shell></Guard>;
const S = ({c}) => <Guard role="student"><Shell>{c}</Shell></Guard>;
const A = ({c}) => <Guard><Shell>{c}</Shell></Guard>;

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition:true, v7_relativeSplatPath:true }}>
          <Routes>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/dashboard"           element={<A c={<DashboardPage/>}/>}/>
            <Route path="/teacher/projects"    element={<T c={<TeacherProjectsPage/>}/>}/>
            <Route path="/teacher/planning"    element={<T c={<TeacherPlanningPage/>}/>}/>
            <Route path="/teacher/groups"      element={<T c={<TeacherGroupsPage/>}/>}/>
            <Route path="/student/projects"    element={<S c={<StudentProjectsPage/>}/>}/>
            <Route path="/student/groups"      element={<S c={<StudentGroupsPage/>}/>}/>
            <Route path="/student/soutenance"  element={<S c={<StudentSoutenancePage/>}/>}/>
            <Route path="/student/schedule"    element={<S c={<StudentSchedulePage/>}/>}/>
            <Route path="/student/news"        element={<S c={<StudentNewsPage/>}/>}/>
            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
            <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
