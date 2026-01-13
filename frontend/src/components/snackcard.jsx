import { Link } from "react-router-dom";

export default function SnackCard({ snack }) {
    const snackId = snack._id || snack.ProductId;
    const hasDiscount = snack.labelledPrice > snack.ProductPrice;

    return (
        <Link
            to={`/snacksoverview/${snackId}`}
            className="group relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 rounded-xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-500/50 hover:-translate-y-2 cursor-pointer"
        >
            {/* Image Container with Overlay */}
            <div className="relative overflow-hidden">
                <img
                    src={snack.ProductImage && snack.ProductImage[0] ? snack.ProductImage[0] : '/placeholder-snack.jpg'}
                    alt={snack.ProductName || 'Snack'}
                    className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Discount Badge */}
                {hasDiscount && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        {Math.round(((snack.labelledPrice - snack.ProductPrice) / snack.labelledPrice) * 100)}% OFF
                    </div>
                )}

                {/* Hover Overlay Content */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="bg-purple-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full font-semibold text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        View Details
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                {/* Category Badge */}
                <div className="mb-3">
                    <span className="inline-block bg-purple-600/20 text-purple-300 text-xs font-medium px-3 py-1 rounded-full border border-purple-500/30">
                        {snack.ProductCategory}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-white text-lg font-bold mb-3 line-clamp-2 group-hover:text-purple-300 transition-colors duration-300">
                    {snack.ProductName}
                </h3>

                {/* Price Section */}
                <div className="mt-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            {hasDiscount ? (
                                <>
                                    <span className="text-gray-400 text-sm line-through">
                                        Rs {snack.labelledPrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-purple-400 font-bold text-xl">
                                        Rs {snack.ProductPrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </>
                            ) : (
                                <span className="text-purple-400 font-bold text-xl">
                                    Rs {snack.ProductPrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            )}
                        </div>

                        {/* Stock Indicator */}
                        <div className="flex flex-col items-end">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                snack.ProductQuantity > 20
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : snack.ProductQuantity > 5
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                                {snack.ProductQuantity > 20 ? 'In Stock' : snack.ProductQuantity > 5 ? 'Low Stock' : 'Limited'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle Border Animation */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </Link>
    );
}