import PropTypes from 'prop-types';

/**
 * MovieCard Component - Displays a movie card with poster, title, rating, and actions
 * @param {Object} movie - Movie object containing id, title, posterImage, genre, duration, rating, status
 * @param {boolean} showAdminActions - Show edit/delete buttons for admin users
 * @param {Function} onEdit - Callback function when edit button is clicked
 * @param {Function} onDelete - Callback function when delete button is clicked
 * @param {Function} onClick - Callback function when card is clicked
 */
export default function MovieCard({ movie, showAdminActions = false, onEdit, onDelete, onClick }) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(movie);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(movie);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(movie);
    }
  };

  return (
    <div 
      className="bg-surface-600 border border-secondary-400 rounded-lg overflow-hidden hover:shadow-2xl hover:shadow-secondary-500/50 hover:scale-105 transition-all duration-200 cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Poster Area */}
      <div className="relative aspect-[2/3] bg-surface-500">
        {movie.posterImage ? (
          <img 
            src={movie.posterImage} 
            alt={movie.title} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-400">
            <div className="text-text-muted text-6xl font-bold">🎬</div>
          </div>
        )}
        
        {/* Rating Badge - Top Right */}
        <div className="absolute top-2 right-2 bg-surface-600 border border-secondary-300 px-2 py-1 text-xs font-bold shadow-sm text-secondary-300">
          {movie.rating || 'NR'}
        </div>
        
        {/* Admin Actions - Top Left (visible on hover) */}
        {showAdminActions && (
          <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleEdit}
              className="bg-accent-blue text-white p-2 rounded hover:bg-accent-blue/80 transition shadow-md"
              aria-label="Edit movie"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button 
              onClick={handleDelete}
              className="bg-semantic-error text-white p-2 rounded hover:bg-semantic-error/80 transition shadow-md"
              aria-label="Delete movie"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Status Badge (if movie has special status) */}
        {movie.status && movie.status !== 'active' && (
          <div className="absolute bottom-2 left-2 bg-semantic-warning border border-accent-gold px-2 py-1 text-xs font-bold uppercase text-background-900">
            {movie.status}
          </div>
        )}
      </div>
      
      {/* Movie Info Section */}
      <div className="p-4 border-t border-secondary-400">
        {/* Movie Title */}
        <h3 className="font-bold text-sm text-text-primary mb-2 truncate uppercase tracking-wide" title={movie.title}>
          {movie.title}
        </h3>
        
        {/* Genre and Duration (optional info) */}
        {(movie.genre || movie.duration) && (
          <div className="text-xs text-text-muted mb-3 flex items-center gap-2">
            {movie.genre && <span className="truncate">{movie.genre}</span>}
            {movie.genre && movie.duration && <span>•</span>}
            {movie.duration && <span>{movie.duration} min</span>}
          </div>
        )}
        
        {/* Book Button */}
        <button 
          className="w-full py-2 bg-primary-500 border border-secondary-400 text-text-primary font-bold text-sm hover:bg-primary-600 transition uppercase tracking-wider rounded shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            // Handle booking action here
            console.log('Book movie:', movie.title);
          }}
        >
          BOOK
        </button>
      </div>
    </div>
  );
}

MovieCard.propTypes = {
  movie: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    posterImage: PropTypes.string,
    genre: PropTypes.string,
    duration: PropTypes.number,
    rating: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
  showAdminActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onClick: PropTypes.func,
};
