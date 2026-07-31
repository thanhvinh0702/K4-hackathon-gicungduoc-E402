const CHAT_STORAGE_KEY = "vlearn.chatHistory.v1";
const MAX_STORED_MESSAGES = 100;
const MAX_STORED_CONVERSATIONS = 30;
const CHAT_WELCOME = "Chào bạn! Mình có thể tìm trong các bài học đã tải lên và chỉ đúng trang liên quan.";
const state = {
  lessons: [],
  activeId: null,
  activePage: 1,
  conversations: [],
  activeConversationId: null,
  lessonChats: {},
  mindmapScale: 1,
  uploading: false,
};
let processingPollTimer = null;

const elements = {
  list: document.querySelector("#lesson-list"),
  count: document.querySelector("#lesson-count"),
  search: document.querySelector("#search-input"),
  title: document.querySelector("#current-title"),
  context: document.querySelector("#current-context"),
  homeView: document.querySelector("#home-view"),
  homeNav: document.querySelector("#home-nav"),
  mindmapView: document.querySelector("#mindmap-view"),
  mindmapNav: document.querySelector("#mindmap-nav"),
  mindmapStage: document.querySelector("#mindmap-stage"),
  mindmapEdges: document.querySelector("#mindmap-edges"),
  mindmapNodes: document.querySelector("#mindmap-nodes"),
  mindmapCanvasWrap: document.querySelector("#mindmap-canvas-wrap"),
  zoomValue: document.querySelector("#zoom-value"),
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
  chatMessages: document.querySelector("#chat-messages"),
  chatForm: document.querySelector("#chat-form"),
  chatInput: document.querySelector("#chat-input"),
  conversationSelect: document.querySelector("#conversation-select"),
  newConversation: document.querySelector("#new-conversation"),
  deleteConversation: document.querySelector("#delete-conversation"),
  slideChatMessages: document.querySelector("#slide-chat-messages"),
  slideChatForm: document.querySelector("#slide-chat-form"),
  slideChatInput: document.querySelector("#slide-chat-input"),
  slidePageLabel: document.querySelector("#slide-page-label"),
  slideTopic: document.querySelector("#slide-topic"),
};

const formatDate = (value) => new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric",
}).format(new Date(value));

function normalizeChatMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-MAX_STORED_MESSAGES).flatMap((message) => {
    if (!message || !["user", "assistant"].includes(message.role) || typeof message.text !== "string") return [];
    const pages = Array.isArray(message.pages) ? message.pages.flatMap((source) => {
      const page = Number.parseInt(source?.page, 10);
      if (!Number.isFinite(page) || page < 1) return [];
      return [{
        lessonId: typeof source.lessonId === "string" ? source.lessonId : "",
        page,
        pageEnd: Number.parseInt(source.pageEnd, 10) || page,
        label: typeof source.label === "string" ? source.label : `Trang ${page}`,
        score: Number.isFinite(Number(source.score)) ? Number(source.score) : 0,
      }];
    }) : [];
    return [{ role: message.role, text: message.text, pages }];
  });
}

