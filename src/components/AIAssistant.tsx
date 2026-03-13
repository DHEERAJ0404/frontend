import React, { useState, useRef, useEffect } from "react";
import type { Complaint, ComplaintStatus } from "../types/index.ts";
import { processCommand } from "../utils/aiEngine.ts";
import type { AIResponse } from "../utils/aiEngine.ts";
import { deleteComplaint, updateComplaintStatus } from "../services/complaint.service.ts";
import { toast } from "react-toastify";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

interface Message {
    id: number;
    role: "user" | "ai";
    text: string;
    pending?: AIResponse;
    typing?: boolean;
}

interface Props {
    complaints: Complaint[];
    isAdmin: boolean;
    onRefresh: () => void;
    onFilter?: (status?: ComplaintStatus, priority?: string) => void;
}

let msgId = 0;

const SUGGESTIONS = [
    "Analyze bottlenecks",
    "Show graph of status",
    "Plot categories",
    "How to fix AC",
    "Highest urgency",
    "Count pending",
    "Delete rejected",
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

function formatText(text: string) {
    return text.split("\n").map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : part
        );
        return <span key={i}>{parts}{i < text.split("\n").length - 1 && <br />}</span>;
    });
}

const AIAssistant: React.FC<Props> = ({ complaints, isAdmin, onRefresh, onFilter }) => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: ++msgId, role: "ai",
            text: `👋 Hi! I'm your **SmartCampus AI**.\nAsk me about complaints, stats, or give actions${isAdmin ? " like \"delete all\"" : ""}.\n\n💡 *Tip: For true NLP, say **set key <GEMINI_API_KEY>**!*`
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [, setPendingAction] = useState<AIResponse | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 150);
    }, [open]);

    const addAIMessage = (text: string, pending?: AIResponse) => {
        setMessages(prev => [...prev, { id: ++msgId, role: "ai", text, pending }]);
    };

    const send = async (raw: string) => {
        const text = raw.trim();
        if (!text) return;
        setInput("");
        setMessages(prev => [...prev, { id: ++msgId, role: "user", text }]);
        setIsTyping(true);

        try {
            const response = await processCommand(text, complaints, isAdmin);
            setIsTyping(false);

            if (response.requiresConfirm) {
                setPendingAction(response);
                addAIMessage(response.text, response);
            } else {
                // Handle non-confirm actions immediately
                if (response.action?.type === "FILTER" && onFilter) {
                    const a = response.action;
                    onFilter(
                        a.type === "FILTER" ? a.status : undefined,
                        a.type === "FILTER" ? a.priority : undefined
                    );
                }
                addAIMessage(response.text, response);
            }
        } catch (err) {
            setIsTyping(false);
            addAIMessage("❌ Oops, I had trouble thinking about that. Please try again.");
            console.error(err);
        }
    };

    const executeAction = async (response: AIResponse) => {
        setPendingAction(null);
        if (!response.action) return;

        const action = response.action;

        try {
            if (action.type === "DELETE_ALL") {
                addAIMessage("⏳ Deleting all complaints...");
                for (const c of complaints) await deleteComplaint(c.id);
                onRefresh();
                addAIMessage(`✅ Done! All **${complaints.length}** complaints have been deleted.`);
                toast.success("All complaints deleted.");

            } else if (action.type === "DELETE_BY_STATUS") {
                const targets = complaints.filter(c => c.status === action.status);
                addAIMessage(`⏳ Deleting ${targets.length} ${action.status.replace(/_/g, " ").toLowerCase()} complaints...`);
                for (const c of targets) await deleteComplaint(c.id);
                onRefresh();
                addAIMessage(`✅ Deleted **${targets.length}** ${action.status.replace(/_/g, " ").toLowerCase()} complaints.`);
                toast.success(`Deleted ${targets.length} complaints.`);

            } else if (action.type === "DELETE_BY_CATEGORY") {
                const targets = complaints.filter(c => c.category.toLowerCase() === action.category);
                addAIMessage(`⏳ Deleting ${targets.length} "${action.category}" complaints...`);
                for (const c of targets) await deleteComplaint(c.id);
                onRefresh();
                addAIMessage(`✅ Deleted **${targets.length}** "${action.category}" complaints.`);
                toast.success(`Deleted ${targets.length} complaints.`);

            } else if (action.type === "RESOLVE_ALL_PENDING") {
                const targets = complaints.filter(c => c.status === "PENDING");
                addAIMessage(`⏳ Resolving ${targets.length} pending complaints...`);
                for (const c of targets) await updateComplaintStatus(c.id, "RESOLVED");
                onRefresh();
                addAIMessage(`✅ Resolved **${targets.length}** pending complaints!`);
                toast.success(`Resolved ${targets.length} complaints.`);

            } else if (action.type === "FILTER" && onFilter) {
                onFilter(action.status, action.priority);
                addAIMessage("🔍 Filter applied! Check the complaints list.");
            }
        } catch {
            addAIMessage("❌ Something went wrong while executing that action.");
            toast.error("Action failed.");
        }
    };

    const cancelAction = () => {
        setPendingAction(null);
        addAIMessage("❌ Action cancelled. Let me know if you need anything else!");
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
                style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: "0 8px 32px rgba(99,102,241,0.45)",
                }}
                title="AI Assistant"
            >
                {open ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.713-1.328 2.42l-1.254-.29a4.196 4.196 0 00-1.01-.121H8.39c-.34 0-.68.04-1.01.12l-1.254.29c-1.358.293-2.329-1.42-1.328-2.42L5 14.5" />
                    </svg>
                )}
                {!open && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white animate-pulse" />
                )}
            </button>

            {/* Chat Panel */}
            {open && (
                <div
                    className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    style={{
                        background: "rgba(17,17,31,0.97)",
                        border: "1px solid rgba(99,102,241,0.3)",
                        backdropFilter: "blur(20px)",
                        animation: "slideUp 0.25s ease",
                        maxHeight: "75vh",
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                    >
                        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.713-1.328 2.42l-1.254-.29a4.196 4.196 0 00-1.01-.121H8.39c-.34 0-.68.04-1.01.12l-1.254.29c-1.358.293-2.329-1.42-1.328-2.42L5 14.5" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-sm">SmartCampus AI {localStorage.getItem("GEMINI_API_KEY") && "✨"}</div>
                            <div className="text-indigo-200 text-xs flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                                {localStorage.getItem("GEMINI_API_KEY") ? "GenAI Online" : "Local Online"} · {complaints.length} records
                            </div>
                        </div>
                        <button onClick={() => setMessages([messages[0]])} title="Clear chat" className="text-white/50 hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                {msg.role === "ai" && (
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" opacity=".2"/><path d="M12 6a1 1 0 011 1v5a1 1 0 01-1 1H7a1 1 0 010-2h4V7a1 1 0 011-1z"/>
                                        </svg>
                                    </div>
                                )}
                                <div
                                    className="rounded-2xl px-3 py-2.5 text-sm max-w-[80%] leading-relaxed"
                                    style={{
                                        background: msg.role === "user"
                                            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                            : "rgba(255,255,255,0.06)",
                                        color: "rgba(255,255,255,0.92)",
                                        borderBottomLeftRadius: msg.role === "ai" ? 4 : undefined,
                                        borderBottomRightRadius: msg.role === "user" ? 4 : undefined,
                                    }}
                                >
                                    {formatText(msg.text)}

                                    {/* Confirm / Cancel buttons */}
                                    {msg.pending?.requiresConfirm && msg.id === messages[messages.length - 1]?.id && (
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => executeAction(msg.pending!)}
                                                className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                                                style={{ background: "#ef4444" }}
                                            >
                                                {msg.pending.confirmLabel || "Confirm"}
                                            </button>
                                            <button
                                                onClick={cancelAction}
                                                className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white/70 border border-white/20 hover:bg-white/10 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}

                                    {/* Graph Rendering */}
                                    {msg.pending?.action?.type === "SHOW_GRAPH" && (
                                        <div className="w-full h-48 mt-3 bg-white/5 rounded-xl p-2 relative">
                                            {(() => {
                                                const gType = msg.pending.action.graphType;
                                                const dataMap: Record<string, number> = {};
                                                complaints.forEach(c => {
                                                    const key = gType === "status" ? c.status.replace(/_/g, " ") 
                                                              : gType === "priority" ? c.priority 
                                                              : c.category;
                                                    dataMap[key] = (dataMap[key] || 0) + 1;
                                                });
                                                const data = Object.entries(dataMap).map(([name, value]) => ({ name, value }));
                                                
                                                if (data.length === 0) return <div className="text-center text-xs text-white/50 mt-16">No data to display</div>;

                                                if (gType === "category") {
                                                    return (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={data} margin={{ bottom: 20 }}>
                                                                <XAxis dataKey="name" stroke="#ffffff80" fontSize={10} tick={{ fill: '#ffffffbb', fontSize: 9 }} interval={0} angle={-30} textAnchor="end" />
                                                                <YAxis stroke="#ffffff80" fontSize={10} width={20} />
                                                                <RechartsTooltip contentStyle={{ background: '#11111f', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                                                                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    );
                                                }

                                                return (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45} innerRadius={25} paddingAngle={5} label={({ name }) => name} labelLine={false} style={{ fontSize: '10px', fill: '#ffffffbb' }}>
                                                                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                            </Pie>
                                                            <RechartsTooltip contentStyle={{ background: '#11111f', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} itemStyle={{ color: '#fff' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div className="flex justify-start items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                                    </svg>
                                </div>
                                <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <div
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                                                style={{ animation: `bounce 1s ease ${i * 0.15}s infinite` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Quick Suggestions */}
                    <div className="px-4 pb-2 flex-shrink-0">
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {SUGGESTIONS.filter(s =>
                                isAdmin || !s.toLowerCase().includes("delete")
                            ).map(s => (
                                <button
                                    key={s}
                                    onClick={() => send(s)}
                                    className="whitespace-nowrap text-xs px-2.5 py-1 rounded-full border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 transition-all flex-shrink-0"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <div className="px-4 pb-4 flex-shrink-0">
                        <form
                            onSubmit={e => { e.preventDefault(); send(input); }}
                            className="flex gap-2 items-center rounded-xl px-3 py-2"
                            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(99,102,241,0.3)" }}
                        >
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask AI something..."
                                className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                            >
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-5px); }
                }
                .scrollbar-none::-webkit-scrollbar { display: none; }
            `}</style>
        </>
    );
};

export default AIAssistant;
