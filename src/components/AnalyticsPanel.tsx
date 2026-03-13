import React from "react";
import type { Complaint } from "../types/index.ts";

interface Props {
    complaints: Complaint[];
}

const CATEGORY_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];

const STATUS_COLORS: Record<string, string> = {
    PENDING: "#f59e0b",
    ASSIGNED: "#3b82f6",
    IN_PROGRESS: "#6366f1",
    RESOLVED: "#10b981",
    REJECTED: "#ef4444",
};

const AnalyticsPanel: React.FC<Props> = ({ complaints }) => {
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === "RESOLVED").length;
    const pending = complaints.filter(c => c.status === "PENDING").length;
    const highPriority = complaints.filter(c => c.priority === "High").length;

    // Group by category
    const categoryMap = complaints.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxCat = Math.max(...categories.map(c => c[1]), 1);

    // Group by status
    const statusMap = complaints.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const statuses = Object.entries(statusMap);

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return (
        <div className="mb-8 relative z-10">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3 animate-slide-up">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                Live Analytics Overview
            </h2>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total", value: total, color: "#6366f1", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", delay: "delay-100" },
                    { label: "Resolved", value: resolved, color: "#10b981", icon: "M5 13l4 4L19 7", delay: "delay-200" },
                    { label: "Pending", value: pending, color: "#f59e0b", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", delay: "delay-300" },
                    { label: "High Priority", value: highPriority, color: "#ef4444", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", delay: "delay-400" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className={`group relative overflow-hidden rounded-2xl p-5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-slide-up ${stat.delay}`}
                    >
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full opacity-20 filter blur-[20px] group-hover:scale-150 transition-transform duration-700 pointer-events-none" style={{ background: stat.color }}></div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="rounded-xl p-3 flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm" style={{ background: stat.color + "20" }}>
                                <svg className="w-6 h-6" style={{ color: stat.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={stat.icon} />
                                </svg>
                            </div>
                            <div>
                                <div className="text-3xl font-extrabold tracking-tight" style={{ color: stat.color }}>
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Bar Chart */}
                <div className="relative overflow-hidden rounded-3xl p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-slide-up delay-500 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <h3 className="text-base font-extrabold text-gray-800 dark:text-gray-200 mb-5 flex items-center gap-2">
                        Complaints by Category
                        <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                    </h3>
                    
                    {categories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                            <p className="text-sm font-medium">Listening for data...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {categories.map(([cat, count], i) => (
                                <div key={cat} className="flex items-center gap-3 cursor-default group/row">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-28 truncate flex-shrink-0 group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-400 transition-colors">{cat}</span>
                                    <div className="flex-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-3 overflow-hidden shadow-inner relative">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out group-hover/row:brightness-110"
                                            style={{
                                                width: `${(count / maxCat) * 100}%`,
                                                background: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                                            }}
                                        >
                                            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-gray-800 dark:text-gray-200 w-6 text-right group-hover/row:scale-110 transition-transform">{count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status & Resolution Rate */}
                <div className="relative overflow-hidden rounded-3xl p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-slide-up delay-700 group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <h3 className="text-base font-extrabold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                        Status Breakdown
                    </h3>

                    <div className="flex items-center justify-between">
                        {/* Status List */}
                        <div className="flex-1 space-y-3 pr-4 border-r border-gray-200/50 dark:border-gray-700/50">
                            {statuses.map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between group/stat cursor-default p-1.5 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ background: STATUS_COLORS[status] || "#9ca3af" }} />
                                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">{status.replace(/_/g, " ")}</span>
                                    </div>
                                    <span className="text-sm font-black text-gray-800 dark:text-gray-200 group-hover/stat:scale-110 transition-transform">{count}</span>
                                </div>
                            ))}
                        </div>

                        {/* Resolution Rate Ring */}
                        <div className="flex flex-col items-center justify-center pl-6 pr-2">
                            <div className="relative w-28 h-28 flex-shrink-0 mb-3 group/ring">
                                <svg className="w-28 h-28 -rotate-90 transform group-hover/ring:scale-105 transition-transform duration-500" viewBox="0 0 36 36">
                                    {/* Background Circle */}
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(156, 163, 175, 0.2)" strokeWidth="4" />
                                    {/* Foreground Circle - Animated */}
                                    <circle
                                        cx="18" cy="18" r="15.9" fill="none"
                                        stroke="url(#gradient)" strokeWidth="4"
                                        strokeDasharray={`${resolutionRate} ${100 - resolutionRate}`}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out drop-shadow-md"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#34d399" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 drop-shadow-sm">{resolutionRate}%</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-bold text-gray-700 dark:text-gray-200">Resolution Rate</div>
                                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-1 rounded-full mt-1 inline-block">
                                    {resolved} / {total} Resolved
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPanel;
