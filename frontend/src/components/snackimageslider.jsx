import { useState } from 'react';


export default function SnackImageSlider(props) {
    const { images } = props;
    const [activeIndex, setActiveIndex] = useState(0);
    
    // Safety check for images array
    if (!images || images.length === 0) {
        return (
            <div className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] flex justify-center items-center bg-gray-800 rounded-lg">
                <div className="text-white text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl mb-2">📷</div>
                    <p className="text-sm sm:text-base">No images available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[280px] sm:max-w-[350px] md:max-w-[450px] lg:max-w-[550px] xl:max-w-[650px] h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px] xl:h-[750px]">
            <img
                src={images[activeIndex]} 
                alt={`Product image ${activeIndex + 1}`}
                className="w-full h-[280px] sm:h-[360px] md:h-[450px] lg:h-[540px] xl:h-[630px] object-cover rounded-lg shadow-lg"
            />
            <div className="w-full h-[60px] sm:h-[80px] md:h-[90px] lg:h-[100px] xl:h-[110px] flex flex-row justify-center items-center gap-1 sm:gap-2 md:gap-3 px-2">
                {images.map((image, index) => (
                    <img
                        src={image} 
                        key={index}
                        alt={`Thumbnail ${index + 1}`}
                        className={`w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] md:w-[60px] md:h-[60px] lg:w-[70px] lg:h-[70px] xl:w-[80px] xl:h-[80px] object-cover border-2 rounded cursor-pointer transition-all duration-200 shadow-md ${activeIndex === index ? 'border-purple-500 scale-110 shadow-purple-500/50' : 'border-transparent hover:border-gray-400 hover:scale-105'}`}  
                        onClick={() => setActiveIndex(index)}
                    />
                ))}
            </div>
        </div>
    )
}
    