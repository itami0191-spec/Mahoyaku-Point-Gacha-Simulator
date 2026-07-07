const POINTS = {
  single: 200,
  ten: 2000,
};

const RATES = {
  R: 0.07,
  N: 0.93,
};

const CHARACTERS = [
  "Oz",
  "Arthur",
  "Cain",
  "Riquet",
  "Snow",
  "White",
  "Mithra",
  "Owen",
  "Bradley",
  "Faust",
  "Shino",
  "Heathcliff",
  "Nero",
  "Shylock",
  "Murr",
  "Chloe",
  "Rustica",
  "Figaro",
  "Rutile",
  "Lennox",
  "Mitile",
];

const R_CARDS = [
  { title: "总有一天独挡一面", character: "Mitile" },
  { title: "想派上用场", character: "Mitile" },
  { title: "好好拉伸", character: "Lennox" },
  { title: "牧羊人的实力", character: "Lennox" },
  { title: "请看人偶戏", character: "Rutile" },
  { title: "南国的老师", character: "Rutile" },
  { title: "正在诊察中", character: "Figaro" },
  { title: "这可真是麻烦了啊", character: "Figaro" },
  { title: "不擅长早起", character: "Rustica" },
  { title: "绅士的手臂上", character: "Rustica" },
  { title: "用温暖包裹着", character: "Chloe" },
  { title: "缝纫的话就交给我吧", character: "Chloe" },
  { title: "瞄准", character: "Murr" },
  { title: "模仿猫咪", character: "Murr" },
  { title: "来一战如何？", character: "Shylock" },
  { title: "像某处的某人一样", character: "Shylock" },
  { title: "年长者的劳苦", character: "Nero" },
  { title: "请吃吧", character: "Nero" },
  { title: "新的气息", character: "Heathcliff" },
  { title: "治愈的目光", character: "Heathcliff" },
  { title: "点亮路标", character: "Shino" },
  { title: "拉钩约定", character: "Shino" },
  { title: "悄悄斟酌中", character: "Faust" },
  { title: "只给你看的表情", character: "Faust" },
  { title: "好烫好烫杂烩粥", character: "Bradley" },
  { title: "倦怠的毯子", character: "Bradley" },
  { title: "看不透的眼睛", character: "Owen" },
  { title: "愉快的小饼干", character: "Owen" },
  { title: "湿透的美男子", character: "Mithra" },
  { title: "麻烦的茶杯", character: "Mithra" },
  { title: "禁忌之书！？", character: "White" },
  { title: "温柔的体温", character: "White" },
  { title: "同一款胸针", character: "Snow" },
  { title: "哪边是哪边？", character: "Snow" },
  { title: "一起加油吧！", character: "Riquet" },
  { title: "初次的咖啡", character: "Riquet" },
  { title: "体力活就交给我吧", character: "Cain" },
  { title: "明明说了真心话", character: "Cain" },
  { title: "不为人知的努力", character: "Arthur" },
  { title: "擦眼泪的王子大人", character: "Arthur" },
  { title: "眼前的东西", character: "Oz" },
  { title: "想要传达感谢", character: "Oz" },
];

const elements = {
  reset: document.querySelector("#reset"),
  single: document.querySelector("#single"),
  ten: document.querySelector("#ten"),
  skip: document.querySelector("#skip"),
  runtimeStatus: document.querySelector("#runtime-status"),
  stage: document.querySelector("#stage"),
  slab: document.querySelector("#slab"),
  cards: document.querySelector("#cards"),
  summary: document.querySelector("#summary"),
  resultPage: document.querySelector("#result-page"),
  totalPulls: document.querySelector("#total-pulls"),
  totalR: document.querySelector("#total-r"),
  totalN: document.querySelector("#total-n"),
  rRate: document.querySelector("#r-rate"),
  again: document.querySelector("#again"),
  confirmResult: document.querySelector("#confirm-result"),
  confirmModal: document.querySelector("#confirm-modal"),
  confirmMessage: document.querySelector("#confirm-message"),
  cancelConfirm: document.querySelector("#cancel-confirm"),
  okConfirm: document.querySelector("#ok-confirm"),
  tapScreen: document.querySelector("#tap-screen"),
};

