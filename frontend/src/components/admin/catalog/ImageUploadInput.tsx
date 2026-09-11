import React, { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { UploadCloud, X, CheckCircle2, Link2, Loader2 } from "lucide-react";
import { StoreService } from "../../../services/storeService";

interface ImageUploadInputProps {
  value?: string;
  onChange: (imageUrl: string) => void;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  value,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [directUrl, setDirectUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (JPG, PNG, WebP).");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(20);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        setUploadProgress(50);
        const res = await StoreService.uploadImage(dataUrl, (pct) => setUploadProgress(pct));
        if (res && res.success && res.url) {
          onChange(res.url);
        } else {
          onChange(dataUrl);
        }
      } catch (err) {
        console.warn("Upload service error, fallback to local data URL:", err);
        onChange(dataUrl);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDirectUrlSubmit = () => {
    if (directUrl.trim()) {
      onChange(directUrl.trim());
      setDirectUrl("");
      setShowUrlInput(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-stone-700">
          Saree Image &amp; Presentation
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-[#D4A373] hover:text-[#b8824f] font-medium flex items-center gap-1 transition-colors"
        >
          <Link2 size={12} />
          <span>{showUrlInput ? "Upload File" : "Paste Image URL"}</span>
        </button>
      </div>

      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={directUrl}
            onChange={(e) => setDirectUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
          />
          <button
            type="button"
            onClick={handleDirectUrlSubmit}
            className="px-4 h-10 rounded-xl bg-[#2A0E20] text-amber-100 text-xs font-medium hover:bg-[#3d162f] transition-colors"
          >
            Apply
          </button>
        </div>
      ) : value ? (
        /* Preview state */
        <div className="relative rounded-2xl border border-stone-200/80 bg-white p-3 flex items-center gap-4 shadow-sm">
          <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
            <img
              src={value}
              alt="Saree Preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
              <CheckCircle2 size={14} />
              <span>Image Uploaded Successfully</span>
            </div>
            <p className="text-[11px] text-stone-500 truncate">{value}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-[#D4A373] hover:underline font-medium"
            >
              Replace Image
            </button>
          </div>

          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        /* Drag & Drop Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-[#D4A373] bg-[#D4A373]/10 scale-[1.01]"
              : "border-stone-200/80 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-center gap-2 text-stone-800 text-xs font-semibold">
                <Loader2 size={16} className="animate-spin text-[#D4A373]" />
                <span>Uploading Saree Visual to Cloud...</span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                <div
                  className="bg-gradient-to-r from-[#D4A373] to-[#2A0E20] h-full rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-stone-500 font-mono">
                {uploadProgress}%
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D4A373] mx-auto flex items-center justify-center border border-amber-200/60 shadow-xs">
                <UploadCloud size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800">
                  Drag &amp; Drop saree photograph here
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  or <span className="text-[#D4A373] font-medium">browse from files</span> (JPG, PNG, WebP)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-[11px] text-rose-600 font-medium">{uploadError}</p>
      )}
    </div>
  );
};