function conversationId() {
  return window.crypto?.randomUUID?.() || `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function conversationTitle(messages) {
  const firstQuestion = messages.find((message) => message.role === "user")?.text.trim();
  if (!firstQuestion) return "Đoạn chat mới";
  return firstQuestion.length > 42 ? `${firstQuestion.slice(0, 42).trim()}…` : firstQuestion;
}

function normalizeConversation(conversation) {
  if (!conversation || typeof conversation !== "object") return null;
  const messages = normalizeChatMessages(conversation.messages);
  const now = new Date().toISOString();
  return {
    id: typeof conversation.id === "string" && conversation.id ? conversation.id : conversationId(),
    title: typeof conversation.title === "string" && conversation.title.trim()
      ? conversation.title.trim().slice(0, 60)
      : conversationTitle(messages),
    createdAt: typeof conversation.createdAt === "string" ? conversation.createdAt : now,
    updatedAt: typeof conversation.updatedAt === "string" ? conversation.updatedAt : now,
    messages,
  };
}

function loadChatHistory() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(CHAT_STORAGE_KEY) || "{}");
    const conversations = Array.isArray(stored.conversations)
      ? stored.conversations.map(normalizeConversation).filter(Boolean)
      : [];
    const legacyMessages = normalizeChatMessages(stored.home);
    if (!conversations.length && legacyMessages.length) {
      conversations.push(normalizeConversation({ messages: legacyMessages }));
    }
    state.conversations = conversations
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, MAX_STORED_CONVERSATIONS);
    state.activeConversationId = state.conversations.some((item) => item.id === stored.activeConversationId)
      ? stored.activeConversationId
      : state.conversations[0]?.id || null;
    if (stored.lessons && typeof stored.lessons === "object" && !Array.isArray(stored.lessons)) {
      state.lessonChats = Object.fromEntries(
        Object.entries(stored.lessons).map(([lessonId, messages]) => [lessonId, normalizeChatMessages(messages)]),
      );
    }
  } catch {
    state.conversations = [];
    state.activeConversationId = null;
    state.lessonChats = {};
  }
}

function saveChatHistory() {
  try {
    const lessons = Object.fromEntries(
      Object.entries(state.lessonChats).map(([lessonId, messages]) => [
        lessonId,
        normalizeChatMessages(messages),
      ]),
    );
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
      version: 2,
      activeConversationId: state.activeConversationId,
      conversations: state.conversations.slice(0, MAX_STORED_CONVERSATIONS).map((conversation) => ({
        ...conversation,
        messages: normalizeChatMessages(conversation.messages),
      })),
      lessons,
    }));
  } catch {
    // Chat vẫn hoạt động nếu trình duyệt chặn localStorage hoặc hết dung lượng.
  }
}

const mindmapNodes = [
  { id: "hub", type: "center", x: 540, y: 286, width: 200, label: "Không gian tri thức", meta: "2 bài học · 70 trang", icon: "✦" },
  { id: "ai-root", type: "ai root", course: "ai", page: 1, x: 275, y: 292, width: 220, label: "AI & LLM Foundation", meta: "29 trang · 6 chủ đề", icon: "AI" },
  { id: "spot-root", type: "test root", course: "spot", page: 1, x: 805, y: 292, width: 220, label: "Kiểm thử với SpotBugs", meta: "41 trang · 6 chủ đề", icon: "SB" },
  { id: "ai-landscape", type: "ai", course: "ai", page: 3, x: 28, y: 18, label: "Bức tranh AI", meta: "AI · ML · GenAI · LLM", icon: "01" },
  { id: "ai-history", type: "ai", course: "ai", page: 5, x: 28, y: 112, label: "Lịch sử AI", meta: "Expert system → ChatGPT", icon: "02" },
  { id: "ai-mechanics", type: "ai", course: "ai", page: 10, x: 28, y: 206, label: "Cơ chế LLM", meta: "Token · Context · Attention", icon: "03" },
  { id: "ai-agents", type: "ai", course: "ai", page: 23, x: 28, y: 394, label: "AI Agent", meta: "Tools · Memory · Action", icon: "04" },
  { id: "ai-model", type: "ai", course: "ai", page: 25, x: 28, y: 488, label: "Model & chi phí", meta: "Chọn tầng · Token cost", icon: "05" },
  { id: "ai-prompt", type: "ai", course: "ai", page: 28, x: 28, y: 582, label: "Prompting", meta: "Prompt · Temperature", icon: "06" },
  { id: "spot-overview", type: "test", course: "spot", page: 6, x: 1060, y: 18, label: "Tổng quan SpotBugs", meta: "Static analysis · Bug pattern", icon: "01" },
  { id: "spot-bytecode", type: "test", course: "spot", page: 10, x: 1060, y: 112, label: "Bytecode & ASM", meta: "JVM · Visitor Pattern", icon: "02" },
  { id: "spot-architecture", type: "test", course: "spot", page: 15, x: 1060, y: 206, label: "Kiến trúc Detector", meta: "Plugin · Pattern matching", icon: "03" },
  { id: "spot-bugs", type: "test", course: "spot", page: 27, x: 1060, y: 394, label: "Các nhóm lỗi", meta: "Security · Performance", icon: "04" },
  { id: "spot-experiment", type: "test", course: "spot", page: 22, x: 1060, y: 488, label: "Thực nghiệm", meta: "IntelliJ · HTML report", icon: "05" },
  { id: "spot-evaluation", type: "test", course: "spot", page: 38, x: 1060, y: 582, label: "Đánh giá công cụ", meta: "Precision · Recall", icon: "06" },
  { id: "bridge", type: "bridge", course: "ai", page: 20, x: 525, y: 570, width: 230, label: "Kiểm chứng & tự động hóa", meta: "AI reasoning ↔ Software quality", icon: "↔" },
];

const mindmapEdges = [
  ["hub", "ai-root", "ai"], ["hub", "spot-root", "test"],
  ["ai-root", "ai-landscape", "ai"], ["ai-root", "ai-history", "ai"], ["ai-root", "ai-mechanics", "ai"],
  ["ai-root", "ai-agents", "ai"], ["ai-root", "ai-model", "ai"], ["ai-root", "ai-prompt", "ai"],
  ["spot-root", "spot-overview", "test"], ["spot-root", "spot-bytecode", "test"], ["spot-root", "spot-architecture", "test"],
  ["spot-root", "spot-bugs", "test"], ["spot-root", "spot-experiment", "test"], ["spot-root", "spot-evaluation", "test"],
  ["ai-agents", "spot-architecture", "cross"], ["ai-mechanics", "spot-bytecode", "cross"],
  ["ai-model", "spot-evaluation", "cross"], ["ai-agents", "bridge", "cross"], ["spot-evaluation", "bridge", "cross"],
];

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function renderInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderAssistantAnswer(value) {
  const blocks = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];
  const normalizedValue = String(value || "")
    .replace(/:\s+-\s+/g, ":\n- ")
    .replace(/([.!?])\s+-\s+/g, "$1\n- ");

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(`<${listType}>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };

  normalizedValue.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const unordered = line.match(/^[-*•]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? "ul" : "ol";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((unordered || ordered)[1]);
      return;
    }

    const heading = line.match(/^#{1,4}\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(`<h4>${renderInlineMarkdown(heading[1])}</h4>`);
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();
  return `<div class="answer-content">${blocks.join("")}</div>`;
}

