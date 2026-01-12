import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import SnackImageSlider from "../components/snackimageslider";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";
import { addToCart as addToCartUtil, getCart as getCartUtil } from "../utils/cart";

export default function SnackOverviewPage() {
    const params = useParams();
    const navigate = useNavigate();
    const [snack, setSnack] = useState(null);
    const [status, setStatus] = useState('loading');

    const handleAddToCart = () => {
        addToCartUtil(snack, 1);
        toast.success("Product added to cart");
        console.log(getCartUtil());
        navigate('/cart');
    };

    const handleBuyNow = () => {
        addToCartUtil(snack, 1);
        navigate('/checkout', { state: { items: getCartUtil() } });
    };

    useEffect(() => {
        if (status === 'loading') {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5008';
            const apiUrl = `${apiBaseUrl}/api/snacks/${params.snackid}`;
            console.log('API URL:', apiUrl);
            axios.get(apiUrl)
                .then((response) => {
                    console.log('Snack data:', response.data); // Debug log
                    setSnack(response.data.snack); // Extract snack from nested response
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
                <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl mb-1 sm:mb-2">{snack.ProductCategory}</p>
                
                
                <div className="mb-3 sm:mb-4 lg:mb-6">
                    {snack.labelledPrice > snack.ProductPrice ? (
                        <>
                            <span className="line-through text-gray-500 text-sm sm:text-base md:text-lg lg:text-xl">Rs {snack.labelledPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> 
                            <span className="text-purple-400 ml-2 sm:ml-3 font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">Rs {snack.ProductPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </>
                    ) : (
                        <span className="text-purple-400 font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">Rs {snack.ProductPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    )}
                </div>
                
                <p className="text-gray-300 mb-4 sm:mb-5 lg:mb-6 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed break-words word-wrap overflow-wrap-anywhere hyphens-auto max-w-full">{snack.ProductDescription || 'No description available'}</p>
                
                <div className="mb-4 sm:mb-5 lg:mb-6">
                    <p className="text-gray-400 text-xs sm:text-sm md:text-base">Stock: <span className="text-white font-semibold">{snack.ProductQuantity} items</span></p>
                </div>
               
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 w-full">
                    <button 
                        onClick={handleAddToCart}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 lg:py-3 lg:px-8 rounded-lg transition-colors text-sm sm:text-base lg:text-lg w-full sm:w-auto">
                        Add to Cart
                    </button>
                    <button 
                        onClick={handleBuyNow}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 lg:py-3 lg:px-8 rounded-lg transition-colors text-sm sm:text-base lg:text-lg w-full sm:w-auto">
                        Buy Now
                    </button>
                </div>
                
            </div>
            </div>
            </div>
        </div>

    );
}