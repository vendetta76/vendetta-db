import { useState } from "react";

type Props = {
  onLogin: (token: string) => void;
};

export default function Login({ onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const data = await res.json();
      onLogin(data.token);
    } else {
      setError("Password salah, coba lagi.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-4 border rounded bg-white shadow space-y-4">
      <h1 className="text-xl font-bold">Login</h1>
      <input
        type="password"
        placeholder="Masukkan password"
        className="w-full border p-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {loading ? "Masuk..." : "Login"}
      </button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}