const state = {
  stats: {
    pulls: 0,
    R: 0,
    N: 0,
  },
  activeTimeouts: [],
  currentResults: [],
  pendingPull: null,
  lastPullCount: 1,
  isAnimating: false,
  isAwaitingTap: false,
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function sample(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function drawCard(index) {
  const rarity = Math.random() < RATES.R ? "R" : "N";
  const card = rarity === "R" ? sample(R_CARDS) : null;
  const character = card?.character ?? sample(CHARACTERS);

  return {
    index,
    rarity,
    character,
    title: rarity === "R" ? `【${card.title}】${character}` : `【N】${character}`,
  };
}

function updateUi() {
  elements.totalPulls.textContent = formatNumber(state.stats.pulls);
  elements.totalR.textContent = formatNumber(state.stats.R);
  elements.totalN.textContent = formatNumber(state.stats.N);
  elements.rRate.textContent =
    state.stats.pulls === 0 ? "0.0%" : `${((state.stats.R / state.stats.pulls) * 100).toFixed(1)}%`;

  elements.single.disabled = state.isAnimating || state.isAwaitingTap;
  elements.ten.disabled = state.isAnimating || state.isAwaitingTap;
  elements.again.disabled = state.isAnimating;
  elements.confirmResult.disabled = state.isAnimating;
}

function setRuntimeStatus(message, type = "ready") {
  elements.runtimeStatus.textContent = message;
  elements.runtimeStatus.className = `runtime-status runtime-status--${type}`;
}

function clearAnimationQueue() {
  state.activeTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
  state.activeTimeouts = [];
}

function queue(callback, delay) {
  const timeoutId = window.setTimeout(() => {
    state.activeTimeouts = state.activeTimeouts.filter((id) => id !== timeoutId);
    callback();
  }, delay);
  state.activeTimeouts.push(timeoutId);
}

function setSummoning(isSummoning, hasRare = false) {
  elements.stage.classList.toggle("is-summoning", isSummoning);
  elements.stage.classList.toggle("is-rare", isSummoning && hasRare);
  elements.skip.hidden = !isSummoning;
  state.isAnimating = isSummoning;
  updateUi();
}

function createCardElement(card) {
  const cardElement = document.createElement("article");
  cardElement.className = `card card--${card.rarity.toLowerCase()}`;
  cardElement.innerHTML = `
    <span class="card__rarity">${card.rarity}</span>
    <h3 class="card__title">${card.title}</h3>
    <p class="card__character">${card.character}</p>
    <span class="card__index">#${String(card.index).padStart(2, "0")}</span>
  `;
  return cardElement;
}

function renderSummary(results) {
  const rareCount = results.filter((card) => card.rarity === "R").length;
  const normalCount = results.length - rareCount;
  elements.summary.textContent = `${results.length} 抽：R ${rareCount} / N ${normalCount}`;
}

function revealAll(results) {
  clearAnimationQueue();
  elements.cards.replaceChildren();
  results.forEach((card) => {
    const cardElement = createCardElement(card);
    elements.cards.append(cardElement);
    cardElement.classList.add("revealed");
  });
  setSummoning(false, false);
}

function revealSequentially(results) {
  elements.cards.replaceChildren();
  results.forEach((card, cardIndex) => {
    queue(() => {
      const cardElement = createCardElement(card);
      elements.cards.append(cardElement);
      requestAnimationFrame(() => cardElement.classList.add("revealed"));
    }, 900 + cardIndex * 260);
  });

  queue(() => {
    setSummoning(false, false);
  }, 900 + results.length * 260 + 280);
}

function showInitialPage() {
  elements.resultPage.hidden = true;
  elements.tapScreen.hidden = true;
  elements.stage.classList.remove("is-tap-ready", "is-rare", "is-summoning");
  elements.slab.textContent = "POINT";
  setRuntimeStatus("脚本已就绪，可以抽卡。");
}

function showResultPage() {
  elements.resultPage.hidden = false;
  setRuntimeStatus("");
}

function openConfirm(count) {
  if (state.isAnimating || state.isAwaitingTap) {
    return;
  }

  const cost = count === 10 ? POINTS.ten : POINTS.single;
  state.pendingPull = { count, cost };
  elements.confirmMessage.textContent = `确定使用召唤点数（${formatNumber(cost)}pt）进行点数召唤（${count}）人？`;
  elements.confirmModal.hidden = false;
  elements.okConfirm.focus();
}

function closeConfirm() {
  elements.confirmModal.hidden = true;
}

function enterTapPhase() {
  if (!state.pendingPull) {
    return;
  }

  closeConfirm();
  clearAnimationQueue();
  elements.resultPage.hidden = true;
  elements.cards.replaceChildren();
  elements.summary.textContent = "召唤准备中";
  elements.slab.textContent = "TAP";
  elements.stage.classList.add("is-tap-ready");
  elements.tapScreen.hidden = false;
  state.isAwaitingTap = true;
  setRuntimeStatus("");
  updateUi();
}

function startDraw(count) {
  clearAnimationQueue();
  state.lastPullCount = count;
  const results = Array.from({ length: count }, (_, index) => drawCard(index + 1));
  state.currentResults = results;
  state.stats.pulls += count;
  results.forEach((card) => {
    state.stats[card.rarity] += 1;
  });

  renderSummary(results);
  updateUi();
  showResultPage();
  setSummoning(true, results.some((card) => card.rarity === "R"));
  elements.slab.textContent = results.some((card) => card.rarity === "R") ? "RARE" : "POINT";
  revealSequentially(results);
}

function beginSummonFromTap() {
  if (!state.isAwaitingTap || !state.pendingPull) {
    return;
  }

  const { count } = state.pendingPull;
  state.pendingPull = null;
  state.isAwaitingTap = false;
  elements.tapScreen.hidden = true;
  elements.stage.classList.remove("is-tap-ready");
  startDraw(count);
}

function safelyRun(action) {
  try {
    action();
  } catch (error) {
    console.error(error);
    setRuntimeStatus("脚本运行出错，请刷新页面后重试。", "error");
    setSummoning(false, false);
  }
}

function reset() {
  clearAnimationQueue();
  state.stats = { pulls: 0, R: 0, N: 0 };
  state.currentResults = [];
  state.pendingPull = null;
  state.lastPullCount = 1;
  state.isAwaitingTap = false;
  elements.cards.replaceChildren();
  elements.resultPage.hidden = true;
  elements.summary.textContent = "尚未抽卡";
  elements.slab.textContent = "POINT";
  elements.stage.classList.remove("is-tap-ready");
  elements.tapScreen.hidden = true;
  closeConfirm();
  setSummoning(false, false);
  showInitialPage();
}

elements.single.addEventListener("click", () => safelyRun(() => openConfirm(1)));
elements.ten.addEventListener("click", () => safelyRun(() => openConfirm(10)));
elements.skip.addEventListener("click", () => safelyRun(() => revealAll(state.currentResults)));
elements.reset.addEventListener("click", () => safelyRun(reset));
elements.again.addEventListener("click", () => safelyRun(() => startDraw(state.lastPullCount)));
elements.confirmResult.addEventListener("click", () =>
  safelyRun(() => {
    clearAnimationQueue();
    state.currentResults = [];
    setSummoning(false, false);
    showInitialPage();
  })
);
elements.cancelConfirm.addEventListener("click", () =>
  safelyRun(() => {
    state.pendingPull = null;
    closeConfirm();
  })
);
elements.okConfirm.addEventListener("click", () => safelyRun(enterTapPhase));
elements.tapScreen.addEventListener("click", () => safelyRun(beginSummonFromTap));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.confirmModal.hidden) {
    state.pendingPull = null;
    closeConfirm();
  }
});

updateUi();
showInitialPage();
