// AI Travel Assistant - 主要JavaScript文件

const ZHIPU_API_KEY = "87021842e8f348f9a0426c26f9c6cfdc.jtwuz3s0sMFag1NX"; // 警告: 不建议在前端暴露密钥

// 全局变量
let budgetChart = null;
let currentPlan = null;

// DOM元素
const elements = {
  mobileMenuButton: document.getElementById("mobile-menu-button"),
  mobileMenu: document.getElementById("mobile-menu"),
  startPlanningBtn: document.getElementById("start-planning-btn"),
  travelForm: document.getElementById("travel-form"),
  budgetSlider: document.getElementById("budget"),
  budgetValue: document.getElementById("budget-value"),
  loading: document.getElementById("loading"),
  planSection: document.getElementById("plan-section"),
  planDestination: document.getElementById("plan-destination"),
  planDuration: document.getElementById("plan-duration"),
  planBudget: document.getElementById("plan-budget"),
  itineraryContainer: document.getElementById("itinerary-container"),
  attractionsContainer: document.getElementById("attractions-container"),
  restaurantsContainer: document.getElementById("restaurants-container"),
  budgetChartCanvas: document.getElementById("budget-chart"),
  draggableAssistant: document.getElementById("draggable-assistant"),
  assistantDialog: document.getElementById("assistant-dialog"),
  closeDialogBtn: document.getElementById("close-dialog-btn"),
  chatWindow: document.getElementById("chat-window"),
  chatInput: document.getElementById("chat-input"),
  sendChatBtn: document.getElementById("send-chat-btn"),
};

// 初始化应用
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

/**
 * 初始化应用
 */
function initializeApp() {
  setupEventListeners();
  setupSmoothScrolling();
  setDefaultDate();
  setupDraggableAssistant();
  setupDraggableDialog();
  setupResizableDialog();
  // 聊天窗口预设AI欢迎语
  if (elements.chatWindow) {
    elements.chatWindow.innerHTML = "";
    appendMessage("你好！我是你的专属旅行助手，有什么可以帮你的吗？", "ai");
  }
  console.log("AI Travel Assistant 已初始化");
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 移动端菜单切换
  elements.mobileMenuButton.addEventListener("click", toggleMobileMenu);

  // 开始规划按钮
  elements.startPlanningBtn.addEventListener("click", scrollToInputSection);

  // 预算滑块
  elements.budgetSlider.addEventListener("input", updateBudgetValue);

  // 表单提交
  elements.travelForm.addEventListener("submit", handleFormSubmit);

  // 导航链接点击
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", handleNavClick);
  });

  // 窗口滚动事件
  window.addEventListener("scroll", handleScroll);
}

/* 切换移动端菜单 */
function toggleMobileMenu() {
  elements.mobileMenu.classList.toggle("active");
}

/**
 * 平滑滚动到指定区域
 */
function scrollToInputSection() {
  document.getElementById("input-section").scrollIntoView({
    behavior: "smooth",
  });
}

/**
 * 更新预算显示值
 */
function updateBudgetValue() {
  const value = elements.budgetSlider.value;
  elements.budgetValue.textContent = `¥${parseInt(value).toLocaleString()}`;
}

/* 设置默认日期（明天） */
function setDefaultDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = tomorrow.toISOString().split("T")[0];
  document.getElementById("start-date").value = dateString;
}

/**
 * 处理导航链接点击
 */
function handleNavClick(e) {
  e.preventDefault();
  const targetId = this.getAttribute("href").substring(1);
  const targetElement = document.getElementById(targetId);

  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: "smooth",
    });
    // 关闭移动端菜单
    elements.mobileMenu.classList.remove("active");
  }
}

/**
 * 处理滚动事件
 */
function handleScroll() {
  const nav = document.querySelector("nav");
  if (window.scrollY > 100) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
}

/**
 * 处理表单提交
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(elements.travelForm);
  const travelData = {
    destination: formData.get("destination"),
    startDate: formData.get("start-date"),
    duration: parseInt(formData.get("duration")),
    budget: parseInt(formData.get("budget")),
    preferences: formData.getAll("preferences"),
  };
  // 验证表单数据
  if (!validateFormData(travelData)) {
    return;
  }

  // 显示加载动画
  showLoading();

  try {
    // 调用智谱GLM-4 API生成旅行计划
    const travelPlan = await generateTravelPlanWithGLM(travelData);

    // 隐藏加载动画
    hideLoading();

    // 显示旅行计划
    displayTravelPlan(travelPlan);

    // 滚动到计划区域
    elements.planSection.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    hideLoading();
    // 如果AI调用失败，回退到模拟数据
    showError(`智谱AI生成失败，将使用模拟数据。错误: ${error.message}`);
    console.error("智谱AI生成旅行计划错误:", error);
    // const mockTravelPlan = await generateTravelPlanWithMockData(travelData);
    // displayTravelPlan(mockTravelPlan);
    // elements.planSection.scrollIntoView({ behavior: "smooth" });
  }
}

/**
 * 验证表单数据
 */
