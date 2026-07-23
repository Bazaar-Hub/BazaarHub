// =========================================================================
// BAZAARHUB — FIREBASE AUTH, CATALOG, CHECKOUT & ADMIN CONSOLE
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPlpnfGWTiUQlyl2vH6uM_Ae6_EQ8YW5E",
  authDomain: "bazaarhubnew-79dee.firebaseapp.com",
  projectId: "bazaarhubnew-79dee",
  storageBucket: "bazaarhubnew-79dee.firebasestorage.app",
  messagingSenderId: "452492018395",
  appId: "1:452492018395:web:6c3cf8d956ce7fe45b42fe"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let globalProducts = [];
let globalOrders = [];
let localCart = JSON.parse(localStorage.getItem('bazaarhub_cart')) || [];
let activeCategory = 'All';
let searchTerm = '';

const STATUS_OPTIONS = ["Pending Dispatch", "Shipped", "Delivered", "Cancelled"];

// ==========================================
// 0. UI SHELL — TOASTS & CONFIRM MODAL
// ==========================================
function ensureUIShell() {
    if (!document.getElementById('toastStack')) {
        const stack = document.createElement('div');
        stack.id = 'toastStack';
        stack.className = 'toast-stack';
        document.body.appendChild(stack);
    }
    if (!document.getElementById('confirmModal')) {
        const overlay = document.createElement('div');
        overlay.id = 'confirmModal';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box">
                <i class="fas fa-triangle-exclamation"></i>
                <h3 id="confirmModalTitle">Are you sure?</h3>
                <p id="confirmModalMessage">This action cannot be undone.</p>
                <div class="modal-actions">
                    <button type="button" id="confirmModalCancel" class="btn btn-secondary">Cancel</button>
                    <button type="button" id="confirmModalOk" class="btn btn-danger">Confirm</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    }
}
ensureUIShell();

const ICONS = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };

function showToast(message, type = 'info') {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fas ${ICONS[type] || ICONS.info}"></i><span>${message}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.25s ease';
        setTimeout(() => el.remove(), 250);
    }, 3800);
}

function showConfirm({ title = 'Are you sure?', message = '', confirmLabel = 'Confirm' } = {}) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('confirmModal');
        document.getElementById('confirmModalTitle').innerText = title;
        document.getElementById('confirmModalMessage').innerText = message;
        const okBtn = document.getElementById('confirmModalOk');
        const cancelBtn = document.getElementById('confirmModalCancel');
        okBtn.innerText = confirmLabel;
        overlay.classList.add('open');

        const cleanup = (result) => {
            overlay.classList.remove('open');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(result);
        };
        const onOk = () => cleanup(true);
        const onCancel = () => cleanup(false);
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

