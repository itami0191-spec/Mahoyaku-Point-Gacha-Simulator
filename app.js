var POINTS = {
  single: 200,
  ten: 2000,
};

var RATES = {
  R: 0.07,
  N: 0.93,
};

var CHARACTERS = [
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

var R_CARDS = [
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

var elements = {
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

var state = {
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
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function sample(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function setClass(element, className, shouldHaveClass) {
  if (shouldHaveClass) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

function onNextFrame(callback) {
  if (window.requestAnimationFrame) {
    window.requestAnimationFrame(callback);
    return;
  }

  window.setTimeout(callback, 16);
}

function drawCard(index) {
  var rarity = Math.random() < RATES.R ? "R" : "N";

  if (rarity === "R") {
    var card = sample(R_CARDS);
    return {
      index: index,
      rarity: rarity,
      character: card.character,
      title: "【" + card.title + "】" + card.character,
    };
  }

  var character = sample(CHARACTERS);

  return {
    index: index,
    rarity: rarity,
    character: character,
    title: "【N】" + character,
  };
}

function updateUi() {
  elements.totalPulls.textContent = formatNumber(state.stats.pulls);
  elements.totalR.textContent = formatNumber(state.stats.R);
  elements.totalN.textContent = formatNumber(state.stats.N);
  elements.rRate.textContent =
    state.stats.pulls === 0 ? "0.0%" : ((state.stats.R / state.stats.pulls) * 100).toFixed(1) + "%";

  elements.single.disabled = state.isAnimating || state.isAwaitingTap;
  elements.ten.disabled = state.isAnimating || state.isAwaitingTap;
  elements.again.disabled = state.isAnimating;
  elements.confirmResult.disabled = state.isAnimating;
}

function setRuntimeStatus(message, type) {
  type = type || "ready";
  elements.runtimeStatus.textContent = message;
  elements.runtimeStatus.className = "runtime-status runtime-status--" + type;
}

function clearAnimationQueue() {
  state.activeTimeouts.forEach(function (timeoutId) {
    window.clearTimeout(timeoutId);
  });
  state.activeTimeouts = [];
}

function queue(callback, delay) {
  var timeoutId = window.setTimeout(function () {
    state.activeTimeouts = state.activeTimeouts.filter(function (id) {
      return id !== timeoutId;
    });
    callback();
  }, delay);
  state.activeTimeouts.push(timeoutId);
}

function setSummoning(isSummoning, hasRare) {
  hasRare = !!hasRare;
  setClass(elements.stage, "is-summoning", isSummoning);
  setClass(elements.stage, "is-rare", isSummoning && hasRare);
  elements.skip.hidden = !isSummoning;
  state.isAnimating = isSummoning;
  updateUi();
}

function createCardElement(card) {
  var cardElement = document.createElement("article");
  var cardIndex = String(card.index);
  while (cardIndex.length < 2) {
    cardIndex = "0" + cardIndex;
  }
  cardElement.className = "card card--" + card.rarity.toLowerCase();
  cardElement.innerHTML =
    '<span class="card__rarity">' +
    card.rarity +
    '</span><h3 class="card__title">' +
    card.title +
    '</h3><p class="card__character">' +
    card.character +
    '</p><span class="card__index">#' +
    cardIndex +
    "</span>";
  return cardElement;
}

function renderSummary(results) {
  var rareCount = results.filter(function (card) {
    return card.rarity === "R";
  }).length;
  var normalCount = results.length - rareCount;
  elements.summary.textContent = results.length + " 抽：R " + rareCount + " / N " + normalCount;
}

function revealAll(results) {
  clearAnimationQueue();
  clearChildren(elements.cards);
  results.forEach(function (card) {
    var cardElement = createCardElement(card);
    elements.cards.appendChild(cardElement);
    cardElement.classList.add("revealed");
  });
  setSummoning(false, false);
}

function revealSequentially(results) {
  clearChildren(elements.cards);
  results.forEach(function (card, cardIndex) {
    queue(function () {
      var cardElement = createCardElement(card);
      elements.cards.appendChild(cardElement);
      onNextFrame(function () {
        cardElement.classList.add("revealed");
      });
    }, 900 + cardIndex * 260);
  });

  queue(function () {
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

  var cost = count === 10 ? POINTS.ten : POINTS.single;
  state.pendingPull = { count: count, cost: cost };
  elements.confirmMessage.textContent =
    "确定使用召唤点数（" + formatNumber(cost) + "pt）进行点数召唤（" + count + "）人？";
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
  clearChildren(elements.cards);
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
  var results = [];
  for (var index = 0; index < count; index += 1) {
    results.push(drawCard(index + 1));
  }
  state.currentResults = results;
  state.stats.pulls += count;
  results.forEach(function (card) {
    state.stats[card.rarity] += 1;
  });

  renderSummary(results);
  updateUi();
  showResultPage();
  var hasRare = results.some(function (card) {
    return card.rarity === "R";
  });
  setSummoning(true, hasRare);
  elements.slab.textContent = hasRare ? "RARE" : "POINT";
  revealSequentially(results);
}

function beginSummonFromTap() {
  if (!state.isAwaitingTap || !state.pendingPull) {
    return;
  }

  var count = state.pendingPull.count;
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
  clearChildren(elements.cards);
  elements.resultPage.hidden = true;
  elements.summary.textContent = "尚未抽卡";
  elements.slab.textContent = "POINT";
  elements.stage.classList.remove("is-tap-ready");
  elements.tapScreen.hidden = true;
  closeConfirm();
  setSummoning(false, false);
  showInitialPage();
}

elements.single.addEventListener("click", function () {
  safelyRun(function () {
    openConfirm(1);
  });
});
elements.ten.addEventListener("click", function () {
  safelyRun(function () {
    openConfirm(10);
  });
});
elements.skip.addEventListener("click", function () {
  safelyRun(function () {
    revealAll(state.currentResults);
  });
});
elements.reset.addEventListener("click", function () {
  safelyRun(reset);
});
elements.again.addEventListener("click", function () {
  safelyRun(function () {
    startDraw(state.lastPullCount);
  });
});
elements.confirmResult.addEventListener("click", function () {
  safelyRun(function () {
    clearAnimationQueue();
    state.currentResults = [];
    setSummoning(false, false);
    showInitialPage();
  });
});
elements.cancelConfirm.addEventListener("click", function () {
  safelyRun(function () {
    state.pendingPull = null;
    closeConfirm();
  });
});
elements.okConfirm.addEventListener("click", function () {
  safelyRun(enterTapPhase);
});
elements.tapScreen.addEventListener("click", function () {
  safelyRun(beginSummonFromTap);
});
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !elements.confirmModal.hidden) {
    state.pendingPull = null;
    closeConfirm();
  }
});

updateUi();
showInitialPage();
