import { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import LoadingLogo from '../components/LoadingLogo';
import SnackCard from '../components/snackcard';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { addToCart } from '../utils/cart';
import { useNavigate } from '../hooks/useNavigate';
import toast from 'react-hot-toast';



export default function Snacks() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const returnTo = urlParams.get('returnTo') ? decodeURIComponent(urlParams.get('returnTo')) : null;
  const [snacks, setSnacks] = useState([]);
  const [filteredSnacks, setFilteredSnacks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  // Filter snacks based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredSnacks(snacks);
    } else {
      const filtered = snacks.filter(snack => 
        snack.ProductName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snack.ProductCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snack.ProductDescription?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSnacks(filtered);
    }
  }, [snacks, searchTerm]);

  useEffect(() => {
    // Fetch snacks for all users (no auth required). If the endpoint needs auth,
    // we fall back to trying with a token from localStorage.
    if (hasFetched) return;
    setHasFetched(true);
    setLoading(true);

    const fetchAllSnacks = async () => {
      try {
        // Try public fetch first
        const publicRes = await axios.get(`${API_BASE_URL}/snacks`);
        const snacksData = publicRes.data.snacks || publicRes.data.data || publicRes.data || [];
        setSnacks(snacksData);
        setFilteredSnacks(snacksData);
        setLoading(false);
      } catch (err) {
        console.warn('Public fetch failed, trying with token', err?.message);
        try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('No token');
          const authRes = await axios.get(`${API_BASE_URL}/snacks`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const snacksData = authRes.data.snacks || authRes.data.data || authRes.data || [];
          setSnacks(snacksData);
          setFilteredSnacks(snacksData);
        } catch (err2) {
          console.error('Failed to load snacks:', err2);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAllSnacks();
  }, [hasFetched]);

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">
      <Navbar />
      <div className='w-full flex flex-col items-center'>
        {/* Search Bar Section */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-6 pb-4">
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search snacks by name, category, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="text-center mt-3 text-gray-400 text-sm">
              {filteredSnacks.length} result{filteredSnacks.length !== 1 ? 's' : ''} found for "{searchTerm}"
            </div>
          )}
        </div>

        {/* Content Section */}
        {authLoading ? (
          <div className="flex items-center justify-center min-h-screen w-full">
            <LoadingLogo size={80} text="Loading..." />
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center min-h-screen w-full">
            <LoadingLogo size={80} text="Loading..." />
          </div>
        ) : (
          Array.isArray(filteredSnacks) && filteredSnacks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-8 p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 max-w-7xl mx-auto place-items-center">
              {filteredSnacks.map((snack) => (
                <SnackCard key={snack._id || snack.ProductId} snack={snack} />
              ))}
            </div>
          ) : searchTerm ? (
            <div className="text-center p-4">
              <div className="text-gray-400 mb-2">No snacks found for "{searchTerm}"</div>
              <button 
                onClick={() => setSearchTerm('')}
                className="text-purple-400 hover:text-purple-300 transition-colors duration-200"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="text-center p-4">No snacks available</div>
          )
        )}
        
      </div>
    </div>
  );
}