function setBtnLoading(btn, loadingText) {
    if (!btn) return () => {};
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${loadingText}`;
    return () => { btn.disabled = false; btn.innerHTML = original; };
}

function friendlyAuthError(error) {
    const map = {
        'auth/invalid-email': 'That email address looks invalid.',
        'auth/user-not-found': 'No account matches that email.',
        'auth/wrong-password': 'Incorrect password. Try again.',
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/email-already-in-use': 'An account already exists with that email.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.'
    };
    return map[error.code] || error.message;
}

// ==========================================
// 1. MOBILE NAV TOGGLE
// ==========================================
function setupMobileNav() {
    const toggle = document.getElementById('navToggle');
    const panel = document.getElementById('mobileNav');
    const closeBtn = document.getElementById('mobileNavClose');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', () => panel.classList.add('open'));
    closeBtn?.addEventListener('click', () => panel.classList.remove('open'));
    panel.addEventListener('click', (e) => { if (e.target === panel) panel.classList.remove('open'); });
}
setupMobileNav();

// ==========================================
// 1b. SMOOTH PAGE TRANSITIONS
// Fades the current page out before following an internal link,
// so navigating between pages feels like one app instead of separate
// documents. Respects new tabs, external links, and modified clicks.
// ==========================================
function setupPageTransitions() {
    const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (PREFERS_REDUCED) return;

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        const isInternalHtml = href && href.endsWith('.html') && !href.startsWith('http');
        const isModifiedClick = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;

        if (!isInternalHtml || link.target === '_blank' || isModifiedClick) return;

        e.preventDefault();
        document.body.classList.add('page-exit');
        setTimeout(() => { window.location.href = href; }, 170);
    });
}
setupPageTransitions();

// ==========================================
// 2. GLOBAL AUTH MONITOR & ROUTE GUARD
// Admin access is granted purely by which Firebase Auth account is signed
// in — there's no separate visible "admin login" and no Firestore lookup
// involved, so nothing about who is admin is exposed to regular customers.
// Firebase Auth verifies the password server-side, so this is safe even
// though the admin email is readable in this file.
// ==========================================
const ADMIN_EMAIL = "bazaarhub0111@gmail.com";

async function isAdminUser(user) {
    if (!user || !user.email) return false;
    return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function setAdminNavVisible(visible) {
    document.querySelectorAll('.admin-only-link').forEach(el => el.classList.toggle('hidden', !visible));
}

function showAdminPanel() {
    const gate = document.getElementById('adminGate');
    const panel = document.getElementById('adminPanel');
    if (gate) gate.classList.add('hidden');
    if (panel) panel.classList.remove('hidden');
}

function showAdminDenied() {
    const gate = document.getElementById('adminGate');
    const panel = document.getElementById('adminPanel');
    if (panel) panel.classList.add('hidden');
    if (gate) {
        gate.classList.remove('hidden');
        const msg = document.getElementById('adminGateMsg');
        if (msg) msg.innerText = "This account doesn't have admin access. Sign in with the owner account, or contact the site owner if this is a mistake.";
    }
}

// Safety net: no matter what triggers a redirect, never let this page send
// the browser to the same destination more than once in a row. This makes
// reload loops structurally impossible, even if something upstream (a stale
// cached file, an unusual hosting path, a Firebase hiccup) tries to redirect
// repeatedly.
function safeRedirect(destination) {
    const lastRedirect = sessionStorage.getItem('bh_last_redirect');
    if (lastRedirect === destination) {
        console.warn('BazaarHub: blocked a repeat redirect to', destination, '— staying put to avoid a reload loop.');
        return;
    }
    sessionStorage.setItem('bh_last_redirect', destination);
    window.location.href = destination;
}

onAuthStateChanged(auth, async (user) => {
    const currentPage = window.location.pathname;
    const isAdminPage = currentPage.includes('admin.html');

    if (user) {
        sessionStorage.removeItem('bh_last_redirect');
        // Redirect logged-in users away from auth page
        if (currentPage.includes('auth.html')) {
            safeRedirect("index.html");
            return;
        }

        const admin = await isAdminUser(user);
        setAdminNavVisible(admin);

        if (isAdminPage) {
            if (admin) {
                showAdminPanel();
                setupAppRealtimeStreams();
            } else {
                showAdminDenied();
            }
        } else {
            setupAppRealtimeStreams();
            prefillCheckoutFromProfile(user);
        }
    } else {
        setAdminNavVisible(false);
        // Not logged in at all — everyone (including admin) must sign in first,
        // but don't redirect if we're already on the login page (that caused
        // an infinite reload loop).
        if (!currentPage.includes('auth.html')) {
            safeRedirect("auth.html");
        } else {
            sessionStorage.removeItem('bh_last_redirect');
        }
    }
});

async function prefillCheckoutFromProfile(user) {
    const nameField = document.getElementById('custName');
    const emailField = document.getElementById('custEmail');
    const phoneField = document.getElementById('custPhone');
    if (!nameField && !emailField) return;
    try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
            const data = snap.data();
            if (nameField && !nameField.value) nameField.value = data.name || '';
            if (phoneField && data.phone) {
                phoneField.value = data.phone;
                phoneField.readOnly = true;
                phoneField.title = "This is the phone number on your account.";
            }
        }
    } catch (err) { /* non-critical, ignore */ }
    if (emailField && user.email) {
        emailField.value = user.email;
        emailField.readOnly = true;
        emailField.title = "This is the email on your account.";
    }
}

// ==========================================
// 3. REGISTRATION
// ==========================================
const regForm = document.getElementById('registerForm');
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = regForm.querySelector('button[type="submit"]');
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPass').value;

        hideAuthError('registerError');
        const restore = setBtnLoading(submitBtn, 'Creating account…');

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name, email, phone, role: "client"
            });
            window.location.href = "index.html";
        } catch (error) {
            restore();
            showAuthError('registerError', friendlyAuthError(error));
        }
    });
}

// ==========================================
// 4. LOGIN
// ==========================================
const logForm = document.getElementById('loginForm');
if (logForm) {
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = logForm.querySelector('button[type="submit"]');
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPass').value;

        hideAuthError('loginError');
        const restore = setBtnLoading(submitBtn, 'Signing in…');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "index.html";
        } catch (error) {
            restore();
            showAuthError('loginError', friendlyAuthError(error));
        }
    });
}

function showAuthError(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<i class="fas fa-circle-exclamation"></i><span>${message}</span>`;
    el.classList.remove('hidden');
}
function hideAuthError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = "auth.html";
    });
}

