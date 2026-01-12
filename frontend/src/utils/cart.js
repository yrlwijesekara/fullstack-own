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
    cart.push({ id, name: snack.ProductName || snack.ProductName || snack.name, price: Number(snack.ProductPrice || snack.price || 0), qty });
  }
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
