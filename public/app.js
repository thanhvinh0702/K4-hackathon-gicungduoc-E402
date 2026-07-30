const state = { lessons: [], activeId: null };

const elements = {
  list: document.querySelector("#lesson-list"),
  count: document.querySelector("#lesson-count"),
  search: document.querySelector("#search-input"),
  title: document.querySelector("#current-title"),
  context: document.querySelector("#current-context"),
  homeView: document.querySelector("#home-view"),
  homeNav: document.querySelector("#home-nav"),
  recentGrid: document.querySelector("#recent-grid"),
  homeSummary: document.querySelector("#home-summary"),
  pdfWrap: document.querySelector("#pdf-wrap"),
  pdfFrame: document.querySelector("#pdf-frame"),
  openNew: document.querySelector("#open-new"),
  modal: document.querySelector("#upload-modal"),
  form: document.querySelector("#upload-form"),
  fileInput: document.querySelector("#pdf-input"),
  fileLabel: document.querySelector("#file-label"),
  fileHint: document.querySelector("#file-hint"),
  dropZone: document.querySelector("#drop-zone"),
  error: document.querySelector("#form-error"),
  submit: document.querySelector("#submit-upload"),
  sidebar: document.querySelector(".sidebar"),
  toast: document.querySelector("#toast"),
};

const formatDate = (value) => new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric",
}).format(new Date(value));

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function renderList() {
  const query = elements.search.value.trim().toLocaleLowerCase("vi");
  const visible = state.lessons.filter((lesson) => lesson.title.toLocaleLowerCase("vi").includes(query));
  elements.count.textContent = state.lessons.length;

  if (!visible.length) {
    elements.list.innerHTML = `<p class="no-results">${state.lessons.length ? "Không tìm thấy bài học phù hợp." : "Chưa có bài học nào."}</p>`;
    return;
  }

  elements.list.innerHTML = visible.map((lesson) => `
    <button class="lesson-item ${lesson.id === state.activeId ? "active" : ""}" data-id="${lesson.id}" type="button">
      <span class="pdf-badge">PDF</span>
      <span class="lesson-info">
        <strong>${escapeHtml(lesson.title)}</strong>
        <span>${formatDate(lesson.createdAt)} · ${formatSize(lesson.size)}</span>
      </span>
    </button>
  `).join("");
}

function renderHome() {
  elements.homeSummary.textContent = `${state.lessons.length} bài học`;
  const recent = state.lessons.slice(0, 6);

  if (!recent.length) {
    elements.recentGrid.innerHTML = `
      <div class="empty-library">
        <p>Thư viện đang trống. Hãy tải lên slide đầu tiên của bạn.</p>
        <button type="button" data-upload>Chọn PDF →</button>
      </div>`;
    return;
  }

  elements.recentGrid.innerHTML = recent.map((lesson) => `
    <button class="recent-card" data-id="${lesson.id}" type="button">
      <span class="pdf-badge">PDF</span>
      <strong>${escapeHtml(lesson.title)}</strong>
      <small>${formatDate(lesson.createdAt)} · ${formatSize(lesson.size)}</small>
    </button>
  `).join("");
}

function showHome() {
  state.activeId = null;
  elements.context.textContent = "Tổng quan";
  elements.title.textContent = "Trang chủ";
  elements.homeView.hidden = false;
  elements.pdfWrap.hidden = true;
  elements.pdfFrame.src = "about:blank";
  elements.openNew.hidden = true;
  elements.homeNav.classList.add("active");
  elements.sidebar.classList.remove("open");
  renderList();
  renderHome();
}

function selectLesson(id) {
  const lesson = state.lessons.find((item) => item.id === id);
  if (!lesson) return;
  state.activeId = id;
  elements.context.textContent = "Đang xem";
  elements.title.textContent = lesson.title;
  elements.homeView.hidden = true;
  elements.pdfWrap.hidden = false;
  elements.pdfFrame.src = `${lesson.url}#view=FitH`;
  elements.openNew.href = lesson.url;
  elements.openNew.hidden = false;
  elements.homeNav.classList.remove("active");
  elements.sidebar.classList.remove("open");
  renderList();
}

function openModal() {
  elements.modal.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => document.querySelector("#lesson-title").focus(), 0);
}

function closeModal() {
  elements.modal.hidden = true;
  elements.form.reset();
  elements.fileLabel.textContent = "Kéo thả PDF vào đây";
  elements.fileHint.textContent = "hoặc nhấn để chọn tệp";
  elements.error.textContent = "";
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2600);
}

function setFile(file) {
  if (!file) return;
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    elements.error.textContent = "Vui lòng chọn đúng định dạng PDF.";
    return;
  }
  const transfer = new DataTransfer();
  transfer.items.add(file);
  elements.fileInput.files = transfer.files;
  elements.fileLabel.textContent = file.name;
  elements.fileHint.textContent = formatSize(file.size);
  elements.error.textContent = "";
}

async function loadLessons() {
  try {
    const response = await fetch("/api/lessons");
    if (!response.ok) throw new Error();
    state.lessons = await response.json();
    renderList();
    showHome();
  } catch {
    elements.list.innerHTML = '<p class="no-results">Không thể tải thư viện.</p>';
  }
}

document.querySelectorAll("#open-upload, #empty-upload").forEach((button) => button.addEventListener("click", openModal));
document.querySelector("#home-link").addEventListener("click", (event) => { event.preventDefault(); showHome(); });
elements.homeNav.addEventListener("click", showHome);
document.querySelector("#close-upload").addEventListener("click", closeModal);
document.querySelector("#mobile-menu").addEventListener("click", () => elements.sidebar.classList.toggle("open"));
elements.modal.addEventListener("click", (event) => { if (event.target === elements.modal) closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !elements.modal.hidden) closeModal(); });
elements.search.addEventListener("input", renderList);
elements.list.addEventListener("click", (event) => {
  const item = event.target.closest(".lesson-item");
  if (item) selectLesson(item.dataset.id);
});
elements.recentGrid.addEventListener("click", (event) => {
  const lesson = event.target.closest(".recent-card");
  if (lesson) selectLesson(lesson.dataset.id);
  if (event.target.closest("[data-upload]")) openModal();
});

elements.fileInput.addEventListener("change", () => setFile(elements.fileInput.files[0]));
["dragenter", "dragover"].forEach((name) => elements.dropZone.addEventListener(name, (event) => {
  event.preventDefault();
  elements.dropZone.classList.add("dragging");
}));
["dragleave", "drop"].forEach((name) => elements.dropZone.addEventListener(name, (event) => {
  event.preventDefault();
  elements.dropZone.classList.remove("dragging");
}));
elements.dropZone.addEventListener("drop", (event) => setFile(event.dataTransfer.files[0]));

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.error.textContent = "";
  if (!elements.fileInput.files[0]) {
    elements.error.textContent = "Vui lòng chọn một tệp PDF.";
    return;
  }

  elements.submit.disabled = true;
  elements.submit.textContent = "Đang tải lên...";
  try {
    const response = await fetch("/api/lessons", { method: "POST", body: new FormData(elements.form) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Không thể tải tệp lên.");
    state.lessons.unshift(data);
    closeModal();
    showHome();
    showToast("Đã thêm bài học vào thư viện.");
  } catch (error) {
    elements.error.textContent = error.message;
  } finally {
    elements.submit.disabled = false;
    elements.submit.textContent = "Tải lên bài học";
  }
});

loadLessons();
