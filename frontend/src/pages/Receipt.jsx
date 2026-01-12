import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingLogo from '../components/LoadingLogo';
import { downloadBase64Pdf } from '../utils/receipt';

export default function ReceiptPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state && (location.state.receipt || location.state.bookings)) {
      setPayload(location.state);
      setLoading(false);
      return;
    }
    // fallback to sessionStorage
    try {
      const raw = sessionStorage.getItem('lastReceipt');
      if (raw) {
        setPayload(JSON.parse(raw));
      }
    } catch (e) {
      // ignore
    }
    setLoading(false);
  }, [location.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-900 flex items-center justify-center">
        <LoadingLogo size={80} text="Loading..." />
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="min-h-screen bg-background-900 text-text-primary">
        <Navbar />
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Receipt not found</h1>
          <p className="text-text-secondary">We couldn't find a recent receipt. If you just completed checkout, try returning to the cart and retrying, or check your profile orders.</p>
          <div className="mt-4">
            <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary-500 text-white rounded">Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  const { bookings = [], purchase = null, receipt } = payload;
  const total = purchase ? purchase.totalPrice : bookings.reduce((s, b) => s + (b.total || 0), 0);

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Checkout Successful</h1>
        <p className="text-text-secondary mb-4">Your booking and purchase were created successfully. Download your receipt below.</p>

        <div className="bg-surface-600 p-4 rounded mb-4">
          <h2 className="font-semibold mb-2">Bookings</h2>
          {bookings.length === 0 ? (
            <div className="text-text-secondary">No bookings found.</div>
          ) : (
            <ul className="list-disc list-inside space-y-2">
              {bookings.map((b) => (
                <li key={b._id} className="text-sm">
                  <div><strong>Booking {b._id}</strong></div>
                  <div className="text-text-secondary">{b.showtimeInfo?.movieTitle || ''} — Seats: {b.seats?.join(', ')}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {purchase && (
          <div className="bg-surface-600 p-4 rounded mb-4">
            <h2 className="font-semibold mb-2">Purchase</h2>
            <div>Purchase ID: {purchase._id}</div>
            <div className="text-lg font-bold">Total: {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(purchase.totalPrice)}</div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              if (receipt) {
                downloadBase64Pdf(receipt, `enimate_receipt_${Date.now()}.pdf`);
              }
            }}
            className="px-4 py-2 bg-primary-500 text-white rounded"
          >
            Download Receipt (PDF)
          </button>

          <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-gray-600 text-white rounded">View Profile Orders</button>
        </div>
      </div>
    </div>
  );
}
