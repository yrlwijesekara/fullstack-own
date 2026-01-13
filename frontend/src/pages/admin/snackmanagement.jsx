import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { BiTrash, BiEdit, BiArrowBack } from "react-icons/bi";
import { API_BASE_URL } from "../../utils/api";
import toast from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext";



const sampleSnacks = [
   
];  

export default function SnackManagement() {
    const { user } = useContext(AuthContext);
    const [snacks, setSnacks] = useState(sampleSnacks);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    
    useEffect(() => {
        const fetchSnacks = async () => {
            try {
                setIsLoading(true);
                
                // Try to fetch from backend with credentials (like ShowtimeManagement)
                const response = await fetch(`${API_BASE_URL}/snacks`, {
                    credentials: "include", // This includes httpOnly cookies
                });

                if (!response.ok) {
                    // If fetch fails, try with token from localStorage
                    const token = localStorage.getItem('token');
                    if (token) {
                        const axiosResponse = await axios.get(`${API_BASE_URL}/snacks`, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });
                        
                        console.log('Fetched snacks with token:', axiosResponse.data);
                        
                        // Handle different response structures
                        if (axiosResponse.data && axiosResponse.data.snacks) {
                            setSnacks(axiosResponse.data.snacks);
                        } else if (Array.isArray(axiosResponse.data)) {
                            setSnacks(axiosResponse.data);
                        } else {
                            console.log('Unexpected response structure:', axiosResponse.data);
                        }
                        
                        setIsLoading(false);
                        return;
                    }
                    throw new Error('Authentication required');
                }

                // If fetch succeeds, handle the response
                const data = await response.json();
                console.log('Fetched snacks with cookies:', data);
                
                if (data && data.snacks) {
                    setSnacks(data.snacks);
                } else if (Array.isArray(data)) {
                    setSnacks(data);
                } else {
                    console.log('Unexpected response structure:', data);
                }
                
            } catch (error) {
                console.error('Error fetching snacks:', error);
                console.log('Using sample data - User authentication status:', user ? 'Logged in' : 'Not logged in');
                
                if (user) {
                    toast('Could not load snacks from database. Using sample data.');
                } else {
                    toast('Login to see live inventory. Showing sample data.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchSnacks();
    }, [user]);

  


    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-900 text-text-primary w-full">
                {/* Header with back button */}
                <div className="flex items-center justify-between p-6">
                    <Link 
                        to="/admin-dashboard" 
                        className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
                    >
                        <BiArrowBack className="text-2xl" />
                        <span className="text-lg font-medium">Back to Admin Dashboard</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-center flex-1">Snack Management</h1>
                    <div className="w-48"></div> 
                </div>
                
                {/* Loading State */}
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mb-4"></div>
                    <p className="text-text-secondary text-lg">Loading snacks data...</p>
                    <p className="text-text-muted text-sm mt-2">Please wait while we fetch the latest inventory</p>
                </div>
            </div>
        );
    }

    return (
       <div className="min-h-screen bg-background-900 text-text-primary w-full">
         {/* Header with back button */}
         <div className="flex items-center justify-between p-6 ">
            <Link 
                to="/admin-dashboard" 
                className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
            >
                <BiArrowBack className="text-2xl" />
                <span className="text-lg font-medium">Back to Admin Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold text-center flex-1">Snack Management</h1>
            <div className="w-48"></div> 
         </div>
         
         <div className="p-4">
            
            
            {/* Table Container */}
            <div className="overflow-x-auto bg-surface-600 rounded-lg border border-surface-400/40 m-6 w-[80%] mx-auto">
                <table className="w-full min-w-[1000px] text-[20px] text-left">
                    <thead className="bg-background-800 border-b border-surface-400/40">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-text-primary">Product ID</th>
                            <th className="px-4 py-3 font-semibold text-text-primary">Product Name</th>
                            <th className="px-4 py-3 font-semibold text-text-primary">Image</th>
                            <th className="px-4 py-3 font-semibold text-text-primary">Category</th>
                            
                            <th className="px-4 py-3 font-semibold text-text-primary">Labelled Price</th>
                            <th className="px-4 py-3 font-semibold text-text-primary">Selling Price</th>
                            <th className="px-4 py-3 font-semibold text-text-primary">Quantity</th>
                            <th className="px-4 py-3 font-semibold text-text-primary">Status</th>
                            <th className="px-4 py-3 font-semibold text-text-primary">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {snacks.map((snack, index) => (
                            <tr key={snack._id || `${snack.ProductId}-${index}`} className={`border-b border-surface-400/20 hover:bg-background-800/50 ${index % 2 === 0 ? 'bg-background-900/30' : 'bg-surface-600/30'}`}>
                                <td className="px-4 py-3 font-mono text-sm text-gray-300">{snack.ProductId}</td>
                                <td className="px-4 py-3 font-mono text-sm text-text-primary">{snack.ProductName}</td>
                                <td className="px-4 py-3">
                                    {snack.ProductImage && snack.ProductImage.length > 0 ? (
                                        <img
                                            src={snack.ProductImage[0]}
                                            alt={snack.ProductName}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-surface-500 flex items-center justify-center rounded text-sm text-text-muted">
                                            No Image
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="bg-primary-600 px-2 py-1 rounded text-xs text-white capitalize">
                                        {snack.ProductCategory}
                                    </span>
                                </td>
                                
                                <td className="px-4 py-3 text-gray-500 line-through">Rs {snack.labelledPrice}</td>
                                <td className="px-4 py-3 font-bold text-green-400">Rs {snack.ProductPrice}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded text-xs ${snack.ProductQuantity > 50 ? 'bg-green-600 text-white' : snack.ProductQuantity > 20 ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white'}`}>
                                        {snack.ProductQuantity}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded text-xs ${snack.isAvailable ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                        {snack.isAvailable ? 'Available' : 'Out of Stock'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => {
                                                const snackId = snack._id || snack.ProductId;
                                                navigate(`/admin-dashboard/updatesnack/${snackId}`, {
                                                    state: snack 
                                                });
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-2xl transition-colors"
                                        >
                                           <BiEdit />
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                // Add confirmation dialog
                                                const confirmDelete = window.confirm(`Are you sure you want to delete "${snack.ProductName}"? This action cannot be undone.`);
                                                if (!confirmDelete) return;

                                                if (!user) {
                                                    toast.error('Please login to delete snacks');
                                                    navigate('/login');
                                                    return;
                                                }

                                                try {
                                                    // Use _id for deletion (MongoDB ObjectId) instead of ProductId
                                                    const deleteEndpoint = snack._id ? 
                                                        `${API_BASE_URL}/snacks/${snack._id}` : 
                                                        `${API_BASE_URL}/snacks/${snack.ProductId}`;
                                                    
                                                    console.log('Deleting snack:', deleteEndpoint);
                                                    
                                                    let response;
                                                    
                                                    // Try with credentials first (httpOnly cookies)
                                                    try {
                                                        response = await fetch(deleteEndpoint, {
                                                            method: 'DELETE',
                                                            credentials: "include",
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                            },
                                                        });
                                                        
                                                        if (!response.ok) {
                                                            throw new Error('Cookie auth failed');
                                                        }
                                                        
                                                        console.log("Snack deleted successfully with cookies");
                                                    } catch (cookieError) {
                                                        console.log('Cookie auth failed, trying with token:', cookieError.message);
                                                        
                                                        // Fallback to localStorage token
                                                        const token = localStorage.getItem('token');
                                                        if (!token) {
                                                            toast.error('Authentication required. Please log in again.');
                                                            navigate('/login');
                                                            return;
                                                        }
                                                        
                                                        response = await axios.delete(deleteEndpoint, {
                                                            headers: {
                                                                Authorization: `Bearer ${token}`,                       
                                                            },
                                                        });
                                                        
                                                        console.log("Snack deleted successfully with token");
                                                    }
                                                    
                                                    toast.success('Snack deleted successfully');
                                                    
                                                    // Remove snack from state using both _id and ProductId for safety
                                                    setSnacks(snacks.filter(s => 
                                                        s._id !== snack._id && s.ProductId !== snack.ProductId
                                                    ));
                                                    
                                                } catch (error) {
                                                    console.error("Error deleting snack:", error);
                                                    
                                                    if (error.response?.status === 401 || error.status === 401) {
                                                        toast.error('Authentication failed. Please login again.');
                                                        navigate('/login');
                                                    } else if (error.response?.status === 404 || error.status === 404) {
                                                        toast.error('Snack not found.');
                                                    } else if (error.response?.data?.message) {
                                                        toast.error(error.response.data.message);
                                                    } else {
                                                        toast.error('Error deleting snack. Please try again.');
                                                    }
                                                }
                                            }}
                                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-2xl transition-colors"
                                        >
                                            <BiTrash />
                                        </button>
                                        
                                       
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         </div>

         <Link to="/admin-dashboard/addsnack" className="fixed right-[60px] bottom-[60px] bg-primary-500 hover:bg-primary-600 text-white font-bold p-4 rounded-full shadow-lg ">
             Add New Snack
         </Link>
        </div>
    );
}