// ==========================================
// 5. REALTIME CLOUD STREAMS
// ==========================================
let streamsStarted = false;
function setupAppRealtimeStreams() {
    if (streamsStarted) return;
    streamsStarted = true;

    onSnapshot(collection(db, "products"), (snapshot) => {
        globalProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderCatalogUI();
        renderFeaturedProducts();
        renderAdminProducts();
        updateAdminStats();
        renderProductDetail();
    });

    const adminOrdersList = document.getElementById('adminOrdersList');
    if (adminOrdersList) {
        onSnapshot(collection(db, "orders"), (snapshot) => {
            globalOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            renderAdminOrders();
            updateAdminStats();
        });
    }

    const myOrdersList = document.getElementById('myOrdersList');
    if (myOrdersList) {
        onSnapshot(collection(db, "orders"), (snapshot) => {
            const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const mine = all.filter(o => o.userUid === (auth.currentUser ? auth.currentUser.uid : null));
            renderMyOrders(mine);
        });
    }
}

function renderMyOrders(orders) {
    const myOrdersList = document.getElementById('myOrdersList');
    if (!myOrdersList) return;

    if (orders.length === 0) {
        myOrdersList.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align:center; padding:30px 0;">You haven't placed any orders yet. <a href="shop.html" class="accent-gold">Start shopping →</a></td></tr>`;
        return;
    }

    const sorted = [...orders].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

    myOrdersList.innerHTML = sorted.map(o => {
        const itemsHtml = (o.items && o.items.length)
            ? o.items.map(i => `${i.name} <span class="text-muted">x${i.qty}</span>`).join('<br>')
            : (o.itemsSummary || '');
        return `
        <tr>
            <td class="order-meta" style="font-family:var(--font-mono); font-size:12px;">#${o.id.slice(-6).toUpperCase()}</td>
            <td class="order-meta">${itemsHtml}</td>
            <td class="order-meta">${o.address || ''}, ${o.city || ''}</td>
            <td class="accent-gold" style="font-weight:800; font-family:var(--font-mono);">Rs ${parseFloat(o.totalCost || 0).toLocaleString()}</td>
            <td><span class="status-badge ${statusClass(o.status)}">${o.status}</span></td>
        </tr>
    `}).join('');
}

