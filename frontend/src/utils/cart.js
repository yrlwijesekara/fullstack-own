// Simple cart stored in localStorage
const CART_KEY = 'snack_cart_v1';

export function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  try {
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (e) {
    // ignore in non-browser environments
  }
}

export function addToCart(snack, qty = 1) {
  const id = snack._id || snack.ProductId || snack.id;
  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty = (existing.qty || 0) + qty;
  } else {
    cart.push({ id, type: 'snack', name: snack.ProductName || snack.name || snack.title || 'Snack', price: Number(snack.ProductPrice || snack.price || 0), qty });
  }
  saveCart(cart);
  return cart;
}

// Add ticket(s) to cart as a single grouped entry. We store type=ticket and include metadata
export function addTicketsToCart({ showtimeId, movieTitle, cinemaName, seats = [], adultCount = 0, childCount = 0, pricePerAdult = 0 }) {
  const cart = getCart();
  // Create a stable-ish id for this ticket group
  const id = `ticket:${showtimeId}:${seats.join('|') || Date.now()}`;
  const ticketCount = Number(adultCount || 0) + Number(childCount || 0);
  const totalPrice = Number(adultCount || 0) * Number(pricePerAdult || 0) + Number(childCount || 0) * Number(pricePerAdult || 0) * 0.5;
  const name = `${movieTitle} — ${cinemaName || 'Cinema'} — ${seats.length > 0 ? `Seats: ${seats.join(',')}` : `${ticketCount} ticket${ticketCount!==1 ? 's' : ''}`}`;

  // push as single qty entry (qty=1) representing this ticket group
  cart.push({ id, type: 'ticket', name, price: Number(totalPrice || 0), qty: 1, meta: { showtimeId, seats, adultCount, childCount, pricePerAdult } });
  saveCart(cart);
  return cart;
}

export function updateQty(id, qty) {
  const cart = getCart();
  const updated = cart.map(i => i.id === id ? { ...i, qty } : i).filter(i => i.qty > 0);
  saveCart(updated);
  return updated;
}

export function removeFromCart(id) {
  const cart = getCart();
  const updated = cart.filter(i => i.id !== id);
  saveCart(updated);
  return updated;
}

export function clearCart() {
  saveCart([]);
}
