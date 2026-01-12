export default function Modal({ isOpen, title, message, children, onClose, onConfirm, confirmText = 'OK', theme = 'default' }) {
  if (!isOpen) return null;

  // Theme classes
  const themeStyles = {
    default: {
      container: 'bg-surface-600 border-secondary-400',
      title: 'text-text-primary',
      message: 'text-text-secondary',
      button: 'bg-primary-500 hover:bg-primary-600',
    },
    success: {
      container: 'bg-semantic-success/20 border-semantic-success',
      title: 'text-text-primary',
      message: 'text-text-secondary',
      button: 'bg-semantic-success hover:bg-semantic-success/80',
    },
  };
  const styles = themeStyles[theme] || themeStyles.default;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 max-w-sm w-full mx-4 border shadow-2xl ${styles.container}`}>
        <h2 className={`text-2xl font-bold mb-4 ${styles.title}`}>{title}</h2>
        <p className={`mb-6 ${styles.message}`}>{message}</p>
        {children}
        <div className="flex gap-4">
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-2 text-white font-bold rounded-lg transition ${styles.button}`}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className={`w-full py-2 text-white font-bold rounded-lg transition ${styles.button}`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
