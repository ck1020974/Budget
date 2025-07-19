let allPolicies = [];
let totalSupport = 0;
let totalSustainability = 0;

let groupSupport = {
  嬰幼兒: 0,
  學生與青少年: 0,
  中壯年: 0,
  高齡者: 0,
  身心障礙者: 0,
  新住民: 0,
  原住民族: 0,
  偏鄉: 0,
  低收入與無家者: 0,
  勞工: 0,
  資本家: 0
};
let usedPolicies = [];
let countdownInterval = null;
let roundCount = 0;
const MAX_ROUNDS = 20;
let totalBudget = 400000000000; // 初始預算為4000億元

// 新增：記錄所有出現過的政策名稱
let appearedPolicies = new Set();

// 新增：記錄每回合三張卡與選擇
let roundRecords = [];

function getRandomPolicies(count) {
  // 只抽還沒出現過的政策
  const unused = allPolicies.filter(p => !appearedPolicies.has(p['政策名稱']));
  const selected = [];
  while (selected.length < count && unused.length > 0) {
    const index = Math.floor(Math.random() * unused.length);
    selected.push(unused.splice(index, 1)[0]);
  }
  // 標記這回合出現過的政策
  selected.forEach(p => appearedPolicies.add(p['政策名稱']));
  return selected;
}

function updateBudgetDisplay() {
  const display = document.getElementById('budget');
  display.textContent = `剩餘預算：${(totalBudget / 100000000).toFixed(0)} 億`;
}

function updateRoundDisplay() {
  const roundDisplay = document.getElementById('round-display');
  if (roundDisplay) {
    const currentRound = roundCount;
    const formattedRound = currentRound.toString().padStart(2, '0');
    roundDisplay.textContent = `第 ${formattedRound}/20 回合`;
  }
}

function renderPolicies(policies) {
  const container = document.getElementById('round-container');
  container.innerHTML = '';

  // 若遊戲已結束，不再渲染卡片
  if (roundCount > MAX_ROUNDS) return;

  // 新增：暫存本回合三張卡
  let thisRound = { cards: policies.map(p => p['政策名稱']), chosen: null };

  policies.forEach(policy => {
    const card = document.createElement('div');
    card.className = 'policy-card';
    const cost = Number(policy['預算（億元）']) * 100000000;
    card.innerHTML = `
      <div class="policy-image">${policy['政策名稱']}</div>
      <div class="policy-img-wrapper"><img class="policy-img" src="${policy['圖片']}" alt="${policy['政策名稱']}圖片"></div>
      <div class="policy-body">
        <div class="policy-desc">${policy['政策內容']}</div>
        <div class="policy-info">
          <div>💰 預算：${policy['預算（億元）']} 億元</div>
          <div>🗳️ 支持度：<span class="vote-icon">${'🗳️'.repeat(Math.round(policy['支持度'] / 3))}</span></div>
        </div>
      </div>
    `;

    if (cost > totalBudget) {
      card.classList.add('disabled');
      card.style.opacity = '0.5';
      card.style.pointerEvents = 'none';
      card.title = '預算不足，無法選擇此政策';
    } else {
      card.addEventListener('click', () => {
        totalBudget -= cost;
        updateBudgetDisplay();
        totalSupport += Number(policy['支持度'] || 0);
        totalSustainability += Number(policy['永續指數'] || 0);
        Object.keys(groupSupport).forEach(group => {
          groupSupport[group] += Number(policy[group] || 0);
        });
        usedPolicies.push(policy['政策名稱']);
        thisRound.chosen = policy['政策名稱'];
        roundRecords.push(thisRound);
        startNewRound();
      });
    }
    container.appendChild(card);
  });

  // 若本回合未選擇（跳過），在 startNewRound 裡補記錄
  window._pendingRoundRecord = thisRound;
}

