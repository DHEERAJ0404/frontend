import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.tsx";
import { login } from "../services/auth.service.ts";
import { toast } from "react-toastify";

const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login: authLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await login(email, password);
            authLogin(response);
            toast.success("Welcome back!");
            navigate("/");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            {/* Background Animated Blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob delay-200"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 dark:bg-indigo-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob delay-400"></div>
            
            {/* Floating Decorative Elements */}
            <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl opacity-20 animate-float rotate-12 backdrop-blur-3xl filter blur-[2px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-20 animate-float-reverse backdrop-blur-3xl filter blur-[2px]"></div>

            <div className="relative w-full max-w-md space-y-8 z-10 px-4">
                
                {/* Header Section */}
                <div className="text-center animate-slide-up">
                    <div className="relative mx-auto h-20 w-20 mb-8 group perspective-1000">
                        {/* Shimmer background behind logo */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-2xl animate-pulse-glow opacity-80 blur-md transition-opacity duration-300 group-hover:opacity-100"></div>
                        <div className="relative h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-2xl transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[10deg] border border-white/20">
                            <span className="animate-pulse">S</span>
                        </div>
                    </div>
                    
                    <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 animate-slide-up delay-100 drop-shadow-sm">
                        Welcome back
                    </h2>
                    <p className="mt-3 text-base text-gray-500 dark:text-gray-400 animate-slide-up delay-200 font-medium">
                        Sign in to access your administrative workspace
                    </p>
                </div>

                {/* Form Card */}
                <div className="animate-slide-up delay-300">
                    <div className="relative p-8 sm:p-10 rounded-3xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden">
                        
                        {/* Glass edge highlight */}
                        <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 skew-x-12 -translate-x-[150%] animate-[shimmer_3s_infinite] pointer-events-none"></div>

                        <form className="space-y-6 relative" onSubmit={handleSubmit}>
                            <div className="group">
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                                    Email address
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full px-5 py-4 rounded-xl border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 shadow-inner focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-base outline-none transition-all duration-300 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-800"
                                        placeholder="admin@smartcampus.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="block w-full px-5 py-4 rounded-xl border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 shadow-inner focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-base outline-none transition-all duration-300 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-800"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="relative w-full overflow-hidden group rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-shadow duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] opacity-90 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative px-6 py-4 flex items-center justify-center text-white text-base font-bold tracking-wide">
                                        {loading ? (
                                            <span className="flex items-center space-x-2">
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Authenticating...</span>
                                            </span>
                                        ) : "Sign in securely"}
                                    </div>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-8 animate-slide-up delay-500">
                        <div className="mt-6 text-center">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Don't have an account? </span>
                            <Link to="/register" className="font-bold text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all hover:underline underline-offset-4">
                                Create an account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;


