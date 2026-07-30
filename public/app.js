const state = { lessons: [], activeId: null, activePage: 1, lessonChats: {}, mindmapScale: 1 };

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
  slideChatMessages: document.querySelector("#slide-chat-messages"),
  slideChatForm: document.querySelector("#slide-chat-form"),
  slideChatInput: document.querySelector("#slide-chat-input"),
  slidePageLabel: document.querySelector("#slide-page-label"),
  slideTopic: document.querySelector("#slide-topic"),
};

const formatDate = (value) => new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric",
}).format(new Date(value));

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
  if (course === "ai") return state.lessons.find((lesson) => isAiCourse(lesson));
  if (course === "spot") return state.lessons.find((lesson) => isSpotBugsCourse(lesson));
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

function getCourseLesson() {
  return state.lessons.find((lesson) => /d1|ai|llm|hackathon/i.test(`${lesson.title} ${lesson.originalName}`)) || state.lessons[0];
}

const chatbotAnswers = [
  {
    keywords: ["token", "chi phí", "chi phi", "giá", "gia"],
    text: "Model đọc các mảnh chữ gọi là token, không đọc nguyên từ. Mọi input và output đều được tính theo token; phần model sinh ra thường đắt hơn input khoảng 3-5 lần. Với tiếng Việt, code hoặc JSON, số token có thể cao hơn văn bản tiếng Anh thông thường.",
    pages: [{ page: 13, label: "Token là gì?" }, { page: 27, label: "Chi phí token" }],
  },
  {
    keywords: ["agent", "tác tử", "tac tu", "llm khác", "llm khac"],
    text: "LLM là bộ não suy luận, còn AI Agent là LLM được đặt trong một vòng làm việc có mục tiêu. Agent bổ sung tools, memory, khả năng lập kế hoạch và action để thực hiện nhiều bước thay vì chỉ tạo câu trả lời.",
    pages: [{ page: 23, label: "LLM đến Agent" }, { page: 24, label: "Cấu tạo Agent" }],
  },
  {
    keywords: ["context", "attention", "ngữ cảnh", "ngu canh", "chú ý", "chu y"],
    text: "Context giống như bàn làm việc có diện tích hữu hạn: mọi thông tin model cần thấy phải nằm trên đó. Attention giúp mỗi token tập trung vào phần liên quan, vì vậy nên đặt yêu cầu quan trọng ở đầu hoặc cuối, giữ context sạch và dùng RAG cho tài liệu dài.",
    pages: [{ page: 14, label: "Context window" }, { page: 15, label: "Attention" }, { page: 16, label: "Quản lý context" }],
  },
  {
    keywords: ["lịch sử", "lich su", "transformer", "chatgpt", "imagenet"],
    text: "Bài học đi qua các cột mốc chính của AI: hệ chuyên gia thập niên 1980, ImageNet thúc đẩy kỷ nguyên dữ liệu, Transformer năm 2017 trở thành nền móng LLM, và ChatGPT năm 2022 đưa mô hình ngôn ngữ đến người dùng đại chúng.",
    pages: [{ page: 5, label: "Lịch sử AI" }, { page: 8, label: "Transformer" }, { page: 9, label: "ChatGPT" }],
  },
  {
    keywords: ["model", "mô hình", "mo hinh", "chọn", "chon", "frontier"],
    text: "Slide khuyên chọn model theo tầng năng lực, bắt đầu từ model đủ tốt và đủ rẻ cho phần lớn công việc, rồi chỉ nâng lên frontier khi chất lượng thực sự cản trở use case. Việc đơn giản dùng model đắt sẽ lãng phí; việc khó ép model rẻ sẽ giảm chất lượng.",
    pages: [{ page: 25, label: "Xu hướng giá" }, { page: 26, label: "Chọn model" }, { page: 27, label: "Tính chi phí" }],
  },
  {
    keywords: ["prompt", "temperature", "top_p", "nhiệt độ", "nhiet do"],
    text: "Một prompt đầy đủ gồm system instruction, user input, context và output format. Temperature điều chỉnh độ ngẫu nhiên; top_p giới hạn nhóm token được cân nhắc. Công việc phân tích hoặc code thường cần thiết lập ổn định hơn.",
    pages: [{ page: 28, label: "Cấu trúc prompt" }, { page: 29, label: "Temperature & top_p" }],
  },
  {
    keywords: ["sai", "hallucination", "ảo giác", "ao giac", "giới hạn", "gioi han", "chain"],
    text: "LLM có thể tự tin nhưng sai vì nó tối ưu câu trả lời hợp lý chứ không trực tiếp tra cứu sự thật. Nó cũng bị giới hạn bởi knowledge cutoff, context và có thể học các dấu hiệu đường tắt. Cho model suy nghĩ từng bước giúp cải thiện suy luận nhưng kết quả quan trọng vẫn cần kiểm chứng.",
    pages: [{ page: 20, label: "Giới hạn LLM" }, { page: 21, label: "Học đường tắt" }, { page: 22, label: "Chain-of-Thought" }],
  },
];

