const mongoose = require('mongoose');

const snackSchema = new mongoose.Schema(
    {
        ProductId: {
            type: String,
            required: true,
        },
        ProductName: {
            type: String,
            required: true,
        },
        labelledPrice: {
            type: Number,
            required: true,
        },
        ProductPrice: {
            type: Number,
            required: true,
        },
        ProductQuantity: {
            type: Number,
            required: true,
        },
        ProductCategory: {
            type: String,
            required: true,
        },
        ProductImage: {
            type: [String],
            default: [],
            
        },
        ProductDescription: {
            type: String,
            required: true,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Snack', snackSchema);
        