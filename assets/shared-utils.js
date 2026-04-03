// ═══════════════════════════════════════════════════════════════
//  SHARED CONFIGURATION & STORAGE OPTIONS
// ═══════════════════════════════════════════════════════════════
const APPS_SCRIPT_BASE = 'https://script.google.com/macros/s/AKfycbw6GWFTk-eNtAvVAUKwURcOYTm_A7YvktZZ1a-8rfU3F6bpa-6QJElHu35jRg3oIEnQlg/exec';
const APPS_SCRIPT_URL = APPS_SCRIPT_BASE;
const RAZORPAY_KEY_ID = 'rzp_live_xxxxx'; // Replace with actual Razorpay Key ID
const DELIVERY_CHARGE = 50;
const GOOGLE_CLIENT_ID = '382545828398-qlrjg8pqubj7a576l19ggin17djqh8e8.apps.googleusercontent.com';

// ── Products Database ───────────────────────────────────────────
const ITEMS = [
  {
    id: 1,
    name: "Goda Masala",
    description: "Maharashtrian Goda Masala, used to make vegetable, dal, Masala Rice.",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjdCzXlD6FL_k2L3VhzOOeHAkbM_xNoUbXsEv5oA08F_8GbbDivvhg7_SsvBNyHERZSkgvx9r2l58bxEcjh2wmuMCnYiGDAeRqL-HwN-LVNwxFtSIA3-lxQ70rT3gMptktAQB1P9sSSmNBYuBcrxykre0S3kqcPDkImHv1AeXt1HGbM4bzwASFXNggJOVk/s1280/GodaMasala_MyLeki.jpeg",
    emoji: "🍛",
    price: 120,
    quantity: 1
  },
  {
    id: 2,
    name: "Kanda Lasun Masala",
    description: "Kanda Lasun Masala (Onion Garlic with Chilli powder) brings extra spice to dishes like Misal",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi-MIhBJHbg_355E3-_e7V0fTx6vHAzW1THvdaY22dbqZEVJSdY2Rs_ZF3WK8woGMmqw6PXrxmA_2V1AuyxWXO9yC2JnkmQGYkOHY9a2N8-Rv1FXTV41DdFuDNpMDwCuoyyh4h6nppVTZpisUEnJcI_O4mhiKSV9YJIqJ8zEesweeyr9U3cKfz7zD0GUmc/s1600/WhatsApp%20Image%202026-02-18%20at%205.57.34%20PM.jpeg",
    emoji: "🌶️",
    price: 80,
    quantity: 1
  },
  {
    id: 3,
    name: "Tea Masala",
    description: "Tea masala gives immunity boost",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7Z6PI_0-eyKVYYzm2q7PO3srPmsYkdXYub_cqMkKumW11Vyb4xSPBzUisW3HnQ6uQPpGKlICUrenlIXQyQZFOlPYJj7at_8MtIgcdFuVSSHEzbE9JyC8pUDW0_L23K5s49RlBrrrSvHv49TqmbuF1IoyQq1ttnvS24jRLDvqo26SczuCpN48Ua_OHQXw/s1600/WhatsApp%20Image%202026-02-18%20at%205.57.35%20PM.jpeg",
    emoji: "🍵",
    price: 100,
    quantity: 1
  },
  {
    id: 4,
    name: "Garam Masala",
    description: "Garam masala to make tasty dishes like Paneer tikka masala",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiYs3GypDu4bGzIo_bPGAx_dbDwOoSChKBpppvyo9TyYn_vYN7xI2iGJE7-0f2o8H-FFLvchFwV3V5XBtId9JJ-S0dEfbBJ2lY1XDIfpKe9Z_AO0KtwT6_IjuSLQa2sM5EKM6tvztUWa_9LwWWd1DKXXoaDE4GfJFBOOMdLqrO5YkZQSOKa9s5fxtOprwM/s320/Dhania.jpeg",
    emoji: "🌶️",
    price: 60,
    quantity: 1
  },
  {
    id: 5,
    name: "Turmeric",
    description: "Turmeric powder from Sangli Maharashtra",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjCqGDLflhSMFW1p7fY4S0sWF3iAyx02sNHLEKOywhtqtbV79ww3zKQVr6kFQJRAVfA4U4p4TUoc5HJCesYAM98O3_9MDaMABl1KtW_Ef0ck3bO4IcIoKGkNrxFm4O2ZDhnJiKcX7-ZXuiBU0DRZZjOkEor9wGYTE3Omrl0lboosH0ZDgB14UXgI93iBgA/s320/Turmeric.jpeg",
    emoji: "🌶️",
    price: 50,
    quantity: 1
  },
  {
    id: 6,
    name: "Coriander Powder",
    description: "Coriander powder",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh8YNSOdbjW9fDirwmrBIKKuSYRiRcaS8LEKdy_LeHqwTQg-ZdLBwjWyKolMmBK2rOW53mhKmi_159XyTKIc9apxpG_X68yH5qrBfbNrc-FPBp18ssikNtgRiCURC4GEsc0yJ_0N-MrgOLzAFGrnWiIPXn4s7JTuDm1vD9ODPCd641SoM9YIpmSUjhGbuI/s320/DhaniaPowder.jpeg",
    emoji: "🌶️",
    price: 36,
    quantity: 1
  },
  {
    id: 7,
    name: "Amla Slice",
    description: "Amla slice/Grated Amla Sweet and Sour",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhKer4PX5wEHYEI1dZBE8SocseQ31sN2LA_IhWeoQKjQoFzGRQz4w7BVcfk8jIo_Zz_IXfOxzkhChp_ImDu0PQGlL16hCNEvWG08WiuOg9bSd81prYXFhaiN3esA0rFusbllztfD4Q7vF1c-yP5vCdUTnDFFbqhsAXHUZPqaPtp_c3V8B3BREBpefUOZFc/s320/AmlaSlice.jpeg",
    emoji: "🍵",
    price: 50,
    quantity: 1
  },
  {
    id: 8,
    name: "Wheat Vermicelli",
    description: "Vermicelli to make your favourite Semia upma, kheer",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiQwF1eOg7FsxoIKWpVWZ1REYloDHNZmFLkrEcrj3muJc2U_vHEng8j9kjbJ4nVZZKAIYzvVW_LRrSFcu0KfZz2Kc-fbcWk6ejgvN16f_yrpkUGGpnnbNOjlIeP1spsu9gucGuOsYppaBR2GB_mJ3qzQHuTv-VszZijCO04zx6QIMU2h0cU5jfKsvUg8Ak/s320/WheatVermicelli.jpeg",
    emoji: "🍵",
    price: 150,
    quantity: 1
  }
];

