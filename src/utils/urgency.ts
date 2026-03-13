import type { Complaint } from "../types/index.ts";

/**
 * Urgency Score = weighted combination of:
 *  - Priority:  High=40, Medium=20, Low=5
 *  - Age:       +2 per day unresolved (max 40)
 *  - Upvotes:   +3 per upvote (max 20)
 * Max score ≈ 100
 */
export function calcUrgencyScore(complaint: Complaint): number {
    const priorityScore =
        complaint.priority === "High" ? 40 :
        complaint.priority === "Medium" ? 20 : 5;

    const ageInDays = Math.floor(
        (Date.now() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const ageScore = Math.min(ageInDays * 2, 40);

    const upvoteScore = Math.min((complaint.upvoters?.length || 0) * 3, 20);

    return Math.min(priorityScore + ageScore + upvoteScore, 100);
}

export function urgencyLabel(score: number): { label: string; color: string; bg: string } {
    if (score >= 70) return { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
    if (score >= 45) return { label: "High", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    if (score >= 20) return { label: "Medium", color: "#6366f1", bg: "rgba(99,102,241,0.12)" };
    return { label: "Low", color: "#10b981", bg: "rgba(16,185,129,0.12)" };
}
