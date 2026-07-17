// ═════════════════════════════════════════════════════════════
//  MAIN PAGE - PRODUCT LISTING
// ═════════════════════════════════════════════════════════════

// ── Render item cards ────────────────────────────────────────
function renderItems() {
  const grid = document.getElementById('itemsGrid');
  grid.innerHTML = ITEMS.map(item => {
    const stats = getStats(item.id);
    const latest = reviews.find(r => r.itemId === item.id);

    let ratingBlock = '';
    if (stats) {
      ratingBlock = `
        <div class="card-rating-row">
          ${starsHtml(Math.round(stats.avg))}
          <span class="card-avg">${stats.avg.toFixed(1)}</span>
          <span class="card-count">(${stats.count} review${stats.count !== 1 ? 's' : ''})</span>
        </div>
        <div class="rating-bars">
          ${[5,4,3,2,1].map(n => {
            const pct = stats.count ? Math.round((stats.dist[n-1]/stats.count)*100) : 0;
            return `<div class="rating-bar-row">
              <span class="rbl">${n}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
              <span class="bar-n">${stats.dist[n-1]}</span>
            </div>`;
          }).join('')}
        </div>`;
    } else {
      ratingBlock = `<p class="no-reviews-tag">No reviews yet — be first!</p>`;
    }

    const snip = latest
      ? `<div class="card-comment-snip">"${latest.comment.length > 90 ? latest.comment.slice(0,90)+'…' : latest.comment}"<span class="snip-by">— ${latest.name}</span></div>`
      : '';

    return `
      <div class="item-card" id="card-${item.id}">
        <div class="item-img-wrap">
          ${item.image
            ? `<img src="${item.image}" alt="${item.name}" onerror="this.parentElement.innerHTML='<div class=\\"item-img-placeholder\\"><span class=\\"icon\\">${item.emoji||'📦'}</span></div>`
            : `<div class="item-img-placeholder"><span class="icon">${item.emoji||'📦'}</span></div>`}
        </div>
        <div class="item-body">
          <div class="item-name">${item.name}</div>
          <div class="item-desc">${item.description||''}</div>
          ${ratingBlock}
          ${snip}
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: auto;">
            <button class="btn-card-action" onclick="goToFeedback(${item.id})" style="background: var(--accent); color: white;">★ Review</button>
            <button class="btn-card-action" onclick="goToOrder(${item.id})">🛒 Order</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Initialize ───────────────────────────────────────────────
function initMainPage() {
  // Render immediately from cached reviews so the page never waits on the network
  reviews = JSON.parse(localStorage.getItem('feedbackReviews') || '[]');
  document.getElementById('itemsGrid').innerHTML = '';
  renderItems();

  // Fetch the latest reviews in the background and refresh the grid once they arrive
  setApiStatus('loading', 'Loading reviews…');
  fetchReviews()
    .then(fetched => {
      reviews = fetched;
      setApiStatus('ok', `✓ Loaded ${reviews.length} review${reviews.length!==1?'s':''}`);
      renderItems();
    })
    .catch(err => {
      setApiStatus('err', '✗ Could not load reviews: ' + err.message);
      console.error(err);
    });

  // Optional: Load Google OAuth
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== '') {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = () => google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: resp => {
        const p = JSON.parse(atob(resp.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
        setSocialUser({ name:p.name, email:p.email, handle:p.email, avatar:p.picture, provider:'Google', googleId: p.sub });
      }
    });
    document.head.appendChild(s);
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', initMainPage);
