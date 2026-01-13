import { Link } from "react-router-dom";
import { useState } from "react";
import LoadingLogo from "./LoadingLogo";

export default function SnackCard({ snack }) {
    const snackId = snack._id || snack.ProductId;
    const hasDiscount = snack.labelledPrice > snack.ProductPrice;
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate loading delay or use actual navigation
        setTimeout(() => {
            window.location.href = `/snacksoverview/${snackId}`;
        }, 800); // Adjust delay as needed
    };

    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-background-900 via-background-800 to-background-900 border border-secondary-400/50 rounded-xl shadow-lg overflow-hidden h-96 flex items-center justify-center">
                <LoadingLogo size={60} />
            </div>
        );
    }

    return (
        <div
            onClick={handleClick}
            className="group relative bg-gradient-to-br from-background-900 via-background-800 to-background-900 border border-secondary-400/50 rounded-xl shadow-lg overflow-hidden transition-all duration-700 ease-out hover:shadow-2xl hover:shadow-primary-500/20 hover:border-primary-500/50 hover:-translate-y-2 cursor-pointer"
        >
            {/* Image Container with Overlay */}
            <div className="relative overflow-hidden">
                <img
                    src={snack.ProductImage && snack.ProductImage[0] ? snack.ProductImage[0] : '/placeholder-snack.jpg'}
                    alt={snack.ProductName || 'Snack'}
                    className="w-full h-64 object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out"></div>

                {/* Discount Badge */}
                {hasDiscount && (
                    <div className="absolute top-3 right-3 bg-semantic-error text-text-primary text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        {Math.round(((snack.labelledPrice - snack.ProductPrice) / snack.labelledPrice) * 100)}% OFF
                    </div>
                )}

                {/* Hover Overlay Content */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out">
                    <div className="bg-primary-500/90 backdrop-blur-sm text-text-primary px-4 py-2 rounded-full font-semibold text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700 ease-out">
                        View Details
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                {/* Category Badge */}
                <div className="mb-3">
                    <span className="inline-block bg-secondary-500/20 text-secondary-300 text-xs font-medium px-3 py-1 rounded-full border border-secondary-400/30">
                        {snack.ProductCategory}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-text-primary text-lg font-bold mb-3 line-clamp-2 group-hover:text-secondary-300 transition-colors duration-700 ease-out">
                    {snack.ProductName}
                </h3>

                {/* Price Section */}
                <div className="mt-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            {hasDiscount ? (
                                <>
                                    <span className="text-text-secondary text-sm line-through">
                                        Rs {snack.labelledPrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-secondary-400 font-bold text-xl">
                                        Rs {snack.ProductPrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </>
                            ) : (
                                <span className="text-secondary-400 font-bold text-xl">
                                    Rs {snack.ProductPrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            )}
                        </div>

                        {/* Stock Indicator */}
                        <div className="flex flex-col items-end">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                snack.ProductQuantity > 20
                                    ? 'bg-semantic-success/20 text-semantic-success border border-semantic-success/30'
                                    : snack.ProductQuantity > 5
                                    ? 'bg-semantic-warning/20 text-semantic-warning border border-semantic-warning/30'
                                    : 'bg-semantic-error/20 text-semantic-error border border-semantic-error/30'
                            }`}>
                                {snack.ProductQuantity > 20 ? 'In Stock' : snack.ProductQuantity > 5 ? 'Low Stock' : 'Limited'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle Border Animation */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/20 to-primary-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out pointer-events-none"></div>
        </div>
    );
}