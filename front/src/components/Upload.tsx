import { useState, ChangeEvent } from "react";

type Props = {
  token: string;
  folders: string[];
  onUploaded: () => void;
  forcedFolder?: string; // ✅ tambahan
};

type FileState = {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error" | "cancelled";
  errorMsg?: string;
  xhr?: XMLHttpRequest;
};

export default function Upload({ token, folders, onUploaded, forcedFolder }: Props) {
  const [selectedFolder, setSelectedFolder] = useState("");
  const [files, setFiles] = useState<FileState[]>([]);
  const [uploading, setUploading] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).map((file) => {
      const tooBig = file.size > MAX_FILE_SIZE;
      return {
        file,
        progress: 0,
        status: tooBig ? "error" : "pending",
        errorMsg: tooBig ? "File too large (max 5MB)" : undefined,
      } as FileState;
    });
    setFiles(selected);
  };

  const cancelUpload = (idx: number) => {
    const xhr = files[idx].xhr;
    if (xhr) xhr.abort();

    setFiles((prev) => {
      const updated = [...prev];
      updated[idx].status = "cancelled";
      updated[idx].errorMsg = "Cancelled by user";
      return updated;
    });
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");

    setUploading(true);

    await Promise.all(
      pendingFiles.map((entry, idx) => {
        return new Promise<void>((resolve) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append("file", entry.file);

          // ✅ Gunakan forcedFolder kalau ada
          const folderToUse = forcedFolder || selectedFolder;
          if (folderToUse) {
            formData.append("folder", folderToUse);
          }

          const realIdx = files.findIndex((f) => f.file === entry.file);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setFiles((prev) => {
                const updated = [...prev];
                updated[realIdx].progress = percent;
                return updated;
              });
            }
          };

          xhr.onload = () => {
            const success = xhr.status >= 200 && xhr.status < 300;
            setFiles((prev) => {
              const updated = [...prev];
              updated[realIdx].status = success ? "done" : "error";
              updated[realIdx].errorMsg = success
                ? undefined
                : `Error: ${xhr.status}`;
              return updated;
            });
            resolve();
          };

          xhr.onerror = () => {
            setFiles((prev) => {
              const updated = [...prev];
              updated[realIdx].status = "error";
              updated[realIdx].errorMsg = "Upload failed";
              return updated;
            });
            resolve();
          };

          xhr.onabort = () => {
            setFiles((prev) => {
              const updated = [...prev];
              updated[realIdx].status = "cancelled";
              updated[realIdx].errorMsg = "Upload cancelled";
              return updated;
            });
            resolve();
          };

          xhr.open("POST", "/api/upload");
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          setFiles((prev) => {
            const updated = [...prev];
            updated[realIdx].status = "uploading";
            updated[realIdx].xhr = xhr;
            return updated;
          });
          xhr.send(formData);
        });
      })
    );

    setUploading(false);
    onUploaded();
  };

  return (
    <div className="space-y-3">
      {!forcedFolder && (
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="border px-2 py-1 rounded w-full"
        >
          <option value="">Select folder (optional)</option>
          {folders.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      )}

      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        className="block"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(({ file, progress, status, errorMsg }, idx) => (
            <div key={idx} className="w-full border p-2 rounded">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">{file.name}</span>
                {status === "uploading" && (
                  <button
                    onClick={() => cancelUpload(idx)}
                    className="text-xs bg-red-600 text-white px-2 py-0.5 rounded"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="bg-gray-300 rounded h-2 overflow-hidden mb-1">
                <div
                  className={
                    status === "error"
                      ? "bg-red-500 h-2"
                      : status === "cancelled"
                      ? "bg-yellow-500 h-2"
                      : "bg-green-500 h-2"
                  }
                  style={{ width: `${progress}%` }}
                />
              </div>

              {errorMsg && (
                <div className="text-red-600 text-xs">{errorMsg}</div>
              )}
              {status === "done" && (
                <div className="text-green-600 text-xs">Uploaded ✅</div>
              )}
              {status === "cancelled" && (
                <div className="text-yellow-600 text-xs">Cancelled 🛑</div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || !files.some((f) => f.status === "pending")}
        className="bg-green-600 text-white px-4 py-1 rounded"
      >
        {uploading ? "Uploading..." : "Upload Files"}
      </button>
    </div>
  );
}