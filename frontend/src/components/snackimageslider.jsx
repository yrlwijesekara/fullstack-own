import { useState } from 'react';


export default function SnackImageSlider(props) {
    const { images } = props;
    const [activeIndex, setActiveIndex] = useState(0);

    // Safety check for images array
    if (!images || images.length === 0) {
        return (
            <div className="w-full max-w-[250px] h-[250px] flex justify-center items-center bg-background-800 rounded-lg">
                <div className="text-text-primary text-center">
                    <div className="text-2xl mb-2">📷</div>
                    <p className="text-sm">No images available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[250px]">
            <img
                src={images[activeIndex]}
                alt={`Product image ${activeIndex + 1}`}
                className="w-full h-[200px] object-cover rounded-lg shadow-lg"
            />
            <div className="w-full h-[50px] flex flex-row justify-center items-center gap-1 px-2 mt-2">
                {images.map((image, index) => (
                    <img
                        src={image}
                        key={index}
                        alt={`Thumbnail ${index + 1}`}
                        className={`w-[35px] h-[35px] object-cover border-2 rounded cursor-pointer transition-all duration-200 shadow-md ${activeIndex === index ? 'border-primary-500 scale-110 shadow-primary-500/50' : 'border-transparent hover:border-secondary-400 hover:scale-105'}`}
                        onClick={() => setActiveIndex(index)}
                    />
                ))}
            </div>
        </div>
    )
}
    