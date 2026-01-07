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
import HallsList from './pages/HallsList';
import HallForm from './pages/HallForm';

function AppContent() {
  const { loading } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState("home");

  useEffect(() => {
    // Simple routing based on URL
    const handleRouteChange = () => {
      const path = window.location.pathname;
      if (path === '/login') setCurrentPage('login');
      else if (path === '/register') setCurrentPage('register');
      else if (path === '/profile') setCurrentPage('profile');
      else if (path === '/movies') setCurrentPage('movies');
      else if (path.startsWith('/movies/') && path.includes('/showtimes')) {
        // Handle /movies/:id/showtimes routes
        setCurrentPage('movie-showtimes');
      }
      else if (path.startsWith('/movies/') && path.split('/').length >= 3) {
        // Handle /movies/:id routes
        setCurrentPage('movie-details');
      }
      else if (path === '/cinemas') setCurrentPage('cinemas');
      else if (path === '/concessions') setCurrentPage('concessions');
      else setCurrentPage('home');
    };

    handleRouteChange();
    window.addEventListener("popstate", handleRouteChange);

    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  // Override history for navigation
  useEffect(() => {
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      const newPath = args[2];
      if (newPath === '/login') setCurrentPage('login');
      else if (newPath === '/register') setCurrentPage('register');
      else if (newPath === '/profile') setCurrentPage('profile');
      else if (newPath === '/movies') setCurrentPage('movies');
      else if (newPath.startsWith('/movies/') && newPath.includes('/showtimes')) {
        setCurrentPage('movie-showtimes');
      }
      else if (newPath.startsWith('/movies/') && newPath.split('/').length >= 3) {
        setCurrentPage('movie-details');
      }
      else if (newPath === '/cinemas') setCurrentPage('cinemas');
      else if (newPath === '/concessions') setCurrentPage('concessions');
      else setCurrentPage('home');
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-900">
        <div className="text-2xl text-text-primary">Loading...</div>
      </div>
    );
  }

  // Let React Router decide which page to show
  return (
    <>
      {currentPage === 'login' && <Login />}
      {currentPage === 'register' && <Register />}
      {currentPage === 'movies' && <Movies />}
      {currentPage === 'movie-details' && <MovieDetails />}
      {currentPage === 'movie-showtimes' && <MovieShowtimes />}
      {currentPage === 'profile' && <Profile />}
      {currentPage === 'cinemas' && <div className="min-h-screen bg-background-900"><div className="text-center py-20 text-text-primary">Cinemas page coming soon...</div></div>}
      {currentPage === 'concessions' && <div className="min-h-screen bg-background-900"><div className="text-center py-20 text-text-primary">Concessions page coming soon...</div></div>}
      {currentPage === 'home' && <Home />}
    </>
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
