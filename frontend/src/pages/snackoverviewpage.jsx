import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import SnackImageSlider from "../components/snackimageslider";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";
import LoadingLogo from "../components/LoadingLogo";
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
        return <div className="w-full h-screen flex justify-center items-center"><LoadingLogo /></div>;
    }

    if (status === 'error') {
        return <div className="w-full h-screen flex justify-center items-center text-text-primary">Error loading snack details</div>;
    }

    return (
        <div className="min-h-screen bg-background-900/95 backdrop-blur-sm">
            <Navbar />
            <div className="pt-2 sm:pt-4 px-2 sm:px-4">
                <BackButton to="/snacks" showText={true} text="Back to Snacks" />
            </div>

            {/* Main Content Container - Compact Window */}
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
                <div className="bg-background-800/90 backdrop-blur-md rounded-2xl border border-secondary-400/50 shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border-b border-secondary-400/50 p-4 sm:p-6">
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary text-center">{snack.ProductName}</h1>
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
                            <div className="w-full lg:w-2/3 flex flex-col text-text-primary">

                                {/* Category Badge */}
                                <div className="mb-4">
                                    <span className="inline-block bg-secondary-500/20 text-secondary-300 text-sm font-medium px-3 py-1 rounded-full border border-secondary-400/30">
                                        {snack.ProductCategory}
                                    </span>
                                </div>

                                {/* Price Section - Smaller */}
                                <div className="mb-4">
                                    {snack.labelledPrice > snack.ProductPrice ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-text-secondary text-lg line-through">
                                                Rs {snack.labelledPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-secondary-400 font-bold text-2xl">
                                                    Rs {snack.ProductPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className="bg-semantic-error text-text-primary text-xs font-bold px-2 py-1 rounded-full">
                                                    {Math.round(((snack.labelledPrice - snack.ProductPrice) / snack.labelledPrice) * 100)}% OFF
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-secondary-400 font-bold text-2xl">
                                            Rs {snack.ProductPrice?.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    )}
                                </div>

                                {/* Description - Smaller */}
                                <div className="mb-4">
                                    <h3 className="text-text-secondary font-medium mb-2 text-sm">Description</h3>
                                    <p className="text-text-secondary text-sm leading-relaxed">{snack.ProductDescription || 'No description available'}</p>
                                </div>

                                {/* Stock Info - Smaller */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-text-secondary text-sm">Stock:</span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                            snack.ProductQuantity > 20
                                                ? 'bg-semantic-success/20 text-semantic-success border border-semantic-success/30'
                                                : snack.ProductQuantity > 5
                                                ? 'bg-semantic-warning/20 text-semantic-warning border border-semantic-warning/30'
                                                : 'bg-semantic-error/20 text-semantic-error border border-semantic-error/30'
                                        }`}>
                                            {snack.ProductQuantity} items available
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons - Smaller */}
                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    <button
                                        onClick={handleAddToCart}
                                        className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-text-primary font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-primary-500/25 text-sm w-full sm:w-auto border border-primary-500/30">
                                        Add to Cart
                                    </button>
                                    <button
                                        onClick={handleBuyNow}
                                        className="bg-gradient-to-r from-semantic-success to-green-700 hover:from-green-700 hover:to-green-800 text-text-primary font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-green-500/25 text-sm w-full sm:w-auto border border-semantic-success/30">
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