import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Upload from "./components/Upload";
import CreateFolder from "./components/CreateFolder";
import FileList from "./components/FileList";

type FileItem = {
  name: string;
  url: string;
};

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = decodeURIComponent(location.pathname).replace(/^\/+|\/+$/g, "");

  const fetchList = async (authToken: string) => {
    const res = await fetch("/api/list", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data: FileItem[] = await res.json();

    const visibleFolders = new Set<string>();
    const visibleFiles: FileItem[] = [];

    data.forEach((item) => {
      const relativePath = item.name.replace(/^uploads\//, "");

      const isInCurrentFolder = currentPath
        ? relativePath.startsWith(`${currentPath}/`)
        : !relativePath.includes("/");

      const stripped = currentPath ? relativePath.replace(`${currentPath}/`, "") : relativePath;

      if (!isInCurrentFolder || stripped.startsWith(".keep")) return;

      if (stripped.includes("/")) {
        const folderName = stripped.split("/")[0];
        visibleFolders.add(folderName);
      } else {
        visibleFiles.push(item);
      }
    });

    setFolders([...visibleFolders]);
    setFiles(visibleFiles);
  };

  useEffect(() => {
    if (token) {
      fetchList(token);
    }
  }, [token, currentPath]);

  if (!token) {
    return <Login onLogin={(t) => { setToken(t); fetchList(t); }} />;
  }

  return (
    <main className="p-6 font-mono text-sm space-y-6">
      <h1 className="text-xl font-bold">
        🔥 Vendetta File Manager — {currentPath || "(root)"}
      </h1>

      <div className="flex gap-4">
        <CreateFolder token={token} onCreated={() => fetchList(token)} />
        <Upload
          token={token}
          folders={folders}
          onUploaded={() => fetchList(token)}
          forcedFolder={currentPath}
        />
      </div>

      <section>
        <h2 className="font-bold mt-6">📂 Folders</h2>
        {folders.length === 0 && <p className="text-gray-500">No subfolders.</p>}
        {folders.map((f) => (
          <div key={f}>
            <button
              className="text-blue-600 underline"
              onClick={() =>
                navigate(`${location.pathname}/${f}`.replace(/\/+/g, "/"))
              }
            >
              {f}/
            </button>
          </div>
        ))}
      </section>

      <FileList
        token={token}
        files={files}
        onDelete={() => fetchList(token)}
      />
    </main>
  );
}
