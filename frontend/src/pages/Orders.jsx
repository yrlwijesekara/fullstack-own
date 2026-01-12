import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import LoadingLogo from '../components/LoadingLogo';
import { API_BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from '../hooks/useNavigate';

export default function OrdersPage() {
  const [bookings, setBookings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function fetchOrders() {
      setLoading(true);
      try {
        const resB = await fetch(`${API_BASE_URL}/bookings/me`, { credentials: 'include' });
        const dataB = resB.ok ? await resB.json() : null;
        if (mounted && dataB && dataB.bookings) setBookings(dataB.bookings);

        const resP = await fetch(`${API_BASE_URL}/purchases`, { credentials: 'include' });
        const dataP = resP.ok ? await resP.json() : null;
        if (mounted && dataP && dataP.purchases) setPurchases(dataP.purchases);
      } catch (err) {
        console.error('Fetch orders error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchOrders();
    return () => { mounted = false; };
  }, []);

  const cancelBooking = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to cancel booking');
      toast.success('Booking canceled');
      setBookings((prev) => prev.map(b => (b._id === id ? { ...b, canceled: true } : b)));
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Cancel failed');
    }
  };

  const cancelPurchase = async (id) => {
    if (!confirm('Cancel this purchase? This will restock the items.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/purchases/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to cancel purchase');
      toast.success('Purchase canceled and items restocked');
      setPurchases((prev) => prev.map(p => (p._id === id ? { ...p, canceled: true } : p)));
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Cancel failed');
    }
  };

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Your Orders</h1>
        {loading ? (
          <div className="p-6 bg-surface-600 rounded"><LoadingLogo size={40} text="Loading orders..." /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-600 p-4 rounded">
              <h3 className="font-semibold mb-2">Bookings</h3>
              {bookings.length === 0 ? (
                <div className="text-text-secondary">No bookings yet.</div>
              ) : (
                <ul className="space-y-3">
                  {bookings.map(b => (
                    <li key={b._id} className="p-3 bg-background-800 rounded flex justify-between items-center">
                      <div>
                        <div className="font-medium">{b.showtimeId?.movieTitle || (b.showtimeInfo?.movieTitle) || 'Showtime'}</div>
                        <div className="text-text-secondary text-sm">Seats: {b.seats?.join(', ')}</div>
                        <div className="text-text-secondary text-sm">{b.canceled ? 'Canceled' : new Date(b.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {!b.canceled && <button onClick={() => cancelBooking(b._id)} className="px-3 py-1 bg-red-600 text-white rounded">Cancel</button>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-surface-600 p-4 rounded">
              <h3 className="font-semibold mb-2">Purchases</h3>
              {purchases.length === 0 ? (
                <div className="text-text-secondary">No purchases yet.</div>
              ) : (
                <ul className="space-y-3">
                  {purchases.map(p => (
                    <li key={p._id} className="p-3 bg-background-800 rounded flex justify-between items-center">
                      <div>
                        <div className="font-medium">Purchase {p._id}</div>
                        <div className="text-text-secondary text-sm">Items: {p.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</div>
                        <div className="text-text-secondary text-sm">{p.canceled ? 'Canceled' : new Date(p.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {!p.canceled && <button onClick={() => cancelPurchase(p._id)} className="px-3 py-1 bg-red-600 text-white rounded">Cancel</button>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary-500 text-white rounded">Back to Home</button>
        </div>
      </div>
    </div>
  );
}
