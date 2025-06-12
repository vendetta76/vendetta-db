import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Homepage from "./components/Homepage";

type FileItem = {
  name: string;
  url: string;
  size?: number;
  uploaded?: string;
};

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = decodeURIComponent(location.pathname).replace(/^\/+|\/+$/g, "");

  const fetchList = async (authToken: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/list`, {
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

  const stripped = currentPath
    ? relativePath.replace(`${currentPath}/`, "")
    : relativePath;

  if (!isInCurrentFolder) return;

  if (stripped.includes("/")) {
    const folderName = stripped.split("/")[0];
    visibleFolders.add(folderName);
  } else {
    if (!stripped.endsWith(".keep")) {
      visibleFiles.push(item);
    }
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
    <Homepage
      token={token}
      folders={folders}
      files={files}
      currentPath={currentPath}
      onRefresh={() => fetchList(token)}
      onNavigate={(folder) =>
        navigate(`${location.pathname}/${folder}`.replace(/\/+/g, "/"))
      }
    />
  );
}