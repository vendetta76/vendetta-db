let token = "";  // hanya disimpan selama sesi

const workerURL = "https://vendetta-db-worker.diorvendetta76.workers.dev";

function login() {
  const pw = document.getElementById("password").value;
  if (!pw) return alert("Password tidak boleh kosong.");

  fetch(workerURL + "/api/login", {
    method: "POST",
    headers: { "Authorization": `Bearer ${pw}` }
  })
  .then(res => res.ok ? res.json() : Promise.reject())
  .then(data => {
    if (data.success) {
      token = pw;
      document.getElementById("login-box").style.display = "none";
      document.getElementById("app").style.display = "block";
      loadFiles();
    } else {
      alert("Password salah.");
    }
  })
  .catch(() => alert("Gagal login."));
}

document.getElementById("upload-form").addEventListener("submit", async e => {
  e.preventDefault();
  const file = document.getElementById("file-input").files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(workerURL + "/api/upload", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData
  });

  const result = await res.json();
  document.getElementById("status").innerHTML =
    res.ok ? `✅ Uploaded: <a href="${result.file_url}" target="_blank">${file.name}</a>`
           : `❌ Upload gagal: ${result.message || "Unknown error"}`;

  loadFiles();
});

async function loadFiles() {
  const res = await fetch(workerURL + "/api/list", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await res.json();
  const listBox = document.getElementById("file-list");
  listBox.innerHTML = data.map(file =>
    `<div>
      📄 <a href="${file.url}" target="_blank">${file.name}</a>
      <button onclick="deleteFile('${file.name}')">🗑</button>
    </div>`
  ).join("");
}

async function deleteFile(file) {
  if (!confirm(`Hapus file ${file}?`)) return;
  await fetch(workerURL + `/api/delete?file=${encodeURIComponent(file)}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  loadFiles();
}