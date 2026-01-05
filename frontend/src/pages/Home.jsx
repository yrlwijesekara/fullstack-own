import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-background-900">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-4">
            Discover Amazing <span className="text-secondary-300">Movies</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8">
            Book your favorite cinema seats and enjoy unforgettable movie experiences
          </p>

          {!user ? (
            <div className="flex gap-4 justify-center">
              <a href="/register" className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-text-primary font-bold rounded-lg transition text-lg shadow-lg">
                Get Started
              </a>
              <a href="/login" className="px-8 py-3 border-2 border-secondary-400 text-secondary-300 hover:bg-secondary-500 hover:text-text-primary font-bold rounded-lg transition text-lg">
                Sign In
              </a>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <a href="#movies" className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-text-primary font-bold rounded-lg transition text-lg shadow-lg">
                Browse Movies
              </a>
              <a href="#bookings" className="px-8 py-3 border-2 border-secondary-400 text-secondary-300 hover:bg-secondary-500 hover:text-text-primary font-bold rounded-lg transition text-lg">
                My Bookings
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-text-primary text-center mb-12">Why Choose Us?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-surface-600 rounded-lg border border-secondary-400 hover:border-secondary-300 transition">
            <div className="text-4xl mb-4">🎫</div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Easy Booking</h3>
            <p className="text-text-muted">Simple and fast ticket booking process with just a few clicks</p>
          </div>
          <div className="p-6 bg-surface-600 rounded-lg border border-secondary-400 hover:border-secondary-300 transition">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Secure Payment</h3>
            <p className="text-text-muted">Safe and encrypted payment methods for your peace of mind</p>
          </div>
          <div className="p-6 bg-surface-600 rounded-lg border border-secondary-400 hover:border-secondary-300 transition">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Best Experience</h3>
            <p className="text-text-muted">Premium cinemas with latest technology and comfort</p>
          </div>
        </div>
      </section>

      {/* Popular Movies Section */}
      <section id="movies" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-text-primary text-center mb-12">Now Showing</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((movie) => (
            <div key={movie} className="bg-surface-600 rounded-lg overflow-hidden border border-secondary-400 hover:border-secondary-300 transition hover:shadow-2xl hover:shadow-secondary-500/50">
              <div className="h-64 bg-secondary-500 flex items-center justify-center">
                <span className="text-6xl">🎬</span>
              </div>
              <div className="p-4">
                <h3 className="text-text-primary font-bold text-lg mb-2">Movie Title {movie}</h3>
                <p className="text-text-muted text-sm mb-4">Action • 2h 15m</p>
                {user ? (
                  <button className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-text-primary font-bold rounded transition shadow-lg">
                    Book Tickets
                  </button>
                ) : (
                  <a href="/login" className="block text-center py-2 bg-primary-500 hover:bg-primary-600 text-text-primary font-bold rounded transition shadow-lg">
                    Sign In to Book
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background-800 border-t border-secondary-400 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-text-muted">
          <p>&copy; 2024 Cinema Booking System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
