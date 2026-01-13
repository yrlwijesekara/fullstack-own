import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import SnackImageSlider from "../components/snackimageslider";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";
import { addToCart as addToCartUtil, getCart as getCartUtil } from "../utils/cart";
import { API_BASE_URL } from "../utils/api";

export default function SnackOverviewPage() {
    const params = useParams();
    const navigate = useNavigate();
    const [snack, setSnack] = useState(null);
    const [status, setStatus] = useState('loading');

    const handleAddToCart = () => {
        addToCartUtil(snack, 1);
        toast.success("Product added to cart");
        console.log(getCartUtil());
        // Small delay to ensure toast is shown before navigation
        setTimeout(() => navigate('/cart'), 100);
    };

    const handleBuyNow = () => {
        addToCartUtil(snack, 1);
        navigate('/cart');
    };

    useEffect(() => {
        if (status === 'loading') {
            const apiUrl = `${API_BASE_URL}/snacks/${params.snackid}`;
            console.log('API URL:', apiUrl);
            axios.get(apiUrl)
                .then((response) => {
                    console.log('Snack data:', response.data); // Debug log
                    setSnack(response.data.snack || response.data); // Handle both nested and direct response
                    setStatus('loaded');
                }).catch((error) => {
                    console.error('Error fetching snack details:', error);
                    console.error('Error response:', error.response);
                    setStatus('error');
                });
        }
    }, [status, params.snackid]);

    if (status === 'loading') {
        return <div className="w-full h-screen flex justify-center items-center text-white">Loading...</div>;
    }

    if (status === 'error' || !snack) {
        return <div className="w-full h-screen flex justify-center items-center text-white">Error loading snack details</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900/95 backdrop-blur-sm">
            <Navbar />
            <div className="pt-2 sm:pt-4 px-2 sm:px-4">
                <BackButton to="/snacks" showText={true} text="Back to Snacks" />
            </div>

            {/* Main Content Container - Compact Window */}
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
                <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-gray-700/50 p-4 sm:p-6">
                        <h1 className="text-xl sm:text-2xl font-bold text-white text-center">{snack.ProductName}</h1>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row gap-6">

                            {/* Image Section - Smaller */}
                            <div className="w-full lg:w-1/3 flex justify-center">
                                <div className="w-full max-w-sm">
                                    <SnackImageSlider images={snack.ProductImage || []} />
                                </div>
                            </div>

                            {/* Details Section - More Compact */}
                            <div className="w-full lg:w-2/3 flex flex-col text-white">

                                {/* Category Badge */}
                                <div className="mb-4">
                                    <span className="inline-block bg-purple-600/20 text-purple-300 text-sm font-medium px-3 py-1 rounded-full border border-purple-500/30">
                                        {snack.ProductCategory}
                                    </span>
                                </div>

                                {/* Price Section - Smaller */}
                                <div className="mb-4">
                                    {snack.labelledPrice > snack.ProductPrice ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-400 text-lg line-through">
                                                Rs {snack.labelledPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-purple-400 font-bold text-2xl">
                                                    Rs {snack.ProductPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                    {Math.round(((snack.labelledPrice - snack.ProductPrice) / snack.labelledPrice) * 100)}% OFF
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-purple-400 font-bold text-2xl">
                                            Rs {snack.ProductPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    )}
                                </div>

                                {/* Description - Smaller */}
                                <div className="mb-4">
                                    <h3 className="text-gray-300 font-medium mb-2 text-sm">Description</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed">{snack.ProductDescription || 'No description available'}</p>
                                </div>

                                {/* Stock Info - Smaller */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-sm">Stock:</span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                            snack.ProductQuantity > 20
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : snack.ProductQuantity > 5
                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        }`}>
                                            {snack.ProductQuantity} items available
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons - Smaller */}
                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    <button
                                        onClick={handleAddToCart}
                                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-purple-500/25 text-sm w-full sm:w-auto border border-purple-500/30">
                                        Add to Cart
                                    </button>
                                    <button
                                        onClick={handleBuyNow}
                                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-green-500/25 text-sm w-full sm:w-auto border border-green-500/30">
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}