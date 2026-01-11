import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/api';
import LoadingLogo from '../components/LoadingLogo';
import Navbar from '../components/Navbar';

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
              <div key={c._id} className="bg-surface-600 rounded-xl p-4 shadow-lg border border-secondary-400/40">
                <div className="h-44 w-full overflow-hidden rounded-lg mb-4 bg-gray-800">
                  <img src={c.image || '/uploads/movies/placeholder-cinema.jpg'} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary">{c.name}</h3>
                <div className="text-text-secondary text-sm">{c.city} — {c.address}</div>
                <p className="text-text-secondary mt-2">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
