import { useState } from "react";

type FileItem = {
  name: string;
  url: string;
  size?: number;
  uploaded?: string;
};

type Props = {
  token: string;
  files: FileItem[];
  onDelete: () => void;
};

export default function FileList({ token, files, onDelete }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (name: string) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      copy.has(name) ? copy.delete(name) : copy.add(name);
      return copy;
    });
  };

  const deleteSingle = async (fileKey: string) => {
    if (!confirm(`Yakin hapus file ini?\n${fileKey}`)) return;
    setDeleting(fileKey);

    await fetch(`/api/delete?file=${encodeURIComponent(fileKey)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setDeleting(null);
    onDelete();
  };

  const deleteSelected = async () => {
    if (!confirm(`Hapus ${selected.size} file?`)) return;

    await Promise.all(
      Array.from(selected).map((fileKey) =>
        fetch(`/api/delete?file=${encodeURIComponent(fileKey)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );

    setSelected(new Set());
    onDelete();
  };

  const toggleAll = () => {
    if (selected.size === files.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(files.map((f) => f.name)));
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">📄 File List</h2>

      {files.length === 0 && (
        <p className="text-gray-500">Belum ada file di folder ini.</p>
      )}

      {selected.size > 0 && (
        <div className="flex items-center justify-between p-2 border bg-yellow-50 rounded">
          <span>{selected.size} file selected</span>
          <button
            onClick={deleteSelected}
            className="bg-red-600 text-white text-sm px-3 py-1 rounded"
          >
            🗑 Delete Selected
          </button>
        </div>
      )}

      <div className="border rounded overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-3 py-2 font-bold bg-gray-100">
          <input
            type="checkbox"
            onChange={toggleAll}
            checked={selected.size === files.length}
          />
          <span>File</span>
          <span className="text-right">Size</span>
          <span className="text-right">Date</span>
          <span className="text-right">Action</span>
        </div>

        {files.map((file) => {
          const name = file.name.replace(/^uploads\//, "").split("/").pop()!;
          const fileKey = file.name;
          const isSelected = selected.has(file.name);
          const sizeKB = file.size ? (file.size / 1024).toFixed(1) + " KB" : "-";
          const date = file.uploaded
            ? new Date(file.uploaded).toLocaleString()
            : "-";

          return (
            <div
              key={fileKey}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 items-center px-3 py-2 border-t text-sm"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(file.name)}
              />
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                {name}
              </a>
              <span className="text-right text-gray-600">{sizeKB}</span>
              <span className="text-right text-gray-500">{date}</span>
              <button
                onClick={() => deleteSingle(file.name)}
                disabled={deleting === file.name}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
              >
                {deleting === file.name ? "..." : "🗑"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}