// ==========================================
// 6. CATALOG — SEARCH, FILTER & RENDER
// ==========================================
function renderSkeleton(grid, count = 6) {
    grid.innerHTML = Array.from({ length: count }).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-block img"></div>
            <div class="skeleton-block line w-70"></div>
            <div class="skeleton-block line w-40"></div>
            <div class="skeleton-block btn"></div>
        </div>
    `).join('');
}

function getCategories() {
    const set = new Set(globalProducts.map(p => (p.category || 'General').trim()).filter(Boolean));
    return ['All', ...Array.from(set)];
}

function renderChips() {
    const wrap = document.getElementById('categoryChips');
    if (!wrap) return;
    const categories = getCategories();
    wrap.innerHTML = categories.map(c => `
        <button type="button" class="chip ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>
    `).join('');
    wrap.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            activeCategory = chip.getAttribute('data-cat');
            renderChips();
            renderCatalogUI();
        });
    });
}

function renderCatalogUI() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    renderChips();

    if (globalProducts.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-store-slash"></i>
                <h3>The stalls are empty right now</h3>
                <p>No products have been added to the bazaar yet. Check back soon.</p>
            </div>`;
        return;
    }

    const filtered = globalProducts.filter(p => {
        const matchesCategory = activeCategory === 'All' || (p.category || 'General') === activeCategory;
        const haystack = `${p.name || ''} ${p.description || ''}`.toLowerCase();
        const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-magnifying-glass"></i>
                <h3>No matches in the bazaar</h3>
                <p>Try a different search term or category.</p>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="product-card">
            <a href="product.html?id=${p.id}" class="product-card-link">
                <div class="product-img-wrap">
                    <img src="${p.image}" class="product-img" alt="${p.name}" loading="lazy">
                    <span class="product-category">${p.category || 'General'}</span>
                </div>
                <div class="product-title">${p.name}</div>
                <div class="product-desc">${p.description}</div>
                <div class="product-footer">
                    <span class="price-tag">Rs ${parseFloat(p.price).toLocaleString()}</span>
                </div>
            </a>
            <button class="btn btn-primary addToCartBtn" data-id="${p.id}"><i class="fas fa-basket-shopping"></i> Add to Basket</button>
            <a href="product.html?id=${p.id}" class="btn btn-secondary" style="margin-top:8px;"><i class="fas fa-circle-info"></i> View Details</a>
        </div>
    `).join('');

    document.querySelectorAll('.addToCartBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const triggerBtn = e.currentTarget;
            const pId = triggerBtn.getAttribute('data-id');
            const item = globalProducts.find(x => x.id === pId);
            if (item) {
                addItemToCart(item);
                showToast(`${item.name} added to your basket.`, 'success');

                const original = triggerBtn.innerHTML;
                triggerBtn.innerHTML = '<i class="fas fa-check"></i> Added';
                triggerBtn.disabled = true;
                setTimeout(() => {
                    triggerBtn.innerHTML = original;
                    triggerBtn.disabled = false;
                }, 1200);
            }
        });
    });
}

function renderFeaturedProducts() {
    const grid = document.getElementById('featuredProductsGrid');
    if (!grid) return;

    if (globalProducts.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-store-slash"></i>
                <h3>The stalls are empty right now</h3>
                <p>No products have been added to the bazaar yet. Check back soon.</p>
            </div>`;
        return;
    }

    const featured = globalProducts.slice(0, 4);

    grid.innerHTML = featured.map(p => `
        <div class="product-card">
            <a href="product.html?id=${p.id}" class="product-card-link">
                <div class="product-img-wrap">
                    <img src="${p.image}" class="product-img" alt="${p.name}" loading="lazy">
                    <span class="product-category">${p.category || 'General'}</span>
                </div>
                <div class="product-title">${p.name}</div>
                <div class="product-desc">${p.description}</div>
                <div class="product-footer">
                    <span class="price-tag">Rs ${parseFloat(p.price).toLocaleString()}</span>
                </div>
            </a>
            <button class="btn btn-primary addToCartBtn" data-id="${p.id}"><i class="fas fa-basket-shopping"></i> Add to Basket</button>
            <a href="product.html?id=${p.id}" class="btn btn-secondary" style="margin-top:8px;"><i class="fas fa-circle-info"></i> View Details</a>
        </div>
    `).join('');

    grid.querySelectorAll('.addToCartBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const triggerBtn = e.currentTarget;
            const pId = triggerBtn.getAttribute('data-id');
            const item = globalProducts.find(x => x.id === pId);
            if (item) {
                addItemToCart(item);
                showToast(`${item.name} added to your basket.`, 'success');

                const original = triggerBtn.innerHTML;
                triggerBtn.innerHTML = '<i class="fas fa-check"></i> Added';
                triggerBtn.disabled = true;
                setTimeout(() => {
                    triggerBtn.innerHTML = original;
                    triggerBtn.disabled = false;
                }, 1200);
            }
        });
    });
}

// ==========================================
// 5b. PRODUCT DETAIL PAGE (PDP)
// ==========================================
let pdpQty = 1;