function validateFormData(data) {
  if (!data.destination.trim()) {
    showError("请输入旅行目的地");
    return false;
  }

  if (!data.startDate) {
    showError("请选择出发日期");
    return false;
  }

  if (data.duration < 1 || data.duration > 30) {
    showError("旅行天数应在1-30天之间");
    return false;
  }

  if (data.budget < 1000 || data.budget > 50000) {
    showError("预算应在¥1,000-¥50,000之间");
    return false;
  }

  if (data.preferences.length === 0) {
    showError("请至少选择一个旅行偏好");
    return false;
  }

  return true;
}

/**
 * 显示加载动画
 */
function showLoading() {
  elements.loading.classList.add("active");
  document.body.classList.add("no-scroll");
}

/**
 * 隐藏加载动画
 */
function hideLoading() {
  elements.loading.classList.remove("active");
  document.body.classList.remove("no-scroll");
}

/**
 * 显示错误信息
 */
function showError(message) {
  // 创建错误提示元素
  const errorDiv = document.createElement("div");
  errorDiv.className =
    "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in-up";
  errorDiv.textContent = message;

  document.body.appendChild(errorDiv);

  // 3秒后自动移除
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}

/**
 * 使用智谱GLM-4 API生成旅行计划
 */
async function generateTravelPlanWithGLM(travelData) {
  console.log("正在使用 智谱GLM-4 API 生成旅行计划...");
  const { destination, duration, budget, preferences } = travelData;

  const prompt = `您是一位专业的旅行规划AI。请为用户生成一份个性化的旅行计划。

用户信息如下:
- 目的地: ${destination}
- 旅行天数: ${duration} 天
- 总预算: ¥${budget}
- 旅行偏好: ${preferences.join(", ")}

请严格按照以下JSON格式生成旅行计划，不要在JSON对象之外添加任何文本或解释。

JSON格式要求:
{
  "dailyItinerary": [
    {
      "day": 1,
      "activities": [
        { "time": "HH:MM格式的时间", "activity": "活动名称", "description": "活动描述" }
      ]
    }
  ],
  "attractions": [
    { "name": "景点名称", "description": "景点描述", "image": "一个有效的Unsplash图片URL (400x300)", "rating": 4.5, "price": "价格描述，如 '免费' 或 '¥3,000'" }
  ],
  "restaurants": [
    { "name": "餐厅名称", "description": "餐厅描述", "cuisine": "菜系", "price": "价格等级，如 '¥¥' 或 '¥¥¥'", "rating": 4.5 }
  ],
  "budgetAllocation": {
    "accommodation": 0,
    "food": 0,
    "transportation": 0,
    "activities": 0,
    "shopping": 0
  }
}

重要指南:
- "budgetAllocation"各项的值应为数字，总和不应超过总预算 ¥${budget}。
- 生成 ${duration} 天的行程。
- 提供6个 "attractions" 和6个 "restaurants"。
- "rating" 字段应为1-5的数字。
- 对于 "attractions" 的 "image" 字段, 请使用 Unsplash Source API (https://source.unsplash.com/400x300/?{关键词})。例如，对于'东京塔'，可以使用 'https://source.unsplash.com/400x300/?tokyo-tower'。关键词请使用英文。
- 所有描述性文本都应该是中文。
- 价格规划不能为0, 请生成确切的数字
`;

  const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZHIPU_API_KEY}`,
    },
    body: JSON.stringify({
      model: "glm-4-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `智谱API错误: ${response.statusText} - ${
        errorData?.error?.msg || "未知错误"
      }`
    );
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  // 清理可能的Markdown代码块
  content = content.replace(/```json/g, "").replace(/```/g, "");

  const planData = JSON.parse(content.trim());

  return {
    ...travelData,
    ...planData,
  };
}

/**
 * 显示旅行计划
 */
function displayTravelPlan(plan) {
  currentPlan = plan;

  // 更新概览信息
  elements.planDestination.textContent = plan.destination;
  elements.planDuration.textContent = `${plan.duration}天`;
  elements.planBudget.textContent = `¥${plan.budget.toLocaleString()}`;

  // 显示计划区域
  elements.planSection.classList.add("active");

  // 生成每日行程
  displayDailyItinerary(plan.dailyItinerary);

  // 生成景点推荐
  displayAttractions(plan.attractions);

  // 生成餐厅推荐
  displayRestaurants(plan.restaurants);

  // 生成预算图表
  displayBudgetChart(plan.budgetAllocation);

  // 添加淡入动画
  elements.planSection.classList.add("fade-in-up");
}

/**
 * 显示每日行程
 */
function displayDailyItinerary(itinerary) {
  elements.itineraryContainer.innerHTML = "";

  itinerary.forEach((day) => {
    const dayCard = document.createElement("div");
    dayCard.className = "day-card";

    dayCard.innerHTML = `
            <h4 class="day-card-title">
                <i class="iconfont icon-rili day-card-title-icon"></i>
                第${day.day}天
            </h4>
            <div class="timeline">
                ${day.activities
                  .map(
                    (activity) => `
                    <div class="timeline-item">
                        <div class="timeline-item-content">
                            <div class="timeline-time">
                                ${activity.time}
                            </div>
                            <div class="timeline-details">
                                <h5 class="timeline-activity">${activity.activity}</h5>
                                <p class="timeline-description">${activity.description}</p>
                            </div>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;

    elements.itineraryContainer.appendChild(dayCard);
  });
}

/**
 * 显示景点推荐
 */
function displayAttractions(attractions) {
  elements.attractionsContainer.innerHTML = "";
  console.log(attractions);
  attractions.forEach(async (attraction) => {
    const attractionCard = document.createElement("div");
    attractionCard.className = "attraction-card";
    const queryString = attraction.image.split("?")[1];
    const res = await getAttractionsImages(queryString);
    // 更新景点图片URL为获取到的高质量图片
    attraction.image = res.results[0].urls.small;
    // console.log(res.results[0].urls.small);
    attractionCard.innerHTML = `
            <img src="${attraction.image}" alt="${attraction.name}" class="attraction-card-image">
            <div class="attraction-card-content">
                <div class="card-header">
                    <h4 class="card-title">${attraction.name}</h4>
                    <span class="card-rating attraction-rating">
                        <i class="iconfont icon-shengdan-xingxing"></i> ${attraction.rating}
                    </span>
                </div>
                <p class="card-description">${attraction.description}</p>
                <div class="attraction-card-footer">
                    <span class="attraction-card-price">${attraction.price}</span>
                    <button class="card-button">查看详情</button>
                </div>
            </div>
        `;

    elements.attractionsContainer.appendChild(attractionCard);
  });
}
//从Unsplash API获取景点图片
async function getAttractionsImages(query) {
  // 构建API请求URL，包含客户端ID和查询参数
  const url =
    "https://api.unsplash.com/search/photos?page=1&client_id=0hZMg6_ZIxhpegByFE1GfohFgIJX9KrcAGgM218XouU&per_page=1&query=" +
    query;
  // 发送API请求并等待响应
  const response = await fetch(url);

  return response.json();
}
/**
 * 显示餐厅推荐
 */
function displayRestaurants(restaurants) {
  elements.restaurantsContainer.innerHTML = "";

  restaurants.forEach((restaurant) => {
    const restaurantCard = document.createElement("div");
    restaurantCard.className = "restaurant-card";

    restaurantCard.innerHTML = `
            <div class="card-header">
                <h4 class="card-title">${restaurant.name}</h4>
                <span class="card-rating">
                    <i class="iconfont icon-shengdan-xingxing"></i> ${restaurant.rating}
                </span>
            </div>
            <p class="card-description">${restaurant.description}</p>
            <div class="card-meta">
                <span class="card-tag">${restaurant.cuisine}</span>
                <span class="card-price">${restaurant.price}</span>
            </div>
            <button class="card-button">
                预订餐桌
            </button>
        `;

    elements.restaurantsContainer.appendChild(restaurantCard);
  });
}

/**
 * 显示预算图表
 */
function displayBudgetChart(budgetAllocation) {
  const ctx = elements.budgetChartCanvas.getContext("2d");
  // 销毁现有图表
  if (budgetChart) {
    budgetChart.destroy();
  }

  // 创建新图表
  budgetChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["住宿", "餐饮", "交通", "活动", "购物"],
      datasets: [
        {
          data: [
            budgetAllocation.accommodation,
            budgetAllocation.food,
            budgetAllocation.transportation,
            budgetAllocation.activities,
            budgetAllocation.shopping,
          ],
          backgroundColor: [
            "#3b82f6",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

// 平滑滚动设置
function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

/**
 * 新增：设置可拖拽助手 (已修复拖拽后粘滞的问题)
 */
function setupDraggableAssistant() {
  const assistant = elements.draggableAssistant;
  const dialog = elements.assistantDialog;
  const closeBtn = elements.closeDialogBtn;

  if (!assistant || !dialog || !closeBtn) return;

  // 核心修复：阻止浏览器对图片默认的拖拽事件，防止虚影和事件劫持
  assistant.addEventListener("dragstart", (e) => e.preventDefault());

  const onMouseDown = (e) => {
    assistant.style.cursor = "grabbing";
    // 拖拽时禁用CSS过渡效果，使移动更平滑
    assistant.style.transition = "none";

    const event = e.type.includes("mouse") ? e : e.touches[0];
    const offsetX = event.clientX - assistant.getBoundingClientRect().left;
    const offsetY = event.clientY - assistant.getBoundingClientRect().top;

    const onMouseMove = (eMove) => {
      eMove.preventDefault();

      const eventMove = eMove.type.includes("mouse") ? eMove : eMove.touches[0];
      let newX = eventMove.clientX - offsetX;
      let newY = eventMove.clientY - offsetY;

      // 限制在视口内
      const bodyRect = document.body.getBoundingClientRect();
      if (newX < 0) newX = 0;
      if (newY < 0) newY = 0;
      if (newX + assistant.offsetWidth > bodyRect.width)
        newX = bodyRect.width - assistant.offsetWidth;
      if (newY + assistant.offsetHeight > bodyRect.height)
        newY = bodyRect.height - assistant.offsetHeight;

      assistant.style.left = `${newX}px`;
      assistant.style.top = `${newY}px`;
      assistant.style.right = "auto";
      assistant.style.bottom = "auto";
    };

    const onMouseUp = () => {
      assistant.style.cursor = "grab";
      // 拖拽结束后恢复CSS过渡效果
      assistant.style.transition = "transform 0.2s ease-in-out";

      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onMouseMove);
      document.removeEventListener("touchend", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchmove", onMouseMove, { passive: false });
    document.addEventListener("touchend", onMouseUp);
  };

  assistant.addEventListener("mousedown", onMouseDown);
  assistant.addEventListener("touchstart", onMouseDown);

  // 对话框逻辑: 双击打开
  assistant.addEventListener("dblclick", () => {
    dialog.classList.add("active");
    const aiImage = elements.draggableAssistant.querySelector("img");
    if (aiImage) {
      aiImage.src = "images/open.gif";
    } else {
      console.error("在 #draggable-assistant 中找不到 img 元素！");
    }
  });

  closeBtn.addEventListener("click", () => {
    dialog.classList.remove("active");
    const aiImage = elements.draggableAssistant.querySelector("img");
    if (aiImage) {
      aiImage.src = "images/weilai.gif";
    }
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      dialog.classList.remove("active");
    }
  });

  // 新增：处理聊天消息发送
  elements.sendChatBtn.addEventListener("click", handleSendMessage);
  elements.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  });
}

/**
 * 新增：处理发送消息的逻辑
 */
function handleSendMessage() {
  const input = elements.chatInput;
  const message = input.value.trim();

  if (message === "") return;

  // 1. 在聊天窗口显示用户消息
  appendMessage(message, "user");

  // 2. 清空输入框
  input.value = "";

  // 3. 获取并显示AI回复
  getAndDisplayAiResponse(message);
}

/* 在聊天窗口追加消息 */
function appendMessage(text, sender) {
  const messageElement = document.createElement("div");
  messageElement.className = `chat-message ${sender}-message`;

  // 头像
  const avatar = document.createElement("img");
  avatar.className = "avatar";
  if (sender === "ai") {
    avatar.src = "images/miku_avatar.png";
    avatar.alt = "AI助手";
  } else {
    avatar.src = "images/user_avatar.png";
    avatar.alt = "用户";
  }

  // 消息气泡
  const p = document.createElement("p");
  p.textContent = text;

  // 结构：AI左侧头像，用户右侧头像，气泡始终靠近内容区
  if (sender === "ai") {
    messageElement.appendChild(avatar);
    messageElement.appendChild(p);
  } else {
    messageElement.appendChild(p);
    messageElement.appendChild(avatar);
  }

  elements.chatWindow.appendChild(messageElement);

  // 滚动到底部
  elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
}

/* 获取并显示AI的回复 */
async function getAndDisplayAiResponse(userMessage) {
  // 显示"思考中"的状态
  const thinkingElement = document.createElement("div");
  thinkingElement.className = "chat-message ai-message";
  thinkingElement.innerHTML = `<p class="thinking">...</p>`;
  elements.chatWindow.appendChild(thinkingElement);
  elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;

  try {
    const aiResponse = await getAiChatResponse(userMessage);
    thinkingElement.remove();
    appendMessage(aiResponse, "ai");
  } catch (error) {
    console.error("AI aPI call failed:", error);
    thinkingElement.remove();
    appendMessage("抱歉，连接AI服务器时出错了，请稍后再试。", "ai");
  }
}

/* 调用AI接口获取聊天回复 */
async function getAiChatResponse(userMessage) {
  const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
  // 为通用聊天创建一个更简单的提示
  const prompt = `你是一位专业的旅行规划AI，请根据用户的提问提供友好且有帮助的回答。\n用户问题: "${userMessage}"`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZHIPU_API_KEY}`,
    },
    body: JSON.stringify({
      model: "glm-4-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `智谱API错误: ${response.statusText} - ${
        errorData?.error?.msg || "未知错误"
      }`
    );
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

function setupDraggableDialog() {
  const dialog = document.getElementById("assistant-dialog");
  const header = dialog.querySelector(".chat-header");
  if (!dialog || !header) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.style.cursor = "move";

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    // 记录鼠标在弹窗内的偏移
    const rect = dialog.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;
    // 限制在视口内
    const minLeft = 0;
    const minTop = 0;
    const maxLeft = window.innerWidth - dialog.offsetWidth;
    const maxTop = window.innerHeight - dialog.offsetHeight;
    newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
    newTop = Math.max(minTop, Math.min(newTop, maxTop));
    dialog.style.left = newLeft + "px";
    dialog.style.top = newTop + "px";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });
}

function setupResizableDialog() {
  const dialog = document.getElementById("assistant-dialog");
  if (!dialog) return;

  // 先移除旧的handle，避免重复
  dialog.querySelectorAll(".resize-handle").forEach((e) => e.remove());

  // 8个方向
  const directions = [
    "top",
    "bottom",
    "left",
    "right",
    "topleft",
    "topright",
    "bottomleft",
    "bottomright",
  ];
  directions.forEach((dir) => {
    const handle = document.createElement("div");
    handle.className = `resize-handle handle-${dir}`;
    dialog.appendChild(handle);
  });

  let isResizing = false;
  let currentDir = "";
  let startX = 0,
    startY = 0,
    startW = 0,
    startH = 0,
    startL = 0,
    startT = 0;

  function onMouseDown(e, dir) {
    e.preventDefault();
    isResizing = true;
    currentDir = dir;
    const rect = dialog.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startW = rect.width;
    startH = rect.height;
    startL = rect.left;
    startT = rect.top;
    document.body.style.userSelect = "none";
  }

  function onMouseMove(e) {
    if (!isResizing) return;
    let dx = e.clientX - startX;
    let dy = e.clientY - startY;
    let minW = 280,
      minH = 320;
    let maxW = window.innerWidth - 20,
      maxH = window.innerHeight - 20;
    let newW = startW,
      newH = startH,
      newL = startL,
      newT = startT;
    if (currentDir.includes("right"))
      newW = Math.min(Math.max(startW + dx, minW), maxW);
    if (currentDir.includes("left")) {
      newW = Math.min(Math.max(startW - dx, minW), maxW);
      newL = startL + dx;
      if (newW === minW) newL = startL + (startW - minW);
      if (newW === maxW) newL = startL + (startW - maxW);
    }
    if (currentDir.includes("bottom"))
      newH = Math.min(Math.max(startH + dy, minH), maxH);
    if (currentDir.includes("top")) {
      newH = Math.min(Math.max(startH - dy, minH), maxH);
      newT = startT + dy;
      if (newH === minH) newT = startT + (startH - minH);
      if (newH === maxH) newT = startT + (startH - maxH);
    }
    // 设置宽高和位置
    dialog.style.width = newW + "px";
    dialog.style.height = newH + "px";
    dialog.style.left = newL + "px";
    dialog.style.top = newT + "px";
  }

  function onMouseUp() {
    isResizing = false;
    document.body.style.userSelect = "";
  }

  directions.forEach((dir) => {
    const handle = dialog.querySelector(`.handle-${dir}`);
    handle.addEventListener("mousedown", (e) => onMouseDown(e, dir));
  });
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}