function startCountdown(durationSeconds) {
  const bar = document.getElementById('timer-bar');
  let remaining = durationSeconds;
  const total = durationSeconds;

  if (countdownInterval) clearInterval(countdownInterval);

  bar.style.transition = 'none';
  bar.style.width = '100%';
  bar.style.backgroundColor = '#3498db';
  void bar.offsetWidth;
  bar.style.transition = 'width 1s linear, background-color 0.5s ease';

  countdownInterval = setInterval(() => {
    remaining--;
    const percentage = (remaining / total) * 100;
    bar.style.width = percentage + '%';

    if (remaining <= 5) {
      bar.style.backgroundColor = '#e74c3c';
    }

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      startNewRound();
    }
  }, 1000);
}

function startNewRound() {
  roundCount++; // ✅ 移到最上面，先遞增回合數

  const skipBtn = document.getElementById('skip-round-btn');
  if (skipBtn) {
    skipBtn.disabled = false;
    skipBtn.style.display = 'block';
  }

  if (roundCount - 1 === 5 || roundCount - 1 === 10 || roundCount - 1 === 15) {
    const addBudget = 300000000000;
    totalBudget += addBudget;
    alert(`第${roundCount - 1}回合結束，追加預算3000億！`);
    updateBudgetDisplay();
  }

  if (roundCount > MAX_ROUNDS) {
    clearInterval(countdownInterval);
    document.getElementById('timer-bar').style.width = '0%';
    document.getElementById('timer-bar-container').style.display = 'none';
    if (skipBtn) skipBtn.style.display = 'none';
    showEnding();  // ✅ 這裡就會正確進入
    return;
  }

  const newPolicies = getRandomPolicies(3);
  if (newPolicies.length === 0) {
    document.getElementById('round-container').innerHTML =
      '<p style="text-align:center; font-size:1.2rem;">🎉 所有政策已展示完畢！</p>';
    document.getElementById('timer-bar').style.width = '0%';
    return;
  }

  updateRoundDisplay();
  renderPolicies(newPolicies);
  startCountdown(20);
}

fetch('policy-list.json')
  .then(res => res.json())
  .then(data => {
    allPolicies = data;
    updateBudgetDisplay();
    updateRoundDisplay();
    startNewRound();
    // 新增：設定跳過按鈕事件
    const skipBtn = document.getElementById('skip-round-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        skipBtn.disabled = true;
        // 跳過時，記錄本回合三張卡且 chosen 為 null
        if (window._pendingRoundRecord) {
          roundRecords.push(window._pendingRoundRecord);
          window._pendingRoundRecord = null;
        }
        startNewRound();
      });
    }
  })
  .catch(err => console.error('載入政策資料錯誤', err));