const slidePageGuides = {
  1: { title: "AI & LLM Foundation", summary: "Đây là trang mở đầu của bài học. Mục tiêu là đi từ việc sử dụng AI như một hộp đen đến hiểu cách LLM hoạt động và biết cách ứng dụng nó.", related: [2, 10] },
  2: { title: "Lộ trình bài học", summary: "Bài học đi qua bức tranh AI, lịch sử 70 năm, cơ chế LLM, AI Agent, cách chọn model, chi phí token và cách gọi API. Đây là bản đồ để định vị từng phần kiến thức.", related: [3, 23, 26] },
  3: { title: "Các tầng của AI", summary: "AI là chiếc ô lớn nhất. Bên trong lần lượt có Machine Learning, Deep Learning, Generative AI và LLM. LLM chỉ là một nhánh chuyên ngôn ngữ, không đại diện cho toàn bộ AI.", related: [4, 10] },
  4: { title: "Ba nhóm AI chính", summary: "Discriminative AI phân loại hoặc dự đoán, Generative AI tạo nội dung mới, còn Agentic AI nhận mục tiêu rồi lập kế hoạch và hành động. LLM có thể làm engine cho cả Generative AI và Agentic AI.", related: [3, 23] },
  5: { title: "Lịch sử AI 70 năm", summary: "AI phát triển qua nhiều chu kỳ kỳ vọng, mùa đông và đột phá. Xu hướng lớn là chuyển từ hệ luật tay sang model học từ dữ liệu, rồi từ model đơn lẻ sang hệ thống có khả năng hành động.", related: [6, 7, 8, 9] },
  6: { title: "Hệ chuyên gia", summary: "Expert system mã hóa tri thức chuyên gia thành các luật rõ ràng để giải một miền hẹp. Cách tiếp cận này hữu ích nhưng khó mở rộng vì cần viết và bảo trì luật thủ công.", related: [5, 7] },
  7: { title: "ImageNet và dữ liệu", summary: "ImageNet cho thấy dữ liệu lớn và được gán nhãn tốt có thể tạo ra bước nhảy vượt bậc. Bộ dữ liệu này là nền tảng cho thành công của AlexNet năm 2012 và kỷ nguyên deep learning.", related: [5, 8] },
  8: { title: "Transformer", summary: "Transformer dùng attention để mỗi token nhìn tới các token quan trọng khác thay vì xử lý hoàn toàn tuần tự. Kiến trúc này trở thành nền móng của GPT, BERT và phần lớn LLM hiện đại.", related: [9, 15] },
  9: { title: "ChatGPT", summary: "ChatGPT biến mô hình ngôn ngữ mạnh thành một trải nghiệm hội thoại đơn giản cho người dùng đại chúng. Đột phá ở đây không chỉ là model mà còn là cách đóng gói sản phẩm dễ tiếp cận.", related: [8, 10] },
  10: { title: "LLM là bộ não nền", summary: "LLM là model ngôn ngữ học cách dự đoán token tiếp theo trên lượng dữ liệu rất lớn. Chatbot, công cụ tóm tắt, dịch hay viết code chỉ là các lớp sản phẩm khác nhau dùng chung bộ não nền đó.", related: [11, 12, 23] },
  11: { title: "Phân bố xác suất", summary: "Ở mỗi bước, LLM chấm điểm toàn bộ token có thể xuất hiện tiếp theo và tạo ra một phân bố xác suất. Câu trả lời là kết quả của việc lựa chọn từ phân bố này chứ không phải tra một câu có sẵn.", related: [12, 29] },
  12: { title: "Vòng lặp sinh văn bản", summary: "LLM chọn một token, nối token đó vào ngữ cảnh rồi chạy lại để dự đoán token kế tiếp. Vòng lặp predict - append - rerun tiếp diễn cho đến khi hoàn thành câu trả lời.", related: [11, 13] },
  13: { title: "Token", summary: "Model không đọc nguyên từ mà đọc các mảnh chữ gọi là token. Tiếng Việt, code và JSON thường bị chia thành nhiều token hơn, ảnh hưởng trực tiếp đến context, tốc độ và chi phí.", related: [14, 27] },
  14: { title: "Context window", summary: "Context là lượng thông tin hữu hạn model có thể nhìn thấy trong một lần trả lời. Nó giống bàn làm việc: quá nhiều nội dung vừa tốn chi phí vừa khiến thông tin ở giữa dễ bị bỏ sót.", related: [15, 16] },
  15: { title: "Attention", summary: "Attention cho phép mỗi token đánh giá mức liên quan của các token khác để hiểu nghĩa theo ngữ cảnh. Đây là cơ chế cốt lõi giúp Transformer xử lý quan hệ xa trong câu.", related: [8, 14, 16] },
  16: { title: "Quản lý sự chú ý", summary: "Để model làm việc tốt, hãy đặt yêu cầu quan trọng ở đầu hoặc cuối, loại bỏ context rác và dùng RAG để chỉ đưa đoạn tài liệu liên quan vào context.", related: [14, 15, 20] },
  17: { title: "Tham số của model", summary: "Tham số là các con số model học được trong quá trình huấn luyện và được đóng gói trong weights. Người dùng không chỉnh trực tiếp tham số; MoE giúp model có rất nhiều tham số nhưng chỉ kích hoạt một phần khi xử lý token.", related: [18, 25] },
  18: { title: "Quá trình tạo LLM", summary: "LLM trải qua pre-training để học ngôn ngữ, SFT để học cách trả lời, RLHF hoặc DPO để căn chỉnh theo con người, và luyện suy luận để làm tốt các bài toán có thể kiểm chứng.", related: [17, 19] },
  19: { title: "RLHF", summary: "RLHF thu thập nhiều câu trả lời, để con người xếp hạng rồi huấn luyện model ưu tiên câu được đánh giá cao. Quá trình này biến cỗ máy dự đoán token thành trợ lý hữu ích và biết nghe lời hơn.", related: [18, 20] },
  20: { title: "Giới hạn của LLM", summary: "LLM bị giới hạn bởi knowledge cutoff, có thể tự tin nhưng sai và chỉ có context hữu hạn. Vì bản chất là dự đoán token, model cần retrieval, tools và bước kiểm chứng cho thông tin quan trọng.", related: [16, 21, 22] },
  21: { title: "Học đường tắt", summary: "Model có thể đạt điểm benchmark cao bằng cách bám vào dấu hiệu phụ thay vì hiểu đúng bản chất. Vì vậy cần đánh giá trên dữ liệu thực tế của chính use case, không chỉ dựa vào benchmark chung.", related: [20, 22] },
  22: { title: "Chain-of-Thought", summary: "Cho model viết nháp và suy nghĩ từng bước có thể cải thiện bài toán nhiều bước. Kỹ thuật này tăng test-time compute nhưng không loại bỏ nhu cầu kiểm chứng kết quả.", related: [20, 23] },
  23: { title: "Từ LLM đến Agent", summary: "LLM trần chỉ suy luận; khi thêm tools, model có thể lấy dữ liệu mới và hành động. Thêm planning tạo agent nhiều bước, còn nhiều agent chuyên biệt phối hợp tạo thành hệ multi-agent.", related: [4, 10, 24] },
  24: { title: "Cấu tạo AI Agent", summary: "Một agent gồm Goal, Reasoning, Tools, Action và Memory chạy trong vòng lặp. Agent quan sát kết quả sau mỗi hành động, cập nhật trạng thái rồi tiếp tục cho đến khi đạt mục tiêu.", related: [23] },
  25: { title: "Xu hướng giảm giá model", summary: "Chi phí để đạt cùng một mức năng lực đang giảm rất nhanh. Công việc từng cần model đắt nhất có thể được model rẻ hơn xử lý sau một thời gian, nên cần định kỳ đánh giá lại lựa chọn model.", related: [26, 27] },
  26: { title: "Chọn model theo tầng", summary: "Hãy bắt đầu bằng model đủ tốt và đủ rẻ cho công việc hàng ngày, chỉ nâng lên frontier khi chất lượng thực sự chặn use case. Dùng model quá mạnh gây lãng phí, quá yếu làm giảm kết quả.", related: [25, 27] },
  27: { title: "Chi phí token", summary: "API tính phí theo token input và output; token output thường đắt hơn input khoảng 3-5 lần. Cần kiểm soát lịch sử chat, context và độ dài câu trả lời để tối ưu hóa đơn.", related: [13, 25, 26] },
  28: { title: "Cấu trúc một prompt", summary: "Một prompt tốt thường có bốn lớp: system instruction, user input, context và output format. Tách rõ từng lớp giúp model hiểu vai trò, dữ liệu và hình dạng kết quả mong muốn.", related: [16, 29] },
  29: { title: "Temperature và top_p", summary: "Temperature điều chỉnh độ ngẫu nhiên của phân bố token, còn top_p giới hạn tập token được cân nhắc. Tác vụ code hoặc phân tích cần ổn định; sáng tạo có thể dùng mức đa dạng cao hơn.", related: [11, 28] },
};

