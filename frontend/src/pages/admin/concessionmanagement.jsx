import { Link } from "react-router-dom";

export default function ConcessionManagement() {
    return (
       <div className="min-h-screen bg-background-900 text-text-primary">
            <Link to="/admin/addsnack" className="fixed right-[60px] bottom-[60px] bg-primary-500 hover:bg-primary-600 text-white font-bold p-4 rounded-full shadow-lg ">
                Add New Snack
            </Link>
            <h1 className="text-2xl font-bold m-4">Concession Management Page</h1>
            {/* Concession management content goes here */}
        </div>
    );
}


