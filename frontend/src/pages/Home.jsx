import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Discover Amazing <span className="text-purple-400">Movies</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Book your favorite cinema seats and enjoy unforgettable movie experiences
          </p>

          {!user ? (
            <div className="flex gap-4 justify-center">
              <a href="/register" className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition text-lg">
                Get Started
              </a>
              <a href="/login" className="px-8 py-3 border-2 border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white font-bold rounded-lg transition text-lg">
                Sign In
              </a>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <a href="#movies" className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition text-lg">
                Browse Movies
              </a>
              <a href="#bookings" className="px-8 py-3 border-2 border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white font-bold rounded-lg transition text-lg">
                My Bookings
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-12">Why Choose Us?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-gray-800 rounded-lg border border-purple-500 hover:border-purple-400 transition">
            <div className="text-4xl mb-4">🎫</div>
            <h3 className="text-xl font-bold text-white mb-2">Easy Booking</h3>
            <p className="text-gray-400">Simple and fast ticket booking process with just a few clicks</p>
          </div>
          <div className="p-6 bg-gray-800 rounded-lg border border-purple-500 hover:border-purple-400 transition">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-white mb-2">Secure Payment</h3>
            <p className="text-gray-400">Safe and encrypted payment methods for your peace of mind</p>
          </div>
          <div className="p-6 bg-gray-800 rounded-lg border border-purple-500 hover:border-purple-400 transition">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-bold text-white mb-2">Best Experience</h3>
            <p className="text-gray-400">Premium cinemas with latest technology and comfort</p>
          </div>
        </div>
      </section>

      {/* Popular Movies Section */}
      <section id="movies" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-12">Now Showing</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((movie) => (
            <div key={movie} className="bg-gray-800 rounded-lg overflow-hidden border border-purple-500 hover:border-purple-400 transition hover:shadow-2xl hover:shadow-purple-500/50">
              <div className="h-64 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <span className="text-6xl">🎬</span>
              </div>
              <div className="p-4">
                <h3 className="text-white font-bold text-lg mb-2">Movie Title {movie}</h3>
                <p className="text-gray-400 text-sm mb-4">Action • 2h 15m</p>
                {user ? (
                  <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded transition">
                    Book Tickets
                  </button>
                ) : (
                  <a href="/login" className="block text-center py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded transition">
                    Sign In to Book
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-purple-500 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; 2024 Cinema Booking System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