// === 結局敘述對照表 ===
const endings = {
  "高票當選_高": `在你所推動的一系列社會福利政策下，你以壓倒性高票當選，民意支持如海嘯般席捲全國。更難能可貴的是，你所推動的政策具備長遠眼光，為社會注入公平與韌性，帶來世代福祉與制度改革，被譽為現代治理典範。 你的政策著眼長遠發展，不僅推動經濟成長，更積極解決社會結構與環境問題，讓國力與族群融合穩步前進。`,
  "高票當選_中": `在你所推動的一系列社會福利政策下，你高票當選，選民對你給予厚望。雖然部分政策展現進步方向，但在環境與社會長遠挑戰上仍留有隱憂，外界期待你在下個任期能展現更全面的改革決心。 你兼顧當前與未來，雖仍有族群差距與社會挑戰未解，但整體國家發展方向穩定，社會對未來仍抱持希望。`,
  "高票當選_低": `在你所推動的一系列社會福利政策下，你以壓倒性票數當選，獲得社會多數支持。然而為了達成高滿意度，政策著重於立即性補貼與擴張性福利，忽略財政可持續與社會結構性改革。雖然短期內民意高漲、政績輝煌，但公共財政壓力劇增，社會對資源分配的期待也不斷上升，未來的政策空間與國家發展彈性正逐步被壓縮。`,
  "驚險連任_高": `在你所推動的一系列社會福利政策下，你在選戰中驚險連任，雖然過程跌宕起伏，但選民最終認可你致力於長期改革與公平正義，這場選舉成為台灣政治發展的一大轉捩點。 你的政策著眼長遠發展，不僅推動經濟成長，更積極解決社會結構與環境問題，讓國力與族群融合穩步前進。`,
  "驚險連任_中": `你以些微差距驚險連任，政策風格不偏激也不過於保守。在民意分歧與財政壓力下，你選擇中庸穩健的施政路線，雖有效維持社會秩序與基本照顧，但未能對長期挑戰提出更具前瞻的策略。或許是因為沒有更好的選擇，民眾多數願意再給你一次機會，但對你也未激起太多熱情與期待。`,
  "驚險連任_低": `你在選前大舉討好選民，成功以些微之差連任，卻也讓財政狀況亮起紅燈。短期內雖收穫掌聲，卻暴露出政策缺乏長期規劃。為討好特定族群而忽略整體國家韌性的結果，使社會更加分裂、族群矛盾加深，選後民怨與質疑聲浪不斷升高，也讓國家的未來，埋下了不安定的因素。`,
  "敗選退場_高": `在你所推動的一系列社會福利政策下，雖然未能連任，但你的遠見與堅持卻深植人心。你所倡議的政策超越眼前選票，著眼於解決更深層的社會問題。你的敗選不僅是政治上的遺憾，更被許多人視為國家的損失。隨著時間推移，越來越多改革被後繼者延續，歷史終將還給你一個公道。`,
  "敗選退場_中": `在你所推動的一系列社會福利政策下，你以些微差距落敗。任期內雖無重大失誤，卻也缺乏明確方向與代表性成果。你既沒有激起希望，也無法凝聚信任，最終讓選民在模糊與冷淡中轉身離去。你或許盡力了，但留下的印象淡薄，很快就被多數人遺忘在歷史的角落。`,
  "敗選退場_低": `在你所推動的一系列社會福利政策下，你在下屆得到極低的支持率，以落選收場。任期內政策爭議不斷，過度討好選民卻忽略財政紀律，導致赤字飆升、經濟失衡，民怨四起。社會撕裂、族群對立、長期發展停滯不前，你的執政被視為國家走向衰退的轉捩點，也被後人譏為民主政治的慘痛教訓。`
};

// === 族群評語資料庫 ===
const groupFeedbackTexts = {
  '嬰幼兒': {
    '被關注': '政府大力推動托育與支持政策，家長普遍感受到育兒負擔減輕，支持度大幅提升。',
    '被忽略': '新生兒與幼童相關政策明顯不足，年輕夫妻育兒壓力沉重，少子化問題雪上加霜。'
  },
  '學生與青少年': {
    '被關注': '你積極投資教育與青年政策，讓年輕世代感受到希望，社會充滿活力與正能量。',
    '被忽略': '教育資源與就業機會不足，年輕人覺得被社會拋棄，無力的青年逐漸放棄工作與生活。'
  },
  '中壯年': {
    '被關注': '政策切中中壯年族群的經濟、居住與工作需求，生活壓力獲得緩解，社會穩定性提升。',
    '被忽略': '對中生代缺乏有效支持，家庭負擔沉重、社會流動停滯，整體經濟發展明顯下滑。'
  },
  '高齡者': {
    '被關注': '長輩在醫療、照護與交通方面獲得改善，生活更有尊嚴，展現對世代的溫暖關懷。',
    '被忽略': '高齡者在就醫與生活上遭遇困境，照護資源不足，讓晚年生活充滿不安與焦慮。'
  },
  '身心障礙者': {
    '被關注': '身障者獲得無障礙設施與職業輔導支持，逐漸融入社會，生活信心穩定提升。',
    '被忽略': '身障族群在就業與交通面臨困難，社會支持薄弱，生活處處受限，處境艱難。'
  },
  '新住民': {
    '被關注': '語言與生活輔導政策到位，協助新住民順利融入社會，提升家庭穩定與參與感。',
    '被忽略': '新住民遭遇語言與文化障礙，社會參與度低，邊緣化情況持續惡化，引發擔憂。'
  },
  '原住民族': {
    '被關注': '原民政策聚焦基礎建設與長期支持，族群尊嚴獲肯定，未來發展開始看見希望。',
    '被忽略': '原民部落長期缺乏資源，族語流失問題日益嚴重，族群身分認同也陷入危機。'
  },
  '偏鄉': {
    '被關注': '偏鄉獲得交通與醫療改善，基礎建設到位，居民感受到生活品質明顯進步。',
    '被忽略': '偏鄉資源長期匱乏，青年外移嚴重，人口老化加劇，地方發展面臨嚴峻挑戰。'
  },
  '勞工': {
    '被關注': '勞工保險與職災制度調整到位，改善職場待遇，讓基層勞動者重拾公平與尊嚴。',
    '被忽略': '勞工面臨過勞與低薪困境，政府被批評傾向資方，職場不公導致民怨累積。'
  }
};

