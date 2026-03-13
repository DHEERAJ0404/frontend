export type UserRole = "STUDENT" | "ADMIN";

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

export type ComplaintStatus =
    | "PENDING"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "RESOLVED"
    | "REJECTED";

export interface Comment {
    id: number;
    text: string;
    createdAt: string;
    user: User;
}

export interface Complaint {
    id: number;
    description: string;
    category: string;
    imageUrl?: string;
    status: ComplaintStatus;
    priority: string;
    location: string;
    upvoters: User[];
    comments: Comment[];
    createdAt: string; // ISO Date String
    user?: User;       // Depending on what frontend needs
}

export interface AuthResponse {
    token: string;
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

export interface ComplaintRequest {
    description: string;
    category: string;
    imageUrl?: string;
    priority: string;
    location: string;
}
