import { useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { AuthProvider } from './context/AuthProvider';
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

function AppContent() {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-900">
        <div className="text-2xl text-text-primary">Loading...</div>
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
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
