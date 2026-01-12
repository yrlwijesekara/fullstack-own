import { useState, useContext } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import MediaUpload from "../../utils/mediaupload";
import { AuthContext } from "../../context/AuthContext";
import { API_BASE_URL } from "../../utils/api";






export default function UpdateSnacks() {
    const { id } = useParams();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const [productId, setProductId] = useState(location.state?.ProductId );
    const [productName, setProductName] = useState(location.state?.ProductName );
    const [labelledPrice, setLabelledPrice] = useState(location.state?.labelledPrice );
    const [productPrice, setProductPrice] = useState(location.state?.ProductPrice );
    const [productQuantity, setProductQuantity] = useState(location.state?.ProductQuantity );
    const [productCategory, setProductCategory] = useState(location.state?.ProductCategory );
    const [productImage, setProductImage] = useState([]);
    const [productDescription, setProductDescription] = useState(location.state?.ProductDescription );
    const [isAvailable, setIsAvailable] = useState(location.state?.isAvailable);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();
    

  


   async function handleSubmit(e) {
        e.preventDefault();
        setUploading(true);

        try {
            // Basic validation
            if (!productId || !productName || !productPrice || !labelledPrice || !productQuantity) {
                toast.error('Please fill in all required fields (ID, Name, Price, Label Price, Quantity)');
                setUploading(false);
                return;
            }

            // Check if images are selected or if we have existing images
            if (!productImage || productImage.length === 0) {
                // No new images selected, check if we have existing images
                if (!location.state?.ProductImage || location.state.ProductImage.length === 0) {
                    toast.error("Please select at least one image");
                    setUploading(false);
                    return;
                }
                // We have existing images, so we'll use those
            }

            // Validate description length
            if (!productDescription || productDescription.length < 10) {
                toast.error("Description must be at least 10 characters");
                setUploading(false);
                return;
            }

            // Validate numeric fields
            if (isNaN(productPrice) || parseFloat(productPrice) <= 0) {
                toast.error('Please enter a valid product price (greater than 0)');
                setUploading(false);
                return;
            }

            if (isNaN(labelledPrice) || parseFloat(labelledPrice) <= 0) {
                toast.error('Please enter a valid labelled price (greater than 0)');
                setUploading(false);
                return;
            }

            if (isNaN(productQuantity) || parseInt(productQuantity) <= 0) {
                toast.error('Please enter a valid quantity (greater than 0)');
                setUploading(false);
                return;
            }

            // Check if user is authenticated
            if (!user) {
                toast.error('Please log in to continue');
                navigate('/login');
                setUploading(false);
                return;
            }

            toast.loading("Processing images...");

            // Upload each image file and collect URLs
            const promisesArray = [];

            for (let i = 0; i < productImage.length; i++) {
                if (!productImage[i]) continue; // Skip null or undefined files
                promisesArray.push(MediaUpload(productImage[i]));
            }

            let finalImages = [];

            if (promisesArray.length > 0) {
                // Upload new images
                const responses = await Promise.all(promisesArray);
                finalImages = responses;
                toast.dismiss();
                console.log("Uploaded new image URLs:", responses);
            } else {
                // No new images to upload, use existing images
                finalImages = location.state?.ProductImage || [];
                toast.dismiss();
                console.log("Using existing images:", finalImages);
            }

            const snackData = {
                ProductId: productId.trim(),
                ProductName: productName.trim(),
                labelledPrice: parseFloat(labelledPrice),
                ProductPrice: parseFloat(productPrice),
                ProductQuantity: parseInt(productQuantity),
                ProductCategory: productCategory,
                ProductImage: finalImages,
                ProductDescription: productDescription.trim(),
                isAvailable: isAvailable,
            };

            // Loading toast for API call
            const loadingToast = toast.loading('Updating snack...');
            
            let response;
            
            // Try with credentials first (httpOnly cookies)
            try {
                response = await fetch(`${API_BASE_URL}/snacks/${id}`, {
                    method: 'PUT',
                    credentials: "include",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(snackData),
                });
                
                if (!response.ok) {
                    throw new Error('Cookie auth failed');
                }
                
                console.log("Snack updated successfully with cookies");
            } catch (cookieError) {
                console.log('Cookie auth failed, trying with token:', cookieError.message);
                
                // Fallback to localStorage token
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('Authentication required. Please login again.');
                    navigate('/login');
                    setUploading(false);
                    return;
                }
                
                response = await axios.put(`${API_BASE_URL}/snacks/${id}`, snackData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                
                console.log("Snack updated successfully with token");
            }

            toast.dismiss(loadingToast);
            toast.success('Snack updated successfully!');
            
            // Clear form
            setProductId('');
            setProductName('');
            setLabelledPrice('');
            setProductPrice('');
            setProductQuantity('');
            setProductCategory('chips');
            setProductImage([]);
            setProductDescription('');
            setIsAvailable('true');
            
            navigate('/admin-dashboard/snack-management');
            
        } catch (error) {
            toast.dismiss();
            console.error('Error updating snack:', error);
            
            if (error.response) {
                if (error.response.status === 401) {
                    toast.error('Session expired. Please log in again.');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else if (error.response.status === 400) {
                    toast.error('Invalid data provided. Please check your inputs.');
                } else {
                    toast.error('Server error occurred. Please try again.');
                }
            } else {
                toast.error('Cannot connect to server. Please check if backend is running.');
            }
        } finally {
            setUploading(false);
        }
    }


    return (
        <div className="min-h-screen bg-background-900 text-text-primary flex justify-center items-center">
            
            <div className="w-[900px]  bottom-60 bg-background-800 rounded-lg mt-20 p-6">
                <div className="w-full mb-4 flex flex-col">
                    <label className="text-text-primary text-lg font-semibold">Snack ID</label>
                    <input
                     disabled
                     onChange={
                        (e) => {setProductId(e.target.value)}
                    } value={productId}
                    type="text" className="w-full p-2 mt-2 mb-4 bg-background-700 text-text-primary rounded"/>
                </div>
                <div className="w-full mb-4 flex flex-col">
                    <label className="text-text-primary text-lg font-semibold">Snack Name</label>
                    <input
                     onChange={(e) => {setProductName(e.target.value)}}
                     value={productName}
                     type="text" className="w-full p-2 mt-2 mb-4 bg-background-700 text-text-primary rounded"/>
                </div>
                <div className="w-full mb-4 flex flex-col">
                    <label className="text-text-primary text-lg font-semibold">Snack Label Price</label>
                    <input 
                    onChange={(e) => {setLabelledPrice(e.target.value)}}
                    value={labelledPrice}
                    type="number" className="w-full p-2 mt-2 mb-4 bg-background-700 text-text-primary rounded"/>
                </div>
                <div className="w-full mb-4 flex flex-col">
                    <label className="text-text-primary text-lg font-semibold">Snack price</label>
                    <input
                     onChange={(e) => {setProductPrice(e.target.value)}}
                        value={productPrice}
                     type="number" className="w-full p-2 mt-2 mb-4 bg-background-700 text-text-primary rounded"/>
                </div>
                <div className="w-full mb-4 flex flex-col">
                    <label className="text-text-primary text-lg font-semibold">Quantity</label>
                    <input
                     onChange={(e) => {setProductQuantity(e.target.value)}}
                        value={productQuantity}
                     type="number" className="w-full p-2 mt-2 mb-4 bg-background-700 text-text-primary rounded"/>
                </div>
                <div className="w-full mb-4 flex flex-col">
                    <label className="text-text-primary text-lg font-semibold">Category</label>
                    <select 
                    onChange={(e) => {setProductCategory(e.target.value)}}
                        value={productCategory}
                    className="w-full p-2 mt-2 mb-4 bg-background-700 text-text-primary rounded">
                        <option value="chips">Chips</option>
                        <option value="chocolate">Chocolate</option>
                        <option value="drinks">Drinks</option>
                        <option value="candy">Candy</option>
                    </select>
                </div>
                <div className="w-full mb-4 flex flex-col">
                    <label className="text-text-primary text-lg font-semibold">Image</label>
                    <input 
                    onChange={(e) => {setProductImage(e.target.files)}}
                    
                    type="file"
                    multiple
                    accept="image/*"
                     className="w-full p-2 mt-2 mb-4 bg-background-700 text-text-primary rounded"/>
                </div>
                <div className="w-full mb-4 flex flex-col">
                    <label className="text-text-primary text-lg font-semibold">Description</label>
                    <textarea 
                    onChange={(e) => {setProductDescription(e.target.value)}}
                    value={productDescription}
                    className="w-full p-2 mt-2 mb-4 bg-background-700 text-text-primary rounded"/>
                </div>
                <div className="w-full mb-4 flex flex-col">
                    <label className="text-text-primary text-lg font-semibold">isavailable</label>
                    <select 
                    onChange={(e) => {setIsAvailable(e.target.value)}} 
                    value={isAvailable}
                    className="w-full p-2 mt-2 mb-4 bg-background-700 text-text-primary rounded">
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                </div>
                
                <div className="flex justify-end gap-4">
                    <Link to="/admin-dashboard/snack-management" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                        Cancel
                    </Link>
                    <Link onClick={handleSubmit} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded">
                        Update Snack
                    </Link>
                </div>
                
                
            

            </div>
            
        </div>
    );
}