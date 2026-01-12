import { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import SnackCard from '../components/snackcard';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { AuthContext } from '../context/AuthContext';



export default function Concession() {
  const { user, loading: authLoading } = useContext(AuthContext);
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
    // Wait for auth to finish loading and only fetch if user is authenticated and haven't fetched yet
    if (!authLoading && user && loading && !hasFetched) {
      setHasFetched(true); // Set flag immediately to prevent multiple calls
      console.log('API Base URL:', API_BASE_URL);
      console.log('Full URL:', `${API_BASE_URL}/snacks`);
      console.log('User authenticated:', user);
      
      axios.get(`${API_BASE_URL}/snacks`, {
        withCredentials: true
      })
        .then((response) => {
          console.log('Response received:', response);
          console.log('Response data:', response.data);
          console.log('Snacks array:', response.data.snacks);
          console.log('Is response.data.snacks an array?', Array.isArray(response.data.snacks));
          const snacksData = response.data.snacks || [];
          setSnacks(snacksData);
          setFilteredSnacks(snacksData);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching snacks:', error);
          console.error('Error message:', error.message);
          console.error('Error response:', error.response);
          setLoading(false);
        });
    } else if (!authLoading && !user) {
      // User is not authenticated, stop loading
      console.log('User not authenticated');
      setLoading(false);
    }
  }, [authLoading, user, loading, hasFetched]);

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
          <div className="text-center p-4">Loading...</div>
        ) : !user ? (
          <div className="text-center p-4">Please log in to view snacks</div>
        ) : loading ? (
          <div className="text-center p-4">Loading snacks...</div>
        ) : (
          Array.isArray(filteredSnacks) && filteredSnacks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 max-w-7xl mx-auto">
              {filteredSnacks.map((snack) => (
                <SnackCard key={snack.id || snack._id} snack={snack} />
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