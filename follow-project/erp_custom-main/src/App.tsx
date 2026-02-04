import { Link } from "react-router";
import { useAuthUserQuery } from "./store/features/auth/authApiService";
import { Loader } from "lucide-react";
import { useGetSettingsInfoQuery } from "./store/features/admin/settingsApiService";
import { useAppSettings } from "./hooks/useAppSettings";

import { useAppSelector } from "./store/store";
import { sidebarItemLink } from "./config/sidebarItemLInk";
import { getFirstAllowedRoute } from "./utils/permissionUtils";



const APP = () => {
  const token = useAppSelector((state) => state.auth.token);
  const { data: user, isLoading } = useAuthUserQuery(undefined, {
    skip: !token,
  });

  const { data: settings } = useGetSettingsInfoQuery();
  const isLoggedIn = user?.data?.user?.email;

  useAppSettings(settings?.data);



  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-24 px-6 bg-linear-to-r from-blue-600 to-indigo-600 text-white">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
          Manage Your Business Effortlessly
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl">
          My ERP helps you streamline Products, Customers, Orders, Accounting, and HR, all in one unified platform.
        </p>
        <div className="flex gap-4">
          {isLoading ? (
            <div className="px-8 py-3 text-white"><Loader /></div>
          ) : isLoggedIn ? (
            <Link
              to={getFirstAllowedRoute(sidebarItemLink, user?.data?.user?.role?.permissions || [])}
              className="px-8 py-3 bg-green-600 text-white font-semibold rounded shadow hover:bg-green-700 transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded shadow hover:bg-gray-100 transition"
              >
                Sign In
              </Link>
              {/* <Link
                to="/register"
                className="px-8 py-3 bg-blue-500 bg-opacity-20 text-white font-semibold rounded shadow hover:bg-opacity-30 transition"
              >
                Sign Up
              </Link> */}
            </>
          )}
        </div>

      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Core Features
        </h2>
        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-blue-600 text-4xl mb-4">📦</div>
            <h3 className="font-semibold text-lg mb-2">Products</h3>
            <p className="text-gray-600 text-sm">Manage your inventory and product catalog efficiently.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-green-600 text-4xl mb-4">👥</div>
            <h3 className="font-semibold text-lg mb-2">Customers</h3>
            <p className="text-gray-600 text-sm">Track and manage customer information and interactions.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-yellow-500 text-4xl mb-4">🛒</div>
            <h3 className="font-semibold text-lg mb-2">Orders</h3>
            <p className="text-gray-600 text-sm">Process orders quickly and monitor order statuses easily.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-purple-600 text-4xl mb-4">📊</div>
            <h3 className="font-semibold text-lg mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm">Get insights from dashboards and reports to grow your business.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center px-6">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} My ERP. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="/privacy" className="text-gray-500 hover:text-gray-800 text-sm">Privacy</a>
            <a href="/terms" className="text-gray-500 hover:text-gray-800 text-sm">Terms</a>
            <a href="/contact" className="text-gray-500 hover:text-gray-800 text-sm">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default APP;
