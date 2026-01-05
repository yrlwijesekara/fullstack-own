import { useNavigate } from '../hooks/useNavigate';

export default function BackButton({
  to = '/',
  className = '',
  showText = false,
  text = 'Back',
  size = 'md',
  variant = 'default' // 'default' or 'round'
}) {
  const navigate = useNavigate();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  const variantClasses = {
    default: 'rounded-lg',
    round: 'rounded-full'
  };

  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-text-primary transition-colors duration-200 shadow-lg font-medium ${buttonClasses[size]} ${variantClasses[variant]} ${className}`}
      aria-label="Go back"
    >
      <svg
        className={sizeClasses[size]}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      {showText && (
        <span className="hidden sm:inline text-sm font-medium">
          {text}
        </span>
      )}
    </button>
  );
}