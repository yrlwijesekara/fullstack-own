import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import LoadingLogo from '../components/LoadingLogo';
import { API_BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from '../hooks/useNavigate';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function fetchOrders() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/orders`, { credentials: 'include' });
        const data = res.ok ? await res.json() : null;
        if (mounted && data && data.orders) setOrders(data.orders);
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
      setOrders((prev) => prev.map(o => ({
        ...o,
        bookings: (o.bookings || []).map(b => (b._id === id ? { ...b, canceled: true } : b)),
      })));
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
      setOrders((prev) => prev.map(o => (o.purchase && o.purchase._id === id ? { ...o, purchase: { ...o.purchase, canceled: true } } : o)));
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
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="p-4 bg-surface-600 rounded">No orders yet.</div>
            ) : (
              <ul className="space-y-4">
                {orders.map(o => (
                  <li key={o._id} className="p-4 bg-surface-600 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">Order {o._id}</div>
                        <div className="text-text-secondary text-sm">{new Date(o.createdAt).toLocaleString()}</div>
                        <div className="text-text-secondary text-sm">Total: {o.totalPrice}</div>
                      </div>
                      <div className="text-right">
                        {/* could add order-level actions here */}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="font-medium mb-1">Bookings</div>
                        {(!o.bookings || o.bookings.length === 0) ? (
                          <div className="text-text-secondary">No bookings in this order.</div>
                        ) : (
                          <ul className="space-y-2">
                            {o.bookings.map(b => (
                              <li key={b._id} className="p-2 bg-background-800 rounded flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{b.showtimeId?.movieId?.title || b.showtimeInfo?.movieTitle || 'Showtime'}</div>
                                  <div className="text-text-secondary text-sm">Seats: {b.seats?.join(', ')}</div>
                                  <div className="text-text-secondary text-sm">{b.canceled ? 'Canceled' : new Date(b.createdAt).toLocaleString()}</div>
                                </div>
                                <div>
                                  {!b.canceled && <button onClick={() => cancelBooking(b._id)} className="px-3 py-1 bg-red-600 text-white rounded">Cancel</button>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <div className="font-medium mb-1">Snacks / Purchases</div>
                        {(!o.purchase) ? (
                          <div className="text-text-secondary">No snacks in this order.</div>
                        ) : (
                          <div className="p-2 bg-background-800 rounded">
                            <div className="text-text-secondary text-sm">Items: {o.purchase.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</div>
                            <div className="text-text-secondary text-sm">{o.purchase.canceled ? 'Canceled' : new Date(o.purchase.createdAt).toLocaleString()}</div>
                            {!o.purchase.canceled && <div className="mt-2"><button onClick={() => cancelPurchase(o.purchase._id)} className="px-3 py-1 bg-red-600 text-white rounded">Cancel Purchase</button></div>}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6">
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary-500 text-white rounded">Back to Home</button>
        </div>
      </div>
    </div>
  );
}
