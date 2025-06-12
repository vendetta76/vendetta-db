import { useState } from "react";

type Props = {
  token: string;
  folder?: string;
  onCreated: () => void;
};

export default function CreateFile({ token, folder, onCreated }: Props) {
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!filename.trim() || !content.trim()) {
      setError("Nama file dan isi wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/create-file`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: filename.trim(), content, folder }),
    });

    if (res.ok) {
      setFilename("");
      setContent("");
      onCreated();
    } else {
      setError("Gagal membuat file.");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-2 max-w-md">
      <h3 className="font-bold">📝 Buat File Baru</h3>

      <input
        type="text"
        placeholder="Nama file (contoh: notes.md)"
        className="border px-2 py-1 rounded w-full"
        value={filename}
        onChange={(e) => setFilename(e.target.value)}
      />

      <textarea
        placeholder="Isi file..."
        className="border px-2 py-1 rounded w-full h-32"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        onClick={handleCreate}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-1 rounded"
      >
        {loading ? "Membuat..." : "Buat File"}
      </button>
    </div>
  );
}