import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { API_BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import LoadingLogo from '../components/LoadingLogo';

function PaymentForm({ items, total }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    if (total <= 0) {
      toast.error('Total amount must be greater than 0');
      return;
    }

    if (total < 1) {
      toast.error('Minimum order amount is LKR 1');
      return;
    }

    setLoading(true);
    try {
      // Create payment intent
      const amountInCents = Math.round(total * 100);
      const res = await fetch(`${API_BASE_URL}/checkout/create-payment-intent`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInCents }),
      });

      let finalRes = res;
      if (!res.ok) {
        const token = localStorage.getItem('token');
        if (token) {
          finalRes = await fetch(`${API_BASE_URL}/checkout/create-payment-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ amount: amountInCents }),
          });
        } else {
          throw new Error('Authentication required');
        }
      }

      if (!finalRes.ok) {
        const err = await finalRes.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create payment intent');
      }

      const { clientSecret } = await finalRes.json();

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) throw new Error(error.message);

      // Payment successful, proceed with checkout
      const checkoutRes = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, paymentMethod: 'card' }),
      });

      let checkoutFinalRes = checkoutRes;
      if (!checkoutRes.ok) {
        const token = localStorage.getItem('token');
        if (token) {
          checkoutFinalRes = await fetch(`${API_BASE_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ items, paymentMethod: 'card' }),
          });
        }
      }

      if (!checkoutFinalRes.ok) {
        const err = await checkoutFinalRes.json().catch(() => ({}));
        throw new Error(err.message || 'Checkout failed');
      }

      const data = await checkoutFinalRes.json();
      toast.success('Payment and checkout completed');

      // Navigate to receipt
      const receiptPayload = { order: data.order, receipt: data.receipt || null };
      try { sessionStorage.setItem('lastReceipt', JSON.stringify(receiptPayload)); } catch { /* ignore */ }
      navigate('/receipt', { state: receiptPayload });

    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-surface-500 p-6 rounded-lg shadow-lg text-text-primary">
      <h2 className="text-2xl font-bold mb-6 text-center">Enter Card Details</h2>
      
      <div className="mb-6">
        <div className="text-lg font-semibold mb-2">Total Amount</div>
        <div className="text-3xl font-bold text-accent-gold">
          {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(total)}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Card Information</label>
          <div className="p-3 border border-surface-400 rounded-md bg-surface-600">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#FFFFFF',
                    '::placeholder': {
                      color: '#CFCFD7',
                    },
                  },
                  invalid: {
                    color: '#E63946',
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="flex-1 px-4 py-2 bg-surface-600 text-text-primary rounded-md hover:bg-surface-700 transition-colors"
          >
            Back to Cart
          </button>
          <button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              'Pay Now'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, total, user } = location.state || {};
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    if (!items || !total || !user) {
      toast.error('Payment data not found. Please return to cart.');
      navigate('/cart');
      return;
    }

    // Load Stripe only when component mounts
    const loadStripeAsync = async () => {
      try {
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        setStripePromise(stripe);
      } catch (error) {
        console.error('Failed to load Stripe:', error);
        toast.error('Payment system unavailable. Please try again later.');
        navigate('/cart');
      }
    };

    loadStripeAsync();
  }, [items, total, user, navigate]);

  if (!items || !total || !user) {
    return (
      <div className="min-h-screen bg-background-900 flex items-center justify-center">
        <LoadingLogo />
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-background-900 text-text-primary">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto flex items-center justify-center">
            <LoadingLogo size={60} text="Loading payment system..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Elements stripe={stripePromise}>
            <PaymentForm items={items} total={total} />
          </Elements>
        </div>
      </div>
    </div>
  );
}