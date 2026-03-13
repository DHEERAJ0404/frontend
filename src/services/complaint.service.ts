import api from "./api.ts";
import type { Complaint, ComplaintRequest, ComplaintStatus } from "../types/index.ts";

export const createComplaint = async (data: ComplaintRequest) => {
    return await api.post("/complaints", data);
};

export const getAllComplaints = async (): Promise<Complaint[]> => {
    const response = await api.get("/complaints");
    return response.data;
};

export const getMyComplaints = async (): Promise<Complaint[]> => {
    const response = await api.get("/complaints/my");
    return response.data;
};

export const updateComplaintStatus = async (id: number, status: ComplaintStatus) => {
    const response = await api.put(`/complaints/${id}/status`, status);
    return response.data;
};

export const upvoteComplaint = async (id: number) => {
    const response = await api.post(`/complaints/${id}/upvote`);
    return response.data;
};

export const addComment = async (id: number, text: string) => {
    const response = await api.post(`/complaints/${id}/comments`, { text });
    return response.data;
};

export const deleteComplaint = async (id: number) => {
    await api.delete(`/complaints/${id}`);
};
