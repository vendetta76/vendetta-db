import Upload from "./Upload";
import CreateFolder from "./CreateFolder";
import CreateFile from "./CreateFile";
import FileList from "./FileList";

type FileItem = {
  name: string;
  url: string;
  size?: number;
  uploaded?: string;
};

type Props = {
  token: string;
  folders: string[];
  files: FileItem[];
  currentPath: string;
  onRefresh: () => void;
  onNavigate: (folderName: string) => void;
};

export default function Homepage({
  token,
  folders,
  files,
  currentPath,
  onRefresh,
  onNavigate,
}: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-white text-sm font-sans">
      {/* Sidebar Folder List */}
      <aside className="w-64 bg-gray-100 p-4 border-r overflow-y-auto">
        <h2 className="text-lg font-bold mb-3">📁 Folders</h2>
        {folders.length === 0 ? (
          <p className="text-sm text-gray-500">Tidak ada folder.</p>
        ) : (
          folders.map((folder) => (
            <div
              key={folder}
              onClick={() => onNavigate(folder)}
              className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded text-blue-700"
            >
              {folder}
            </div>
          ))
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Vendetta File Manager
            <span className="text-sm text-gray-500 ml-2">/{currentPath || "root"}</span>
          </h1>
        </div>

        {/* Actions */}
        <div className="flex gap-4 flex-wrap">
          <CreateFolder token={token} onCreated={onRefresh} />
          <CreateFile token={token} folder={currentPath} onCreated={onRefresh} />
          <Upload
            token={token}
            folders={folders}
            onUploaded={onRefresh}
            forcedFolder={currentPath}
          />
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          <FileList token={token} files={files} onDelete={onRefresh} />
        </div>
      </main>
    </div>
  );
}