import type { Complaint, ComplaintStatus } from "../types/index.ts";
import { calcUrgencyScore } from "./urgency.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type ActionType =
    | { type: "DELETE_ALL" }
    | { type: "DELETE_BY_STATUS"; status: ComplaintStatus }
    | { type: "DELETE_BY_CATEGORY"; category: string }
    | { type: "FILTER"; status?: ComplaintStatus; priority?: string }
    | { type: "RESOLVE_ALL_PENDING" }
    | { type: "SHOW_GRAPH"; graphType: "status" | "priority" | "category" }
    | { type: "NONE" };

export interface AIResponse {
    text: string;
    action?: ActionType;
    requiresConfirm?: boolean;
    confirmLabel?: string;
    data?: Record<string, unknown>;
}

const STATUS_KEYWORDS: Record<string, ComplaintStatus> = {
    pending:     "PENDING",
    assigned:    "ASSIGNED",
    "in progress": "IN_PROGRESS",
    "in_progress": "IN_PROGRESS",
    inprogress:  "IN_PROGRESS",
    resolved:    "RESOLVED",
    rejected:    "REJECTED",
};

const PRIORITY_KEYWORDS = ["high", "medium", "low"];

function detectStatus(input: string): ComplaintStatus | undefined {
    for (const [kw, status] of Object.entries(STATUS_KEYWORDS)) {
        if (input.includes(kw)) return status;
    }
}

function detectPriority(input: string): string | undefined {
    return PRIORITY_KEYWORDS.find(p => input.includes(p));
}

function categoryFromInput(input: string, complaints: Complaint[]): string | undefined {
    const cats = [...new Set(complaints.map(c => c.category.toLowerCase()))];
    return cats.find(cat => input.includes(cat));
}

// ==========================================
// TRUE NLP: GEMINI INTEGRATION
// ==========================================
export async function processCommand(raw: string, complaints: Complaint[], isAdmin: boolean): Promise<AIResponse> {
    const input = raw.trim();
    if (/^set key\s+/i.test(input)) {
        const key = input.replace(/^set key\s+/i, "").trim();
        localStorage.setItem("GEMINI_API_KEY", key);
        return { text: "✅ **Gemini API Key Saved!** I am now powered by true Natural Language Processing. Try asking me complex questions!" };
    }
    
    if (/^remove key/i.test(input)) {
        localStorage.removeItem("GEMINI_API_KEY");
        return { text: "🗑️ Gemini API Key removed. Reverting to local fallback engine." };
    }

    const key = localStorage.getItem("GEMINI_API_KEY");
    if (key) {
        try {
            return await processLLMCommand(input, complaints, isAdmin, key);
        } catch (err) {
            console.error(err);
            return { text: "⚠️ **LLM Error**: The API Key might be invalid or I'm rate limited. Let me fallback to my local logic...\n\n" + fallbackProcessCommand(raw, complaints, isAdmin).text };
        }
    }

    // Delay for local fallback to feel natural
    await new Promise(r => setTimeout(r, 700 + Math.random() * 400));
    return fallbackProcessCommand(raw, complaints, isAdmin);
}

async function processLLMCommand(input: string, complaints: Complaint[], isAdmin: boolean, apiKey: string): Promise<AIResponse> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const context = `
You are SmartCampus AI, an administrative assistant for a university complaint management app. 
You are given a snapshot of the current complaints. Figure out what the user wants to do.
User is Admin: ${isAdmin}
Total Complaints: ${complaints.length}
Snapshot of data (JSON array): ${JSON.stringify(complaints.map(c => ({ id: c.id, c: c.category, s: c.status, p: c.priority }))) }

You MUST ONLY output a JSON string of type AIResponse. NO MARKDOWN formatting, purely the JSON.
type ActionType =
    | { type: "DELETE_ALL" } // Admin only
    | { type: "DELETE_BY_STATUS", status: "PENDING"|"ASSIGNED"|"IN_PROGRESS"|"RESOLVED"|"REJECTED" } // Admin only
    | { type: "DELETE_BY_CATEGORY", category: string } // Admin only
    | { type: "FILTER", status?: string, priority?: string }
    | { type: "RESOLVE_ALL_PENDING" } // Admin only
    | { type: "SHOW_GRAPH", graphType: "status" | "priority" | "category" }
    | { type: "NONE" };

interface AIResponse {
    text: string; // The natural language conversational reply to the user. (Be highly descriptive, use emojis, formatting).
    action?: ActionType;
    requiresConfirm?: boolean; // If they want to do a destructive action or massive change
    confirmLabel?: string; // e.g. "Yes, delete"
}

User prompt: "${input}"
`;
    
    const result = await model.generateContent(context);
    let txt = result.response.text().trim();
    if (txt.startsWith("\`\`\`json")) txt = txt.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
    
    try {
        return JSON.parse(txt) as AIResponse;
    } catch {
        return { text: "🧠 I tried to think extremely hard about that, but my logic module glitched. Can you rephrase?" };
    }
}

