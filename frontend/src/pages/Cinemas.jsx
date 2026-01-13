import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/api';
import LoadingLogo from '../components/LoadingLogo';
import Navbar from '../components/Navbar';

// Helper function to get the correct image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return '/uploads/movies/placeholder-cinema.jpg';
  // If it's already a full URL (B2), return as is
  if (imagePath.startsWith('http')) return imagePath;
  // Otherwise, prepend API_BASE_URL for local images
  return `${API_BASE_URL}${imagePath}`;
};

export default function Cinemas() {
  const [cinemas, setCinemas] = useState(null);

  useEffect(() => {
    fetchCinemas();
  }, []);

  async function fetchCinemas() {
    try {
      const res = await fetch(`${API_BASE_URL}/cinemas`);
      if (!res.ok) return setCinemas([]);
      const data = await res.json();
      setCinemas(data.data || []);
    } catch (err) {
      console.error('Failed to fetch cinemas', err);
      setCinemas([]);
    }
  }

  if (cinemas === null) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background-900">
          <LoadingLogo size={80} text="Loading cinemas..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background-900 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-secondary-400 mb-6">Cinemas</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cinemas.map((c) => (
              <div
                key={c._id}
                className="bg-surface-600 rounded-xl overflow-hidden shadow-lg border border-secondary-400/30 hover:scale-[1.01] transform transition"
              >
                <div className="relative h-44 w-full overflow-hidden bg-gray-800">
                  <img
                    src={getImageUrl(c.image)}
                    alt={c.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute left-4 bottom-3">
                    <h3 className="text-lg font-bold text-white drop-shadow">{c.name}</h3>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-sm text-text-secondary mb-2">
                    <span className="font-semibold text-secondary-200">City:</span> <span className="ml-1">{c.city || '—'}</span>
                  </div>

                  <div className="text-sm text-text-secondary mb-2">
                    <span className="font-semibold text-secondary-200">Address:</span> <span className="ml-1">{c.address || '—'}</span>
                  </div>

                  <div className="text-sm text-text-secondary">
                    <span className="font-semibold text-secondary-200">About:</span>
                    <p className="mt-1 text-sm text-text-secondary">{c.description ? c.description : 'No description provided.'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
