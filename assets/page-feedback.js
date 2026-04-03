// ═════════════════════════════════════════════════════════════
//  FEEDBACK PAGE - REVIEW FORM & DISPLAY
// ═════════════════════════════════════════════════════════════

// ── Render all reviews ───────────────────────────────────────
function renderReviews() {
  const section = document.getElementById('reviewsSection');
  const grid = document.getElementById('reviewsGrid');
  const tabs = document.getElementById('reviewsTabs');
  
  if (!reviews.length) { 
    section.style.display = 'none'; 
    return; 
  }
  
  section.style.display = 'block';
  if (!activeFilter) activeFilter = 'all';

  tabs.innerHTML = [{ label:'All Reviews', value:'all' }, ...ITEMS.map(i => ({ label:i.name, value:String(i.id) }))].map(t =>
    `<button class="tab-btn ${activeFilter===t.value?'active':''}" onclick="setFilter('${t.value}')">${t.label}</button>`
  ).join('');

  const shown = activeFilter === 'all' ? reviews : reviews.filter(r => r.itemId === parseInt(activeFilter));
  
  grid.innerHTML = shown.slice(0, 50).map(r => `
    <div class="review-card">
      <div class="r-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
      <div class="r-comment">"${r.comment}"</div>
      <div class="r-meta">
        <div class="r-avatar-sm">${r.avatar ? `<img src="${r.avatar}" alt="">` : r.name.charAt(0)}</div>
        <div class="r-reviewer">
          <strong>${r.name}</strong>
          <span>${r.date}</span>
        </div>
        <div class="r-item-tag">${r.item}</div>
      </div>
    </div>
  `).join('');
}

function setFilter(val) { 
  if (!val) val = 'all';
  activeFilter = val; 
  renderReviews(); 
}

// ── Setup form banner with product info ──────────────────────
function setupProductBanner() {
  if (!selectedItem) return;
  
  const stats = getStats(selectedItem.id);
  const avgTxt = stats
    ? `${starsHtml(Math.round(stats.avg))} ${stats.avg.toFixed(1)} · ${stats.count} review${stats.count!==1?'s':''}`
    : 'No reviews yet';

  document.getElementById('previewBanner').innerHTML = `
    ${selectedItem.image
      ? `<img src="${selectedItem.image}" alt="${selectedItem.name}">`
      : `<div class="prev-ph">${selectedItem.emoji||'📦'}</div>`}
    <div class="prev-text">
      <strong>${selectedItem.name}</strong>
      <span style="display:flex;align-items:center;gap:5px;">${avgTxt}</span>
    </div>`;
}

// ── Submit review to Google Sheets ──────────────────────────
async function submitReview(e) {
  e.preventDefault();
  
  const name = document.getElementById('reviewerName').value.trim() || 'Anonymous';
  const email = document.getElementById('reviewerEmail').value.trim();
  const comment = document.getElementById('reviewComment').value.trim();
  const ratEl = document.querySelector('input[name="rating"]:checked');
  const rating = ratEl ? parseInt(ratEl.value) : 0;

  if (!selectedItem) return alert('Please select a product first.');
  if (!rating) return alert('Please choose a star rating.');
  if (!comment) return alert('Please write a comment.');

  const btn = document.getElementById('submitBtn');
  btn.textContent = 'Saving to Google Sheets…';
  btn.disabled = true;
  setApiStatus('loading', 'Saving your review…');

  const review = {
    itemId: selectedItem.id, 
    item: selectedItem.name,
    name, email, comment, rating,
    provider: socialUser?.provider || '',
    avatar: socialUser?.avatar || '',
    googleId: socialUser?.googleId || ''
  };

  try {
    // Save to localStorage first
    const stored = JSON.parse(localStorage.getItem('feedbackReviews') || '[]');
    const reviewData = {
      ...review,
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
    };
    stored.unshift(reviewData);
    localStorage.setItem('feedbackReviews', JSON.stringify(stored));
    
    // Try to post to Apps Script
    await postReviewToScript(review);

    // Optimistically add to local array so UI updates instantly
    reviews.unshift(reviewData);

    setApiStatus('ok', '✓ Saved successfully');
    document.getElementById('feedbackForm').style.display = 'none';
    document.getElementById('successMsg').style.display = 'block';
    document.getElementById('successMsg').querySelector('p').textContent = 'Your feedback has been saved successfully.';
    document.getElementById('successMsg').scrollIntoView({ behavior:'smooth', block:'start' });
    renderReviews();

  } catch (err) {
    // Always succeed since we save to localStorage
    setApiStatus('ok', '✓ Saved locally');
    document.getElementById('feedbackForm').style.display = 'none';
    document.getElementById('successMsg').style.display = 'block';
    document.getElementById('successMsg').querySelector('p').textContent = 'Your feedback has been saved.';
    console.warn('Error saving review:', err);
  }
}

function resetForm() {
  selectedItem = null;
  document.getElementById('reviewForm').reset();
  document.getElementById('ratingCaption').textContent = '';
  document.getElementById('pickerHint').style.display = '';
  document.getElementById('feedbackForm').style.display = 'block';
  document.getElementById('successMsg').style.display = 'none';
  document.getElementById('submitBtn').textContent = 'Submit Review →';
  document.getElementById('submitBtn').disabled = false;
  disconnectSocial();
  window.scrollTo({ top:0, behavior:'smooth' });
}

// ── Initialize Feedback Page ────────────────────────────────
async function initFeedbackPage() {
  try {
    reviews = await fetchReviews();
    setApiStatus('ok', `✓ Loaded ${reviews.length} review${reviews.length!==1?'s':''}`);
  } catch (err) {
    setApiStatus('err', '✗ Could not load reviews: ' + err.message);
    console.error(err);
    reviews = [];
  }

  // Get product from URL or sessionStorage
  const productId = getProductFromUrl();
  selectedItem = ITEMS.find(i => i.id === productId);
  
  if (selectedItem) {
    setupProductBanner();
  }

  renderReviews();

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

// Star rating event listeners
document.addEventListener('DOMContentLoaded', () => {
  initFeedbackPage();
  
  document.querySelectorAll('input[name="rating"]').forEach(r =>
    r.addEventListener('change', () => {
      document.getElementById('ratingCaption').textContent = CAPTIONS[r.value];
      document.getElementById('pickerHint').style.display = 'none';
    })
  );
});
