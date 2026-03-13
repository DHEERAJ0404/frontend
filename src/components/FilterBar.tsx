import React from "react";
import type { ComplaintStatus } from "../types/index.ts";

export interface FilterState {
    search: string;
    status: ComplaintStatus | "ALL";
    priority: string;
    sortBy: "newest" | "oldest" | "upvotes" | "urgency";
}

interface Props {
    filters: FilterState;
    onChange: (f: FilterState) => void;
    totalShown: number;
    totalAll: number;
}

const STATUSES: Array<ComplaintStatus | "ALL"> = ["ALL", "PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"];
const PRIORITIES = ["ALL", "High", "Medium", "Low"];

const FilterBar: React.FC<Props> = ({ filters, onChange, totalShown, totalAll }) => {
    const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

    return (
        <div className="mb-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg p-5 space-y-4 animate-fade-in relative overflow-hidden group/filter">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover/filter:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            {/* Search */}
            <div className="relative z-10">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-indigo-400 group-focus-within/filter:text-indigo-600 dark:group-focus-within/filter:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search by category, description or location..."
                    value={filters.search}
                    onChange={e => set({ search: e.target.value })}
                    className="w-full pl-11 pr-10 py-3 text-sm rounded-xl bg-white/50 dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/80 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all duration-300"
                />
                {filters.search && (
                    <button
                        onClick={() => set({ search: "" })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-500/20 p-1.5 rounded-full transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-4 items-center relative z-10 pt-1 border-t border-gray-100/50 dark:border-gray-700/50">
                {/* Status Filter */}
                <div className="flex flex-wrap gap-2">
                    {STATUSES.map(s => (
                        <button
                            key={s}
                            onClick={() => set({ status: s })}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105 shadow-sm ${
                                filters.status === s
                                    ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border border-indigo-400 shadow-indigo-500/30"
                                    : "bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                            }`}
                        >
                            {s === "ALL" ? "All Status" : s.replace(/_/g, " ")}
                        </button>
                    ))}
                </div>

                <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

                {/* Priority Filter */}
                <div className="flex flex-wrap gap-2">
                    {PRIORITIES.map(p => (
                        <button
                            key={p}
                            onClick={() => set({ priority: p })}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105 shadow-sm ${
                                filters.priority === p
                                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white border border-purple-400 shadow-purple-500/30"
                                    : "bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400"
                            }`}
                        >
                            {p === "ALL" ? "All Priority" : p}
                        </button>
                    ))}
                </div>

                <div className="w-full sm:w-auto ml-auto flex items-center gap-3 justify-end mt-2 sm:mt-0">
                    {/* Sort */}
                    <div className="relative group/sort">
                        <select
                            value={filters.sortBy}
                            onChange={e => set({ sortBy: e.target.value as FilterState["sortBy"] })}
                            className="text-xs font-bold rounded-xl border border-gray-200/80 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm appearance-none cursor-pointer group-hover/sort:border-indigo-400 transition-colors"
                        >
                            <option value="newest">Sort: Newest</option>
                            <option value="oldest">Sort: Oldest</option>
                            <option value="upvotes">Sort: Most Upvoted</option>
                            <option value="urgency">Sort: Highest Urgency</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-indigo-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>

                    {/* Result count */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 px-3 py-1.5 rounded-full shadow-inner">
                        <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                            {totalShown} <span className="opacity-60 text-indigo-500 font-medium">/ {totalAll}</span>
                        </span>
                    </div>

                    {/* Reset */}
                    {(filters.search || filters.status !== "ALL" || filters.priority !== "ALL" || filters.sortBy !== "newest") && (
                        <button
                            onClick={() => onChange({ search: "", status: "ALL", priority: "ALL", sortBy: "newest" })}
                            className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-3 py-1.5 rounded-full hover:bg-red-500 hover:text-white dark:hover:bg-red-500/50 font-bold transition-all shadow-sm hover:shadow-red-500/20"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
