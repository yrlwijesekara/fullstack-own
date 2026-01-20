import { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import { fetchMovieById, createMovie, updateMovie } from '../services/movieService';

export default function MovieForm() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Determine if we're in edit mode based on URL path
  const isEditMode = window.location.pathname.includes('/edit');

  console.log('MovieForm - URL params:', { id, isEditMode, pathname: window.location.pathname });

  // Form state with all movie fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    genre: [],
    language: '',
    releaseDate: '',
    posterImage: null,
    trailerUrl: '',
    rating: '',
    cast: [],
    castImages: [],
    director: '',
    status: 'upcoming',
  });

  const [loading, setLoading] = useState(false);
  const [fetchingMovie, setFetchingMovie] = useState(isEditMode);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Additional state for complex fields
  const [existingPosterUrl, setExistingPosterUrl] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [castInput, setCastInput] = useState('');
  const [castImageFiles, setCastImageFiles] = useState([]);
  const [youtubePreview, setYoutubePreview] = useState('');

  // Available genres
  const availableGenres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 
    'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 
    'Romance', 'Sci-Fi', 'Thriller', 'Western'
  ];

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url) => {
    if (!url) return null;
    
    // Match various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  // Admin protection - redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setError('Unauthorized: Admin access required');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [user, navigate]);

  // Fetch existing movie data in edit mode
  useEffect(() => {
    const loadMovie = async () => {
      if (!isEditMode) return;

      // Check if ID is missing
      if (!id) {
        console.error('Edit mode but no ID provided in URL');
        setError('No movie ID provided. Please select a movie to edit.');
        setFetchingMovie(false);
        setTimeout(() => navigate('/movies'), 3000);
        return;
      }

      // Validate ID format (MongoDB ObjectId is 24 hex characters)
      if (id.length !== 24 || !/^[a-f\d]{24}$/i.test(id)) {
        console.error('Invalid movie ID format:', id);
        setError(`Invalid movie ID format. Please select a valid movie to edit.`);
        setFetchingMovie(false);
        setTimeout(() => navigate('/movies'), 3000);
        return;
      }

      try {
        setFetchingMovie(true);
        console.log('Fetching movie with ID:', id);
        const response = await fetchMovieById(id);
        console.log('API response:', response);
        
        // Handle both response formats: { movie: {...} } or direct movie object
        const movieData = response.movie || response;
        console.log('Movie data extracted:', movieData);

        // Populate form with existing movie data
        setFormData({
          title: movieData.title || '',
          description: movieData.description || '',
          duration: movieData.duration || '',
          genre: movieData.genre || [],
          language: movieData.language || '',
          releaseDate: movieData.releaseDate ? movieData.releaseDate.split('T')[0] : '',
          posterImage: null, // File input will be empty, but we'll keep the existing poster URL
          trailerUrl: movieData.trailerUrl || '',
          rating: movieData.rating || '',
          cast: movieData.cast || [],
          castImages: movieData.castImages || [],
          director: movieData.director || '',
          status: movieData.status || 'upcoming',
        });

        console.log('Form data set:', {
          title: movieData.title,
          description: movieData.description?.substring(0, 50) + '...',
          duration: movieData.duration,
          genre: movieData.genre,
        });

        // Set existing poster URL for display
        // Handle both posterUrl and posterImage field names for backward compatibility
        if (movieData.posterImage) {
          setExistingPosterUrl(movieData.posterImage);
          console.log('Existing poster URL:', movieData.posterImage);
        } else if (movieData.posterUrl) {
          setExistingPosterUrl(movieData.posterUrl);
          console.log('Existing poster URL:', movieData.posterUrl);
        }

        // Set YouTube preview if trailer URL exists
        if (movieData.trailerUrl) {
          const videoId = extractYouTubeId(movieData.trailerUrl);
          if (videoId) {
            setYoutubePreview(videoId);
          }
        }

        setError('');
      } catch (err) {
        console.error('Error loading movie:', err);
        setError(err.message || 'Failed to load movie data');
      } finally {
        setFetchingMovie(false);
      }
    };

    loadMovie();
  }, [id, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
    // Clear validation error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Handle trailer URL change - update preview
    if (name === 'trailerUrl') {
      const videoId = extractYouTubeId(value);
      setYoutubePreview(videoId || '');
      if (value && !videoId) {
        setValidationErrors(prev => ({
          ...prev,
          trailerUrl: 'Please enter a valid YouTube URL'
        }));
      }
    }
  };

  // Genre selection handler
  const handleGenreToggle = (genre) => {
    setHasChanges(true);
    setFormData(prev => {
      const currentGenres = prev.genre || [];
      const isSelected = currentGenres.includes(genre);
      
      return {
        ...prev,
        genre: isSelected 
          ? currentGenres.filter(g => g !== genre)
          : [...currentGenres, genre]
      };
    });

    // Clear genre validation error
    if (validationErrors.genre) {
      setValidationErrors(prev => ({
        ...prev,
        genre: ''
      }));
    }
  };

  // Cast management handlers
  const handleAddCast = () => {
    if (castInput.trim()) {
      setHasChanges(true);
      setFormData(prev => ({
        ...prev,
        castImages: [...prev.castImages, { name: castInput.trim(), imageUrl: '' }]
      }));
      setCastImageFiles(prev => [...prev, null]);
      setCastInput('');
    }
  };

  const handleRemoveCast = (index) => {
    setHasChanges(true);
    setFormData(prev => ({
      ...prev,
      castImages: prev.castImages.filter((_, i) => i !== index)
    }));
    setCastImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCastImageChange = (index, file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, JPEG, PNG, or WEBP)');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    setHasChanges(true);
    const updatedFiles = [...castImageFiles];
    updatedFiles[index] = file;
    setCastImageFiles(updatedFiles);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => {
        const updatedCastImages = [...prev.castImages];
        updatedCastImages[index] = {
          ...updatedCastImages[index],
          imageUrl: reader.result // Use data URL for preview
        };
        return { ...prev, castImages: updatedCastImages };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCastImage = (index) => {
    setHasChanges(true);
    const updatedFiles = [...castImageFiles];
    updatedFiles[index] = null;
    setCastImageFiles(updatedFiles);

    setFormData(prev => {
      const updatedCastImages = [...prev.castImages];
      updatedCastImages[index] = {
        ...updatedCastImages[index],
        imageUrl: ''
      };
      return { ...prev, castImages: updatedCastImages };
    });
  };

  // File upload handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setValidationErrors(prev => ({
        ...prev,
        posterImage: 'Please upload a valid image file (JPG, JPEG, PNG, or WEBP)'
      }));
      e.target.value = '';
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setValidationErrors(prev => ({
        ...prev,
        posterImage: 'File size must be less than 5MB'
      }));
      e.target.value = '';
      return;
    }

    // Clear validation error
    if (validationErrors.posterImage) {
      setValidationErrors(prev => ({
        ...prev,
        posterImage: ''
      }));
    }

    // Set file and create preview
    setHasChanges(true);
    setFormData(prev => ({
      ...prev,
      posterImage: file
    }));

    // Create image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setHasChanges(true);
    setFormData(prev => ({
      ...prev,
      posterImage: null
    }));
    setImagePreview(null);
    setExistingPosterUrl('');
  };

  const validateForm = () => {
    const errors = {};

    // Title validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      errors.title = 'Title must be 200 characters or less';
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      errors.description = 'Description must be at least 50 characters';
    } else if (formData.description.length > 1000) {
      errors.description = 'Description must be 1000 characters or less';
    }

    // Duration validation
    if (!formData.duration) {
      errors.duration = 'Duration is required';
    } else if (formData.duration <= 0) {
      errors.duration = 'Duration must be a positive number';
    }

    // Genre validation - at least one required
    if (!formData.genre || formData.genre.length === 0) {
      errors.genre = 'Please select at least one genre';
    }

    // Rating validation (optional, but must be valid if provided)
    if (formData.rating !== '' && (formData.rating < 0 || formData.rating > 10)) {
      errors.rating = 'Rating must be between 0 and 10';
    }

    // Trailer URL validation (optional, but must be valid YouTube URL if provided)
    if (formData.trailerUrl && !extractYouTubeId(formData.trailerUrl)) {
      errors.trailerUrl = 'Please enter a valid YouTube URL';
    }

    // Poster image validation (required for new movies, optional for edits if there's an existing poster)
    if (!isEditMode && !formData.posterImage) {
      errors.posterImage = 'Poster image is required for new movies';
    } else if (isEditMode && !formData.posterImage && !existingPosterUrl) {
      errors.posterImage = 'Please upload a poster image';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const prepareFormData = () => {
    const data = new FormData();

    // Append all text fields
    data.append('title', formData.title.trim());
    data.append('description', formData.description.trim());
    data.append('duration', formData.duration);
    data.append('language', formData.language);
    data.append('status', formData.status);
    
    // Append optional text fields
    if (formData.director) {
      data.append('director', formData.director.trim());
    }
    if (formData.rating) {
      data.append('rating', formData.rating);
    }
    if (formData.releaseDate) {
      data.append('releaseDate', formData.releaseDate);
    }
    if (formData.trailerUrl) {
      data.append('trailerUrl', formData.trailerUrl.trim());
    }

    // Append genre array as JSON
    data.append('genre', JSON.stringify(formData.genre));

    // Append cast array as JSON (for backward compatibility)
    data.append('cast', JSON.stringify(formData.cast));

    // Append castImages metadata (names and existing URLs)
    const castImagesData = formData.castImages.map((cast, index) => ({
      name: cast.name,
      imageUrl: castImageFiles[index] ? '' : (cast.imageUrl || '') // Keep existing URL if no new file
    }));
    data.append('castImagesData', JSON.stringify(castImagesData));

    // Append cast image files (only the ones that are new)
    castImageFiles.forEach((file) => {
      if (file) {
        data.append('castImages', file);
      }
    });

    // Append poster image file if selected
    // In edit mode, only append if a new file was selected
    if (formData.posterImage) {
      data.append('posterImage', formData.posterImage);
    }

    return data;
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? All changes will be lost.'
      );
      if (!confirmCancel) return;
    }
    navigate('/movies');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setMessage('');
    
    // Validate form
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setLoading(true);

      // Prepare FormData
      const data = prepareFormData();

      // Call appropriate API based on edit mode
      let response;
      if (isEditMode) {
        response = await updateMovie(id, data);
        setModalMessage(`"${formData.title}" has been updated successfully!`);
      } else {
        response = await createMovie(data);
        setModalMessage(`"${formData.title}" has been added to the movie catalog!`);
      }

      // Reset form changes tracking
      setHasChanges(false);

      // Show success modal
      setShowModal(true);

    } catch (err) {
      console.error('Error submitting form:', err);
      
      // Handle different types of errors
      if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
        setError('Network error: Please check your internet connection and try again.');
      } else if (err.message.includes('validation')) {
        setError(`Validation error: ${err.message}`);
      } else if (err.message.includes('file') || err.message.includes('image')) {
        setError(`File upload error: ${err.message}`);
      } else if (err.message.includes('Unauthorized') || err.message.includes('authentication')) {
        setError('Authentication error: Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} movie. Please try again.`);
      }
      
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/movies');
  };

  // Show loading state while checking auth or fetching movie
  if (!user || fetchingMovie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-900 text-text-primary">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-900 text-text-primary">
        <div className="text-center">
          <div className="text-xl text-semantic-error mb-4">{error}</div>
          <div className="text-text-muted">Redirecting to home...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Modal 
        isOpen={showModal}
        title={isEditMode ? '✅ Movie Updated!' : '🎬 Movie Created!'}
        message={modalMessage}
        onClose={handleModalClose}
        confirmText="View Movies"
        theme="success"
      />
      <div className="min-h-screen bg-background-900 text-text-primary py-8">
        <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <BackButton to="/movies" />
          <h1 className="text-3xl font-bold mt-4">
            {isEditMode ? 'Edit Movie' : 'Add New Movie'}
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded mb-6">
            {message}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-surface-800 rounded-lg p-6 shadow-xl border border-secondary-400">
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-secondary-400">
                Basic Information
              </h2>
              
              {/* Title */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength={200}
                  className={`w-full px-4 py-2 bg-surface-500 text-text-primary rounded-lg border ${
                    validationErrors.title 
                      ? 'border-semantic-error focus:border-semantic-error' 
                      : 'border-secondary-400 focus:border-secondary-300'
                  } focus:outline-none transition-colors`}
                  placeholder="Enter movie title"
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-semantic-error">{validationErrors.title}</p>
                )}
                <p className="mt-1 text-xs text-text-muted">
                  {formData.title.length}/200 characters
                </p>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-2">
                  Description <span className="text-semantic-error">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  maxLength={1000}
                  className={`w-full px-4 py-2 bg-surface-500 text-text-primary rounded-lg border ${
                    validationErrors.description 
                      ? 'border-semantic-error focus:border-semantic-error' 
                      : 'border-secondary-400 focus:border-secondary-300'
                  } focus:outline-none transition-colors resize-none`}
                  placeholder="Enter movie description (minimum 50 characters)"
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-semantic-error">{validationErrors.description}</p>
                )}
                <p className="mt-1 text-xs text-text-muted">
                  {formData.description.length}/1000 characters
                  {formData.description.length < 50 && 
                    ` (${50 - formData.description.length} more required)`
                  }
                </p>
              </div>

              {/* Duration and Language Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Duration */}
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-text-secondary mb-2">
                    Duration (minutes) <span className="text-semantic-error">*</span>
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-4 py-2 bg-surface-500 text-text-primary rounded-lg border ${
                      validationErrors.duration 
                        ? 'border-semantic-error focus:border-semantic-error' 
                        : 'border-secondary-400 focus:border-secondary-300'
                    } focus:outline-none transition-colors`}
                    placeholder="e.g., 120"
                  />
                  {validationErrors.duration && (
                    <p className="mt-1 text-sm text-semantic-error">{validationErrors.duration}</p>
                  )}
                  {formData.duration > 0 && (
                    <p className="mt-1 text-xs text-text-muted">
                      Duration: {formatDuration(formData.duration)}
                    </p>
                  )}
                </div>

                {/* Language */}
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-text-secondary mb-2">
                    Language
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-surface-500 text-text-primary rounded-lg border border-secondary-400 focus:border-secondary-300 focus:outline-none transition-colors"
                  >
                    <option value="">Select a language</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Italian">Italian</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Korean">Korean</option>
                    <option value="Mandarin">Mandarin</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="Russian">Russian</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Release Date and Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Release Date */}
                <div>
                  <label htmlFor="releaseDate" className="block text-sm font-medium text-text-secondary mb-2">
                    Release Date
                  </label>
                  <input
                    type="date"
                    id="releaseDate"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-surface-500 text-text-primary rounded-lg border border-secondary-400 focus:border-secondary-300 focus:outline-none transition-colors"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-surface-500 text-text-primary rounded-lg border border-secondary-400 focus:border-secondary-300 focus:outline-none transition-colors"
                  >
                    <option value="upcoming">Coming Soon</option>
                    <option value="now_showing">Now Showing</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Director and Rating Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Director */}
                <div>
                  <label htmlFor="director" className="block text-sm font-medium text-text-secondary mb-2">
                    Director
                  </label>
                  <input
                    type="text"
                    id="director"
                    name="director"
                    value={formData.director}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-surface-500 text-text-primary rounded-lg border border-secondary-400 focus:border-secondary-300 focus:outline-none transition-colors"
                    placeholder="e.g., Christopher Nolan"
                  />
                </div>

                {/* Rating */}
                <div>
                  <label htmlFor="rating" className="block text-sm font-medium text-text-secondary mb-2">
                    Rating (0-10)
                  </label>
                  <input
                    type="number"
                    id="rating"
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    min="0"
                    max="10"
                    step="0.1"
                    className={`w-full px-4 py-2 bg-surface-500 text-text-primary rounded-lg border ${
                      validationErrors.rating 
                        ? 'border-semantic-error focus:border-semantic-error' 
                        : 'border-secondary-400 focus:border-secondary-300'
                    } focus:outline-none transition-colors`}
                    placeholder="e.g., 8.5"
                  />
                  {validationErrors.rating && (
                    <p className="mt-1 text-sm text-semantic-error">{validationErrors.rating}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Genre Selection Section */}
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-secondary-400">
                Genres
              </h2>
              
              <div className="mb-2">
                <label className="block text-sm font-medium text-text-secondary mb-3">
                  Select Genres <span className="text-semantic-error">*</span>
                  {formData.genre.length > 0 && (
                    <span className="ml-2 text-secondary-300">
                      ({formData.genre.length} selected)
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableGenres.map(genre => (
                    <label
                      key={genre}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                        formData.genre.includes(genre)
                          ? 'bg-secondary-300 border-secondary-300 text-background-900'
                          : 'bg-surface-700 border-secondary-400 text-text-secondary hover:border-secondary-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.genre.includes(genre)}
                        onChange={() => handleGenreToggle(genre)}
                        className="w-4 h-4 text-secondary-300 bg-surface-700 border-secondary-400 rounded focus:ring-secondary-300"
                      />
                      <span className="text-sm">{genre}</span>
                    </label>
                  ))}
                </div>
                {validationErrors.genre && (
                  <p className="mt-2 text-sm text-semantic-error">{validationErrors.genre}</p>
                )}
              </div>
            </div>

            {/* Cast Management Section */}
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-secondary-400">
                Cast Members
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Add Cast Members (Optional)
                </label>
                
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={castInput}
                    onChange={(e) => setCastInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCast())}
                    className="flex-1 px-4 py-2 bg-surface-500 text-text-primary rounded-lg border border-secondary-400 focus:border-secondary-300 focus:outline-none transition-colors"
                    placeholder="Enter actor/actress name"
                  />
                  <button
                    type="button"
                    onClick={handleAddCast}
                    className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-text-primary rounded-lg font-medium transition-colors border border-secondary-400"
                  >
                    Add
                  </button>
                </div>

                {/* Cast List with Images */}
                {formData.castImages.length > 0 && (
                  <div className="space-y-4">
                    {formData.castImages.map((cast, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-4 px-4 py-4 bg-surface-700 rounded-lg border border-secondary-400"
                      >
                        {/* Cast Image Preview */}
                        <div className="flex-shrink-0">
                          {cast.imageUrl ? (
                            <div className="relative w-20 h-20">
                              <img
                                src={cast.imageUrl}
                                alt={cast.name}
                                className="w-20 h-20 rounded-full object-cover border-2 border-secondary-400"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveCastImage(index)}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-semantic-error text-white rounded-full text-xs hover:bg-red-600"
                                title="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-surface-500 flex items-center justify-center border-2 border-secondary-400">
                              <span className="text-2xl text-secondary-300">👤</span>
                            </div>
                          )}
                        </div>

                        {/* Cast Name */}
                        <div className="flex-1">
                          <p className="text-text-primary font-medium">{cast.name}</p>
                          <label className="mt-2 inline-block">
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={(e) => handleCastImageChange(index, e.target.files[0])}
                              className="hidden"
                            />
                            <span className="text-xs text-secondary-300 hover:text-secondary-200 cursor-pointer underline">
                              {cast.imageUrl ? 'Change Image' : 'Upload Image'}
                            </span>
                          </label>
                        </div>

                        {/* Remove Cast Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveCast(index)}
                          className="px-4 py-2 text-semantic-error hover:text-red-400 transition-colors font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {formData.castImages.length === 0 && (
                  <p className="text-sm text-text-muted">No cast members added yet.</p>
                )}
              </div>
            </div>

            {/* Poster Image Upload Section */}
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-secondary-400">
                Poster Image
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Upload Poster Image
                </label>
                
                <div className="mb-3">
                  <input
                    type="file"
                    id="posterImage"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 bg-surface-500 text-text-primary rounded-lg border border-secondary-400 focus:border-secondary-300 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-text-primary hover:file:bg-primary-600 cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-text-muted">
                    Accepted formats: JPG, JPEG, PNG, WEBP (Max size: 5MB)
                  </p>
                  {validationErrors.posterImage && (
                    <p className="mt-1 text-sm text-semantic-error">{validationErrors.posterImage}</p>
                  )}
                </div>

                {/* Image Preview */}
                <div className="mt-4">
                  {imagePreview || existingPosterUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview || existingPosterUrl}
                        alt="Poster preview"
                        className="max-w-xs max-h-96 rounded-lg border-2 border-secondary-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 px-3 py-1 bg-semantic-error hover:bg-red-700 text-text-primary text-sm rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="w-64 h-96 bg-surface-700 rounded-lg border-2 border-dashed border-secondary-400 flex items-center justify-center">
                      <div className="text-center text-text-muted">
                        <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">No image selected</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trailer URL Section */}
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4 pb-2 border-b border-secondary-400">
                Trailer
              </h2>
              
              <div>
                <label htmlFor="trailerUrl" className="block text-sm font-medium text-text-secondary mb-2">
                  YouTube Trailer URL (Optional)
                </label>
                <input
                  type="text"
                  id="trailerUrl"
                  name="trailerUrl"
                  value={formData.trailerUrl}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 bg-surface-500 text-text-primary rounded-lg border ${
                    validationErrors.trailerUrl 
                      ? 'border-semantic-error focus:border-semantic-error' 
                      : 'border-secondary-400 focus:border-secondary-300'
                  } focus:outline-none transition-colors`}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {validationErrors.trailerUrl && (
                  <p className="mt-1 text-sm text-semantic-error">{validationErrors.trailerUrl}</p>
                )}
                <p className="mt-1 text-xs text-text-muted">
                  Enter a valid YouTube video URL
                </p>

                {/* YouTube Preview */}
                {youtubePreview && (
                  <div className="mt-4">
                    <p className="text-sm text-text-secondary mb-2">Trailer Preview:</p>
                    <div className="aspect-video max-w-2xl">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${youtubePreview}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg border border-secondary-400"
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-secondary-400">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 bg-surface-700 hover:bg-surface-600 text-text-primary rounded-lg font-medium transition-colors border border-secondary-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-surface-600 disabled:cursor-not-allowed text-text-primary rounded-lg font-medium transition-colors border border-secondary-400"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Movie' : 'Create Movie'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}
