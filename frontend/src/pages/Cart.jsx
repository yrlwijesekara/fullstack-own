import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import LoadingLogo from '../components/LoadingLogo';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { getCart, updateQty, removeFromCart, clearCart } from '../utils/cart';
import { API_BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from '../hooks/useNavigate';

export default function Cart() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [successInfo, setSuccessInfo] = useState({ bookings: [], purchase: null });
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background-900 flex items-center justify-center">
        <LoadingLogo size={80} text="Loading..." />
      </div>
    );
  }

  useEffect(() => {
    setItems(getCart());
  }, []);

  const handleQty = (id, qty) => {
    const updated = updateQty(id, qty);
    setItems(updated);
  };

  const handleRemove = (id) => {
    const updated = removeFromCart(id);
    setItems(updated);
    toast.success('Removed from cart');
  };

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const handlePay = async () => {
    if (!user) {
      toast.error('Please login to complete purchase');
      setTimeout(() => navigate('/login'), 600);
      return;
    }
    try {
      // call unified checkout endpoint
      const res = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      // fallback to token if cookie-auth fails
      let finalRes = res;
      if (!res.ok) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');
        finalRes = await fetch(`${API_BASE_URL}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ items }),
        });
      }

      if (!finalRes.ok) {
        const err = await finalRes.json().catch(() => ({}));
        throw new Error(err.message || 'Checkout failed');
      }

      const data = await finalRes.json();
      // data: { bookings, purchase, receipt: base64 }
      toast.success('Checkout completed');
      // navigate to receipt page and pass data via location state; also save to sessionStorage as fallback
      const receiptPayload = { receipt: data.receipt || null, bookings: data.bookings || [], purchase: data.purchase || null };
      try { sessionStorage.setItem('lastReceipt', JSON.stringify(receiptPayload)); } catch (e) { /* ignore */ }
      // clear client cart and navigate to receipt
      clearCart();
      setItems([]);
      navigate('/receipt', { state: receiptPayload });
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Checkout failed');
    }
  };

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 sm:pb-6">
        <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
        {items.length === 0 ? (
          <div className="text-text-secondary">Your cart is empty</div>
        ) : (
          <div className="space-y-4">
            {items.map(it => (
              <div key={it.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface-600 p-4 rounded gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{it.name}</div>
                    {it.type === 'ticket' && (
                      <span className="text-xs bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded">Ticket</span>
                    )}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {it.type === 'ticket' && it.meta?.seats && it.meta.seats.length > 0 ? (
                      <span>Seats: {it.meta.seats.join(', ')}</span>
                    ) : (
                      new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(it.price)
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {it.type === 'ticket' ? (
                    // tickets are stored as grouped entries (qty = 1)
                    <div className="w-28 text-right font-semibold">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(it.price)}</div>
                  ) : (
                    <>
                      <button onClick={() => handleQty(it.id, Math.max(1, it.qty - 1))} className="px-3 py-2 bg-surface-500 rounded">-</button>
                      <div className="w-10 text-center font-medium">{it.qty}</div>
                      <button onClick={() => handleQty(it.id, it.qty + 1)} className="px-3 py-2 bg-surface-500 rounded">+</button>
                      <div className="w-28 text-right font-semibold">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(it.price * it.qty)}</div>
                    </>
                  )}
                  <button onClick={() => handleRemove(it.id)} className="ml-2 px-3 py-2 bg-red-600 text-white rounded">Remove</button>
                </div>
              </div>
            ))}

            {/* Desktop/Tablet summary */}
            <div className="hidden sm:flex justify-between items-center p-4 bg-surface-600 rounded">
              <div className="text-lg font-semibold">Total:</div>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(total)}</div>
            </div>

            <div className="hidden sm:flex justify-end gap-3">
              <button onClick={() => { clearCart(); setItems([]); toast.success('Cart cleared'); }} className="px-4 py-2 bg-gray-600 rounded">Clear</button>
              <button onClick={handlePay} className="px-4 py-2 bg-primary-500 text-white rounded">Pay Now</button>
            </div>

            {/* Mobile sticky checkout bar */}
            <div className="fixed inset-x-0 bottom-0 bg-background-900 border-t border-secondary-400 p-3 sm:hidden">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-text-secondary">Total</div>
                  <div className="text-lg font-bold">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(total)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { clearCart(); setItems([]); toast.success('Cart cleared'); }} className="px-3 py-2 bg-gray-600 rounded">Clear</button>
                  <button onClick={handlePay} className="px-4 py-2 bg-primary-500 text-white rounded">Pay</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
        {/* Receipt page replaces the old modal flow; navigation handled after successful checkout */}
    </div>
  );
}