// === 族群評語產生函式 ===
function generateGroupFeedback(resultKey, onlyIgnored = false) {
  // 隨機排列函式，用於處理平手情況
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  let allGroups = Object.entries(groupSupport)
    .map(([group, count]) => ({ group, count }))
    .filter(g => g.group !== '資本家' && g.group !== '低收入與無家者'); // 排除特定非目標群體

  // 特殊結局：高票當選_高，三個都顯示被關注
  if (resultKey === '高票當選_高') {
    const caredGroups = shuffleArray(allGroups.filter(g => g.count > 0 && groupFeedbackTexts[g.group])).slice(0, 3);
    let feedbackHtml = '';
    caredGroups.forEach(group => {
      const message = groupFeedbackTexts[group.group]?.['被關注'];
      if (message) {
        feedbackHtml += `<div class="feedback-card">${message}</div>`;
      }
    });
    if (count === 0) {
      // fallback 起碼一張虛擬評語卡
      feedbackHtml += `<div class="feedback-card">在你的任內，似乎沒有推動任何具體的福利政策，所有族群都未得到特別的關注。</div>`;
      count++;
    }
    if (count < 3) {
  const allIgnoredMessages = Object.entries(groupFeedbackTexts)
    .map(([group, obj]) => obj['被忽略'])
    .filter(msg => msg && !usedMessages.has(msg));
  for (let msg of allIgnoredMessages) {
    feedbackHtml += `<div class="feedback-card">${msg}</div>`;
    count++;
    if (count === 3) break;
  }
}
    return feedbackHtml;
  }

  // 特殊結局：敗選退場_低，三個都顯示被忽略
  if (resultKey === '敗選退場_低') {
    const ignoredGroups = shuffleArray(allGroups.filter(g => g.count === 0 && groupFeedbackTexts[g.group])).slice(0, 3);
    let feedbackHtml = '';
    ignoredGroups.forEach(group => {
      const message = groupFeedbackTexts[group.group]?.['被忽略'];
      if (message) {
        feedbackHtml += `<div class="feedback-card">${message}</div>`;
      }
    });
    if (ignoredGroups.length === 0) {
      return `<div class="feedback-card">在你的任內，似乎沒有推動任何具體的福利政策，所有族群都未得到特別的關注。</div>`;
    }
    return feedbackHtml;
  }

  // 只顯示三個被忽視的 groupFeedback，且保證三個不同族群
  if (onlyIgnored) {
    const ignoredGroups = shuffleArray(allGroups.filter(g => g.count === 0 && groupFeedbackTexts[g.group]));
    let feedbackHtml = '';
    let usedMessages = new Set();
    let count = 0;
    for (let group of ignoredGroups) {
      const message = groupFeedbackTexts[group.group]?.['被忽略'];
      if (message && !usedMessages.has(message)) {
        feedbackHtml += `<div class="feedback-card">${message}</div>`;
        usedMessages.add(message);
        count++;
        if (count === 3) break;
      }
    }
    if (count === 0) {
      return `<div class="feedback-card">在你的任內，似乎沒有推動任何具體的福利政策，所有族群都未得到特別的關注。</div>`;
    }
    // 若不足三個，補上其他未重複的族群評語
    if (count < 3) {
      const allIgnoredMessages = Object.entries(groupFeedbackTexts)
        .map(([group, obj]) => obj['被忽略'])
        .filter(msg => msg && !usedMessages.has(msg));
      for (let msg of allIgnoredMessages) {
        feedbackHtml += `<div class="feedback-card">${msg}</div>`;
        count++;
        if (count === 3) break;
      }
    }
    return feedbackHtml;
  }


  let supportedGroups = allGroups.filter(g => g.count > 0);
  let ignoredGroups = allGroups.filter(g => g.count === 0 && groupFeedbackTexts[g.group]);
  let mostCaredFor = [];
  let leastCaredFor = [];
  const isWin = resultKey.startsWith('高票當選') || resultKey.startsWith('驚險連任');

  if (isWin) {
    mostCaredFor = supportedGroups.slice(0, 2);
    const potentialLeast = [...supportedGroups.slice(2), ...ignoredGroups];
    leastCaredFor = shuffleArray(potentialLeast).slice(0, 1);
  } else { // 敗選
    mostCaredFor = supportedGroups.slice(0, 1);
    const potentialLeast = [...supportedGroups.slice(1), ...ignoredGroups];
    leastCaredFor = shuffleArray(potentialLeast).slice(0, 2);
  }

  let feedbackHtml = '';
  mostCaredFor.forEach(group => {
    const message = groupFeedbackTexts[group.group]?.['被關注'];
    if (message) {
      feedbackHtml += `<div class="feedback-card">${message}</div>`;
    }
  });
  leastCaredFor.forEach(group => {
    const message = groupFeedbackTexts[group.group]?.['被忽略'];
    if (message) {
      feedbackHtml += `<div class="feedback-card">${message}</div>`;
    }
  });
  if (supportedGroups.length === 0) {
    return `<div class="feedback-card">在你的任內，似乎沒有推動任何具體的福利政策，所有族群都未得到特別的關注。</div>`;
  }
  return feedbackHtml;
}

