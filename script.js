// =========================================================================
// BAZAARHUB — FIREBASE AUTH, CATALOG, CHECKOUT & ADMIN CONSOLE
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, RecaptchaVerifier, linkWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
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
let currentUserProfile = { role: 'client', phoneVerified: false };
let confirmationResult = null;
let recaptchaVerifier = null;

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
        'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
        'auth/invalid-phone-number': "That phone number doesn't look valid. Use a Pakistani mobile number like 03001234567.",
        'auth/credential-already-in-use': 'This phone number is already verified on another account.',
        'auth/captcha-check-failed': "Verification check failed — please try again.",
        'auth/invalid-verification-code': "That code isn't right. Double-check and try again.",
        'auth/code-expired': 'That code expired — request a new one.',
        'auth/missing-verification-code': 'Enter the 6-digit code we texted you.',
        'auth/provider-already-linked': 'This account already has a verified phone number.'
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
// 2. GLOBAL AUTH MONITOR, ROUTE GUARD, ADMIN GUARD & PHONE-VERIFICATION GATE
// ==========================================
onAuthStateChanged(auth, async (user) => {
    const currentPage = window.location.pathname;

    if (!user) {
        if (!currentPage.includes('auth.html')) {
            window.location.href = "auth.html";
        }
        return;
    }

    let profile = { role: 'client', phoneVerified: false, phone: '' };
    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
            const d = userSnap.data();
            profile = { role: d.role || 'client', phoneVerified: !!d.phoneVerified, phone: d.phone || '' };
        }
    } catch (err) {
        console.error('Could not load user profile:', err);
    }
    currentUserProfile = profile;

    // Admins are manually vetted in the Firebase console, so they skip the SMS gate.
    const needsPhoneVerification = profile.role !== 'admin' && !profile.phoneVerified;

    if (needsPhoneVerification) {
        if (currentPage.includes('auth.html')) {
            showVerifyPanel(profile.phone);
        } else {
            window.location.href = "auth.html";
        }
        return;
    }

    if (currentPage.includes('auth.html')) {
        window.location.href = "index.html";
        return;
    }

    document.querySelectorAll('.admin-only-link').forEach(el => {
        el.classList.toggle('hidden', profile.role !== 'admin');
    });

    if (currentPage.includes('admin.html') && profile.role !== 'admin') {
        showToast("That area is restricted to admins.", 'error');
        window.location.href = "index.html";
        return;
    }

    setupAppRealtimeStreams();
});

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
        const password = document.getElementById('regPass').value;

        hideAuthError('registerError');
        const restore = setBtnLoading(submitBtn, 'Creating account…');

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name, email, phone: '', role: "client", phoneVerified: false
            });
            // onAuthStateChanged takes it from here and routes to phone verification.
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
            // onAuthStateChanged decides where to send them next (catalog or phone verification).
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
// 4b. PHONE VERIFICATION (mandatory — keeps fake accounts off the bazaar)
// ==========================================
function toE164Pakistan(raw) {
    let digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (digits.startsWith('92')) digits = digits.slice(2);
    return '+92' + digits;
}

function showVerifyPanel(savedPhone) {
    document.getElementById('authTabs')?.classList.add('hidden');
    document.getElementById('loginForm')?.classList.add('hidden');
    document.getElementById('registerForm')?.classList.add('hidden');
    document.getElementById('verifyPanel')?.classList.remove('hidden');

    const heading = document.getElementById('authHeading');
    const sub = document.getElementById('authSub');
    if (heading) heading.innerText = 'Verify your phone';
    if (sub) sub.innerText = "You're almost in — just confirm your number.";

    const phoneInput = document.getElementById('verifyPhone');
    if (phoneInput && savedPhone && !phoneInput.value) phoneInput.value = savedPhone;

    document.getElementById('verifyCodeStep')?.classList.add('hidden');
    document.getElementById('verifySendStep')?.classList.remove('hidden');
}

const sendCodeBtn = document.getElementById('sendCodeBtn');
if (sendCodeBtn) {
    sendCodeBtn.addEventListener('click', async () => {
        hideAuthError('verifyError');
        const rawPhone = document.getElementById('verifyPhone').value.trim();
        const e164 = toE164Pakistan(rawPhone);

        if (!/^\+92\d{10}$/.test(e164)) {
            showAuthError('verifyError', 'Enter a valid Pakistani mobile number, e.g. 03001234567.');
            return;
        }

        const restore = setBtnLoading(sendCodeBtn, 'Sending…');
        try {
            if (!recaptchaVerifier) {
                recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
            }
            confirmationResult = await linkWithPhoneNumber(auth.currentUser, e164, recaptchaVerifier);
            document.getElementById('verifySendStep').classList.add('hidden');
            document.getElementById('verifyCodeStep').classList.remove('hidden');
            showToast('Code sent! Check your SMS inbox.', 'success');
        } catch (error) {
            try { recaptchaVerifier?.clear(); } catch (_) { /* no-op */ }
            recaptchaVerifier = null;
            showAuthError('verifyError', friendlyAuthError(error));
        } finally {
            restore();
        }
    });
}

const confirmCodeBtn = document.getElementById('confirmCodeBtn');
if (confirmCodeBtn) {
    confirmCodeBtn.addEventListener('click', async () => {
        hideAuthError('verifyError');
        const code = document.getElementById('otpCode').value.trim();
        if (!code) {
            showAuthError('verifyError', 'Enter the 6-digit code we texted you.');
            return;
        }

        const restore = setBtnLoading(confirmCodeBtn, 'Confirming…');
        try {
            if (!confirmationResult) throw new Error('Request a code first.');
            await confirmationResult.confirm(code);
            // Force a fresh ID token so Firestore rules immediately see the verified phone claim.
            await auth.currentUser.getIdToken(true);
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                phoneVerified: true,
                phone: auth.currentUser.phoneNumber
            });
            showToast('Phone verified — welcome to BazaarHub!', 'success');
            window.location.href = "index.html";
        } catch (error) {
            restore();
            showAuthError('verifyError', friendlyAuthError(error));
        }
    });
}

