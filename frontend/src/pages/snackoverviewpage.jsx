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
        <div className="min-h-screen bg-gray-900">
            <Navbar />
            <div className="pt-2 sm:pt-4 px-2 sm:px-4">
                <BackButton to="/snacks" showText={true} text="Back to Snacks" />
            </div>
            <div className="p-6 ">
            <div className="w-full min-h-screen flex flex-col lg:flex-row justify-center items-center lg:items-start bg-gray-900 px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"> 
        
            <div className="w-full lg:w-[49%] xl:w-[45%] flex justify-center items-center mb-6 lg:mb-0">
                <SnackImageSlider images={snack.ProductImage || []} />
            </div>
            <div className="w-full lg:w-[49%] xl:w-[50%] flex flex-col justify-start items-start p-2 sm:p-4 md:p-6 lg:p-8 text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">{snack.ProductName}</h1>
                <div className="mb-4">
                    <span className="inline-block bg-purple-600/20 text-purple-300 text-sm sm:text-base md:text-lg font-medium px-4 py-2 rounded-full border border-purple-500/30">
                        {snack.ProductCategory}
                    </span>
                </div>


                <div className="mb-6 sm:mb-8">
                    {snack.labelledPrice > snack.ProductPrice ? (
                        <div className="flex flex-col gap-2">
                            <span className="text-gray-400 text-lg sm:text-xl md:text-2xl line-through">
                                Rs {snack.labelledPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-purple-400 font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                                    Rs {snack.ProductPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                                    {Math.round(((snack.labelledPrice - snack.ProductPrice) / snack.labelledPrice) * 100)}% OFF
                                </span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-purple-400 font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                            Rs {snack.ProductPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    )}
                </div>
                
                <p className="text-gray-300 mb-4 sm:mb-5 lg:mb-6 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed break-words word-wrap overflow-wrap-anywhere hyphens-auto max-w-full">{snack.ProductDescription || 'No description available'}</p>
                
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm sm:text-base">Stock:</span>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
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

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full">
                    <button
                        onClick={handleAddToCart}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:scale-105 text-sm sm:text-base lg:text-lg w-full sm:w-auto border border-purple-500/30">
                        Add to Cart
                    </button>
                    <button
                        onClick={handleBuyNow}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-105 text-sm sm:text-base lg:text-lg w-full sm:w-auto border border-green-500/30">
                        Buy Now
                    </button>
                </div>
                
            </div>
            </div>
            </div>
        </div>

    );
}