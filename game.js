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
  低收入與無家者: 0,
  勞工: 0,
  資本家: 0
};
let usedPolicies = [];
let countdownInterval = null;

let roundCount = 0;
const MAX_ROUNDS = 10;
let totalBudget = 100000000000; // 初始預算為1000億元

function getRandomPolicies(count) {
  const unused = allPolicies.filter(p => !usedPolicies.includes(p['政策名稱']));
  const selected = [];
  while (selected.length < count && unused.length > 0) {
    const index = Math.floor(Math.random() * unused.length);
    selected.push(unused.splice(index, 1)[0]);
  }
  return selected;
}

function updateBudgetDisplay() {
  const display = document.getElementById('budget');
  display.textContent = `剩餘預算：${(totalBudget / 100000000).toFixed(0)} 億`;
}

function renderPolicies(policies) {
  const container = document.getElementById('round-container');
  container.innerHTML = '';

  policies.forEach(policy => {
    usedPolicies.push(policy['政策名稱']); // 標記已使用
    const card = document.createElement('div');
    card.className = 'policy-card';
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

    card.addEventListener('click', () => {
      const cost = Number(policy['預算（億元）']) * 100000000;
      if (cost <= totalBudget) {
        totalBudget -= cost;
        updateBudgetDisplay();
      
        // ⬇️ 累加支持度與永續指數
        totalSupport += Number(policy['支持度'] || 0);
        totalSustainability += Number(policy['永續指數'] || 0);
      
        // ⬇️ 累加各族群被照顧次數
        Object.keys(groupSupport).forEach(group => {
          groupSupport[group] += Number(policy[group] || 0);
        });
      
        startNewRound();
      } else {
        alert('預算不足，無法選擇此政策');
      }
    });

    container.appendChild(card);
  });
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
  if (roundCount >= MAX_ROUNDS) {
    clearInterval(countdownInterval);  // 停止倒數計時器
    document.getElementById('round-container').innerHTML = '<p style="text-align:center; font-size:1.2rem;">🎉 已達 10 回合，遊戲結束！</p>';
    document.getElementById('timer-bar').style.width = '0%';
    document.getElementById('timer-bar-container').style.display = 'none';
    showEnding();
    return;
  }

  const newPolicies = getRandomPolicies(3);
  if (newPolicies.length === 0) {
    document.getElementById('round-container').innerHTML = '<p style="text-align:center; font-size:1.2rem;">🎉 所有政策已展示完畢！</p>';
    document.getElementById('timer-bar').style.width = '0%';
    return;
  }

  roundCount++;
  renderPolicies(newPolicies);
  startCountdown(20);
}

fetch('policy-list.json')
  .then(res => res.json())
  .then(data => {
    allPolicies = data;
    updateBudgetDisplay();
    startNewRound();
  })
  .catch(err => console.error('載入政策資料錯誤', err));


