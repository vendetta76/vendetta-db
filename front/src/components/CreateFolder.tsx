import { useState } from "react";

type Props = {
  token: string;
  onCreated: () => void;
};

export default function CreateFolder({ token, onCreated }: Props) {
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createFolder = async () => {
    const name = folderName.trim();
    if (!name) {
      setError("Nama folder tidak boleh kosong.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/create-folder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ folder: name }),
    });

    if (res.ok) {
      setFolderName("");
      onCreated();
    } else {
      setError("Gagal membuat folder.");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-2 max-w-sm">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nama folder"
          className="border px-2 py-1 rounded w-full"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
        />
        <button
          onClick={createFolder}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          {loading ? "Membuat..." : "Buat"}
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}