function renderProductDetail() {
    const wrap = document.getElementById('pdpContent');
    if (!wrap) return; // not on product.html

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const product = globalProducts.find(p => p.id === productId);

    if (!product) {
        // Still loading (products stream hasn't populated yet) vs genuinely missing
        if (globalProducts.length === 0) return; // wait for data
        wrap.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-basket-shopping"></i>
                <h3>Product not found</h3>
                <p>This item may have been removed. <a href="shop.html" class="accent-gold">Browse the catalog →</a></p>
            </div>`;
        return;
    }

    const breadcrumbName = document.getElementById('pdpBreadcrumbName');
    if (breadcrumbName) breadcrumbName.innerText = product.name;
    document.title = `BazaarHub — ${product.name}`;

    wrap.innerHTML = `
        <div class="pdp-image-wrap">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div>
            <span class="pdp-category">${product.category || 'General'}</span>
            <h1 class="pdp-title">${product.name}</h1>
            <div class="pdp-price">Rs ${parseFloat(product.price).toLocaleString()}</div>
            <p class="pdp-desc">${product.description || ''}</p>

            <div class="pdp-qty-row">
                <span class="pdp-qty-label">Quantity</span>
                <div class="pdp-qty-control">
                    <button type="button" id="pdpQtyMinus">−</button>
                    <span id="pdpQtyValue">1</span>
                    <button type="button" id="pdpQtyPlus">+</button>
                </div>
            </div>

            <div class="pdp-actions">
                <button class="btn btn-secondary" id="pdpAddToCart"><i class="fas fa-basket-shopping"></i> Add to Basket</button>
                <button class="btn btn-primary" id="pdpBuyNow"><i class="fas fa-bolt"></i> Buy Now</button>
            </div>

            <div class="pdp-trust-row">
                <div class="pdp-trust-item"><i class="fas fa-shield-halved"></i> Verified Seller</div>
                <div class="pdp-trust-item"><i class="fas fa-truck-fast"></i> Karachi Delivery</div>
                <div class="pdp-trust-item"><i class="fas fa-headset"></i> Order Support</div>
                <div class="pdp-trust-item"><i class="fas fa-lock"></i> Secure Checkout</div>
            </div>
        </div>
    `;

    pdpQty = 1;
    const qtyValue = document.getElementById('pdpQtyValue');
    document.getElementById('pdpQtyMinus').addEventListener('click', () => {
        if (pdpQty > 1) { pdpQty--; qtyValue.innerText = pdpQty; }
    });
    document.getElementById('pdpQtyPlus').addEventListener('click', () => {
        pdpQty++; qtyValue.innerText = pdpQty;
    });

    document.getElementById('pdpAddToCart').addEventListener('click', (e) => {
        for (let i = 0; i < pdpQty; i++) addItemToCart(product);
        showToast(`${product.name} added to your basket.`, 'success');
        const btn = e.currentTarget;
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Added';
        btn.disabled = true;
        setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 1200);
    });

    document.getElementById('pdpBuyNow').addEventListener('click', () => {
        for (let i = 0; i < pdpQty; i++) addItemToCart(product);
        window.location.href = "checkout.html";
    });
}

function setupCatalogControls() {
    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            renderCatalogUI();
        });
    }
    const grid = document.getElementById('productsGrid');
    if (grid) renderSkeleton(grid);
}
setupCatalogControls();

function updateCartWidgetCount() {
    const totalQty = localCart.reduce((sum, i) => sum + (i.qty || 1), 0);
    document.querySelectorAll('#cartCount').forEach(counter => counter.innerText = totalQty);
}

function addItemToCart(item) {
    const existing = localCart.find(i => i.id === item.id);
    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
    } else {
        localCart.push({ ...item, qty: 1 });
    }
    localStorage.setItem('bazaarhub_cart', JSON.stringify(localCart));
    updateCartWidgetCount();
}

// ==========================================
// 7. CHECKOUT / ORDER PROCESSING
// ==========================================
const checkoutItemsWrap = document.getElementById('checkoutSummaryItemsContainer');
if (checkoutItemsWrap) {

    function recalcCartTotal() {
        return localCart.reduce((sum, i) => sum + (parseFloat(i.price) * (i.qty || 1)), 0);
    }

    function renderCheckoutItems() {
        const displayTotal = document.getElementById('checkoutSummaryTotalDisplay');

        if (localCart.length === 0) {
            checkoutItemsWrap.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-basket-shopping"></i>
                    <p>Your basket is empty.<br><a href="index.html" class="accent-gold">Browse the bazaar →</a></p>
                </div>`;
            if (displayTotal) displayTotal.innerText = "Rs 0";
            return;
        }

        checkoutItemsWrap.innerHTML = localCart.map((i, idx) => `
            <div class="summary-item" data-idx="${idx}">
                <span class="item-name">${i.name}</span>
                <div class="qty-stepper">
                    <button type="button" class="qtyMinusBtn" data-idx="${idx}" aria-label="Decrease quantity"><i class="fas fa-minus"></i></button>
                    <span class="qty-value">${i.qty || 1}</span>
                    <button type="button" class="qtyPlusBtn" data-idx="${idx}" aria-label="Increase quantity"><i class="fas fa-plus"></i></button>
                </div>
                <span class="accent-gold" style="font-weight:700; min-width:90px; text-align:right;">Rs ${(parseFloat(i.price) * (i.qty || 1)).toLocaleString()}</span>
                <button type="button" class="cart-item-remove" data-idx="${idx}" aria-label="Remove item"><i class="fas fa-trash-alt"></i></button>
            </div>
        `).join('');

        if (displayTotal) displayTotal.innerText = "Rs " + recalcCartTotal().toLocaleString();

        checkoutItemsWrap.querySelectorAll('.qtyPlusBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                localCart[idx].qty = (localCart[idx].qty || 1) + 1;
                persistCartAndRerender();
            });
        });
        checkoutItemsWrap.querySelectorAll('.qtyMinusBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                const current = localCart[idx].qty || 1;
                if (current <= 1) {
                    localCart.splice(idx, 1);
                } else {
                    localCart[idx].qty = current - 1;
                }
                persistCartAndRerender();
            });
        });
        checkoutItemsWrap.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                localCart.splice(idx, 1);
                persistCartAndRerender();
            });
        });
    }

    function persistCartAndRerender() {
        localStorage.setItem('bazaarhub_cart', JSON.stringify(localCart));
        updateCartWidgetCount();
        renderCheckoutItems();
    }

    renderCheckoutItems();

    const checkForm = document.getElementById('checkoutForm');
    if (checkForm) {
        checkForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = checkForm.querySelector('button[type="submit"]');

            if (localCart.length === 0) {
                showToast("Your basket is empty — add something first.", 'error');
                return;
            }

            const totalCost = recalcCartTotal();
            const orderItems = localCart.map(i => ({
                productId: i.id || null,
                name: i.name,
                price: parseFloat(i.price),
                qty: i.qty || 1,
                lineTotal: parseFloat(i.price) * (i.qty || 1)
            }));

            const orderPayload = {
                userUid: auth.currentUser ? auth.currentUser.uid : "GUEST",
                customerName: document.getElementById('custName').value.trim(),
                customerEmail: document.getElementById('custEmail').value.trim(),
                address: document.getElementById('custAddress').value.trim(),
                city: document.getElementById('custCity').value.trim(),
                phone: document.getElementById('custPhone').value.trim(),
                items: orderItems,
                itemsSummary: orderItems.map(i => `${i.name} x${i.qty}`).join(', '),
                totalCost,
                status: "Pending Dispatch",
                timestamp: new Date().toISOString()
            };

            const restore = setBtnLoading(submitBtn, 'Placing order…');

            try {
                await addDoc(collection(db, "orders"), orderPayload);
                localCart = [];
                localStorage.removeItem('bazaarhub_cart');
                updateCartWidgetCount();
                showToast("Order placed! Track it any time from My Orders.", 'success');
                setTimeout(() => { window.location.href = "orders.html"; }, 1100);
            } catch (err) {
                restore();
                showToast("Couldn't place your order: " + err.message, 'error');
            }
        });
    }
}

