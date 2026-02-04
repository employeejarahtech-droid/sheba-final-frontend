import { useRouteError } from "react-router";



type TNotFound = {
    data: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any;
    internal: boolean;
    status: number
    statusText: string

}


const NotFound = () => {
    const error = useRouteError() as TNotFound;

    console.log(error);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
            <h1 className="text-6xl font-bold text-gray-800 mb-4">
                {error?.status || "404"}
            </h1>
            <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-gray-600 mb-6 text-center">
                Sorry, the page you visited does not exist.
            </p>

            <button onClick={() => window.history.back()} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                Go Back
            </button>

        </div>
    );
};

export default NotFound;