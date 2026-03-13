import React, { useState, useRef } from "react";
import type { ComplaintRequest } from "../types/index.ts";
import { createComplaint } from "../services/complaint.service.ts";
import { toast } from "react-toastify";

interface Props {
    onComplaintSubmitted: () => void;
}

const CATEGORIES = ["Hostel", "Water", "Electricity", "Internet", "Cleanliness", "Others"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const LOCATIONS = ["Library", "Hostel Block A", "Main Building", "Cafeteria", "Sports Complex", "Other"];

const BACKEND_UPLOAD_URL = "http://localhost:8082/api/upload/image";

const ComplaintForm: React.FC<Props> = ({ onComplaintSubmitted }) => {
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [priority, setPriority] = useState(PRIORITIES[1]);
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [imageUrl, setImageUrl] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadToBackend = async (file: File) => {
        setUploading(true);
        setUploadProgress(0);

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Simulate progress while uploading
            const progressInterval = setInterval(() => {
                setUploadProgress((p) => Math.min(p + 15, 85));
            }, 200);

            const token = localStorage.getItem("token");
            const response = await fetch(BACKEND_UPLOAD_URL, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            const data = await response.json();

            if (response.ok && data.url) {
                setImageUrl(data.url);
                toast.success("📸 Image uploaded successfully!", {
                    style: { borderRadius: '16px', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }
                });
            } else {
                toast.error("Image upload failed. You can still paste a URL manually.");
                setImagePreview(null);
            }
        } catch {
            toast.error("Image upload failed. Please paste a URL manually.");
            setImagePreview(null);
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadToBackend(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            uploadToBackend(file);
        } else {
            toast.error("Please drop a valid image file.");
        }
    };

    const removeImage = () => {
        setImageUrl("");
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const ComplaintRequest: ComplaintRequest = { description, category, imageUrl, priority, location };
            await createComplaint(ComplaintRequest);
            toast.success("Complaint submitted successfully!", {
                style: { borderRadius: '16px', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }
            });
            setDescription("");
            setImageUrl("");
            setImagePreview(null);
            onComplaintSubmitted();
        } catch (error) {
            toast.error("Failed to submit complaint.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative z-10 w-full animate-fade-in">
            <div className="flex items-center justify-between mb-8 animate-slide-up">
                <div>
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 drop-shadow-sm flex items-center gap-3">
                        Submit a New Complaint
                    </h3>
                    <p className="text-base text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        Report an issue and our team will get on it.
                    </p>
                </div>
                <div className="hidden sm:block">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                        <span className="relative flex items-center justify-center h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 animate-slide-up delay-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Category */}
                    <div className="group">
                        <label className={`block text-sm font-bold mb-2 transition-colors duration-300 ${focusedField === 'category' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>Category</label>
                        <div className="relative">
                            <select
                                value={category}
                                onFocus={() => setFocusedField('category')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => setCategory(e.target.value)}
                                className="block w-full px-5 py-4 rounded-xl border-gray-200/80 dark:border-gray-700/80 bg-white/50 dark:bg-gray-800/50 shadow-inner focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-base outline-none transition-all duration-300 dark:text-white appearance-none hover:bg-white/80 dark:hover:bg-gray-800/80 cursor-pointer"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 group-hover:text-indigo-500 transition-colors">
                                <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="group">
                        <label className={`block text-sm font-bold mb-2 transition-colors duration-300 ${focusedField === 'location' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>Location</label>
                        <div className="relative">
                            <select
                                value={location}
                                onFocus={() => setFocusedField('location')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => setLocation(e.target.value)}
                                className="block w-full px-5 py-4 rounded-xl border-gray-200/80 dark:border-gray-700/80 bg-white/50 dark:bg-gray-800/50 shadow-inner focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-base outline-none transition-all duration-300 dark:text-white appearance-none hover:bg-white/80 dark:hover:bg-gray-800/80 cursor-pointer"
                            >
                                {LOCATIONS.map((loc) => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 group-hover:text-indigo-500 transition-colors">
                                <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="group">
                        <label className={`block text-sm font-bold mb-2 transition-colors duration-300 ${focusedField === 'priority' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>Priority Level</label>
                        <div className="relative">
                            <select
                                value={priority}
                                onFocus={() => setFocusedField('priority')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => setPriority(e.target.value)}
                                className="block w-full px-5 py-4 rounded-xl border-gray-200/80 dark:border-gray-700/80 bg-white/50 dark:bg-gray-800/50 shadow-inner focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-base outline-none transition-all duration-300 dark:text-white appearance-none hover:bg-white/80 dark:hover:bg-gray-800/80 cursor-pointer"
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 group-hover:text-indigo-500 transition-colors">
                                <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload Field */}
                    <div className="group">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Attach Photo <span className="text-xs font-semibold text-gray-400 opacity-70 ml-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Optional</span>
                        </label>

                        {/* If no image yet: drag-and-drop / click zone */}
                        {!imagePreview ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className={`group/drop relative overflow-hidden flex flex-col items-center justify-center gap-3 p-6 min-h-[140px] rounded-xl border-2 border-dashed transition-all duration-500 ease-out cursor-pointer ${
                                    dragOver 
                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.02]" 
                                    : "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 hover:border-indigo-400 hover:shadow-lg"
                                }`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover/drop:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
                                <div className={`p-3 rounded-full transition-all duration-300 ${dragOver ? "bg-indigo-100 dark:bg-indigo-500/30 animate-bounce" : "bg-gray-100 dark:bg-gray-700 group-hover/drop:bg-indigo-50 dark:group-hover/drop:bg-indigo-500/20 group-hover/drop:-translate-y-1"}`}>
                                    <svg className={`w-8 h-8 transition-colors duration-300 ${dragOver ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 group-hover/drop:text-indigo-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                                <div className="text-center z-10">
                                    <p className={`font-bold transition-colors duration-300 ${dragOver ? "text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300 group-hover/drop:text-indigo-600 dark:group-hover/drop:text-indigo-400"}`}>
                                        Click to browse or drag image here
                                    </p>
                                    <p className="text-xs font-medium text-gray-500 mt-1">
                                        PNG, JPG up to 10MB
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Preview + progress */
                            <div className="relative rounded-xl overflow-hidden shadow-lg group/preview border border-gray-200 dark:border-gray-700 h-[140px]">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/preview:scale-105"
                                />
                                {uploading && (
                                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                                        <div className="relative w-12 h-12 mb-3">
                                            <svg className="animate-spin text-white absolute inset-0 w-full h-full" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        </div>
                                        <div className="w-full max-w-[150px] bg-white/20 rounded-full h-2 mb-1 overflow-hidden backdrop-blur-md">
                                            <div 
                                                className="bg-emerald-400 h-full rounded-full transition-all duration-300 relative overflow-hidden"
                                                style={{ width: `${uploadProgress}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite]"></div>
                                            </div>
                                        </div>
                                        <span className="text-white text-xs font-bold drop-shadow-md tracking-wider">UPLOADING... {uploadProgress}%</span>
                                    </div>
                                )}
                                {!uploading && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 flex items-start justify-end p-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white border border-white/30 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm transition-all hover:scale-105"
                                        >
                                            Change
                                        </button>
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="bg-red-500/80 hover:bg-red-500 backdrop-blur-md text-white border border-red-400/50 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm transition-all hover:scale-105"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                                {!uploading && imageUrl && (
                                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 bg-gray-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-700/50 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 translate-y-2 group-hover/preview:translate-y-0 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                        <span className="text-gray-200 truncate font-mono">{imageUrl}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {/* Manual URL fallback */}
                        <div className="relative mt-3">
                            <input
                                type="text"
                                onFocus={() => setFocusedField('image_url')}
                                onBlur={() => setFocusedField(null)}
                                value={imageUrl}
                                onChange={(e) => { setImageUrl(e.target.value); setImagePreview(null); }}
                                className="block w-full px-4 py-3 rounded-xl border-gray-200/80 dark:border-gray-700/80 bg-white/50 dark:bg-gray-800/50 shadow-inner focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm outline-none transition-all duration-300 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-800"
                                placeholder="Or paste image URL directly…"
                            />
                        </div>
                    </div>
                </div>

                <div className="group animate-slide-up delay-200">
                    <label className={`block text-sm font-bold mb-2 transition-colors duration-300 ${focusedField === 'description' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>Description</label>
                    <textarea
                        required
                        rows={4}
                        onFocus={() => setFocusedField('description')}
                        onBlur={() => setFocusedField(null)}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="block w-full px-5 py-4 rounded-xl border-gray-200/80 dark:border-gray-700/80 bg-white/50 dark:bg-gray-800/50 shadow-inner focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-base outline-none transition-all duration-300 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:bg-white dark:focus:bg-gray-800"
                        placeholder="Please describe the issue in detail. Be as specific as possible so we can help quickly..."
                    />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800 animate-slide-up delay-300">
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="relative overflow-hidden group btn-primary rounded-xl px-10 py-4 font-bold tracking-wide shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-1 transition-all duration-300 focus:ring-4 focus:ring-indigo-500/30"
                    >
                        {/* Shimmer effect inside button */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full group-hover:duration-1000 transition-transform ease-out"></div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiLz48L3N2Zz4=')]"></div>

                        <div className="relative flex items-center justify-center text-lg z-10">
                            {loading ? (
                                <span className="flex items-center gap-3">
                                    <svg className="animate-spin h-5 w-5 text-indigo-200" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Transmitting...
                                </span>
                            ) : uploading ? (
                                "Wait for Upload..."
                            ) : (
                                <span className="flex items-center gap-2">
                                    Submit Request
                                    <svg className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </span>
                            )}
                        </div>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ComplaintForm;