// ==========================================
// 8. ADMIN — PRODUCT MANAGEMENT
// ==========================================

// ---- 8a. Image upload: read a local file, downscale + compress it in
// the browser via canvas, and hand back a data URL small enough to store
// directly on the Firestore product doc (no Storage bucket needed). ----
function readAndCompressImage(file, maxDim = 1000, quality = 0.82) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('Please choose an image file (JPG, PNG, or WEBP).'));
            return;
        }
        if (file.size > 12 * 1024 * 1024) {
            reject(new Error('That image is too large — please pick one under 12MB.'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                    if (width > height) { height = Math.round((height / width) * maxDim); width = maxDim; }
                    else { width = Math.round((width / height) * maxDim); height = maxDim; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject(new Error('Could not read that image.'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Could not read that file.'));
        reader.readAsDataURL(file);
    });
}

let uploadedProductImage = null;
let resetProductImageField = () => {};

function setupProductImageUpload() {
    const fileInput  = document.getElementById('pImageFile');
    const box        = document.getElementById('imgUploadBox');
    const prompt     = document.getElementById('imgUploadPrompt');
    const previewImg = document.getElementById('imgUploadPreview');
    const clearBtn   = document.getElementById('imgUploadClear');
    const urlToggle  = document.getElementById('imgUrlToggle');
    const urlInput   = document.getElementById('pImageUrl');
    if (!fileInput || !box) return;

    async function handleFile(file) {
        if (!file) return;
        try {
            box.classList.add('dragover');
            const dataUrl = await readAndCompressImage(file);
            uploadedProductImage = dataUrl;
            previewImg.src = dataUrl;
            previewImg.classList.remove('hidden');
            prompt.classList.add('hidden');
            clearBtn.classList.remove('hidden');
        } catch (err) {
            showToast(err.message, 'error');
            fileInput.value = '';
        } finally {
            box.classList.remove('dragover');
        }
    }

    function clearPreview() {
        uploadedProductImage = null;
        fileInput.value = '';
        previewImg.classList.add('hidden');
        previewImg.src = '';
        prompt.classList.remove('hidden');
        clearBtn.classList.add('hidden');
        urlInput.value = '';
        urlInput.classList.add('hidden');
        box.classList.remove('hidden');
        urlToggle.textContent = 'Paste an image link instead';
    }
    resetProductImageField = clearPreview;

    box.addEventListener('click', () => fileInput.click());
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

    ['dragenter', 'dragover'].forEach(evt => box.addEventListener(evt, (e) => { e.preventDefault(); box.classList.add('dragover'); }));
    ['dragleave'].forEach(evt => box.addEventListener(evt, (e) => { e.preventDefault(); box.classList.remove('dragover'); }));
    box.addEventListener('drop', (e) => {
        e.preventDefault();
        box.classList.remove('dragover');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) handleFile(file);
    });

    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        uploadedProductImage = null;
        fileInput.value = '';
        previewImg.classList.add('hidden');
        previewImg.src = '';
        prompt.classList.remove('hidden');
        clearBtn.classList.add('hidden');
    });

    urlToggle.addEventListener('click', () => {
        const switchingToUrl = urlInput.classList.contains('hidden');
        if (switchingToUrl) {
            urlInput.classList.remove('hidden');
            box.classList.add('hidden');
            urlToggle.textContent = 'Upload a photo instead';
        } else {
            urlInput.classList.add('hidden');
            box.classList.remove('hidden');
            urlToggle.textContent = 'Paste an image link instead';
        }
    });
}
setupProductImageUpload();