function renderMessageText(role, text) {
  return role === "assistant" ? renderAssistantAnswer(text) : `<p>${escapeHtml(text)}</p>`;
}

function lessonStatus(lesson) {
  if (lesson.status === "processing") {
    const labels = {
      queued: "Đang chờ xử lý",
      extracting: "Đang đọc PDF",
      chunking: "Đang chia nội dung",
      embedding: "Đang tạo embedding",
    };
    return { type: "processing", label: labels[lesson.processingStep] || "Đang xử lý" };
  }
  if (lesson.status === "failed") return { type: "error", label: "Xử lý thất bại" };
  if (lesson.status === "needs_api_key") return { type: "warning", label: "Chưa tạo embedding" };
  return null;
}

function statusMarkup(lesson) {
  const status = lessonStatus(lesson);
  if (!status) return "";
  const spinner = status.type === "processing" ? '<i class="status-spinner" aria-hidden="true"></i>' : "";
  return `<span class="lesson-status ${status.type}">${spinner}${escapeHtml(status.label)}</span>`;
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
    <button class="lesson-item ${lesson.id === state.activeId ? "active" : ""} ${lesson.status === "processing" ? "processing" : ""}" data-id="${lesson.id}" type="button">
      <span class="pdf-badge">PDF</span>
      <span class="lesson-info">
        <strong>${escapeHtml(lesson.title)}</strong>
        <span>${formatDate(lesson.createdAt)} · ${formatSize(lesson.size)}</span>
        ${statusMarkup(lesson)}
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
    <button class="recent-card ${lesson.status === "processing" ? "processing" : ""}" data-id="${lesson.id}" type="button">
      <span class="pdf-badge">PDF</span>
      ${statusMarkup(lesson)}
      <strong>${escapeHtml(lesson.title)}</strong>
      <small>${formatDate(lesson.createdAt)} · ${formatSize(lesson.size)}</small>
    </button>
  `).join("");
}

function setRoute(value) {
  if (window.location.hash !== value) history.pushState(null, "", value);
}

function showHome(updateRoute = true) {
  state.activeId = null;
  state.activePage = 1;
  elements.context.textContent = "Tổng quan";
  elements.title.textContent = "Trang chủ";
  elements.homeView.hidden = false;
  elements.mindmapView.hidden = true;
  elements.pdfWrap.hidden = true;
  elements.pdfFrame.src = "about:blank";
  elements.openNew.hidden = true;
  elements.homeNav.classList.add("active");
  elements.mindmapNav.classList.remove("active");
  elements.sidebar.classList.remove("open");
  if (updateRoute) setRoute("#home");
  renderList();
  renderHome();
}

function resolveMindmapLesson(course) {
  if (course === "ai") return state.lessons.find((lesson) => /d1|ai|llm|hackathon/i.test(`${lesson.title} ${lesson.originalName}`));
  if (course === "spot") return state.lessons.find((lesson) => /spotbugs|ki.*m.*th/i.test(`${lesson.title} ${lesson.originalName}`));
  return null;
}

function renderMindMap() {
  const nodeById = Object.fromEntries(mindmapNodes.map((node) => [node.id, node]));
  const nodeHeight = (node) => node.type === "center" ? 94 : node.type.includes("root") ? 82 : node.type === "bridge" ? 72 : 66;

  elements.mindmapEdges.innerHTML = mindmapEdges.map(([fromId, toId, type]) => {
    const from = nodeById[fromId];
    const to = nodeById[toId];
    const startX = from.x + (from.width || 190) / 2;
    const startY = from.y + nodeHeight(from) / 2;
    const endX = to.x + (to.width || 190) / 2;
    const endY = to.y + nodeHeight(to) / 2;
    const bend = (startX + endX) / 2;
    return `<path class="map-edge ${type}" d="M ${startX} ${startY} C ${bend} ${startY}, ${bend} ${endY}, ${endX} ${endY}" />`;
  }).join("");

  elements.mindmapNodes.innerHTML = mindmapNodes.map((node) => {
    const lesson = node.course ? resolveMindmapLesson(node.course) : null;
    const unavailable = node.course && !lesson;
    const content = `<span class="node-icon">${escapeHtml(node.icon)}</span><span class="node-copy"><strong>${escapeHtml(node.label)}</strong><span>${escapeHtml(node.meta)}</span></span>`;
    const style = `left:${node.x}px;top:${node.y}px;${node.width ? `width:${node.width}px;` : ""}`;
    if (node.type === "center") return `<div class="map-node ${node.type}" style="${style}">${content}</div>`;
    return `<button class="map-node ${node.type}${unavailable ? " unavailable" : ""}" style="${style}" type="button" data-course="${node.course}" data-page="${node.page}" ${unavailable ? "disabled" : ""}>${content}</button>`;
  }).join("");
}

function setMindmapScale(scale) {
  state.mindmapScale = Math.min(1.25, Math.max(.55, scale));
  elements.mindmapStage.style.transform = `scale(${state.mindmapScale})`;
  elements.zoomValue.textContent = `${Math.round(state.mindmapScale * 100)}%`;
}

function fitMindMap() {
  const availableWidth = elements.mindmapCanvasWrap.clientWidth - 20;
  setMindmapScale(Math.min(1, availableWidth / 1280));
  elements.mindmapCanvasWrap.scrollTo({ left: 0, top: 0 });
}

function showMindMap(updateRoute = true) {
  state.activeId = null;
  state.activePage = 1;
  elements.context.textContent = "Không gian tri thức";
  elements.title.textContent = "Mind map bài học";
  elements.homeView.hidden = true;
  elements.pdfWrap.hidden = true;
  elements.pdfFrame.src = "about:blank";
  elements.mindmapView.hidden = false;
  elements.openNew.hidden = true;
  elements.homeNav.classList.remove("active");
  elements.mindmapNav.classList.add("active");
  elements.sidebar.classList.remove("open");
  if (updateRoute) setRoute("#mindmap");
  renderList();
  renderMindMap();
  requestAnimationFrame(fitMindMap);
}

function selectLesson(id, page = 1, updateRoute = true) {
  const lesson = state.lessons.find((item) => item.id === id);
  if (!lesson) return;
  const targetPage = Math.max(1, Number.parseInt(page, 10) || 1);
  state.activeId = id;
  state.activePage = targetPage;
  elements.context.textContent = "Đang xem";
  elements.title.textContent = lesson.title;
  elements.homeView.hidden = true;
  elements.mindmapView.hidden = true;
  elements.pdfWrap.hidden = false;
  elements.pdfFrame.src = `${lesson.url}#page=${targetPage}&view=FitH`;
  elements.openNew.href = `${lesson.url}#page=${targetPage}&view=FitH`;
  elements.openNew.hidden = false;
  elements.homeNav.classList.remove("active");
  elements.mindmapNav.classList.remove("active");
  elements.sidebar.classList.remove("open");
  if (updateRoute) setRoute(`#lesson=${encodeURIComponent(id)}&page=${targetPage}`);
  renderList();
  updateLessonChatContext();
  if (!state.lessonChats[id]) resetLessonChat();
  else renderLessonChat();
}

