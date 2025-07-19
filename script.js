fetch('policy-list.json')  // 確保這個檔案有放在同一資料夾
  .then(response => response.json())
  .then(data => {
    const policyList = document.getElementById('policy-list');
    data.forEach(policy => {
      const card = document.createElement('div');
      card.className = 'policy-card';

      card.innerHTML = `
      <div class="policy-image-title">${policy['政策名稱']}</div>
      <div class="policy-img-wrapper">
        <img src="${policy['圖片']}" alt="${policy['政策名稱']}" class="policy-img">
      </div>
      <div class="policy-body">
        <div class="policy-desc">${policy['政策內容']}</div>
        <div class="policy-info">
          <div>💰 預算：${policy['預算（億元）']} 億元</div>
          <div>🗳️ 支持度：<span class="vote-icon">${'🗳️'.repeat(Math.round(policy['支持度'] / 3))}</span></div>
        </div>
      </div>
    `;
    
      policyList.appendChild(card);
    });
  })
  .catch(err => {
    console.error('無法載入政策資料:', err);
  });