const CAPTIONS = ['','Terrible 😞','Poor 😕','Average 😐','Good 😊','Excellent 🤩'];

// ── Global State ────────────────────────────────────────────
let selectedItem = null;
let socialUser = null;
let activeFilter = 'all';
let reviews = [];
let apiOk = false;

// ── Persistence (localStorage + optional Apps Script) ─────────
async function fetchReviews() {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('YOUR_APPS')) {
    return JSON.parse(localStorage.getItem('feedbackReviews') || '[]');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 100000);
  try {
    const resp = await fetch(APPS_SCRIPT_URL, { 
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    if (resp.status === 200) {
      try {
        const text = await resp.text();
        const data = text ? JSON.parse(text) : JSON.parse(localStorage.getItem('feedbackReviews') || '[]');
        console.log('Fetched reviews from Apps Script:', data);
        
        const reviewsArray = Array.isArray(data.reviews) ? data.reviews : [];
        
        return reviewsArray.map(r => ({
          itemId: r.itemId,
          item: r.item,
          name: r.name || 'Anonymous',
          email: r.email || '',
          comment: r.comment || '',
          rating: parseInt(r.rating) || 0,
          provider: r.provider || '',
          avatar: r.avatar || '',
          date: new Date(r.timestamp).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
        }));
      } catch (e) {
        console.warn('Could not parse remote reviews:', e);
        return JSON.parse(localStorage.getItem('feedbackReviews') || '[]');
      }
    } else {
      console.warn('Apps Script returned status:', resp.status, 'falling back to localStorage');
      return JSON.parse(localStorage.getItem('feedbackReviews') || '[]');
    }
  } catch (err) {
    console.error('fetchReviews error:', err);
    return JSON.parse(localStorage.getItem('feedbackReviews') || '[]');
  } finally {
    clearTimeout(timeout);
  }
}

async function postReviewToScript(review) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('YOUR_APPS')) {
    return { success: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const resp = await fetch(APPS_SCRIPT_URL, {
      signal: controller.signal,
      redirect: "follow",
      method: "POST",      
      mode: 'no-cors',
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(review)
    });
    return { success: true };
  } catch (err) {
    console.warn('Could not save to Apps Script:', err);
    return { success: false, error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Helpers ─────────────────────────────────────────────────
function setApiStatus(state, msg) {
  const el = document.getElementById('apiStatus');
  if (!el) return;
  el.className = `api-status ${state}`;
  const dotClass = state === 'ok' ? 'dot-ok' : state === 'err' ? 'dot-err' : 'dot-loading';
  el.innerHTML = `<span class="dot ${dotClass}"></span>${msg}`;
}

function getStats(itemId) {
  const rs = reviews.filter(r => r.itemId === itemId);
  if (!rs.length) return null;
  const avg = rs.reduce((s, r) => s + r.rating, 0) / rs.length;
  const dist = [0,0,0,0,0];
  rs.forEach(r => dist[r.rating - 1]++);
  return { avg, count: rs.length, dist };
}

function starsHtml(avg) {
  let h = '<div class="card-stars">';
  for (let i = 1; i <= 5; i++) h += `<span class="${avg >= i ? 'sf' : 'se'}">★</span>`;
  return h + '</div>';
}

// ── Social login ────────────────────────────────────────────
function loginWith(provider) {
  const demos = {
    google:   { name:'Demo Google User',   email:'demo@gmail.com',   handle:'demo@gmail.com',    avatar:'https://ui-avatars.com/api/?name=Demo+User&background=4285F4&color=fff&size=80',    provider:'Google' },
    facebook: { name:'Demo Facebook User', email:'demo@fb.com',      handle:'facebook.com/demo', avatar:'https://ui-avatars.com/api/?name=Facebook+User&background=1877F2&color=fff&size=80', provider:'Facebook' },
    twitter:  { name:'Demo Twitter User',  email:'',                 handle:'@demo_user',         avatar:'https://ui-avatars.com/api/?name=Twitter+User&background=000000&color=fff&size=80',  provider:'X/Twitter' }
  };
  if (provider === 'google' && GOOGLE_CLIENT_ID) { google.accounts.id.prompt(); }
  else setSocialUser(demos[provider]);
}

function setSocialUser(user) {
  socialUser = user;
  document.getElementById('socialBtns').style.display = 'none';
  document.getElementById('connectedBadge').style.display = 'flex';
  document.getElementById('socialAvatar').src = user.avatar;
  document.getElementById('socialName').textContent = user.name + ' · via ' + user.provider;
  document.getElementById('socialHandle').textContent = user.handle;
  if (!document.getElementById('reviewerName').value) document.getElementById('reviewerName').value = user.name;
  if (!document.getElementById('reviewerEmail').value) document.getElementById('reviewerEmail').value = user.email||'';
}

function disconnectSocial() {
  socialUser = null;
  document.getElementById('connectedBadge').style.display = 'none';
  document.getElementById('socialBtns').style.display = 'flex';
}

// ── Star rating helpers ─────────────────────────────────────
function hoverStar(n) {
  document.getElementById('pickerHint').style.display = 'none';
  document.getElementById('ratingCaption').textContent = CAPTIONS[n];
}

function unhoverStar() {
  const checked = document.querySelector('input[name="rating"]:checked');
  document.getElementById('ratingCaption').textContent = checked ? CAPTIONS[checked.value] : '';
  document.getElementById('pickerHint').style.display = checked ? 'none' : '';
}

// ── Navigation helpers ───────────────────────────────────────
function getProductFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const productId = parseInt(params.get('product'));
  return productId && ITEMS.find(i => i.id === productId) ? productId : 1;
}

function goToIndex() {
  window.location.href = 'index.html';
}

function goToFeedback(productId) {
  sessionStorage.setItem('selectedProductId', productId);
  window.location.href = 'feedback.html?product=' + productId;
}

function goToOrder(productId) {
  sessionStorage.setItem('selectedProductId', productId);
  window.location.href = 'order.html?product=' + productId;
}
