// ============================================================
// VANTRA — interactions
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Navbar shrink + drawer toggle ---------- */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const drawer = document.getElementById('navDrawer');

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  // close drawer when a link inside it is tapped
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- 2. Scroll-reveal for .reveal elements ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => io.observe(el));
  } else {
    // fallback: just show everything
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- 3. Animated stat counters ---------- */
  const counters = document.querySelectorAll('.stat-num');

  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(eased * target);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window && counters.length) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach(el => counterIO.observe(el));
  } else {
    counters.forEach(el => { el.textContent = el.dataset.count; });
  }

  /* ---------- 4. Smooth-close drawer on resize past tablet breakpoint ---------- */
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      drawer.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  /* ============================================================
     5. PRODUCT CATALOGUE + CART + RAZORPAY CHECKOUT
     ============================================================ */

  // ---- 5a. Replace with your own Razorpay TEST Key ID. ----
  // This must be the public "Key ID" (starts with rzp_test_...), never the
  // Key Secret — the secret should only ever live on a server, never here.
  const RAZORPAY_KEY_ID = 'rzp_test_REPLACE_WITH_YOUR_KEY_ID';

  // ---- 5b. Product catalogue (mirrors products.sql — see server-example.js
  // for the live SQL-backed /api/search endpoint this falls back from).
  // Prices are in rupees; converted to paise only at checkout time.
  const PRODUCTS = [
    { id: 'mob-01a', name: 'Lumen X12 5G', cat: 'Mobiles', variant: '128GB · Graphite', icon: '📱', spec: '5000mAh · 5G', price: 24999 },
    { id: 'mob-01b', name: 'Lumen X12 5G', cat: 'Mobiles', variant: '256GB · Ocean Blue', icon: '📱', spec: '5000mAh · 5G', price: 27999 },
    { id: 'mob-02a', name: 'Aria Lite 5G', cat: 'Mobiles', variant: '64GB · Black', icon: '📱', spec: '4500mAh · 5G', price: 14499 },
    { id: 'mob-02b', name: 'Aria Lite 5G', cat: 'Mobiles', variant: '128GB · Silver', icon: '📱', spec: '4500mAh · 5G', price: 16499 },
    { id: 'lap-01a', name: 'Forge 14 Ultrabook', cat: 'Laptops', variant: '16GB / 512GB · Space Grey', icon: '💻', spec: 'Intel i5', price: 54990 },
    { id: 'lap-01b', name: 'Forge 14 Ultrabook', cat: 'Laptops', variant: '16GB / 1TB · Silver', icon: '💻', spec: 'Intel i5', price: 59990 },
    { id: 'lap-02',  name: 'Workbench Pro 16',   cat: 'Laptops', variant: '32GB / 1TB · Black', icon: '💻', spec: 'Intel i7', price: 89990 },
    { id: 'tv-01a',  name: 'Vantra 55" 4K Smart TV', cat: 'TV & Audio', variant: '55-inch', icon: '📺', spec: '4K HDR · WebOS', price: 42990 },
    { id: 'tv-01b',  name: 'Vantra 65" 4K Smart TV', cat: 'TV & Audio', variant: '65-inch', icon: '📺', spec: '4K HDR · WebOS', price: 58990 },
    { id: 'tv-02',   name: 'Pulse Soundbar 2.1',     cat: 'TV & Audio', variant: '2.1 Channel · Black', icon: '🔊', spec: '120W · Bluetooth', price: 6499 },
    { id: 'app-01a', name: 'ChillCore Fridge', cat: 'Appliances', variant: '260L · Silver', icon: '🧊', spec: 'Frost-free · 3 Star', price: 28990 },
    { id: 'app-01b', name: 'ChillCore Fridge', cat: 'Appliances', variant: '340L · Black Steel', icon: '🧊', spec: 'Frost-free · 4 Star', price: 34990 },
    { id: 'app-02',  name: 'SpinWash Washer',  cat: 'Appliances', variant: '7kg · White', icon: '🌀', spec: 'Front-load · Inverter', price: 19990 },
    { id: 'app-03a', name: 'AeroCool Tower Fan', cat: 'Appliances', variant: 'Standard · White', icon: '🌬', spec: 'Remote · 3 Speeds', price: 3499 },
    { id: 'app-03b', name: 'AeroCool Tower Fan', cat: 'Appliances', variant: 'Smart Wi-Fi · Black', icon: '🌬', spec: 'App Control', price: 4999 },
    { id: 'mob-03a', name: 'NovaCam Pro', cat: 'Mobiles', variant: '256GB · Midnight', icon: '📱', spec: '108MP · 5G · 4800mAh', price: 34999 },
    { id: 'mob-03b', name: 'NovaCam Pro', cat: 'Mobiles', variant: '512GB · Pearl White', icon: '📱', spec: '108MP · 5G · 4800mAh', price: 39999 },
    { id: 'lap-03',  name: 'SlimAir 13', cat: 'Laptops', variant: '8GB / 256GB · Silver', icon: '💻', spec: 'M-series · 18hr battery', price: 79990 },
    { id: 'tv-03',   name: 'BassCore 5.1 Surround', cat: 'TV & Audio', variant: '5.1 Channel · Black', icon: '🔊', spec: '300W · Dolby Atmos', price: 14999 },
    { id: 'app-04',  name: 'BrewMaster Coffee Maker', cat: 'Appliances', variant: '1.2L · Matte Black', icon: '☕', spec: 'Drip & Espresso · Timer', price: 8999 },
  ];

  // Shared id -> product lookup. Search results (whether from the SQL API
  // or the client-side fallback) get merged into this so cart rendering
  // always has a single source of truth, regardless of where a product
  // was added from (catalogue grid vs. search panel).
  const PRODUCT_INDEX = {};
  PRODUCTS.forEach(p => { PRODUCT_INDEX[p.id] = p; });

  const rupee = (n) => '₹' + n.toLocaleString('en-IN');

  // ---- 5c. Cart state, persisted in localStorage so it survives reloads ----
  let cart = JSON.parse(localStorage.getItem('vantra_cart') || '{}'); // { productId: qty }

  const saveCart = () => localStorage.setItem('vantra_cart', JSON.stringify(cart));

  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = () => Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCT_INDEX[id];
    return sum + (p ? p.price * qty : 0);
  }, 0);

  // ---- 5d. Render product grid ----
  let wishlist = new Set(JSON.parse(localStorage.getItem('vantra_wishlist') || '[]'));
  const saveWishlist = () => localStorage.setItem('vantra_wishlist', JSON.stringify([...wishlist]));
  const productGrid = document.getElementById('productGrid');
  let activeFilter = 'All';

  function renderProducts() {
    const filtered = activeFilter === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.cat === activeFilter);
    if (productGrid) {
      productGrid.innerHTML = filtered.map(productCardHtml).join('');
    }
  }

  document.getElementById('productFilters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    renderProducts();
  });

  const productCardHtml = (p) => `
    <article class="product-card" data-id="${p.id}">
      <button class="wishlist-btn" data-id="${p.id}" aria-label="Wishlist">${wishlist.has(p.id) ? '♥' : '♡'}</button>
      <span class="product-icon">${p.icon}</span>
      <span class="product-cat">${p.cat}</span>
      <h3>${p.name}</h3>
      <p class="product-spec">${p.variant} · ${p.spec}</p>
      <div class="product-foot">
        <span class="product-price">${rupee(p.price)}<small>incl. GST</small></span>
        <button class="add-to-cart-btn" data-id="${p.id}">Add to Cart</button>
      </div>
    </article>`;

  renderProducts();

  // ---- 5e. Cart drawer elements ----
  const cartOverlay = document.getElementById('cartOverlay');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartItemsEl = document.getElementById('cartItems');
  const cartEmptyEl = document.getElementById('cartEmpty');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartBadge = document.getElementById('cartBadge');
  const cartBadgeMobile = document.getElementById('cartBadgeMobile');

  const openCart = () => { cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); };
  const closeCart = () => { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); };

  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartBtnMobile')?.addEventListener('click', () => {
    drawer.classList.remove('open'); burger.classList.remove('open');
    openCart();
  });
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  function renderCart() {
    const entries = Object.entries(cart).filter(([, qty]) => qty > 0);

    cartEmptyEl.style.display = entries.length ? 'none' : 'block';
    cartItemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());

    entries.forEach(([id, qty]) => {
      const p = PRODUCT_INDEX[id];
      if (!p) return;
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <span class="cart-item-icon">${p.icon}</span>
        <div>
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${rupee(p.price)} × ${qty}</div>
        </div>
        <div class="cart-item-actions">
          <div class="qty-stepper">
            <button data-action="dec" data-id="${id}" aria-label="Decrease quantity">−</button>
            <span>${qty}</span>
            <button data-action="inc" data-id="${id}" aria-label="Increase quantity">+</button>
          </div>
          <button class="cart-item-remove" data-action="remove" data-id="${id}">Remove</button>
        </div>`;
      cartItemsEl.appendChild(row);
    });

    const total = cartTotal();
    cartSubtotalEl.textContent = rupee(total);
    cartTotalEl.textContent = rupee(total);

    const count = cartCount();
    cartBadge.textContent = count;
    cartBadgeMobile.textContent = count;
  }

  // delegated click handling for qty steppers / remove / add-to-cart
  document.addEventListener('click', (e) => {
    const wishBtn = e.target.closest('.wishlist-btn');
    if (wishBtn) {
      const id = wishBtn.dataset.id;
      if (wishlist.has(id)) { wishlist.delete(id); wishBtn.textContent = '♡'; }
      else { wishlist.add(id); wishBtn.textContent = '♥'; wishBtn.classList.add('wishlisted'); setTimeout(() => wishBtn.classList.remove('wishlisted'), 400); }
      saveWishlist();
      return;
    }

    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      const id = addBtn.dataset.id;
      cart[id] = (cart[id] || 0) + 1;
      saveCart();
      renderCart();
      addBtn.textContent = 'Added ✓';
      addBtn.classList.add('in-cart');
      setTimeout(() => { addBtn.textContent = 'Add to Cart'; addBtn.classList.remove('in-cart'); }, 1100);
      return;
    }

    const stepBtn = e.target.closest('.qty-stepper button, .cart-item-remove');
    if (stepBtn) {
      const id = stepBtn.dataset.id;
      const action = stepBtn.dataset.action;
      if (action === 'inc') cart[id] = (cart[id] || 0) + 1;
      if (action === 'dec') cart[id] = Math.max(0, (cart[id] || 0) - 1);
      if (action === 'remove') delete cart[id];
      saveCart();
      renderCart();
    }
  });

  renderCart(); // initial paint from localStorage

  /* ============================================================
     5f. SEARCH PANEL — queries the SQL-backed /api/search endpoint
     (see server-example.js + products.sql), with a client-side
     fallback so the page still works when no backend is running.
     ============================================================ */
  const searchOverlay = document.getElementById('searchOverlay');
  const searchPanel = document.getElementById('searchPanel');
  const searchInput = document.getElementById('searchInput');
  const searchResultsEl = document.getElementById('searchResults');
  const searchMetaEl = document.getElementById('searchMeta');
  const searchHintEl = document.getElementById('searchHint');

  const openSearch = () => {
    searchPanel.classList.add('open');
    searchOverlay.classList.add('open');
    setTimeout(() => searchInput.focus(), 150);
  };
  const closeSearch = () => {
    searchPanel.classList.remove('open');
    searchOverlay.classList.remove('open');
  };

  document.getElementById('searchIconBtn')?.addEventListener('click', openSearch);
  document.getElementById('searchIconBtnMobile')?.addEventListener('click', () => {
    drawer.classList.remove('open'); burger.classList.remove('open');
    openSearch();
  });
  document.getElementById('searchClose')?.addEventListener('click', closeSearch);
  searchOverlay?.addEventListener('click', closeSearch);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchPanel.classList.contains('open')) closeSearch();
  });

  // Client-side fallback search — same matching fields the SQL query
  // checks (name, category, variant, spec), used only if /api/search
  // is unreachable (e.g. server-example.js isn't running locally).
  function localSearch(query) {
    const q = query.toLowerCase();
    return PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.cat.toLowerCase().includes(q) ||
      p.variant.toLowerCase().includes(q) ||
      p.spec.toLowerCase().includes(q)
    );
  }

  function renderSearchResults(results, source) {
    searchHintEl.style.display = results.length ? 'none' : 'block';
    searchHintEl.textContent = results.length ? '' : `No products match that search.`;

    searchMetaEl.textContent = results.length
      ? `${results.length} result${results.length === 1 ? '' : 's'} · via ${source}`
      : '';

    results.forEach(p => { PRODUCT_INDEX[p.id] = p; }); // keep cart lookups in sync

    const grid = results.length ? `<div class="search-grid">${results.map(p => `
      <article class="search-result-card" data-id="${p.id}">
        <span class="search-result-icon">${p.icon}</span>
        <div class="search-result-info">
          <div class="search-result-name">${p.name}</div>
          <div class="search-result-variant">${p.variant}</div>
          <div class="search-result-price">${rupee(p.price)}</div>
        </div>
        <button class="search-result-add" data-id="${p.id}" aria-label="Add ${p.name} to cart">+</button>
      </article>`).join('')}</div>` : '';

    searchResultsEl.querySelectorAll('.search-grid').forEach(el => el.remove());
    searchResultsEl.insertAdjacentHTML('beforeend', grid);
  }

  // clicking a result (or its + button) adds it to the cart
  searchResultsEl.addEventListener('click', (e) => {
    const card = e.target.closest('.search-result-card');
    if (!card) return;
    const id = card.dataset.id;
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    const addBtn = card.querySelector('.search-result-add');
    addBtn.textContent = '✓';
    setTimeout(() => { addBtn.textContent = '+'; }, 900);
  });

  let searchDebounce;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    const query = searchInput.value.trim();

    if (!query) {
      searchResultsEl.querySelectorAll('.search-grid').forEach(el => el.remove());
      searchMetaEl.textContent = '';
      searchHintEl.style.display = 'block';
      searchHintEl.textContent = 'Search runs against the product database — try a category, a spec, or a brand-style keyword.';
      return;
    }

    searchDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(2500) });
        if (!res.ok) throw new Error('search api error');
        const data = await res.json();
        renderSearchResults(data.results || [], 'SQL database');
      } catch (err) {
        // No backend running (or it's offline) — fall back to an
        // identical search over the local catalogue copy.
        renderSearchResults(localSearch(query), 'local catalogue');
      }
    }, 250); // debounce so we're not hammering the API on every keystroke
  });

  /* ============================================================
     6. CHECKOUT MODAL + MULTI-PAYMENT FLOW
     ============================================================ */
  const checkoutOverlay = document.getElementById('checkoutOverlay');
  const checkoutAmountEl = document.getElementById('checkoutAmount');
  const payNowBtn = document.getElementById('payNowBtn');
  const payToast = document.getElementById('payToast');
  const payToastDetail = document.getElementById('payToastDetail');

  // Step elements
  const stepIndicators = document.querySelectorAll('.checkout-step[data-step]');
  const stepDetails = document.getElementById('stepDetails');
  const stepPayment = document.getElementById('stepPayment');
  const stepConfirm = document.getElementById('stepConfirm');

  function activateStep(num) {
    stepIndicators.forEach(el => {
      const n = parseInt(el.dataset.step);
      el.classList.remove('active', 'done');
      if (n === num) el.classList.add('active');
      else if (n < num) el.classList.add('done');
    });
    stepDetails.classList.toggle('active', num === 1);
    stepPayment.classList.toggle('active', num === 2);
    stepConfirm.classList.toggle('active', num === 3);
  }

  document.getElementById('openCheckoutBtn')?.addEventListener('click', () => {
    if (cartCount() === 0) return;
    updateCheckoutAmount();
    activateStep(1);
    checkoutOverlay.classList.add('open');
    closeCart();
  });
  document.getElementById('checkoutClose')?.addEventListener('click', () => {
    checkoutOverlay.classList.remove('open');
  });
  checkoutOverlay?.addEventListener('click', (e) => {
    if (e.target === checkoutOverlay) checkoutOverlay.classList.remove('open');
  });

  // Coupon logic
  const COUPONS = { 'VANTRA10': 10, 'WELCOME5': 5, 'SAVE15': 15 };
  let appliedDiscount = 0;

  function updateCheckoutAmount() {
    const base = cartTotal();
    const cod = document.querySelector('input[name="payMethod"]:checked')?.value === 'cod' ? 40 : 0;
    const discounted = Math.round(base * (1 - appliedDiscount / 100)) + cod;
    checkoutAmountEl.textContent = rupee(discounted);
    updateEmiCalc(discounted);
    return discounted;
  }

  document.getElementById('applyCouponBtn')?.addEventListener('click', () => {
    const code = document.getElementById('couponInput').value.trim().toUpperCase();
    const msgEl = document.getElementById('couponMsg');
    if (COUPONS[code]) {
      appliedDiscount = COUPONS[code];
      msgEl.textContent = `✓ ${appliedDiscount}% discount applied!`;
      msgEl.className = 'coupon-msg success';
      updateCheckoutAmount();
    } else {
      appliedDiscount = 0;
      msgEl.textContent = '✗ Invalid coupon code.';
      msgEl.className = 'coupon-msg error';
      updateCheckoutAmount();
    }
  });

  // Step 1 → 2
  document.getElementById('toPaymentBtn')?.addEventListener('click', () => {
    const name = document.getElementById('custName').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    if (!name || !email || !phone || !address) {
      alert('Please fill in all fields.');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }
    updateCheckoutAmount();
    activateStep(2);
  });

  // Step 2 → 1
  document.getElementById('backToDetailsBtn')?.addEventListener('click', () => activateStep(1));

  // Payment method toggle - show/hide sub-fields
  document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const val = radio.value;
      document.getElementById('upiIdField').classList.toggle('show', val === 'upi');
      document.getElementById('bankSelectField').classList.toggle('show', val === 'netbanking');
      document.getElementById('emiSelectField').classList.toggle('show', val === 'emi');

      // Update pay button label & secure note
      const labels = {
        razorpay: 'Pay with Razorpay',
        upi: 'Pay via UPI',
        netbanking: 'Pay via Net Banking',
        emi: 'Set up EMI',
        cod: 'Place Order (Pay on Delivery)',
      };
      const notes = {
        razorpay: '🔒 Secured by Razorpay · 256-bit SSL encryption',
        upi: '🔒 UPI payment via your bank · instant settlement',
        netbanking: '🔒 Redirects to your bank\'s secure portal',
        emi: '🔒 No-cost EMI · processed via Razorpay',
        cod: '📦 Pay cash/UPI when the delivery agent arrives',
      };
      payNowBtn.textContent = labels[val] || 'Pay Now';
      document.getElementById('paySecureNote').textContent = notes[val] || '';
      updateCheckoutAmount();
    });
  });

  // EMI calculator
  document.getElementById('emiTenure')?.addEventListener('change', () => updateCheckoutAmount());
  function updateEmiCalc(total) {
    const emiNote = document.getElementById('emiCalcNote');
    if (!emiNote) return;
    const months = parseInt(document.getElementById('emiTenure')?.value || 3);
    const monthly = Math.ceil(total / months);
    emiNote.textContent = `≈ ${rupee(monthly)} / month for ${months} months`;
  }

  function showPayToast(message) {
    payToastDetail.textContent = message;
    payToast.classList.add('show');
    setTimeout(() => payToast.classList.remove('show'), 5500);
  }

  function finishOrder(methodLabel, amountRupees, name) {
    const spinner = document.getElementById('confirmSpinner');
    const check = document.getElementById('confirmCheck');
    const label = document.getElementById('confirmLabel');
    activateStep(3);
    spinner.classList.remove('hide');
    check.classList.remove('show');
    label.textContent = 'Processing payment…';

    setTimeout(() => {
      spinner.classList.add('hide');
      check.classList.add('show');
      label.textContent = 'Order confirmed!';
      showPayToast(`${methodLabel} · ${rupee(amountRupees)} from ${name} — order confirmed!`);
      cart = {};
      saveCart();
      renderCart();
      document.getElementById('checkoutForm').reset();
      appliedDiscount = 0;
      setTimeout(() => checkoutOverlay.classList.remove('open'), 2500);
    }, 1800);
  }

  document.getElementById('checkoutForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value || 'razorpay';
    const name = document.getElementById('custName').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const amountRupees = updateCheckoutAmount();

    if (amountRupees <= 0) return;

    // ----- UPI -----
    if (payMethod === 'upi') {
      const upiId = document.getElementById('upiId').value.trim();
      if (!upiId) { alert('Please enter your UPI ID.'); return; }
      finishOrder(`UPI · ${upiId}`, amountRupees, name);
      return;
    }

    // ----- Net Banking -----
    if (payMethod === 'netbanking') {
      const bank = document.getElementById('bankSelect').value;
      if (!bank) { alert('Please select your bank.'); return; }
      finishOrder(`Net Banking · ${bank}`, amountRupees, name);
      return;
    }

    // ----- EMI -----
    if (payMethod === 'emi') {
      const months = document.getElementById('emiTenure').value;
      if (typeof Razorpay === 'undefined') {
        finishOrder(`No-Cost EMI · ${months}mo`, amountRupees, name);
        return;
      }
      // Route through Razorpay with EMI intent
      const options = buildRazorpayOptions({ name, email, phone, address, amountRupees,
        description: `No-Cost EMI ${months} months · ${cartCount()} item(s)` });
      options.config = { display: { blocks: { emi: { name: 'Pay via EMI', instruments: [{ method: 'emi' }] } }, sequence: ['block.emi'], preferences: { show_default_blocks: false } } };
      options.handler = (response) => finishOrder(`EMI ${months}mo · ${response.razorpay_payment_id}`, amountRupees, name);
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (r) => showPayToast(`Payment failed: ${r.error.description}`));
      rzp.open();
      return;
    }

    // ----- Cash on Delivery -----
    if (payMethod === 'cod') {
      finishOrder('Cash on Delivery', amountRupees, name);
      return;
    }

    // ----- Razorpay (card/wallet) -----
    if (typeof Razorpay === 'undefined') {
      alert('Razorpay script failed to load — check your internet connection.');
      return;
    }
    payNowBtn.disabled = true;
    payNowBtn.textContent = 'Opening Razorpay…';
    const options = buildRazorpayOptions({ name, email, phone, address, amountRupees,
      description: `${cartCount()} item(s) — Order` });
    options.handler = (response) => finishOrder(`Razorpay · ${response.razorpay_payment_id}`, amountRupees, name);
    options.modal = { ondismiss: () => { payNowBtn.disabled = false; payNowBtn.textContent = 'Pay with Razorpay'; } };
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (r) => {
      payNowBtn.disabled = false;
      payNowBtn.textContent = 'Pay with Razorpay';
      showPayToast(`Payment failed: ${r.error.description}`);
    });
    rzp.open();
    payNowBtn.disabled = false;
    payNowBtn.textContent = 'Pay with Razorpay';
  });

  function buildRazorpayOptions({ name, email, phone, address, amountRupees, description }) {
    return {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(amountRupees * 100),
      currency: 'INR',
      name: 'Vantra Electronics',
      description,
      prefill: { name, email, contact: phone },
      notes: { address },
      theme: { color: '#FF5A1F' },
    };
  }

});
