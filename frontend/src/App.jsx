import { useContext } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthProvider";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ShowtimeManagement from "./pages/ShowtimeManagement";
import HallsList from './pages/HallsList';
import HallForm from './pages/HallForm';

function AppContent() {
  const { loading } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState("home");

  useEffect(() => {
    // Simple routing based on URL
    const handleRouteChange = () => {
      const path = window.location.pathname;
      if (path === "/login") setCurrentPage("login");
      else if (path === "/register") setCurrentPage("register");
      else if (path === "/profile") setCurrentPage("profile");
      else if (path === "/showtimes") setCurrentPage("showtimes");
      else setCurrentPage("home");
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
      if (newPath === "/login") setCurrentPage("login");
      else if (newPath === "/register") setCurrentPage("register");
      else if (newPath === "/profile") setCurrentPage("profile");
      else if (newPath === "/showtimes") setCurrentPage("showtimes");
      else setCurrentPage("home");
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
      {currentPage === "login" && <Login />}
      {currentPage === "register" && <Register />}
      {currentPage === "profile" && <Profile />}
      {currentPage === "showtimes" && <ShowtimeManagement />}
      {currentPage === "home" && <Home />}
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
