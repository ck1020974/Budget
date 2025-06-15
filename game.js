let allPolicies = [];
let usedPolicies = [];
let countdownInterval = null;

let roundCount = 0;
const MAX_ROUNDS = 10;

function getRandomPolicies(count) {
  const unused = allPolicies.filter(p => !usedPolicies.includes(p['政策名稱']));
  const selected = [];
  while (selected.length < count && unused.length > 0) {
    const index = Math.floor(Math.random() * unused.length);
    selected.push(unused.splice(index, 1)[0]);
  }
  return selected;
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
    container.appendChild(card);
  });
}

function startCountdown(durationSeconds) {
  const bar = document.getElementById('timer-bar');
  let remaining = durationSeconds;
  const total = durationSeconds;

  if (countdownInterval) clearInterval(countdownInterval);

  // 立即先將寬度與顏色重設為滿格，但不啟動動畫
  bar.style.transition = 'none';  // 移除動畫效果
  bar.style.width = '100%';
  bar.style.backgroundColor = '#3498db';

  // 強制觸發一次重新繪製（不讓 transition 被跳過）
  void bar.offsetWidth;

  // 再開啟動畫，並從 100% 開始倒數
  bar.style.transition = 'width 1s linear, background-color 0.5s ease';

  countdownInterval = setInterval(() => {
    remaining--;
    const percentage = (remaining / total) * 100;
    bar.style.width = percentage + '%';

    if (remaining <= 5) {
      bar.style.backgroundColor = '#e74c3c'; // 紅色警示
    }

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      startNewRound(); // 下一回合
    }
  }, 1000);
}


function startNewRound() {
  if (roundCount >= MAX_ROUNDS) {
    document.getElementById('round-container').innerHTML = '<p style="text-align:center; font-size:1.2rem;">🎉 已達 10 回合，遊戲結束！</p>';
    document.getElementById('timer-bar').style.width = '0%';
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
    startNewRound(); // 啟動第一回合
  })
  .catch(err => console.error('載入政策資料錯誤', err));

  let totalBudget = 1000000000; // 初始預算為 1,000,000,000 元

function updateBudgetDisplay() {
  const display = document.getElementById('budget-display');
  display.textContent = `💰 剩餘預算：${totalBudget.toLocaleString()} 元`;
}
  