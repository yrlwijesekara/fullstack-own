import mongoose from 'mongoose';

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
            type: String,
            required: true,
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

export default mongoose.model('Snack', snackSchema);
        