function openRoute() {
  const hash = window.location.hash.slice(1);
  if (!hash || hash === "home") return showHome(false);
  if (hash === "mindmap") return showMindMap(false);
  const params = new URLSearchParams(hash);
  const lessonId = params.get("lesson");
  if (lessonId && state.lessons.some((lesson) => lesson.id === lessonId)) {
    selectLesson(lessonId, params.get("page") || 1, false);
  } else {
    showHome(false);
  }
}



function getActiveLesson() {
  return state.lessons.find((lesson) => lesson.id === state.activeId);
}


function getActivePageCount() {
  return getActiveLesson()?.pageCount || 1;
}

function updateLessonChatContext() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  elements.slidePageLabel.textContent = `Bài học · ${getActivePageCount()} trang`;
  elements.slideTopic.textContent = lesson.title;
}

function addSlideChatMessage(role, text, pages = [], persist = true) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;
  const sources = role === "assistant" && pages.length ? `
    <div class="slide-sources">${pages.map((source) => `
      <button class="slide-link" type="button" data-lesson="${state.activeId}" data-page="${source.page}">↗ ${escapeHtml(source.label)} · tr. ${source.page}</button>
    `).join("")}</div>` : "";
  wrapper.innerHTML = `${role === "assistant" ? '<span class="message-avatar">AI</span>' : ""}<div class="message-bubble">${renderMessageText(role, text)}${sources}</div>`;
  elements.slideChatMessages.appendChild(wrapper);
  elements.slideChatMessages.scrollTop = elements.slideChatMessages.scrollHeight;
  if (persist && state.activeId) {
    state.lessonChats[state.activeId] ||= [];
    state.lessonChats[state.activeId].push({ role, text, pages });
    state.lessonChats[state.activeId] = state.lessonChats[state.activeId].slice(-MAX_STORED_MESSAGES);
    saveChatHistory();
  }
}

