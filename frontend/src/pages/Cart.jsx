import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getCart, updateQty, removeFromCart, clearCart } from '../utils/cart';
import { API_BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from '../hooks/useNavigate';

export default function Cart() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

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
      const body = { items: items.map(i => ({ productId: i.id, quantity: i.qty })) };
      // Try cookie auth first
      let res = await fetch(`${API_BASE_URL}/purchases`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // fallback to token
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Auth required');
        res = await fetch(`${API_BASE_URL}/purchases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Purchase failed');
      }

      toast.success('Purchase successful');
      clearCart();
      setItems([]);
      navigate('/profile');
    } catch (err) {
      console.error('Purchase error:', err);
      toast.error(err.message || 'Purchase failed');
    }
  };

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
        {items.length === 0 ? (
          <div className="text-text-secondary">Your cart is empty</div>
        ) : (
          <div className="space-y-4">
            {items.map(it => (
              <div key={it.id} className="flex items-center justify-between bg-surface-600 p-4 rounded">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-sm text-text-secondary">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(it.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleQty(it.id, Math.max(1, it.qty - 1))} className="px-2 py-1 bg-surface-500 rounded">-</button>
                  <div className="w-8 text-center">{it.qty}</div>
                  <button onClick={() => handleQty(it.id, it.qty + 1)} className="px-2 py-1 bg-surface-500 rounded">+</button>
                  <div className="w-32 text-right font-semibold">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(it.price * it.qty)}</div>
                  <button onClick={() => handleRemove(it.id)} className="ml-3 px-3 py-1 bg-red-600 text-white rounded">Remove</button>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center p-4 bg-surface-600 rounded">
              <div className="text-lg font-semibold">Total:</div>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(total)}</div>
            </div>

              <div className="flex justify-end gap-3">
              <button onClick={() => { clearCart(); setItems([]); toast.success('Cart cleared'); }} className="px-4 py-2 bg-gray-600 rounded">Clear</button>
              <button onClick={handlePay} className="px-4 py-2 bg-primary-500 text-white rounded">Pay Now</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