// ==========================================
// LOCAL NLP PATTERN MATCHING FALLBACK
// ==========================================
function fallbackProcessCommand(raw: string, complaints: Complaint[], isAdmin: boolean): AIResponse {
    const input = raw.toLowerCase().trim();

    // ── GREETINGS ───────────────────────────────────────────────
    if (/^(hi|hello|hey|yo)\b/.test(input)) {
        return { text: "👋 Hello! I'm your SmartCampus AI Assistant. Ask me anything about complaints — counts, stats, filters, or actions like deleting complaints!" };
    }

    // ── HELP ────────────────────────────────────────────────────
    if (input.includes("help") || input.includes("what can you do") || input.includes("commands")) {
        return {
            text: `🤖 Here's what I can do:\n\n` +
                `📊 **Stats & Counts**\n• "how many complaints"\n• "show stats"\n• "most common category"\n• "highest urgency complaint"\n\n` +
                `🧠 **AI Insights**\n• "analyze bottlenecks"\n• "show trends"\n\n` +
                `🔍 **Filter & Find**\n• "show pending complaints"\n• "show high priority"\n• "find [category] complaints"\n\n` +
                `📈 **Graphs & Trends**\n• "show graph of status"\n• "plot complaints by category"\n• "chart priorities"\n\n` +
                (isAdmin ? `🗑️ **Actions (Admin)**\n• "delete all complaints"\n• "delete pending complaints"\n• "delete rejected complaints"\n• "delete [category] complaints"\n• "resolve all pending"\n\n` : "") +
                `💡 Just type naturally — I'll understand!`
        };
    }

    // ── GRAPHS & CHARTS ──────────────────────────────────────────
    if (/graph|chart|plot|visualize/.test(input)) {
        let graphType: "status" | "priority" | "category" = "status";
        if (input.includes("priority") || input.includes("priorities")) graphType = "priority";
        else if (input.includes("category") || input.includes("categories")) graphType = "category";
        
        return {
            text: `📈 Here is the graph of complaints by **${graphType}**:`,
            action: { type: "SHOW_GRAPH", graphType }
        };
    }

    // ── TOTAL COUNT ──────────────────────────────────────────────
    if (/how many|total|count all|number of|give.*(count|number)|show.*(count|number)/.test(input) && !detectStatus(input) && !detectPriority(input)) {
        return { text: `📋 There are currently **${complaints.length}** complaint${complaints.length !== 1 ? "s" : ""} in the system.` };
    }

    // ── COUNT BY STATUS ──────────────────────────────────────────
    if (/(count|how many|number of)/.test(input) && detectStatus(input)) {
        const status = detectStatus(input)!;
        const count = complaints.filter(c => c.status === status).length;
        const emoji: Record<string, string> = { PENDING: "⏳", ASSIGNED: "👤", IN_PROGRESS: "⚙️", RESOLVED: "✅", REJECTED: "❌" };
        return { text: `${emoji[status] || "📋"} There are **${count}** ${status.replace(/_/g, " ").toLowerCase()} complaint${count !== 1 ? "s" : ""}.` };
    }

    // ── COUNT BY PRIORITY ────────────────────────────────────────
    if (/(count|how many|number of)/.test(input) && detectPriority(input)) {
        const priority = detectPriority(input)!;
        const count = complaints.filter(c => c.priority.toLowerCase() === priority).length;
        return { text: `🎯 There are **${count}** ${priority} priority complaint${count !== 1 ? "s" : ""}.` };
    }

    // ── STATS OVERVIEW ───────────────────────────────────────────
    if (/stats|overview|summary|breakdown|report/.test(input)) {
        const total = complaints.length;
        const byStatus = Object.entries(STATUS_KEYWORDS).reduce((acc, [, s]) => {
            acc[s] = complaints.filter(c => c.status === s).length;
            return acc;
        }, {} as Record<string, number>);
        const unique = [...new Set(Object.values(byStatus))]; void unique;
        const rate = total > 0 ? Math.round((byStatus["RESOLVED"] / total) * 100) : 0;
        return {
            text:
                `📊 **Complaint Overview**\n\n` +
                `• Total: **${total}**\n` +
                `• ⏳ Pending: **${byStatus["PENDING"]}**\n` +
                `• 👤 Assigned: **${byStatus["ASSIGNED"]}**\n` +
                `• ⚙️ In Progress: **${byStatus["IN_PROGRESS"]}**\n` +
                `• ✅ Resolved: **${byStatus["RESOLVED"]}**\n` +
                `• ❌ Rejected: **${byStatus["REJECTED"]}**\n\n` +
                `🏆 Resolution Rate: **${rate}%**`
        };
    }

    // ── MOST COMMON CATEGORY ─────────────────────────────────────
    if (/most common|top category|popular|frequent/.test(input)) {
        if (complaints.length === 0) return { text: "No complaints yet to analyze." };
        const catMap: Record<string, number> = {};
        complaints.forEach(c => { catMap[c.category] = (catMap[c.category] || 0) + 1; });
        const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
        const top3 = sorted.slice(0, 3).map(([cat, n], i) => `${i + 1}. **${cat}** (${n})`).join("\n");
        return { text: `🏷️ **Top Categories:**\n${top3}` };
    }

    // ── HIGHEST URGENCY ──────────────────────────────────────────
    if (/highest urgency|most urgent|critical|emergency/.test(input)) {
        if (complaints.length === 0) return { text: "No complaints to analyze." };
        const sorted = [...complaints].sort((a, b) => calcUrgencyScore(b) - calcUrgencyScore(a));
        const top = sorted[0];
        const score = calcUrgencyScore(top);
        return { text: `🚨 **Most Urgent Complaint** (Score: ${score}/100)\n\n📌 Category: **${top.category}**\n📍 Location: **${top.location}**\n⚡ Priority: **${top.priority}**\n🔁 Status: **${top.status}**\n👍 Upvotes: **${top.upvoters?.length || 0}**\n\n"${top.description.slice(0, 100)}${top.description.length > 100 ? '…' : ''}"` };
    }

    // ── AI BOTTLENECKS & TRENDS ──────────────────────────────────
    if (/insight|bottleneck|slowest|trend/i.test(input)) {
        const pending = complaints.filter(c => c.status === "PENDING" || c.status === "IN_PROGRESS");
        if (pending.length === 0) return { text: "🎉 No bottlenecks right now! All issues seem to be handled quickly." };

        const byCat: Record<string, number> = {};
        pending.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
        const slowestCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

        const oldPending = pending.filter(p => {
             const daysOld = (new Date().getTime() - new Date(p.createdAt || new Date()).getTime()) / (1000 * 3600 * 24);
             return daysOld > 7;
        });

        let text = `🧠 **AI Insights & Bottlenecks**\n\n`;
        text += `• **Struggling Category**: We have **${slowestCat[1]} unresolved** complaints in **${slowestCat[0]}**. This is our current bottleneck.\n`;
        if (oldPending.length > 0) {
            text += `• **Stale Issues**: There are **${oldPending.length} complaints** pending for more than a week. We should prioritize these.\n`;
        } else {
            text += `• **Fresh Backlog**: Most pending issues are fairly recent!\n`;
        }
        text += `\n💡 **Recommendation**: Target the "${slowestCat[0]}" category first to clear the largest backlog.`;
        return { text };
    }

    // ── AI ASSISTANCE & FIX SUGGESTIONS ──────────────────────────
    if (/how to fix|suggest|solve|idea|fix/i.test(input) && !/(delete|remove)/.test(input)) {
        if (/ac|air condition|hvac/.test(input)) {
            return { text: `❄️ **AC Fix Suggestions:**\n1. Check if the thermostat is set to cooling mode.\n2. Verify the air filter isn't dirty affecting airflow.\n3. Make sure the circuit breaker hasn't tripped.\n4. If leaking, check the AC drain line for clogs.` };
        }
        if (/electrical|power|light/.test(input)) {
            return { text: `⚡ **Electrical Fix Suggestions:**\n1. Ensure the main power switch/breaker for the room is ON.\n2. Check if a GFCI outlet needs to be reset.\n3. Verify if it's a localized issue (one room) or whole building.\n4. Do NOT attempt to wire anything if you are not authorized.` };
        }
        if (/plumb|water|leak|toilet/.test(input)) {
            return { text: `💧 **Plumbing Fix Suggestions:**\n1. For leaks, immediately shut off the localized water valve.\n2. If the toilet is clogged, try using a plunger before calling maintenance.\n3. For slow drains, avoid using chemical cleaners. Try a plumbing snake or hot water first.` };
        }
        if (/internet|wifi|network/.test(input)) {
            return { text: `🌐 **Network Fix Suggestions:**\n1. Unplug the router/switch, wait 30 seconds, and plug it back in.\n2. Check if the campus portal requires re-authentication.\n3. Verify if there is a known campus-wide outage.\n4. Try forgetting the network and reconnecting on the device.` };
        }
        return { text: `🧠 **General Fix Suggestions:**\nIf you're unsure how to resolve a complaint:\n• Contact the specific department assigned to the category.\n• Ask the reporter for more details using the Comments section.\n• Check past resolved complaints in this category to see how they were handled.` };
    }

    // ── DELETE ALL (admin) ───────────────────────────────────────
    if (isAdmin && /delete all|remove all|clear all/.test(input)) {
        if (complaints.length === 0) return { text: "✅ There are no complaints to delete." };
        return {
            text: `⚠️ You're about to delete **all ${complaints.length} complaints**. This cannot be undone. Do you confirm?`,
            action: { type: "DELETE_ALL" },
            requiresConfirm: true,
            confirmLabel: `Yes, delete all ${complaints.length}`,
        };
    }

    // ── DELETE BY STATUS (admin) ─────────────────────────────────
    if (isAdmin && /delete|remove/.test(input) && detectStatus(input)) {
        const status = detectStatus(input)!;
        const count = complaints.filter(c => c.status === status).length;
        if (count === 0) return { text: `✅ No ${status.replace(/_/g, " ").toLowerCase()} complaints to delete.` };
        return {
            text: `⚠️ Delete all **${count} ${status.replace(/_/g, " ").toLowerCase()}** complaints? This cannot be undone.`,
            action: { type: "DELETE_BY_STATUS", status },
            requiresConfirm: true,
            confirmLabel: `Yes, delete ${count} ${status.replace(/_/g, " ").toLowerCase()}`,
        };
    }

    // ── DELETE BY CATEGORY (admin) ───────────────────────────────
    if (isAdmin && /delete|remove/.test(input)) {
        const cat = categoryFromInput(input, complaints);
        if (cat) {
            const count = complaints.filter(c => c.category.toLowerCase() === cat).length;
            if (count === 0) return { text: `✅ No complaints in category "${cat}" to delete.` };
            return {
                text: `⚠️ Delete all **${count}** "${cat}" complaints? This cannot be undone.`,
                action: { type: "DELETE_BY_CATEGORY", category: cat },
                requiresConfirm: true,
                confirmLabel: `Yes, delete ${count}`,
            };
        }
    }

    // ── RESOLVE ALL PENDING (admin) ───────────────────────────────
    if (isAdmin && /resolve all|mark all.*resolved|close all/.test(input)) {
        const count = complaints.filter(c => c.status === "PENDING").length;
        if (count === 0) return { text: "✅ No pending complaints to resolve." };
        return {
            text: `✅ Mark all **${count} pending** complaints as resolved?`,
            action: { type: "RESOLVE_ALL_PENDING" },
            requiresConfirm: true,
            confirmLabel: `Yes, resolve ${count} complaints`,
        };
    }

    // ── FILTER SHOW ───────────────────────────────────────────────
    if (/show|filter|list|find|display/.test(input)) {
        const status = detectStatus(input);
        const priority = detectPriority(input);
        if (status || priority) {
            const filtered = complaints.filter(c =>
                (!status || c.status === status) &&
                (!priority || c.priority.toLowerCase() === priority)
            );
            const desc = [
                status ? status.replace(/_/g, " ").toLowerCase() : "",
                priority ? priority + " priority" : "",
            ].filter(Boolean).join(", ");
            return {
                text: `🔍 Found **${filtered.length}** ${desc} complaint${filtered.length !== 1 ? "s" : ""}. Applying filter now...`,
                action: { type: "FILTER", status, priority: priority ? (priority.charAt(0).toUpperCase() + priority.slice(1)) : undefined },
            };
        }
    }

    // ── FALLBACK ─────────────────────────────────────────────────
    return {
        text: `🤔 I didn't quite understand that. Try asking:\n• "how many complaints"\n• "show pending"\n• "stats"\n• "most common category"\n${isAdmin ? '• "delete all"\n• "delete rejected"\n' : ""}• "help"`
    };
}