function getProductImageValue() {
    const urlInput = document.getElementById('pImageUrl');
    if (urlInput && !urlInput.classList.contains('hidden')) {
        return urlInput.value.trim();
    }
    return uploadedProductImage || '';
}

// ---- 8b. Save product ----
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('formSubmitBtn');
        const imageValue = getProductImageValue();

        if (!imageValue) {
            showToast('Please add a product photo — upload one or paste a link.', 'error');
            return;
        }

        const payload = {
            name: document.getElementById('pName').value.trim(),
            category: document.getElementById('pCategory').value.trim(),
            price: parseFloat(document.getElementById('pPrice').value),
            image: imageValue,
            description: document.getElementById('pDesc').value.trim()
        };

        const restore = setBtnLoading(submitBtn, 'Saving…');
        try {
            await addDoc(collection(db, "products"), payload);
            showToast(`"${payload.name}" was added to the catalog.`, 'success');
            addProductForm.reset();
            resetProductImageField();
        } catch (err) {
            showToast("Couldn't save the product: " + err.message, 'error');
        } finally {
            restore();
        }
    });
}

function renderAdminProducts() {
    const adminList = document.getElementById('adminProductsList');
    if (!adminList) return;

    const filterInput = document.getElementById('adminProductSearch');
    const term = filterInput ? filterInput.value.toLowerCase() : '';
    const items = globalProducts.filter(p => !term || (p.name || '').toLowerCase().includes(term));

    if (items.length === 0) {
        adminList.innerHTML = `<p class="text-muted" style="font-size:12.5px; padding:10px 0;">No products match.</p>`;
        return;
    }

    adminList.innerHTML = items.map(p => `
        <div class="inventory-row">
            <div class="inv-left">
                <img src="${p.image}" alt="${p.name}">
                <div class="inv-info">
                    <div class="inv-name">${p.name}</div>
                    <div class="inv-price">Rs ${parseFloat(p.price).toLocaleString()} · ${p.category || 'General'}</div>
                </div>
            </div>
            <button class="btn btn-ghost deleteProductBtn" data-id="${p.id}" data-name="${p.name}"><i class="fas fa-trash-alt"></i></button>
        </div>
    `).join('');

    adminList.querySelectorAll('.deleteProductBtn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const targetId = e.currentTarget.getAttribute('data-id');
            const targetName = e.currentTarget.getAttribute('data-name');
            const ok = await showConfirm({
                title: 'Delete this product?',
                message: `"${targetName}" will be removed from the catalog immediately.`,
                confirmLabel: 'Delete'
            });
            if (!ok) return;
            try {
                await deleteDoc(doc(db, "products", targetId));
                showToast(`"${targetName}" was deleted.`, 'success');
            } catch (err) {
                showToast("Couldn't delete the product: " + err.message, 'error');
            }
        });
    });
}