// === 結局敘述對照表 ===
const endings = {
  "高票當選_高": `💯 在你所推動的一系列社會福利政策下，你以壓倒性高票當選，民意支持如海嘯般席捲全國。更難能可貴的是，你所推動的政策具備長遠眼光，為社會注入公平與韌性，帶來世代福祉與制度改革，被譽為現代治理典範。 你的政策著眼長遠發展，不僅推動經濟成長，更積極解決社會結構與環境問題，讓國力與族群融合穩步前進。`,
  "高票當選_中": `🏆 在你所推動的一系列社會福利政策下，你高票當選，選民對你給予厚望。雖然部分政策展現進步方向，但在環境與社會長遠挑戰上仍留有隱憂，外界期待你在下個任期能展現更全面的改革決心。 你兼顧當前與未來，雖仍有族群差距與社會挑戰未解，但整體國家發展方向穩定，社會對未來仍抱持希望。`,
  "高票當選_低": `📢 在你所推動的一系列社會福利政策下，你以壓倒性票數當選，獲得社會多數支持。然而為了達成高滿意度，政策著重於立即性補貼與擴張性福利，忽略財政可持續與社會結構性改革。雖然短期內民意高漲、政績輝煌，但公共財政壓力劇增，社會對資源分配的期待也不斷上升，未來的政策空間與國家發展彈性正逐步被壓縮。`,
  "驚險連任_高": `💡 在你所推動的一系列社會福利政策下，你在選戰中驚險連任，雖然過程跌宕起伏，但選民最終認可你致力於長期改革與公平正義，這場選舉成為台灣政治發展的一大轉捩點。 你的政策著眼長遠發展，不僅推動經濟成長，更積極解決社會結構與環境問題，讓國力與族群融合穩步前進。`,
  "驚險連任_中": `🧩 你以些微差距驚險連任，政策風格不偏激也不過於保守。在民意分歧與財政壓力下，你選擇中庸穩健的施政路線，雖有效維持社會秩序與基本照顧，但未能對長期挑戰提出更具前瞻的策略。或許是因為沒有更好的選擇，民眾多數願意再給你一次機會，但對你也未激起太多熱情與期待。`,
  "驚險連任_低": `🚨 你在選前大舉討好選民，成功以些微之差連任，卻也讓財政狀況亮起紅燈。短期內雖收穫掌聲，卻暴露出政策缺乏長期規劃。為討好特定族群而忽略整體國家韌性的結果，使社會更加分裂、族群矛盾加深，選後民怨與質疑聲浪不斷升高，也讓國家的未來，埋下了不安定的因素。`,
  "敗選退場_高": `💎 在你所推動的一系列社會福利政策下，雖然未能連任，但你的遠見與堅持卻深植人心。你所倡議的政策超越眼前選票，著眼於解決更深層的社會問題。你的敗選不僅是政治上的遺憾，更被許多人視為國家的損失。隨著時間推移，越來越多改革被後繼者延續，歷史終將還給你一個公道。`,
  "敗選退場_中": `💤 在你所推動的一系列社會福利政策下，你以些微差距落敗。任期內雖無重大失誤，卻也缺乏明確方向與代表性成果。你既沒有激起希望，也無法凝聚信任，最終讓選民在模糊與冷淡中轉身離去。你或許盡力了，但留下的印象淡薄，很快就被多數人遺忘在歷史的角落。`,
  "敗選退場_低": `📉 在你所推動的一系列社會福利政策下，你在下屆得到極低的支持率，以落選收場。任期內政策爭議不斷，過度討好選民卻忽略財政紀律，導致赤字飆升、經濟失衡，民怨四起。社會撕裂、族群對立、長期發展停滯不前，你的執政被視為國家走向衰退的轉捩點，也被後人譏為民主政治的慘痛教訓。`
};

// === 顯示結局函式 ===
function showEnding() {
  let resultTitle = "";
  let sustainabilityLevel = "";
  let resultText = "";

  if (totalSupport >= 100) {
    resultTitle = "高票當選";
  } else if (totalSupport >= 60) {
    resultTitle = "驚險連任";
  } else {
    resultTitle = "落選收場";
  }

  if (totalSustainability >= 80) {
    sustainabilityLevel = "高";
  } else if (totalSustainability >= 50) {
    sustainabilityLevel = "中";
  } else {
    sustainabilityLevel = "低";
  }

  const key = `${resultTitle}_${sustainabilityLevel}`;
  resultText = endings[key] || "⚠️ 找不到對應結局內容";

  const container = document.getElementById('round-container');
  container.classList.remove('policy-list');  // <-- 這一行是關鍵
  container.innerHTML = `
  <div class="ending-result">
    <h2>🏁 遊戲結束</h2>
    <strong>${resultTitle}</strong>
    <p>${resultText}</p>
    <button onclick="location.reload()">重新開始遊戲</button>
  </div>
`;
}
