// Simple wrapper for Halls API
import { buildUrl } from '../utils/api';

export const getHalls = async () => {
  const res = await fetch(buildUrl('halls'), {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch halls');
  return res.json();
};

export const getHall = async (id) => {
  const res = await fetch(buildUrl(`halls/${id}`), {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch hall');
  return res.json();
};

export const createHall = async (data) => {
  const res = await fetch(buildUrl('halls'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create hall');
  }
  return res.json();
};

export const updateHall = async (id, data) => {
  const res = await fetch(buildUrl(`halls/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update hall');
  }
  return res.json();
};

export const deleteHall = async (id) => {
  const res = await fetch(buildUrl(`halls/${id}`), {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete hall');
  }
  return res.json();
};