function renderLessonChat() {
  if (!state.activeId) return;
  elements.slideChatMessages.innerHTML = "";
  (state.lessonChats[state.activeId] || []).forEach((message) => {
    addSlideChatMessage(message.role, message.text, message.pages, false);
  });
}

function resetLessonChat() {
  if (!state.activeId) return;
  const lesson = getActiveLesson();
  state.lessonChats[state.activeId] = [];
  elements.slideChatMessages.innerHTML = "";
  updateLessonChatContext();
  addSlideChatMessage("assistant", `Mình là trợ lý riêng cho bài “${lesson.title}”. Bạn có thể hỏi tóm tắt, khái niệm hoặc phần nội dung cần xem.`);
}


async function askLessonChatbot(question) {
  const value = question.trim();
  if (!value || !state.activeId) return;
  addSlideChatMessage("user", value);
  elements.slideChatInput.value = "";

  const typing = document.createElement("div");
  typing.className = "message";
  typing.innerHTML = '<span class="message-avatar">AI</span><div class="message-bubble"><span class="typing-dots"><i></i><i></i><i></i></span></div>';
  elements.slideChatMessages.appendChild(typing);
  elements.slideChatMessages.scrollTop = elements.slideChatMessages.scrollHeight;

  try {
    const response = await fetch(`/api/lessons/${encodeURIComponent(state.activeId)}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: value }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Không thể hỏi trợ lý lúc này.");
    typing.remove();
    addSlideChatMessage("assistant", data.answer, data.sources || []);
  } catch (error) {
    typing.remove();
    addSlideChatMessage("assistant", error.message);
  }
}


function addChatMessage(role, text, pages = [], persist = true, targetConversationId = state.activeConversationId) {
  if (!persist || targetConversationId === state.activeConversationId) {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${role}`;
    const sources = role === "assistant" && pages.length ? `
      <div class="slide-sources">${pages.map((source) => `
        <button class="slide-link" type="button" data-lesson="${source.lessonId}" data-page="${source.page}">↗ ${escapeHtml(source.label)} · tr. ${source.page}</button>
      `).join("")}</div>` : "";
    wrapper.innerHTML = `${role === "assistant" ? '<span class="message-avatar">AI</span>' : ""}<div class="message-bubble">${renderMessageText(role, text)}${sources}</div>`;
    elements.chatMessages.appendChild(wrapper);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }
  if (persist) {
    const conversation = state.conversations.find((item) => item.id === targetConversationId);
    if (!conversation) return;
    conversation.messages.push({ role, text, pages });
    conversation.messages = conversation.messages.slice(-MAX_STORED_MESSAGES);
    if (role === "user" && conversation.title === "Đoạn chat mới") {
      conversation.title = conversationTitle(conversation.messages);
    }
    conversation.updatedAt = new Date().toISOString();
    state.conversations.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    renderConversationSelect();
    saveChatHistory();
  }
}

function getActiveConversation() {
  return state.conversations.find((conversation) => conversation.id === state.activeConversationId) || null;
}

function createConversation(render = true) {
  const now = new Date().toISOString();
  const conversation = {
    id: conversationId(),
    title: "Đoạn chat mới",
    createdAt: now,
    updatedAt: now,
    messages: [{ role: "assistant", text: CHAT_WELCOME, pages: [] }],
  };
  state.conversations.unshift(conversation);
  state.conversations = state.conversations.slice(0, MAX_STORED_CONVERSATIONS);
  state.activeConversationId = conversation.id;
  if (render) {
    renderConversationSelect();
    renderChat();
    elements.chatInput.focus();
  }
  saveChatHistory();
  return conversation;
}

function renderConversationSelect() {
  elements.conversationSelect.innerHTML = state.conversations.map((conversation) => `
    <option value="${escapeHtml(conversation.id)}"${conversation.id === state.activeConversationId ? " selected" : ""}>
      ${escapeHtml(conversation.title)}
    </option>
  `).join("");
}

function renderChat() {
  elements.chatMessages.innerHTML = "";
  const conversation = getActiveConversation();
  (conversation?.messages || []).forEach((message) => {
    addChatMessage(message.role, message.text, message.pages, false);
  });
}

function selectConversation(id) {
  if (!state.conversations.some((conversation) => conversation.id === id)) return;
  state.activeConversationId = id;
  renderConversationSelect();
  renderChat();
  saveChatHistory();
}

function deleteConversation() {
  state.conversations = state.conversations.filter(
    (conversation) => conversation.id !== state.activeConversationId,
  );
  if (!state.conversations.length) {
    createConversation();
    return;
  }
  state.activeConversationId = state.conversations[0].id;
  renderConversationSelect();
  renderChat();
  saveChatHistory();
}

async function askChatbot(question) {
  const value = question.trim();
  if (!value) return;
  if (!getActiveConversation()) createConversation(false);
  const targetConversationId = state.activeConversationId;
  addChatMessage("user", value, [], true, targetConversationId);
  elements.chatInput.value = "";

  const typing = document.createElement("div");
  typing.className = "message";
  typing.innerHTML = '<span class="message-avatar">AI</span><div class="message-bubble"><span class="typing-dots"><i></i><i></i><i></i></span></div>';
  elements.chatMessages.appendChild(typing);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: value }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Không thể hỏi trợ lý lúc này.");
    typing.remove();
    addChatMessage("assistant", data.answer, data.sources || [], true, targetConversationId);
  } catch (error) {
    typing.remove();
    addChatMessage("assistant", error.message, [], true, targetConversationId);
  }
}

