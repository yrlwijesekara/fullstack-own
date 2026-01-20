import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import LoadingLogo from '../components/LoadingLogo';
import { API_BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from '../hooks/useNavigate';
import { downloadBase64Pdf } from '../utils/receipt';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, { credentials: 'include' });
      const data = res.ok ? await res.json() : null;
      if (data && data.orders) setOrders(data.orders);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const cancelBooking = async (id) => {
    if (!confirm('Cancel this booking? This will also cancel any associated purchases in the same order.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to cancel booking');
      toast.success('Booking and associated purchase canceled');
      // Refresh orders to show updated state
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Cancel failed');
    }
  };

  const cancelPurchase = async (id) => {
    if (!confirm('Cancel this purchase? This will also cancel any associated bookings in the same order.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/purchases/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to cancel purchase');
      toast.success('Purchase and associated bookings canceled');
      // Refresh orders to show updated state
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Cancel failed');
    }
  };

  const downloadReceipt = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/receipt`, { credentials: 'include' });
      if (!res.ok) throw new Error('Receipt not available');
      const data = await res.json();
      downloadBase64Pdf(data.receipt, `enimate_receipt_${orderId}.pdf`);
      toast.success('Receipt downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download receipt');
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
                  <li key={o._id} className="p-6 bg-surface-600 rounded shadow-md">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-sm">Order</div>
                          <div className="font-mono text-xs text-text-secondary break-all">{o._id}</div>
                          <div className="ml-3">
                            <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${
                              o.bookings?.some(b => !b.canceled) || (o.purchase && !o.purchase.canceled) ? 'bg-semantic-success/20 text-semantic-success border border-semantic-success/30' : 'bg-surface-500 text-text-secondary border border-secondary-400'
                            }`}>{o.bookings?.some(b => !b.canceled) || (o.purchase && !o.purchase.canceled) ? 'Active' : 'Canceled'}</span>
                          </div>
                        </div>
                        <div className="text-text-secondary text-sm mt-2">{new Date(o.createdAt).toLocaleString()}</div>
                        <div className="text-text-secondary text-sm mt-1">Total: <span className="font-semibold">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(o.totalPrice)}</span></div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(() => {
                          const hasActiveBookings = o.bookings?.some(b => !b.canceled);
                          const hasActivePurchase = o.purchase && !o.purchase.canceled;
                          const hasAnyActiveItems = hasActiveBookings || hasActivePurchase;
                          
                          return hasAnyActiveItems ? (
                            <button
                              onClick={() => downloadReceipt(o._id)}
                              className="px-3 py-2 bg-primary-500 text-white rounded text-sm flex items-center gap-2"
                            >
                              📄 Receipt
                            </button>
                          ) : (
                            <div className="text-text-secondary text-sm mb-2">
                              All items canceled
                            </div>
                          );
                        })()}
                        {/* Details button removed per UI preference */}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium mb-2">Bookings</div>
                        {(!o.bookings || o.bookings.length === 0) ? (
                          <div className="text-text-secondary">No bookings in this order.</div>
                        ) : (
                          <ul className="space-y-2">
                            {o.bookings.map(b => (
                              <li key={b._id} className="p-3 bg-background-800 rounded flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium">{b.showtimeId?.movieId?.title || b.showtimeInfo?.movieTitle || 'Showtime'}</div>
                                  <div className="text-text-secondary text-sm mt-1">
                                    {b.showtimeId?.cinemaId?.name || b.showtimeInfo?.cinemaName || 'N/A'}{b.showtimeId?.cinemaId?.city ? ` — ${b.showtimeId.cinemaId.city}` : ''}
                                  </div>
                                  <div className="text-text-secondary text-sm">Hall: {b.showtimeId?.hallId?.name || b.showtimeInfo?.hallName || 'N/A'}</div>
                                  <div className="text-text-secondary text-sm">Seats: {b.seats?.join(', ')}</div>
                                  <div className="text-text-secondary text-sm mt-1">{b.canceled ? <span className="text-red-400">Canceled</span> : new Date(b.createdAt).toLocaleString()}</div>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                  {!b.canceled && <button onClick={() => cancelBooking(b._id)} className="px-3 py-1 bg-red-600 text-white rounded">Cancel</button>}
                                  {b.canceled && <span className="text-red-400 text-sm">Canceled</span>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <div className="font-medium mb-2">Snacks</div>
                        {(!o.purchase) ? (
                          <div className="text-text-secondary">No snacks in this order.</div>
                        ) : (
                          <div className="p-3 bg-background-800 rounded">
                            <div className="text-text-secondary text-sm">Items: {o.purchase.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</div>
                            {!o.purchase.canceled && <div className="text-text-secondary text-sm mt-1">{new Date(o.purchase.createdAt).toLocaleString()}</div>}
                            {!o.purchase.canceled && <div className="mt-3"><button onClick={() => cancelPurchase(o.purchase._id)} className="px-3 py-1 bg-red-600 text-white rounded">Cancel Purchase</button></div>}
                            {o.purchase.canceled && <div className="mt-2 text-red-400 text-sm">Purchase Canceled</div>}
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
