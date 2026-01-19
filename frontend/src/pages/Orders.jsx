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
    let mounted = true;
    fetchOrders();
    return () => { mounted = false; };
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
                  <li key={o._id} className="p-4 bg-surface-600 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">Order {o._id}</div>
                        <div className="text-text-secondary text-sm">{new Date(o.createdAt).toLocaleString()}</div>
                        <div className="text-text-secondary text-sm">Total: {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(o.totalPrice)}</div>
                      </div>
                      <div className="text-right">
                        {(() => {
                          const hasActiveBookings = o.bookings?.some(b => !b.canceled);
                          const hasActivePurchase = o.purchase && !o.purchase.canceled;
                          const hasAnyActiveItems = hasActiveBookings || hasActivePurchase;
                          
                          return hasAnyActiveItems ? (
                            <button
                              onClick={() => downloadReceipt(o._id)}
                              className="px-3 py-1 bg-primary-500 text-white rounded text-sm mb-2 block"
                            >
                              Download Receipt
                            </button>
                          ) : (
                            <div className="text-text-secondary text-sm mb-2">
                              All items canceled
                            </div>
                          );
                        })()}
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
                                  <div className="text-text-secondary text-sm">
                                    Cinema: {b.showtimeId?.cinemaId?.name || b.showtimeInfo?.cinemaName || 'N/A'}
                                    {b.showtimeId?.cinemaId?.city ? ` - ${b.showtimeId.cinemaId.city}` : ''}
                                  </div>
                                  <div className="text-text-secondary text-sm">Hall: {b.showtimeId?.hallId?.name || b.showtimeInfo?.hallName || 'N/A'}</div>
                                  <div className="text-text-secondary text-sm">Seats: {b.seats?.join(', ')}</div>
                                  <div className="text-text-secondary text-sm">{b.canceled ? 'Canceled' : new Date(b.createdAt).toLocaleString()}</div>
                                </div>
                                <div>
                                  {!b.canceled && <button onClick={() => cancelBooking(b._id)} className="px-3 py-1 bg-red-600 text-white rounded">Cancel</button>}
                                  {b.canceled && <span className="text-red-400 text-sm">Canceled</span>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <div className="font-medium mb-1">Snacks</div>
                        {(!o.purchase) ? (
                          <div className="text-text-secondary">No snacks in this order.</div>
                        ) : (
                          <div className="p-2 bg-background-800 rounded">
                            <div className="text-text-secondary text-sm">Items: {o.purchase.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</div>
                            {!o.purchase.canceled && <div className="text-text-secondary text-sm">{new Date(o.purchase.createdAt).toLocaleString()}</div>}
                            {!o.purchase.canceled && <div className="mt-2"><button onClick={() => cancelPurchase(o.purchase._id)} className="px-3 py-1 bg-red-600 text-white rounded">Cancel Purchase</button></div>}
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