const resendCodeBtn = document.getElementById('resendCodeBtn');
if (resendCodeBtn) {
    resendCodeBtn.addEventListener('click', () => {
        confirmationResult = null;
        document.getElementById('verifyCodeStep').classList.add('hidden');
        document.getElementById('verifySendStep').classList.remove('hidden');
    });
}

const verifySignOut = document.getElementById('verifySignOut');
if (verifySignOut) {
    verifySignOut.addEventListener('click', async () => {
        await signOut(auth);
        window.location.reload();
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
        renderAdminProducts();
        updateAdminStats();
    });

    const adminOrdersList = document.getElementById('adminOrdersList');
    if (adminOrdersList) {
        onSnapshot(collection(db, "orders"), (snapshot) => {
            globalOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            renderAdminOrders();
            updateAdminStats();
        });
    }
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
            <div class="product-img-wrap">
                <img src="${p.image}" class="product-img" alt="${p.name}" loading="lazy">
                <span class="product-category">${p.category || 'General'}</span>
            </div>
            <div class="product-title">${p.name}</div>
            <div class="product-desc">${p.description}</div>
            <div class="product-footer">
                <span class="price-tag">Rs ${parseFloat(p.price).toLocaleString()}</span>
            </div>
            <button class="btn btn-primary addToCartBtn" data-id="${p.id}"><i class="fas fa-basket-shopping"></i> Add to Basket</button>
        </div>
    `).join('');

    document.querySelectorAll('.addToCartBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const triggerBtn = e.currentTarget;
            const pId = triggerBtn.getAttribute('data-id');
            const item = globalProducts.find(x => x.id === pId);
            if (item) {
                localCart.push(item);
                localStorage.setItem('bazaarhub_cart', JSON.stringify(localCart));
                updateCartWidgetCount();
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
    document.querySelectorAll('#cartCount').forEach(counter => counter.innerText = localCart.length);
}

// ==========================================
// 7. CHECKOUT / ORDER PROCESSING
// ==========================================
const checkoutItemsWrap = document.getElementById('checkoutSummaryItemsContainer');
if (checkoutItemsWrap) {
    let priceSum = 0;

    if (localCart.length === 0) {
        checkoutItemsWrap.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-basket-shopping"></i>
                <p>Your basket is empty.<br><a href="index.html" class="accent-gold">Browse the bazaar →</a></p>
            </div>`;
    } else {
        checkoutItemsWrap.innerHTML = localCart.map(i => {
            priceSum += parseFloat(i.price);
            return `<div class="summary-item"><span class="item-name">${i.name}</span><span class="accent-gold" style="font-weight:700;">Rs ${parseFloat(i.price).toLocaleString()}</span></div>`;
        }).join('');
    }

    const displayTotal = document.getElementById('checkoutSummaryTotalDisplay');
    if (displayTotal) displayTotal.innerText = "Rs " + priceSum.toLocaleString();

    const checkForm = document.getElementById('checkoutForm');
    if (checkForm) {
        checkForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = checkForm.querySelector('button[type="submit"]');

            if (localCart.length === 0) {
                showToast("Your basket is empty — add something first.", 'error');
                return;
            }

            const orderPayload = {
                userUid: auth.currentUser ? auth.currentUser.uid : "GUEST",
                address: document.getElementById('custAddress').value.trim(),
                city: document.getElementById('custCity').value.trim(),
                phone: document.getElementById('custPhone').value.trim(),
                itemsSummary: localCart.map(i => i.name).join(', '),
                totalCost: priceSum,
                status: "Pending Dispatch",
                timestamp: new Date().toISOString()
            };

            const restore = setBtnLoading(submitBtn, 'Placing order…');

            try {
                await addDoc(collection(db, "orders"), orderPayload);
                localCart = [];
                localStorage.removeItem('bazaarhub_cart');
                showToast("Order placed! Track it any time from your account.", 'success');
                setTimeout(() => { window.location.href = "index.html"; }, 1100);
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
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('formSubmitBtn');
        const payload = {
            name: document.getElementById('pName').value.trim(),
            category: document.getElementById('pCategory').value.trim(),
            price: parseFloat(document.getElementById('pPrice').value),
            image: document.getElementById('pImage').value.trim(),
            description: document.getElementById('pDesc').value.trim()
        };

        const restore = setBtnLoading(submitBtn, 'Saving…');
        try {
            await addDoc(collection(db, "products"), payload);
            showToast(`"${payload.name}" was added to the catalog.`, 'success');
            addProductForm.reset();
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
        adminOrdersList.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center; padding:30px 0;">No orders have come in yet.</td></tr>`;
        return;
    }

    const sorted = [...globalOrders].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

    adminOrdersList.innerHTML = sorted.map(o => `
        <tr>
            <td class="order-meta"><b>${o.city || ''}</b><br>${o.address || ''}<br>${o.phone || ''}</td>
            <td class="order-meta">${o.itemsSummary || ''}</td>
            <td class="accent-gold" style="font-weight:800; font-family:var(--font-mono);">Rs ${parseFloat(o.totalCost || 0).toLocaleString()}</td>
            <td>
                <span class="status-badge ${statusClass(o.status)}" style="margin-bottom:6px; display:inline-flex;">${o.status}</span>
                <select class="status-select orderStatusSelect" data-id="${o.id}">
                    ${STATUS_OPTIONS.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </td>
        </tr>
    `).join('');

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
