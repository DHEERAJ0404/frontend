import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../AuthContext.tsx";
import { getAllComplaints, getMyComplaints } from "../services/complaint.service.ts";
import type { Complaint, ComplaintStatus } from "../types/index.ts";
import ComplaintForm from "../components/ComplaintForm.tsx";
import ComplaintList from "../components/ComplaintList.tsx";
import AnalyticsPanel from "../components/AnalyticsPanel.tsx";
import FilterBar from "../components/FilterBar.tsx";
import type { FilterState } from "../components/FilterBar.tsx";
import AIAssistant from "../components/AIAssistant.tsx";
import { calcUrgencyScore } from "../utils/urgency.ts";
import { toast } from "react-toastify";

const DEFAULT_FILTERS: FilterState = {
    search: "",
    status: "ALL",
    priority: "ALL",
    sortBy: "newest",
};

const Dashboard: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            let data: Complaint[];
            if (user?.role === "ADMIN") {
                data = await getAllComplaints();
            } else {
                data = await getMyComplaints();
            }
            setComplaints(data);
        } catch (error: any) {
            console.error("Error fetching complaints:", error);
            if (error.response?.status === 401) {
                toast.error("Session expired. Please login again.");
            } else if (error.response?.status === 403) {
                toast.error("Access denied. You don't have permission.");
            } else {
                toast.error("Failed to fetch complaints");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            fetchComplaints();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [user, authLoading]);

    // Apply filters + sort
    const filteredComplaints = useMemo(() => {
        let list = [...complaints];

        if (filters.search.trim()) {
            const q = filters.search.toLowerCase();
            list = list.filter(c =>
                c.category.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.location?.toLowerCase().includes(q)
            );
        }
        if (filters.status !== "ALL") {
            list = list.filter(c => c.status === filters.status);
        }
        if (filters.priority !== "ALL") {
            list = list.filter(c => c.priority === filters.priority);
        }

        switch (filters.sortBy) {
            case "oldest":
                list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
            case "upvotes":
                list.sort((a, b) => (b.upvoters?.length || 0) - (a.upvoters?.length || 0));
                break;
            case "urgency":
                list.sort((a, b) => calcUrgencyScore(b) - calcUrgencyScore(a));
                break;
            default: // newest
                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return list;
    }, [complaints, filters]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-20 h-16 w-16"></div>
                    <div className="relative animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen -mt-20 pt-20 px-4 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            {/* Background Animated Blobs - Fixed to cover whole screen */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-indigo-200/50 dark:bg-indigo-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-blob"></div>
                <div className="absolute top-1/4 -right-20 w-[450px] h-[450px] bg-purple-200/50 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-blob delay-2000"></div>
                <div className="absolute -bottom-20 left-1/3 w-[600px] h-[600px] bg-blue-200/50 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-blob delay-4000"></div>
                <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-pink-200/40 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-blob delay-7000"></div>
            </div>

            <div className="relative z-10 space-y-8 animate-slide-up max-w-[1400px] mx-auto pb-12">
                <header className="relative pt-6 pb-8 border-b border-gray-200/50 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="relative z-10">
                        <div className="absolute -inset-4 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl -z-10 shadow-[0_4px_30px_rgba(0,0,0,0.05)] border border-white/20 dark:border-white/5 opacity-0 sm:opacity-100 transition-opacity duration-500"></div>
                        <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter text-slate-900 dark:text-white drop-shadow-sm mb-1">
                            {user?.role === "ADMIN" ? (
                                <span className="text-indigo-600 dark:text-indigo-400">Admin</span>
                            ) : "Student"} 
                            <span className="ml-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-300 dark:via-purple-300 dark:to-indigo-300">
                                {user?.role === "ADMIN" ? "Command Center" : "Portal"}
                            </span>
                        </h1>
                        <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                            {user?.role === "ADMIN"
                                ? "Overview of all campus complaints and their live statuses."
                                : `Welcome back, ${user?.name}. Manage your requests here.`}
                        </p>
                    </div>
                    {user?.role === "STUDENT" && (
                        <div className="hidden sm:block z-10">
                            <button
                                className="relative overflow-hidden group btn-primary rounded-xl px-6 font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-1"
                                onClick={() => document.getElementById('complaint-form')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                                + New Complaint
                            </button>
                        </div>
                    )}
                </header>

                <div className="relative z-10 space-y-10">
                    {/* Analytics — Admin only */}
                    {user?.role === "ADMIN" && (
                        <div className="animate-slide-up delay-100">
                            <AnalyticsPanel complaints={complaints} />
                        </div>
                    )}

                    {user?.role === "STUDENT" && (
                        <div id="complaint-form" className="animate-slide-up delay-100">
                            <div className="relative p-6 sm:p-8 rounded-3xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-colors duration-500"></div>
                                <div className="relative z-10">
                                    <ComplaintForm onComplaintSubmitted={fetchComplaints} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="relative p-6 sm:p-8 rounded-3xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl animate-slide-up delay-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                                {user?.role === "ADMIN" ? (
                                    <>
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                                            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        </div>
                                        Live Complaints
                                    </>
                                ) : (
                                    <>
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                                            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        Your Request History
                                    </>
                                )}
                                <span className="ml-3 inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
                                    {filteredComplaints.length}
                                </span>
                            </h3>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="mb-6">
                            <FilterBar
                                filters={filters}
                                onChange={setFilters}
                                totalShown={filteredComplaints.length}
                                totalAll={complaints.length}
                            />
                        </div>

                        <div className="relative rounded-2xl overflow-hidden">
                            <ComplaintList complaints={filteredComplaints} refreshComplaints={fetchComplaints} />
                        </div>
                    </div>
                </div>

                {/* AI Assistant */}
                <AIAssistant
                    complaints={complaints}
                    isAdmin={user?.role === "ADMIN"}
                    onRefresh={fetchComplaints}
                    onFilter={(status?: ComplaintStatus, priority?: string) => {
                        setFilters(f => ({
                            ...f,
                            status: status ?? "ALL",
                            priority: priority ?? "ALL",
                        }));
                    }}
                />
            </div>
        </div>
    );
};

export default Dashboard;
