import React from 'react';
import GlobalHeader from '../components/layout/GlobalHeader';

const Home: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <GlobalHeader />
            <main className="container mx-auto px-4 pt-28 pb-12">
                {/* Hero Section */}
                <section className="text-center max-w-4xl mx-auto mb-20">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
                        Welcome to{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            Petlyst
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Your trusted platform for managing pet health records and veterinary appointments
                    </p>
                </section>

                {/* Features Grid */}
                <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Feature Card 1 */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                        <div className="text-indigo-600 mb-6">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Health Records</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Keep all your pet's health records in one secure place. Easy access to vaccination history, medications, and treatments.
                        </p>
                    </div>

                    {/* Feature Card 2 */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                        <div className="text-indigo-600 mb-6">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Appointments</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Schedule and manage veterinary appointments with ease. Get reminders and confirmations automatically.
                        </p>
                    </div>

                    {/* Feature Card 3 */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                        <div className="text-indigo-600 mb-6">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Reminders</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Never miss important vaccinations or checkups. Get timely notifications for your pet's healthcare needs.
                        </p>
                    </div>
                </section>

                {/* Call to Action Section */}
                <section className="mt-20 text-center">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 max-w-4xl mx-auto shadow-xl">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Ready to get started?
                        </h2>
                        <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
                            Join thousands of pet owners who trust Petlyst for their pet's healthcare management.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Home; 