// === 顯示結局函式 ===
function showEnding() {
  let resultKey = "";
  let sustainabilityLevel = "";

  if (totalSupport >= 120) {
    resultKey = "高票當選";
  } else if (totalSupport >= 110) {
    resultKey = "驚險連任";
  } else {
    resultKey = "敗選退場";
  }

  if (totalSustainability >= 20) {
    sustainabilityLevel = "高";
  } else if (totalSustainability >= 15) {
    sustainabilityLevel = "中";
  } else {
    sustainabilityLevel = "低";
  }

  const key = `${resultKey}_${sustainabilityLevel}`;
  const resultText = endings[key] || "⚠️ 找不到對應結局內容";

  const labelMap = {
    "高票當選_高": ["高票當選", "💯 完美執政 × 大獲全勝"],
    "高票當選_中": ["高票當選", "🏆 穩健施政 × 民意支持"],
    "高票當選_低": ["高票當選", "💣 表面風光 × 潛藏危機"],
    "驚險連任_高": ["驚險連任", "💡 堅持改革 × 艱困勝出"],
    "驚險連任_中": ["驚險連任", "🧾 中庸穩定 × 無驚無險"],
    "驚險連任_低": ["驚險連任", "🚨 操作民意 × 社會衝突"], 
    "敗選退場_高": ["敗選退場", "💎 雖敗猶榮 × 改革典範"],
    "敗選退場_中": ["敗選退場", "💬 平庸執政 × 無聲落幕"],
    "敗選退場_低": ["敗選退場", "📉 滿盤皆輸 × 民怨四起"] 
  };
  const [mainTitle, subTitle] = labelMap[key] || [resultKey, ""];

  // 優先判斷花費過少的特殊結局
  if (totalBudget > 299900000000) {
    const container = document.getElementById('round-container');
    container.classList.remove('policy-list');
    container.innerHTML = `
      <div class="ending-result">
        <h2 class="main-ending-title">${mainTitle}</h2>
        <p class="sub-ending-title">⏱️ 空轉國政 × 原地踏步</p>
        <p>你的整體政策花費過低，被外界質疑為紙上談兵，民眾對改革實施的決心感到遲疑。外界批評你在預算調度上顯得過於保守，導致多項施政無疾而終。原先寄望於改變的選民逐漸失去耐心，最終國家如同空轉的機器原地踏步，錯失改革的黃金時機，只留下模糊的承諾與失落的期待。</p>
        <div id="group-feedback" class="feedback-container">
          ${generateGroupFeedback(resultKey, true)}
        </div>
        <div class="ending-btn-group">
          <button class="ending-restart-btn" onclick="location.reload()">重新開始遊戲</button>
          <button class="ending-review-btn" onclick="window.reviewPolicies && window.reviewPolicies()">回顧你的政策</button>
        </div>
      </div>
    `;
    return;
  }

  const groupFeedbackHtml = generateGroupFeedback(resultKey);

  const container = document.getElementById('round-container');
  container.classList.remove('policy-list');
  container.innerHTML = `
    <div class="ending-result">
      <h2 class="main-ending-title">${mainTitle}</h2>
      <p class="sub-ending-title">${subTitle}</p>
      <p>${resultText}</p>
      <div id="group-feedback" class="feedback-container">
        ${groupFeedbackHtml}
      </div>
      <div class="ending-btn-group">
        <button class="ending-restart-btn" onclick="location.reload()">重新開始遊戲</button>
        <button class="ending-review-btn" onclick="window.reviewPolicies && window.reviewPolicies()">回顧你的政策</button>
      </div>
    </div>
  `;
  // 可在 window.reviewPolicies = function() { ... } 裡自訂回顧政策行為
}