function getActiveLesson() {
  return state.lessons.find((lesson) => lesson.id === state.activeId);
}

function isAiCourse(lesson = getActiveLesson()) {
  return Boolean(lesson && /d1|ai|llm|hackathon/i.test(`${lesson.title} ${lesson.originalName}`));
}

function isSpotBugsCourse(lesson = getActiveLesson()) {
  return Boolean(lesson && (lesson.id === "de0f4b09-e37b-414f-94e9-308878326e70" || /spotbugs/i.test(`${lesson.title} ${lesson.originalName}`)));
}

function getSpotBugsGuide(page) {
  if (page === 1) return { title: "Công cụ kiểm thử SpotBugs", summary: "Đây là trang mở đầu báo cáo về SpotBugs - công cụ phân tích tĩnh cho Java, dùng để phát hiện mẫu lỗi trong bytecode mà không cần chạy chương trình.", related: [5, 6] };
  if (page === 2) return { title: "Phân công nhóm", summary: "Trang trình bày vai trò và phần đóng góp của từng thành viên trong quá trình nghiên cứu kiến trúc, cài đặt, thực nghiệm và đánh giá SpotBugs.", related: [3] };
  if (page <= 4) return { title: "Mục lục báo cáo", summary: "Báo cáo gồm tổng quan SpotBugs, nền tảng bytecode và data-flow, kiến trúc detector, thực nghiệm, phân tích các nhóm lỗi, so sánh SonarQube và đánh giá độ chính xác.", related: [6, 15, 22] };
  if (page === 5) return { title: "Đặt vấn đề", summary: "Phân tích tĩnh giúp tìm lỗi sớm mà không cần thực thi chương trình. SpotBugs tập trung vào Java bytecode, hỗ trợ phát hiện các lỗi tiềm ẩn trước khi chúng đi vào production.", related: [6, 9] };
  if (page === 6) return { title: "Tổng quan SpotBugs", summary: "SpotBugs là công cụ mã nguồn mở kế thừa FindBugs. Nó quét Java bytecode, đối chiếu với các bug pattern và trả về cảnh báo được phân loại theo loại lỗi và mức ưu tiên.", related: [7, 8, 15] };
  if (page === 7) return { title: "Quy trình hoạt động", summary: "Quy trình cơ bản gồm biên dịch mã Java thành bytecode, nạp class, chạy các detector, thu thập BugInstance và xuất kết quả dưới dạng IDE, XML hoặc HTML.", related: [6, 15, 21] };
  if (page === 8) return { title: "Các loại lỗi phát hiện", summary: "SpotBugs có thể phát hiện nhiều nhóm lỗi như bad practice, correctness, multithreaded correctness, performance, security và dodgy code thông qua các mẫu lỗi định nghĩa sẵn.", related: [27, 31, 34] };
  if (page === 9) return { title: "Data Flow Analysis", summary: "Phân tích luồng dữ liệu theo dõi giá trị và trạng thái biến qua các nhánh điều khiển. SpotBugs dùng kỹ thuật này để suy ra nullness, kiểu dữ liệu và các điều kiện có thể dẫn đến lỗi.", related: [18, 20] };
  if (page >= 10 && page <= 13) return { title: "Phân tích Java Bytecode", summary: "Java source được javac biên dịch thành file .class chứa bytecode. Phân tích bytecode giúp SpotBugs quan sát hành vi gần runtime, độc lập với cách mã nguồn được viết và không cần chạy ứng dụng.", related: [9, 14, 15] };
  if (page === 14) return { title: "ASM và Visitor Pattern", summary: "SpotBugs dùng cơ chế visitor để đi qua class, method và instruction trong bytecode. Detector có thể bắt các sự kiện visit tương ứng rồi tạo BugInstance khi phát hiện mẫu đáng ngờ.", related: [10, 15, 18] };
  if (page >= 15 && page <= 17) return { title: "Kiến trúc SpotBugs", summary: "Kiến trúc gồm bước đọc và tiền xử lý bytecode, nạp detector plugin, chạy phân tích, tổng hợp BugInstance và xuất báo cáo. Thiết kế plugin cho phép mở rộng thêm bug detector mới.", related: [7, 14, 18] };
  if (page >= 18 && page <= 21) return { title: "Cơ chế phát hiện bug", summary: "Detector kết hợp pattern matching với data-flow analysis. Ví dụ lỗi null được phát hiện bằng cách theo dõi trạng thái biến qua từng nhánh rồi cảnh báo tại instruction có khả năng dereference null.", related: [9, 14, 27] };
  if (page === 22) return { title: "Thiết lập thực nghiệm", summary: "Phần thực nghiệm mô tả dự án Java được phân tích, môi trường cài đặt và cách tích hợp SpotBugs vào IntelliJ để chạy kiểm tra trên code thực tế.", related: [23, 24] };
  if (page >= 23 && page <= 26) return { title: "Kết quả phân tích", summary: "SpotBugs hiển thị cảnh báo trong IntelliJ và có thể xuất báo cáo HTML. Kết quả được lọc theo loại, mức ưu tiên và vị trí code để hỗ trợ lập trình viên điều tra từng vấn đề.", related: [22, 27, 38] };
  if (page >= 27 && page <= 30) return { title: "Bad Practice và I18N", summary: "Nhóm lỗi này bao gồm các thực hành Java dễ gây sai như so sánh String bằng ==, vấn đề contract của compareTo, và các cảnh báo quốc tế hóa có thể ảnh hưởng khi phần mềm chạy ở locale khác.", related: [8, 31, 34] };
  if (page >= 31 && page <= 33) return { title: "Malicious Code Vulnerability", summary: "Các cảnh báo bảo mật tập trung vào việc làm lộ hoặc giữ tham chiếu tới đối tượng mutable. Cách khắc phục thường là defensive copy và hạn chế khả năng sửa trạng thái nội bộ từ bên ngoài.", related: [27, 34, 38] };
  if (page >= 34 && page <= 35) return { title: "Dodgy Code và Performance", summary: "Dodgy Code là các đoạn hợp lệ nhưng đáng ngờ, còn cảnh báo Performance chỉ ra cách viết gây tốn tài nguyên. Các cảnh báo cần được xem trong ngữ cảnh để phân biệt lỗi thật và false positive.", related: [27, 31, 38] };
  if (page >= 36 && page <= 37) return { title: "SpotBugs và SonarQube", summary: "SpotBugs chuyên sâu vào Java bytecode và dễ dùng trong quy trình Java, trong khi SonarQube hỗ trợ nhiều ngôn ngữ và cung cấp nền tảng quản trị chất lượng rộng hơn. Hai công cụ có thể bổ sung cho nhau.", related: [6, 38] };
  if (page >= 38 && page <= 40) return { title: "Đánh giá công cụ", summary: "Phần đánh giá đối chiếu cảnh báo với ground truth để tính precision, recall và false positive. SpotBugs tìm được nhiều lỗi hữu ích nhưng vẫn cần cấu hình filter và kiểm tra thủ công để giảm cảnh báo sai.", related: [23, 36] };
  return { title: "Tài liệu tham khảo", summary: "Trang cuối tổng hợp các nguồn được sử dụng trong báo cáo, gồm tài liệu SpotBugs, Java bytecode, ASM và các kỹ thuật phân tích tĩnh.", related: [3, 6] };
}

