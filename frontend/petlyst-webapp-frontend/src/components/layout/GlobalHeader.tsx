import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from '../auth/AuthModal';

const GlobalHeader: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check if user is logged in
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
        window.location.reload();
    };

    // Function to get initials from name
    const getInitials = (name: string, surname: string) => {
        return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
    };

    return (
        <header className="bg-white shadow-sm fixed w-full top-0 z-50">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo and Brand */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <img 
                                src="https://d4ryfzc64ndbh.cloudfront.net/petlyst-logo.svg" 
                                alt="Petlyst Logo" 
                                className="h-8 w-auto"
                            />
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                                Petlyst
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden sm:flex sm:items-center sm:space-x-8">
                        <Link to="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                            Home
                        </Link>
                        <Link to="/services" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                            Services
                        </Link>
                        
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                    className="flex items-center space-x-3 text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors focus:outline-none group"
                                >
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium group-hover:bg-indigo-700 transition-colors">
                                        {getInitials(user.name, user.surname)}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span>Hello, {user.name}</span>
                                        <svg
                                            className={`h-5 w-5 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {/* Profile Dropdown */}
                                {showProfileDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                                        <Link
                                            to="/dashboard"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => setShowProfileDropdown(false)}
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setShowProfileDropdown(false);
                                                handleLogout();
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Sign In
                            </button>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isMenuOpen ? (
                                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="sm:hidden">
                        <div className="pt-2 pb-3 space-y-1">
                            <Link
                                to="/"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                            >
                                Home
                            </Link>
                            <Link
                                to="/services"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                            >
                                Services
                            </Link>
                            {user ? (
                                <>
                                    <div className="flex items-center space-x-3 px-3 py-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium">
                                            {getInitials(user.name, user.surname)}
                                        </div>
                                        <span className="text-gray-700">Hello, {user.name}</span>
                                    </div>
                                    <Link
                                        to="/dashboard"
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Auth Modal */}
            {showAuthModal && (
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                />
            )}
        </header>
    );
};

export default GlobalHeader;
