import { API_BASE_URL } from '../utils/api';

/**
 * Fetch movies with optional query parameters
 * @param {Object} params - Query parameters (page, limit, genre, etc.)
 * @returns {Promise<Object>} Response data with movies array
 */
export const fetchMovies = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE_URL}/movies?${query}` : `${API_BASE_URL}/movies`;
    
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch movies');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }
};

/**
 * Fetch a single movie by ID
 * @param {string} id - Movie ID
 * @returns {Promise<Object>} Movie data
 */
export const fetchMovieById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch movie');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching movie:', error);
    throw error;
  }
};

/**
 * Create a new movie
 * @param {FormData} formData - FormData containing movie details and poster image
 * @returns {Promise<Object>} Created movie data
 */
export const createMovie = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies`, {
      method: 'POST',
      credentials: 'include',
      body: formData, // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create movie');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating movie:', error);
    throw error;
  }
};

/**
 * Update an existing movie
 * @param {string} id - Movie ID
 * @param {FormData} formData - FormData containing updated movie details and optional poster image
 * @returns {Promise<Object>} Updated movie data
 */
export const updateMovie = async (id, formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData, // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update movie');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating movie:', error);
    throw error;
  }
};

/**
 * Delete a movie
 * @param {string} id - Movie ID
 * @returns {Promise<Object>} Deletion confirmation message
 */
export const deleteMovie = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete movie');
    }

    return response.json();
  } catch (error) {
    console.error('Error deleting movie:', error);
    throw error;
  }
};

/**
 * Search movies with search parameters
 * @param {Object} searchParams - Search parameters (query, genre, year, etc.)
 * @returns {Promise<Object>} Search results with movies array
 */
export const searchMovies = async (searchParams = {}) => {
  try {
    const query = new URLSearchParams(searchParams).toString();
    const url = query ? `${API_BASE_URL}/movies/search?${query}` : `${API_BASE_URL}/movies/search`;
    
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to search movies');
    }

    return response.json();
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
};