function getPageGuide(page = state.activePage) {
  if (isSpotBugsCourse()) return getSpotBugsGuide(page);
  return slidePageGuides[page] || {
    title: "Nội dung bài học",
    summary: "Trang này thuộc tài liệu đang mở. Hiện phần giải thích hardcode chi tiết mới được chuẩn bị cho bộ slide AI & LLM Foundation.",
    related: [],
  };
}

function getActivePageCount() {
  if (isAiCourse()) return 29;
  if (isSpotBugsCourse()) return 41;
  return 1;
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
  wrapper.innerHTML = `${role === "assistant" ? '<span class="message-avatar">AI</span>' : ""}<div class="message-bubble"><p>${escapeHtml(text)}</p>${sources}</div>`;
  elements.slideChatMessages.appendChild(wrapper);
  elements.slideChatMessages.scrollTop = elements.slideChatMessages.scrollHeight;
  if (persist && state.activeId) {
    state.lessonChats[state.activeId] ||= [];
    state.lessonChats[state.activeId].push({ role, text, pages });
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

function getLessonAnswer(question) {
  const normalized = question.toLocaleLowerCase("vi");

  if (isAiCourse()) {
    const answer = chatbotAnswers.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
    return answer || {
      text: "Bài học giới thiệu bức tranh AI và lịch sử phát triển, giải thích cơ chế LLM từ token, context và attention, sau đó mở rộng sang AI Agent, cách chọn model, chi phí API và cấu trúc prompt.",
      pages: [{ page: 3, label: "Các tầng AI" }, { page: 10, label: "LLM là gì?" }, { page: 23, label: "AI Agent" }, { page: 28, label: "Prompt" }],
    };
  }

  if (isSpotBugsCourse()) {
    if (["bytecode", "jvm", "asm", "visitor"].some((keyword) => normalized.includes(keyword))) {
      return { text: "SpotBugs phân tích Java bytecode thay vì chạy chương trình. Nó dùng ASM và Visitor Pattern để duyệt class, method, instruction rồi cung cấp dữ liệu cho các detector nhận diện mẫu lỗi.", pages: [{ page: 10, label: "Java Bytecode" }, { page: 14, label: "ASM & Visitor" }] };
    }
    if (["kiến trúc", "kien truc", "detector", "hoạt động", "hoat dong", "data flow"].some((keyword) => normalized.includes(keyword))) {
      return { text: "Kiến trúc SpotBugs gồm đọc và tiền xử lý bytecode, nạp detector plugin, chạy pattern matching cùng data-flow analysis, thu thập BugInstance và xuất báo cáo.", pages: [{ page: 15, label: "Kiến trúc" }, { page: 18, label: "Pattern matching" }, { page: 20, label: "Data-flow" }] };
    }
    if (["lỗi", "loi", "security", "bảo mật", "bao mat", "performance", "dodgy"].some((keyword) => normalized.includes(keyword))) {
      return { text: "Tài liệu phân tích các nhóm cảnh báo chính: Bad Practice, Internationalization, Malicious Code Vulnerability, Performance và Dodgy Code. Mỗi cảnh báo cần được xem trong ngữ cảnh để phân biệt lỗi thật với false positive.", pages: [{ page: 27, label: "Bad Practice" }, { page: 31, label: "Security" }, { page: 34, label: "Dodgy Code" }] };
    }
    if (["sonarqube", "so sánh", "so sanh"].some((keyword) => normalized.includes(keyword))) {
      return { text: "SpotBugs chuyên sâu vào Java bytecode và tích hợp nhẹ trong quy trình Java. SonarQube hỗ trợ nhiều ngôn ngữ và quản trị chất lượng rộng hơn; hai công cụ có thể dùng bổ sung cho nhau.", pages: [{ page: 36, label: "So sánh SonarQube" }] };
    }
    if (["đánh giá", "danh gia", "precision", "recall", "kết quả", "ket qua"].some((keyword) => normalized.includes(keyword))) {
      return { text: "Phần thực nghiệm chạy SpotBugs trên dự án Java, xem cảnh báo qua IntelliJ/HTML rồi đối chiếu ground truth để tính precision, recall và tỷ lệ false positive.", pages: [{ page: 22, label: "Thực nghiệm" }, { page: 24, label: "Kết quả" }, { page: 38, label: "Đánh giá" }] };
    }
    return {
      text: "Bài học trình bày SpotBugs - công cụ phân tích tĩnh Java: từ bytecode, data-flow và kiến trúc detector đến cài đặt thực nghiệm, phân loại cảnh báo, so sánh SonarQube và đánh giá độ chính xác.",
      pages: [{ page: 6, label: "Tổng quan" }, { page: 15, label: "Kiến trúc" }, { page: 22, label: "Thực nghiệm" }, { page: 36, label: "So sánh" }],
    };
  }

  return { text: "Đây là trợ lý hardcode cho bài học đang mở. Tài liệu này chưa có bộ nội dung chuyên biệt, nhưng bạn vẫn có thể xem và đặt câu hỏi tổng quan về PDF.", pages: [] };
}

function askLessonChatbot(question) {
  const value = question.trim();
  if (!value || !state.activeId) return;
  addSlideChatMessage("user", value);
  elements.slideChatInput.value = "";

  const typing = document.createElement("div");
  typing.className = "message";
  typing.innerHTML = '<span class="message-avatar">AI</span><div class="message-bubble"><span class="typing-dots"><i></i><i></i><i></i></span></div>';
  elements.slideChatMessages.appendChild(typing);
  elements.slideChatMessages.scrollTop = elements.slideChatMessages.scrollHeight;

  setTimeout(() => {
    typing.remove();
    const answer = getLessonAnswer(value);
    addSlideChatMessage("assistant", answer.text, answer.pages);
  }, 420);
}

function findAnswer(question) {
  const normalized = question.toLocaleLowerCase("vi");
  return chatbotAnswers.find((answer) => answer.keywords.some((keyword) => normalized.includes(keyword))) || {
    text: "Bài học cung cấp nền tảng từ bức tranh AI, lịch sử phát triển và cơ chế hoạt động của LLM đến AI Agent, cách chọn model, tính chi phí token và xây dựng prompt. Đây là lộ trình từ hiểu AI đến có thể gọi và ứng dụng AI trong thực tế.",
    pages: [{ page: 2, label: "Agenda" }, { page: 10, label: "LLM là gì?" }, { page: 23, label: "AI Agent" }, { page: 28, label: "Prompt" }],
  };
}

function addChatMessage(role, text, pages = []) {
  const lesson = getCourseLesson();
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;
  const sources = role === "assistant" && lesson && pages.length ? `
    <div class="slide-sources">${pages.map((source) => `
      <button class="slide-link" type="button" data-lesson="${lesson.id}" data-page="${source.page}">↗ ${escapeHtml(source.label)} · tr. ${source.page}</button>
    `).join("")}</div>` : "";
  wrapper.innerHTML = `${role === "assistant" ? '<span class="message-avatar">AI</span>' : ""}<div class="message-bubble"><p>${escapeHtml(text)}</p>${sources}</div>`;
  elements.chatMessages.appendChild(wrapper);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function resetChat() {
  elements.chatMessages.innerHTML = "";
  addChatMessage("assistant", "Chào bạn! Mình đã đọc slide AI & LLM Foundation. Bạn muốn tìm hiểu phần nào? Mình sẽ chỉ đúng trang để bạn xem tiếp.");
}

function askChatbot(question) {
  const value = question.trim();
  if (!value) return;
  addChatMessage("user", value);
  elements.chatInput.value = "";

  const typing = document.createElement("div");
  typing.className = "message";
  typing.innerHTML = '<span class="message-avatar">AI</span><div class="message-bubble"><span class="typing-dots"><i></i><i></i><i></i></span></div>';
  elements.chatMessages.appendChild(typing);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

  setTimeout(() => {
    typing.remove();
    const answer = findAnswer(value);
    addChatMessage("assistant", answer.text, answer.pages);
  }, 450);
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
    openRoute();
    resetChat();
  } catch {
    elements.list.innerHTML = '<p class="no-results">Không thể tải thư viện.</p>';
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
elements.chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  askChatbot(elements.chatInput.value);
});
document.querySelector("#suggestion-list").addEventListener("click", (event) => {
  if (event.target.matches("button")) askChatbot(event.target.textContent);
});
document.querySelector("#clear-chat").addEventListener("click", resetChat);
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
