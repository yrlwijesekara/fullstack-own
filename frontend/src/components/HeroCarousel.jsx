import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * HeroCarousel Component - Featured movies carousel with auto-play and navigation
 * @param {Array} movies - Array of featured movie objects
 * @param {boolean} autoPlay - Auto-advance slides (default: true)
 * @param {number} interval - Milliseconds between slides (default: 5000)
 */
export default function HeroCarousel({ movies = [], autoPlay = true, interval = 5000 }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Auto-advance functionality
  useEffect(() => {
    if (!autoPlay || movies.length === 0 || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % movies.length);
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoPlay, interval, movies.length, isPaused]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % movies.length);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Empty state - no movies to display
  if (movies.length === 0) {
    return (
      <div className="relative w-full h-[400px] md:h-[500px] bg-surface-500 flex items-center justify-center border-b border-secondary-400">
        <div className="text-center">
          <div className="text-secondary-400 text-8xl mb-4">🎬</div>
          <p className="text-text-secondary text-xl md:text-2xl uppercase tracking-widest font-bold">
            Featured Movie Carousel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[400px] md:h-[500px] bg-surface-600 overflow-hidden group border-b border-secondary-400"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides */}
      {movies.map((movie, index) => (
        <div
          key={movie.id || index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          {movie.posterImage ? (
            <img 
              src={movie.posterImage} 
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-surface-500 flex items-center justify-center">
              <div className="text-secondary-400 text-9xl">🎬</div>
            </div>
          )}
          
          {/* Overlay with Movie Info */}
          <div className="absolute inset-0 bg-gradient-to-t from-background-900 via-background-900/70 to-transparent flex flex-col items-center justify-center px-4">
            <h2 className="text-text-primary text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-widest text-center mb-4 drop-shadow-lg">
              {movie.title}
            </h2>
            
            {/* Movie Details */}
            <div className="flex items-center gap-4 text-text-secondary text-sm md:text-base mb-6">
              {movie.rating && (
                <span className="border-2 border-secondary-300 px-2 py-1 font-bold text-secondary-300">{movie.rating}</span>
              )}
              {movie.genre && <span>{movie.genre}</span>}
              {movie.duration && (
                <>
                  <span>•</span>
                  <span>{movie.duration} min</span>
                </>
              )}
            </div>

            {/* Action Button */}
            <button className="bg-primary-500 border border-secondary-400 text-text-primary px-8 py-3 font-bold text-sm md:text-base hover:bg-primary-600 transition uppercase tracking-wider rounded-lg shadow-lg">
              BOOK NOW
            </button>
          </div>
        </div>
      ))}

      {/* Previous Button */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-surface-600 border border-secondary-400 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-surface-500 transition opacity-0 group-hover:opacity-100 z-20 shadow-lg rounded"
        aria-label="Previous slide"
      >
        <span className="text-2xl md:text-3xl font-bold text-text-primary">‹</span>
      </button>

      {/* Next Button */}
      <button
        onClick={goToNext}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-surface-600 border border-secondary-400 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-surface-500 transition opacity-0 group-hover:opacity-100 z-20 shadow-lg rounded"
        aria-label="Next slide"
      >
        <span className="text-2xl md:text-3xl font-bold text-text-primary">›</span>
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full border-2 border-secondary-300 transition-all hover:scale-110 ${
              index === currentSlide ? 'bg-secondary-300 scale-110' : 'bg-transparent'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentSlide ? 'true' : 'false'}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 bg-surface-600 bg-opacity-80 text-text-primary border border-secondary-400 px-3 py-1 text-sm font-bold z-20 rounded">
        {currentSlide + 1} / {movies.length}
      </div>
    </div>
  );
}

HeroCarousel.propTypes = {
  movies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string.isRequired,
      posterImage: PropTypes.string,
      genre: PropTypes.string,
      duration: PropTypes.number,
      rating: PropTypes.string,
    })
  ),
  autoPlay: PropTypes.bool,
  interval: PropTypes.number,
};
