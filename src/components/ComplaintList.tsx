import React, { useState } from "react";
import type { Complaint, ComplaintStatus } from "../types/index.ts";
import { updateComplaintStatus, upvoteComplaint, addComment, deleteComplaint } from "../services/complaint.service.ts";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext.tsx";
import { calcUrgencyScore, urgencyLabel } from "../utils/urgency.ts";

interface Props {
    complaints: Complaint[];
    refreshComplaints: () => void;
}

const STATUS_CONFIG: Record<ComplaintStatus, { bg: string, text: string, icon: React.ReactElement }> = {
    PENDING: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-800 dark:text-yellow-300",
        icon: <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    ASSIGNED: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-800 dark:text-blue-300",
        icon: <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    },
    IN_PROGRESS: {
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        text: "text-indigo-800 dark:text-indigo-300",
        icon: <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
    },
    RESOLVED: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-800 dark:text-green-300",
        icon: <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
    },
    REJECTED: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-800 dark:text-red-300",
        icon: <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
    },
};

const ComplaintList: React.FC<Props> = ({ complaints, refreshComplaints }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const handleStatusChange = async (id: number, newStatus: ComplaintStatus) => {
        try {
            await updateComplaintStatus(id, newStatus);
            toast.success(`Status updated to ${newStatus}`);
            refreshComplaints();
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleUpvote = async (id: number) => {
        try {
            await upvoteComplaint(id);
            refreshComplaints();
        } catch {
            toast.error("Failed to upvote");
        }
    };

    const handleComment = async (id: number, text: string) => {
        if (!text.trim()) return;
        try {
            await addComment(id, text);
            refreshComplaints();
        } catch {
            toast.error("Failed to add comment");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteComplaint(id);
            toast.success("Complaint deleted successfully.");
            setConfirmDeleteId(null);
            refreshComplaints();
        } catch {
            toast.error("Failed to delete complaint.");
            setConfirmDeleteId(null);
        }
    };

    if (complaints.length === 0) {
        return (
            <div className="text-center py-16 px-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No complaints found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isAdmin ? "Waiting for new complaints." : "You haven't submitted any complaints yet."}
                </p>
            </div>
        );
    }

    return (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {complaints.map((complaint, index) => {
                const statusInfo = STATUS_CONFIG[complaint.status];
                const hasUpvoted = user ? complaint.upvoters?.some(u => u.id === user.id) : false;
                const animationDelay = `${index * 50}ms`;

                return (
                    <div
                        key={complaint.id}
                        className="card flex flex-col h-full overflow-hidden group/card relative transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 border-l-4 animate-slide-up bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl"
                        style={{ borderLeftColor: complaint.status === 'RESOLVED' ? '#10B981' : '#6366F1', animationDelay }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                        <div className="p-6 flex-grow relative z-10 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm transition-transform duration-300 group-hover/card:scale-105 ${statusInfo.bg} ${statusInfo.text}`}
                                >
                                    {statusInfo.icon}
                                    {complaint.status.replace(/_/g, " ")}
                                </span>
                                <div className="flex items-center gap-2">
                                    {/* Urgency Badge */}
                                    {(() => {
                                        const score = calcUrgencyScore(complaint);
                                        const { label, color, bg } = urgencyLabel(score);
                                        return (
                                            <span
                                                title={`Urgency Score: ${score}/100`}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide group-hover/card:animate-pulse"
                                                style={{ color, background: bg }}
                                            >
                                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 15a1 1 0 110-2 1 1 0 010 2zm1-4h-2V7h2v6z" />
                                                </svg>
                                                {label}
                                            </span>
                                        );
                                    })()}
                                    <span className="text-xs text-gray-500 font-bold bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-full group-hover/card:bg-indigo-100 dark:group-hover/card:bg-indigo-900/30 transition-colors">
                                        {new Date(complaint.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            <h4 className="text-lg font-black text-gray-900 dark:text-white mb-3 line-clamp-1 group-hover/card:text-transparent group-hover/card:bg-clip-text group-hover/card:bg-gradient-to-r group-hover/card:from-indigo-600 group-hover/card:to-purple-600 transition-all duration-300">
                                {complaint.category}
                            </h4>
                            
                            <div className="flex gap-2 text-xs font-bold mb-4">
                                <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-500/20 shadow-sm flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Priority: {complaint.priority}
                                </span>
                                <span className="bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 px-2 py-1 rounded-md border border-purple-100 dark:border-purple-500/20 shadow-sm flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Loc: {complaint.location}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 line-clamp-3 font-medium flex-grow">
                                {complaint.description}
                            </p>

                            {complaint.imageUrl && !complaint.imageUrl.includes('/api/complaints') && (
                                <div
                                    className="mt-3 relative h-36 w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4 group-hover/card:shadow-md transition-all cursor-zoom-in group/img"
                                    onClick={() => setLightboxUrl(complaint.imageUrl!)}
                                    title="Click to view full image"
                                >
                                    <img
                                        src={complaint.imageUrl}
                                        alt="Proof"
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div className="bg-white/20 backdrop-blur-md rounded-full p-2 translate-y-4 group-hover/img:translate-y-0 transition-transform duration-300">
                                            <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                <div className="flex items-center group-hover/card:text-indigo-500 transition-colors">
                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-200 dark:border-indigo-700 flex items-center justify-center text-[10px] font-black text-indigo-700 dark:text-indigo-300 mr-2 shadow-sm group-hover/card:scale-110 transition-transform">
                                        {isAdmin ? "A" : (complaint.user?.name?.charAt(0) || "U")}
                                    </div>
                                    <span className="truncate max-w-[100px] font-bold">
                                        {isAdmin ? "Anonymous" : (complaint.user?.name || "Unknown")}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleUpvote(complaint.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all shadow-sm ${hasUpvoted ? 'text-white bg-gradient-to-r from-indigo-500 to-purple-500 scale-105 shadow-indigo-500/30' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                                >
                                    <svg className={`w-4 h-4 ${hasUpvoted ? 'animate-[pulse_2s_infinite]' : ''}`} fill={hasUpvoted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                    </svg>
                                    <span className="font-extrabold">{complaint.upvoters?.length || 0}</span>
                                </button>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                <div className="space-y-2 mb-3 max-h-32 overflow-y-auto pr-1">
                                    {complaint.comments?.map(comment => (
                                        <div key={comment.id} className="text-sm bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in group-hover/card:border-indigo-100 dark:group-hover/card:border-indigo-900/30 transition-colors">
                                            <span className="font-black text-xs mr-2 text-indigo-600 dark:text-indigo-400">{comment.user.name}:</span>
                                            <span className="text-gray-600 dark:text-gray-300 font-medium">{comment.text}</span>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const input = e.currentTarget.elements.namedItem('comment') as HTMLInputElement;
                                    handleComment(complaint.id, input.value);
                                    input.value = '';
                                }} className="flex gap-2 relative">
                                    <input 
                                        name="comment"
                                        type="text" 
                                        placeholder="Add a comment..." 
                                        className="text-sm border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 shadow-inner rounded-full px-4 py-2 flex-grow focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 dark:text-white"
                                    />
                                    <button type="submit" className="absolute right-1 top-1 bottom-1 aspect-square bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-600 hover:text-white hover:bg-indigo-600 dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:text-white transition-all duration-300 hover:rotate-12 hover:scale-105 group/btn">
                                        <svg className="w-4 h-4 translate-y-[1px] -translate-x-[1px] group-hover/btn:translate-x-[1px] group-hover/btn:-translate-y-[1px] transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-100 dark:border-gray-700">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Update Status
                                </label>
                                <select
                                    value={complaint.status}
                                    onChange={(e) =>
                                        handleStatusChange(complaint.id, e.target.value as ComplaintStatus)
                                    }
                                    className="block w-full text-sm rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white py-1.5"
                                >
                                    {Object.keys(STATUS_CONFIG).map((status) => (
                                        <option key={status} value={status}>
                                            {status.replace(/_/g, " ")}
                                        </option>
                                    ))}
                                </select>

                                {/* Delete button */}
                                <div className="mt-3">
                                    {confirmDeleteId === complaint.id ? (
                                        <div className="flex items-center gap-2 animate-fade-in">
                                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium flex-1">
                                                ⚠️ Delete this complaint?
                                            </span>
                                            <button
                                                onClick={() => handleDelete(complaint.id)}
                                                style={{
                                                    background: "#ef4444",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: 6,
                                                    padding: "4px 12px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Yes, Delete
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                style={{
                                                    background: "transparent",
                                                    color: "#6b7280",
                                                    border: "1px solid #d1d5db",
                                                    borderRadius: 6,
                                                    padding: "4px 10px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDeleteId(complaint.id)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 5,
                                                width: "100%",
                                                padding: "6px 12px",
                                                borderRadius: 6,
                                                border: "1px solid #fca5a5",
                                                background: "rgba(239,68,68,0.06)",
                                                color: "#dc2626",
                                                fontSize: "0.78rem",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                transition: "all 0.15s",
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                                        >
                                            <svg style={{ width: 14, height: 14, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete Complaint
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Lightbox Modal */}
        {lightboxUrl && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={() => setLightboxUrl(null)}
                onKeyDown={(e) => e.key === 'Escape' && setLightboxUrl(null)}
                tabIndex={-1}
                style={{ animation: 'fadeIn 0.2s ease' }}
            >
                <div
                    className="relative max-w-5xl max-h-[90vh] w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <img
                        src={lightboxUrl ?? undefined}
                        alt="Full view"
                        className="w-full h-full object-contain rounded-xl shadow-2xl"
                        style={{ maxHeight: '85vh' }}
                    />
                    <button
                        onClick={() => setLightboxUrl(null)}
                        className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        )}
        </>
    );
};

export default ComplaintList;

