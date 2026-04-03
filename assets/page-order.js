// ═════════════════════════════════════════════════════════════
//  ORDER PAGE - CHECKOUT & PAYMENT
// ═════════════════════════════════════════════════════════════

// ── Render cart summary ──────────────────────────────────────
function renderCartSummary() {
  if (!selectedItem) return;
  
  const container = document.getElementById('cartItemsContainer');
  const subtotal = selectedItem.price;
  const total = subtotal + DELIVERY_CHARGE;
  
  container.innerHTML = `
    <div class="cart-item">
      <div class="item-detail">
        <strong>${selectedItem.name}</strong>
        <span>Qty: 1 × ₹${selectedItem.price}</span>
      </div>
      <div class="item-price">₹${selectedItem.price}</div>
    </div>
  `;
  
  document.getElementById('subtotal').textContent = `₹${subtotal}`;
  document.getElementById('deliveryCharge').textContent = `₹${DELIVERY_CHARGE}`;
  document.getElementById('totalAmount').textContent = `₹${total}`;
  document.getElementById('payAmount').textContent = total;
}

// ── Initiate Payment ─────────────────────────────────────────
async function initiatePayment(e) {
  e.preventDefault();
  
  if (!selectedItem) return alert('Please select a product first.');
  
  const name = document.getElementById('deliveryName').value.trim();
  const mobile = document.getElementById('deliveryMobile').value.trim();
  const email = document.getElementById('deliveryEmail').value.trim();
  const address = document.getElementById('deliveryAddress').value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  
  if (!name || !mobile || !email || !address) {
    return alert('Please fill all required fields.');
  }
  
  if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
    return alert('Please enter a valid 10-digit mobile number.');
  }
  
  const subtotal = selectedItem.price;
  const total = subtotal + DELIVERY_CHARGE;
  
  // If COD selected, skip Razorpay and proceed directly
  if (paymentMethod === 'cod') {
    await saveOrderAndReview(name, mobile, email, address, 'Cash on Delivery');
    return;
  }
  
  // Razorpay payment for online methods
  if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID === 'rzp_live_xxxxx') {
    alert('Payment gateway not configured. Please contact the administrator.\n\nFor testing, you can use "Cash on Delivery" option.');
    return;
  }
  
  const payBtn = document.getElementById('payBtn');
  payBtn.disabled = true;
  const originalText = payBtn.textContent;
  payBtn.textContent = 'Processing Payment...';
  
  try {
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: total * 100, // amount in paise
      currency: "INR",
      name: "Maharashtrian Masalas",
      description: `Order for ${selectedItem.name}`,
      image: selectedItem.image || '',
      prefill: {
        name: name,
        email: email,
        contact: '+91' + mobile
      },
      notes: {
        product_id: selectedItem.id,
        delivery_address: address
      },
      handler: async function(response) {
        // Payment successful callback
        console.log('Payment successful:', response);
        await saveOrderAndReview(name, mobile, email, address, 'Razorpay', response.razorpay_payment_id);
      },
      modal: {
        ondismiss: function() {
          console.log('Payment cancelled by user');
          payBtn.disabled = false;
          payBtn.textContent = originalText;
        }
      },
      theme: {
        color: '#c4622d'
      }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error('Razorpay error:', err);
    payBtn.disabled = false;
    payBtn.textContent = originalText;
    alert('Payment gateway error. Please try again or use Cash on Delivery.');
  }
}

// ── Save Order ───────────────────────────────────────────────
async function saveOrderAndReview(name, mobile, email, address, paymentMethod, paymentId = '') {
  if (!selectedItem) return;
  
  try {
    // Save order details
    const orderData = {
      id: 'ORD-' + Date.now(),
      productId: selectedItem.id,
      productName: selectedItem.name,
      price: selectedItem.price,
      deliveryCharge: DELIVERY_CHARGE,
      totalAmount: selectedItem.price + DELIVERY_CHARGE,
      customerName: name,
      customerMobile: mobile,
      customerEmail: email,
      deliveryAddress: address,
      paymentMethod: paymentMethod,
      paymentId: paymentId,
      status: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      orderDate: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    // Save to localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.unshift(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Show order success
    showOrderSuccess(orderData);
    
  } catch (err) {
    console.error('Error saving order:', err);
    alert('Error processing order. Please try again.');
  }
}

// ── Show Order Success ───────────────────────────────────────
function showOrderSuccess(orderData) {
  const orderSection = document.getElementById('orderSection');
  orderSection.style.display = 'none';
  
  const successDiv = document.getElementById('orderSuccess');
  document.getElementById('orderId').textContent = orderData.id;
  document.getElementById('orderSuccessMsg').innerHTML = `
    Order ID: <strong>${orderData.id}</strong><br>
    A confirmation email has been sent to <strong>${orderData.customerEmail}</strong>
  `;
  
  successDiv.style.display = 'block';
  successDiv.scrollIntoView({ behavior:'smooth', block:'start' });
}

// ── Initialize Order Page ────────────────────────────────────
function initOrderPage() {
  // Get product from URL or sessionStorage
  const productId = getProductFromUrl();
  selectedItem = ITEMS.find(i => i.id === productId);
  
  if (!selectedItem) {
    alert('No product selected. Redirecting to products page.');
    goToIndex();
    return;
  }

  // Render cart and summary
  renderCartSummary();
  
  // Clear form fields
  document.getElementById('deliveryName').value = '';
  document.getElementById('deliveryEmail').value = '';
  document.getElementById('deliveryMobile').value = '';
  document.getElementById('deliveryAddress').value = '';
  
  setApiStatus('ok', '✓ Ready to checkout');
}

// Run on page load
document.addEventListener('DOMContentLoaded', initOrderPage);