const adminProductSearch = document.getElementById('adminProductSearch');
if (adminProductSearch) {
    adminProductSearch.addEventListener('input', renderAdminProducts);
}

// ==========================================
// 9. ADMIN — ORDERS & STATUS UPDATES
// ==========================================
function statusClass(status) {
    const map = {
        'Pending Dispatch': 'status-pending',
        'Shipped': 'status-shipped',
        'Delivered': 'status-delivered',
        'Cancelled': 'status-cancelled'
    };
    return map[status] || 'status-pending';
}

function renderAdminOrders() {
    const adminOrdersList = document.getElementById('adminOrdersList');
    if (!adminOrdersList) return;

    if (globalOrders.length === 0) {
        adminOrdersList.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align:center; padding:30px 0;">No orders have come in yet.</td></tr>`;
        return;
    }

    const sorted = [...globalOrders].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

    adminOrdersList.innerHTML = sorted.map(o => {
        const itemsHtml = (o.items && o.items.length)
            ? o.items.map(i => `${i.name} <span class="text-muted">x${i.qty}</span>`).join('<br>')
            : (o.itemsSummary || '');
        return `
        <tr>
            <td class="order-meta"><b>${o.customerName || 'Guest'}</b><br>${o.customerEmail || ''}</td>
            <td class="order-meta"><b>${o.city || ''}</b><br>${o.address || ''}<br>${o.phone || ''}</td>
            <td class="order-meta">${itemsHtml}</td>
            <td class="accent-gold" style="font-weight:800; font-family:var(--font-mono);">Rs ${parseFloat(o.totalCost || 0).toLocaleString()}</td>
            <td>
                <span class="status-badge ${statusClass(o.status)}" style="margin-bottom:6px; display:inline-flex;">${o.status}</span>
                <select class="status-select orderStatusSelect" data-id="${o.id}">
                    ${STATUS_OPTIONS.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </td>
        </tr>
    `}).join('');

    adminOrdersList.querySelectorAll('.orderStatusSelect').forEach(sel => {
        sel.addEventListener('change', async (e) => {
            const orderId = e.target.getAttribute('data-id');
            const newStatus = e.target.value;
            try {
                await updateDoc(doc(db, "orders", orderId), { status: newStatus });
                showToast(`Order status updated to "${newStatus}".`, 'success');
            } catch (err) {
                showToast("Couldn't update order status: " + err.message, 'error');
            }
        });
    });
}

function updateAdminStats() {
    const elProducts = document.getElementById('statTotalProducts');
    const elOrders = document.getElementById('statTotalOrders');
    const elRevenue = document.getElementById('statRevenue');
    const elPending = document.getElementById('statPending');
    if (!elProducts && !elOrders && !elRevenue && !elPending) return;

    if (elProducts) elProducts.innerText = globalProducts.length;
    if (elOrders) elOrders.innerText = globalOrders.length;
    if (elRevenue) {
        const revenue = globalOrders
            .filter(o => o.status !== 'Cancelled')
            .reduce((sum, o) => sum + (parseFloat(o.totalCost) || 0), 0);
        elRevenue.innerText = "Rs " + revenue.toLocaleString();
    }
    if (elPending) elPending.innerText = globalOrders.filter(o => o.status === 'Pending Dispatch').length;
}

updateCartWidgetCount();

// Floating WhatsApp chat button — shown on every page.
// WhatsApp support is temporarily unavailable (no number set up yet), so the
// button just informs the customer instead of opening a chat. Once a number
// is ready, swap this back to an <a href="https://wa.me/..."> link.
const waBtn = document.createElement('button');
waBtn.type = "button";
waBtn.className = "whatsapp-float";
waBtn.innerHTML = '<i class="fab fa-whatsapp"></i>';
waBtn.setAttribute('aria-label', 'Chat with us on WhatsApp');
waBtn.addEventListener('click', () => {
    showToast("WhatsApp is currently unavailable — please order via our Instagram or the website.", 'info');
});
document.body.appendChild(waBtn);

// Contact page's "Chat on WhatsApp" button — same temporary unavailability message.
const contactWaBtn = document.getElementById('contactWhatsappBtn');
if (contactWaBtn) {
    contactWaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showToast("WhatsApp is currently unavailable — please order via our Instagram or the website.", 'info');
    });
}
