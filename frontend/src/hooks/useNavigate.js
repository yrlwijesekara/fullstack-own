import { useNavigate as useRouterNavigate } from 'react-router-dom';

/**
 * Custom navigation hook that wraps React Router's useNavigate
 * Provides a consistent interface for navigation throughout the app
 */
export function useNavigate() {
  const navigate = useRouterNavigate();
  
  return (path, options) => {
    navigate(path, options);
  };
}
