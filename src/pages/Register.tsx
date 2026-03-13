import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/auth.service.ts";
import { toast } from "react-toastify";
import type { UserRole } from "../types/index.ts";

const Register: React.FC = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("STUDENT");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(name, email, password, role);
            toast.success("Registration successful! Please login.");
            navigate("/login");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-[90vh] flex items-center justify-center p-4 overflow-hidden -mt-10 pt-10">
            {/* Background Animated Blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob delay-200"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob delay-400"></div>

            {/* Floating Decorative Elements */}
            <div className="absolute top-10 left-10 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg rotate-12 opacity-20 dark:opacity-40 animate-float hidden md:block"></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full opacity-20 dark:opacity-40 animate-float-reverse hidden md:block"></div>
            <div className="absolute top-1/2 right-20 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-tr-xl rounded-bl-xl rotate-45 opacity-20 dark:opacity-40 animate-float hidden md:block" style={{ animationDelay: '1s' }}></div>

            <div className="w-full max-w-md space-y-8 relative z-10 px-4">
                <div className="text-center animate-slide-up">
                    <div className="mx-auto h-20 w-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-purple-500/30 transform rotate-3 hover:rotate-6 hover:scale-110 transition-all duration-300 mb-6 relative group animate-pulse-glow cursor-default">
                        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10 drop-shadow-md">S</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2">
                        Create account
                    </h2>
                    <p className="mt-2 text-base font-medium text-gray-600 dark:text-gray-400">
                        Join <strong className="text-purple-600 dark:text-purple-400">SmartCampus</strong> today
                    </p>
                </div>

                <div className="relative animate-slide-up delay-100 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative card p-8 sm:p-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl overflow-hidden rounded-2xl">
                        
                        {/* Shimmer effect overlay */}
                        <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:animate-shimmer pointer-events-none"></div>

                        <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                            <div className="animate-slide-up delay-200">
                                <label htmlFor="name" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 group-focus-within:text-indigo-600 transition-colors">Full Name</label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        className="input-field pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-inner"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className="animate-slide-up delay-300">
                                <label htmlFor="email" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 group-focus-within:text-indigo-600 transition-colors">Email address</label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="input-field pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-inner"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="animate-slide-up delay-400">
                                <label htmlFor="password" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 group-focus-within:text-indigo-600 transition-colors">Password</label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className="input-field pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-inner"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="animate-slide-up delay-500">
                                <label htmlFor="role" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1">I am a</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <select
                                        id="role"
                                        name="role"
                                        className="input-field pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-inner cursor-pointer appearance-none"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as UserRole)}
                                    >
                                        <option value="STUDENT">Student</option>
                                        <option value="ADMIN">Administrator</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 animate-slide-up delay-500">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="relative w-full overflow-hidden group/btn btn-primary py-3.5 rounded-xl text-sm font-bold shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                                    {loading ? (
                                        <span className="flex items-center justify-center relative z-10">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating magic...
                                        </span>
                                    ) : (
                                        <span className="relative z-10 flex items-center justify-center gap-2 text-base">
                                            Sign up
                                            <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 relative z-10 animate-slide-up delay-700">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200/60 dark:border-gray-700/60" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white dark:bg-gray-900 px-4 text-gray-500 dark:text-gray-400 font-medium rounded-full border border-gray-100 dark:border-gray-800">
                                        Already have an account?
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <Link to="/login" className="inline-flex items-center font-bold text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 transition-colors group/link p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                    <svg className="w-4 h-4 mr-2 group-hover/link:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Sign in instead
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