window.reviewPolicies = function() {
  const container = document.getElementById('round-container');
  // 進入回顧前，暫存結局畫面 HTML
  window._endingHTML = container.innerHTML;
  container.classList.remove('policy-list');
  container.innerHTML = '';

  // 主標題
  const title = document.createElement('h2');
  title.textContent = '你選擇的政策卡';
  title.style.textAlign = 'center';
  title.style.margin = '24px 0 16px 0';
  container.appendChild(title);

  // 卡片區塊
  const cardList = document.createElement('div');
  cardList.style.display = 'flex';
  cardList.style.flexWrap = 'wrap';
  cardList.style.gap = '24px';
  cardList.style.justifyContent = 'center';
  cardList.style.marginBottom = '32px';

  // 依 roundRecords 顯示每回合三張卡，若 chosen 為 null 則全灰
  roundRecords.forEach(round => {
    round.cards.forEach(policyName => {
      const policy = allPolicies.find(p => p['政策名稱'] === policyName);
      if (!policy) return;
      const card = document.createElement('div');
      card.className = 'policy-card';
      card.style.width = '320px';
      if (!round.chosen || policy['政策名稱'] !== round.chosen) {
        card.classList.add('disabled');
        card.style.opacity = '0.5';
      }
      card.innerHTML = `
        <div class=\"policy-image\">${policy['政策名稱']}</div>
        <div class=\"policy-img-wrapper\"><img class=\"policy-img\" src=\"${policy['圖片']}\" alt=\"${policy['政策名稱']}圖片\"></div>
        <div class=\"policy-body\">
          <div class=\"policy-desc\">${policy['政策內容']}</div>
          <div class=\"policy-info\">
            <div>💰 預算：${policy['預算（億元）']} 億元</div>
            <div>🗳️ 支持度：<span class=\"vote-icon\">${'🗳️'.repeat(Math.round(policy['支持度'] / 3))}</span></div>
          </div>
        </div>
      `;
      cardList.appendChild(card);
    });
  });
  container.appendChild(cardList);

  // 按鈕區塊
  const btnGroup = document.createElement('div');
  btnGroup.className = 'ending-btn-group';
  btnGroup.style.textAlign = 'center';
  btnGroup.style.marginBottom = '32px';
  btnGroup.innerHTML = `
    <button class=\"ending-restart-btn\" onclick=\"location.reload()\">重新開始遊戲</button>
    <button class=\"ending-back-btn\" onclick=\"window.backToEnding && window.backToEnding()\">返回結局畫面</button>
  `;
  container.appendChild(btnGroup);
};

window.backToEnding = function() {
  const container = document.getElementById('round-container');
  if (window._endingHTML) {
    container.innerHTML = window._endingHTML;
  }
};

// 在重新開始遊戲時，清空 appearedPolicies 與 roundRecords
window.onload = function() {
  appearedPolicies = new Set();
  roundRecords = [];
  usedPolicies = [];
};
