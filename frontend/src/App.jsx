import { useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext';
import { AuthProvider } from './context/AuthProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingLogo from './components/LoadingLogo';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import MovieShowtimes from './pages/MovieShowtimes';
import MovieForm from './pages/MovieForm';
import HallsList from './pages/admin/HallsList';
import HallForm from './pages/admin/HallForm';
import AdminDashboard from './pages/admin/AdminDashboard';
import ShowtimeManagement from './pages/admin/ShowtimeManagement';
import UserManagement from './pages/admin/UserManagement';
import Concession from './pages/concession';
import ConcessionManagement from './pages/admin/concessionmanagement';
import AddSnacks from './pages/admin/addsnacks';
import UpdateSnacks from './pages/admin/updatesnacks';
import NotFound from './pages/notfound';

function AppContent() {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-900">
        <LoadingLogo size={80} text="Loading..." />
      </div>
    );
  }

  // Use React Router to decide which page to show
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/movies" element={<Movies />} />
      <Route path="/movies/new" element={<MovieForm />} />
      <Route path="/movies/:id" element={<MovieDetails />} />
      <Route path="/movies/:id/edit" element={<MovieForm />} />
      <Route path="/movies/:id/showtimes" element={<MovieShowtimes />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/halls" element={<HallsList />} />
      <Route path="/halls/:id" element={<HallForm />} />
      <Route path="/showtime-management" element={<ShowtimeManagement />} />
      <Route path="/user-management" element={<UserManagement />} />
      <Route path="/concession-management" element={<ConcessionManagement />} />
      <Route path="/concessions" element={<Concession />} />
      <Route path="/admin/addsnack" element={<AddSnacks />} />
      <Route path="/admin/updatesnack" element={<UpdateSnacks />} />
      <Route path="*" element={<NotFound />} />
      

    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
