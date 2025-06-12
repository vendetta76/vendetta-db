const api = "https://vendetta-db-worker.diorvendetta76.workers.dev";
let token = "";

async function login() {
  const password = document.getElementById("password").value;
  const res = await fetch(api + "/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
  if (!res.ok) return alert("Unauthorized");
  const data = await res.json();
  token = data.token;
  document.getElementById("login-box").style.display = "none";
  document.getElementById("panel").style.display = "block";
  loadFiles();
}

// UPLOAD FILE
document.getElementById("upload-form").addEventListener("submit", async e => {
  e.preventDefault();
  const file = document.getElementById("upload-file").files[0];
  const folder = document.getElementById("upload-path").value.trim();
  if (!file) return alert("No file selected");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  await fetch(api + "/api/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  loadFiles();
});

// CREATE FOLDER
document.getElementById("create-folder-form").addEventListener("submit", async e => {
  e.preventDefault();
  const folderName = document.getElementById("new-folder-name").value.trim();
  if (!folderName) return alert("Folder name required");

  await fetch(api + "/api/create-folder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ folder: folderName })
  });

  loadFiles();
});

// CREATE FILE
document.getElementById("create-file-form").addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("file-name").value.trim();
  const content = document.getElementById("file-content").value;
  const folder = document.getElementById("file-folder").value.trim();
  if (!name || !content) return alert("Name and content required");

  await fetch(api + "/api/create-file", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, content, folder })
  });

  loadFiles();
});

// LIST FILES
async function loadFiles() {
  const res = await fetch(api + "/api/list", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const files = await res.json();
  const listBox = document.getElementById("file-list");
  listBox.innerHTML = files.map(f => `
    <div>
      <a href="${f.url}" target="_blank">${f.name}</a>
      <button onclick="deleteFile('${f.name}')">🗑</button>
    </div>
  `).join("");
}

// DELETE FILE
async function deleteFile(fileName) {
  if (!confirm(`Delete ${fileName}?`)) return;
  await fetch(api + "/api/delete?file=" + encodeURIComponent(fileName), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  loadFiles();
}