function openModal() {
  elements.modal.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => document.querySelector("#lesson-title").focus(), 0);
}

function closeModal(force = false) {
  if (state.uploading && !force) return;
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
    openRoute();
    if (!getActiveConversation()) createConversation(false);
    renderConversationSelect();
    renderChat();
    scheduleProcessingPoll();
  } catch {
    elements.list.innerHTML = '<p class="no-results">Không thể tải thư viện.</p>';
  }
}

function scheduleProcessingPoll() {
  window.clearTimeout(processingPollTimer);
  if (state.lessons.some((lesson) => lesson.status === "processing")) {
    processingPollTimer = window.setTimeout(refreshProcessingLessons, 1200);
  }
}

async function refreshProcessingLessons() {
  try {
    const previous = new Map(state.lessons.map((lesson) => [lesson.id, lesson.status]));
    const response = await fetch("/api/lessons");
    if (!response.ok) throw new Error();
    state.lessons = await response.json();
    renderList();
    if (!elements.homeView.hidden) renderHome();
    if (!elements.mindmapView.hidden) renderMindMap();
    const completed = state.lessons.find((lesson) => previous.get(lesson.id) === "processing" && lesson.status === "ready");
    const failed = state.lessons.find((lesson) => previous.get(lesson.id) === "processing" && ["failed", "needs_api_key"].includes(lesson.status));
    if (completed) showToast(`Đã xử lý xong “${completed.title}”.`);
    if (failed) showToast(`Không thể tạo embedding cho “${failed.title}”.`);
  } catch {
    // Giữ trạng thái hiện tại và thử lại ở lần poll kế tiếp.
  } finally {
    scheduleProcessingPoll();
  }
}

document.querySelectorAll("#open-upload, #empty-upload").forEach((button) => button.addEventListener("click", openModal));
document.querySelector("#home-link").addEventListener("click", (event) => { event.preventDefault(); showHome(); });
elements.homeNav.addEventListener("click", showHome);
elements.mindmapNav.addEventListener("click", showMindMap);
elements.mindmapNodes.addEventListener("click", (event) => {
  const node = event.target.closest(".map-node[data-course]");
  if (!node || node.disabled) return;
  const lesson = resolveMindmapLesson(node.dataset.course);
  if (lesson) selectLesson(lesson.id, node.dataset.page);
});
document.querySelector("#zoom-in").addEventListener("click", () => setMindmapScale(state.mindmapScale + .1));
document.querySelector("#zoom-out").addEventListener("click", () => setMindmapScale(state.mindmapScale - .1));
document.querySelector("#zoom-reset").addEventListener("click", fitMindMap);
document.querySelector("#close-upload").addEventListener("click", () => closeModal());
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
elements.chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  askChatbot(elements.chatInput.value);
});
document.querySelector("#suggestion-list").addEventListener("click", (event) => {
  if (event.target.matches("button")) askChatbot(event.target.textContent);
});
elements.newConversation.addEventListener("click", () => createConversation());
elements.deleteConversation.addEventListener("click", deleteConversation);
elements.conversationSelect.addEventListener("change", (event) => selectConversation(event.target.value));
elements.chatMessages.addEventListener("click", (event) => {
  const link = event.target.closest(".slide-link");
  if (link) selectLesson(link.dataset.lesson, link.dataset.page);
});
elements.slideChatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  askLessonChatbot(elements.slideChatInput.value);
});
document.querySelector("#slide-prompts").addEventListener("click", (event) => {
  if (event.target.matches("button")) askLessonChatbot(event.target.textContent);
});
document.querySelector("#reset-slide-chat").addEventListener("click", resetLessonChat);
elements.slideChatMessages.addEventListener("click", (event) => {
  const link = event.target.closest(".slide-link");
  if (link) selectLesson(link.dataset.lesson, link.dataset.page);
});
window.addEventListener("popstate", openRoute);

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
  state.uploading = true;
  document.querySelector("#close-upload").disabled = true;
  elements.form.classList.add("is-uploading");
  elements.submit.innerHTML = '<i class="button-spinner" aria-hidden="true"></i><span>Đang tải PDF...</span>';
  try {
    const response = await fetch("/api/lessons", { method: "POST", body: new FormData(elements.form) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Không thể tải tệp lên.");
    state.lessons.unshift(data);
    state.uploading = false;
    closeModal(true);
    showHome();
    showToast("Đã tải lên. VLearn đang xử lý nội dung.");
    scheduleProcessingPoll();
  } catch (error) {
    elements.error.textContent = error.message;
  } finally {
    state.uploading = false;
    document.querySelector("#close-upload").disabled = false;
    elements.form.classList.remove("is-uploading");
    elements.submit.disabled = false;
    elements.submit.textContent = "Tải lên bài học";
  }
});

loadChatHistory();
loadLessons();
