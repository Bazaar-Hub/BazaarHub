// =========================================================================
// FIREBASE LIFETIME MULTI-DEVICE LOGIN & REGISTER SYSTEM (INTEGRATED)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Your web app's Firebase configuration (FINAL CORRECTED WITH DATABASE URL)
const firebaseConfig = {
  apiKey: "AIzaSyBQ5JXRZUqW75b78Lf90SgsncohByPHaoE",
  authDomain: "bazaarhub-7fad9.firebaseapp.com",
  projectId: "bazaarhub-7fad9",
  storageBucket: "bazaarhub-7fad9.firebasestorage.app",
  messagingSenderId: "234144258685",
  appId: "1:234144258685:web:01743589d514f78a64ef14",
  databaseURL: "https://bazaarhub-7fad9-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// State Pipeline Framework Databases Arrays
let products = [];
let cart = JSON.parse(localStorage.getItem('bazaarhub_cart_matrix')) || [];
let currentCategoryFilterRoute = 'ALL';

// --- 1. SECURE DATABASE SYNC & LISTENERS ROUTER ---
if (document.getElementById('storefrontDynamicViewgridEngine')) {
    onSnapshot(collection(db, "products"), (snapshot) => {
        products = [];
        snapshot.forEach((docSnap) => {
            products.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderEcosystemViewgridEngine();
    });
}

if (document.getElementById('adminProductsList') || document.getElementById('adminOrdersList')) {
    onSnapshot(collection(db, "products"), (snapshot) => {
        products = [];
        snapshot.forEach((docSnap) => {
            products.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderAdminDashboardMatrix();
    });

    onSnapshot(collection(db, "orders"), (snapshot) => {
        let ordersArray = [];
        snapshot.forEach((docSnap) => {
            ordersArray.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderAdminOrdersMatrix(ordersArray);
    });
}

// --- 2. GLOBAL MATRIX FOR AUTH DATA SYNCHRONIZATION ---
window.registerUserAccount = async function(event) {
    if (event) event.preventDefault();
    const nameField = document.getElementById('regName');
    const emailField = document.getElementById('regEmail');
    const phoneField = document.getElementById('regPhone');
    const passField = document.getElementById('regPass');

    if (!emailField || !passField) return;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailField.value, passField.value);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            fullName: nameField ? nameField.value : '',
            email: emailField.value,
            phone: phoneField ? phoneField.value : '',
            role: "client",
            createdAt: new Date().toISOString()
        });

        alert("Account synchronized securely with central node registry!");
        window.location.href = 'index.html';
    } catch (error) {
        alert("Registration Core Error: " + error.message);
    }
};

window.loginUserPortal = async function(event) {
    if (event) event.preventDefault();
    const emailField = document.getElementById('loginEmail');
    const passField = document.getElementById('loginPass');

    if (!emailField || !passField) return;

    try {
        await signInWithEmailAndPassword(auth, emailField.value, passField.value);
        alert("Access authenticated. Telemetry verification approved.");
        window.location.href = 'index.html';
    } catch (error) {
        alert("Authentication Engine Denied: " + error.message);
    }
};

window.logoutSecureSession = function() {
    signOut(auth).then(() => {
        alert("Active network session terminated cleanly.");
        window.location.href = 'index.html';
    });
};

onAuthStateChanged(auth, async (user) => {
    const slot = document.getElementById('authActionBtnSlot');
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        let userName = "Authorized Operator";
        if (userDoc.exists()) {
            userName = userDoc.data().fullName || userName;
        }
        if (slot) {
            slot.innerHTML = `
                <span style="color:#facc15; font-size:12px; margin-right:12px; font-weight:700;">Hi, ${userName}</span>
                <button onclick="window.logoutSecureSession()" class="action-btn" style="background:linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color:white;">LOGOUT</button>
            `;
        }
    } else {
        if (slot) {
            slot.innerHTML = `<button onclick="window.location.href='auth.html'" class="action-btn">SECURE AUTHORIZATION</button>`;
        }
    }
});

// --- 3. STOREFRONT DISPATCH ARCHITECTURE RENDERING ---
function renderEcosystemViewgridEngine() {
    const canvas = document.getElementById('storefrontDynamicViewgridEngine');
    if (!canvas) return;

    let targetArray = currentCategoryFilterRoute === 'ALL' ? products : products.filter(p => p.category === currentCategoryFilterRoute);

    if (targetArray.length === 0) {
        canvas.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#9ca3af;">No dynamic assets mapped to this module router path.</div>`;
        return;
    }

    canvas.innerHTML = targetArray.map(p => `
        <div class="product-3d-card-node">
            <div class="card-media-canvas">
                <img src="${p.image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=400'}" alt="product Image">
            </div>
            <div class="card-info-deck">
                <div>
                    <div class="card-routing-tag">${p.category}</div>
                    <h3 class="card-header-title">${p.name}</h3>
                </div>
                <div class="card-pricing-row">
                    <span class="matrix-price-display">Rs. ${p.price}</span>
                    <button class="action-btn" onclick="window.addItemToCartMatrix('${p.id}')">PROVISION TO CART</button>
                </div>
            </div>
        </div>
    `).join('');
    updateCartHUDCounters();
}

window.applyCategoryFilterRoute = function(cat) {
    currentCategoryFilterRoute = cat;
    const items = document.querySelectorAll('.filter-category-node');
    items.forEach(node => {
        if (node.innerText.toLowerCase().includes(cat.toLowerCase()) || (cat === 'ALL' && node.innerText.toLowerCase().includes('all'))) {
            node.classList.add('active');
        } else {
            node.classList.remove('active');
        }
    });
    renderEcosystemViewgridEngine();
};

// --- 4. CART ENGINE CONTROLLER ROUTINES ---
window.addItemToCartMatrix = function(id) {
    const asset = products.find(p => p.id === id);
    if (!asset) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id: asset.id, name: asset.name, price: asset.price, image: asset.image, qty: 1 });
    }
    syncCartCacheStorage();
};

function syncCartCacheStorage() {
    localStorage.setItem('bazaarhub_cache_cart', JSON.stringify(cart));
    updateCartHUDCounters();
}

function updateCartHUDCounters() {
    const badge = document.getElementById('globalCartTelemetryBadge');
    if (badge) badge.innerText = cart.reduce((acc, item) => acc + item.qty, 0);

    const container = document.getElementById('cartDrawerStreamItemsContainer');
    const totalDisplay = document.getElementById('cartDrawerTotalValuationDisplay');
    let totalSum = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    if (totalDisplay) totalDisplay.innerText = `Rs. ${totalSum}`;

    if (container) {
        if (cart.length === 0) {
            container.innerHTML = `<p style="font-size:12px; color:#9ca3af; text-align:center; padding:20px;">Cart pipeline array is vacant.</p>`;
        } else {
            container.innerHTML = cart.map((item, idx) => `
                <div class="cart-stream-node">
                    <img src="${item.image}" style="width:100%; height:45px; object-fit:cover; border-radius:6px;">
                    <div>
                        <h4 style="font-size:12px; font-weight:700;">${item.name}</h4>
                        <p style="font-size:11px; color:#facc15;">Rs. ${item.price} x ${item.qty}</p>
                    </div>
                    <i class="fas fa-trash-alt" style="color:#ef4444; cursor:pointer; font-size:12px;" onclick="window.eraseCartItemNode(${idx})"></i>
                </div>
            `).join('');
        }
    }
    renderCheckoutSummaryEcosystem();
}

window.eraseCartItemNode = function(idx) {
    cart.splice(idx, 1);
    syncCartCacheStorage();
};

window.toggleCartDrawerFlyover = function() {
    const drawer = document.getElementById('cartFlyoverDrawerHUD');
    if(drawer) drawer.classList.toggle('active');
};

// --- 5. CHECKOUT SYSTEM PROCESSOR LAYERS ---
function renderCheckoutSummaryEcosystem() {
    const block = document.getElementById('checkoutSummaryItemsContainer');
    const display = document.getElementById('checkoutSummaryTotalDisplay');
    let totalSum = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    if (display) display.innerText = `Rs. ${totalSum}`;
    if (block) {
        if (cart.length === 0) {
            block.innerHTML = `<p style="font-size:12px; color:#9ca3af;">No pending checkout manifests matched.</p>`;
        } else {
            block.innerHTML = cart.map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:13px;">
                    <span>${item.name} <strong>x${item.qty}</strong></span>
                    <span style="color:#facc15; font-weight:700;">Rs. ${item.price * item.qty}</span>
                </div>
            `).join('');
        }
    }
}

const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) {
            alert("Checkout terminal tracking vector cannot proceed with zero item parameters.");
            return;
        }

        const orderManifest = {
            customerName: document.getElementById('custFirstName').value + " " + document.getElementById('custLastName').value,
            address: document.getElementById('custAddress').value,
            city: document.getElementById('custCity').value,
            phone: document.getElementById('custPhone').value,
            items: cart.map(i => `${i.name} (x${i.qty})`).join(', '),
            cost: "Rs. " + cart.reduce((acc, i) => acc + (i.price * i.qty), 0),
            status: "Pending Verification",
            timestamp: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "orders"), orderManifest);
            alert("Order packet successfully processed, registered and dispatched into database cloud nodes!");
            cart = [];
            syncCartCacheStorage();
            window.location.href = 'index.html';
        } catch (err) {
            alert("Logistics Injection Defect: " + err.message);
        }
    });
}

// --- 6. ADMIN DASHBOARD CONTROL MODULE LAYER ---
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const docId = document.getElementById('editIndex').value;
        const payload = {
            name: document.getElementById('pName').value,
            category: document.getElementById('pCategory').value,
            price: Number(document.getElementById('pPrice').value),
            image: document.getElementById('pImage').value,
            description: document.getElementById('pDesc').value
        };

        try {
            if (docId) {
                await setDoc(doc(db, "products", docId), payload);
                document.getElementById('editIndex').value = '';
                document.getElementById('formSubmitBtn').innerText = "SAVE NODE MODULE";
                alert("Vault matrix data block successfully modified!");
            } else {
                await addDoc(collection(db, "products"), payload);
                alert("New asset successfully initialized into configuration database paths!");
            }
            addProductForm.reset();
        } catch (err) {
            alert("Database Mutation Error: " + err.message);
        }
    });
}

function renderAdminDashboardMatrix() {
    const list = document.getElementById('adminProductsList');
    if (!list) return;

    list.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#14141c; padding:10px 14px; border:1px solid #1f2937; border-radius:8px; margin-bottom:8px; font-size:12px;">
            <span><strong>${p.name}</strong> (${p.category}) - Rs. ${p.price}</span>
            <div>
                <button onclick="window.editProductConsole('${p.id}')" style="color:#facc15; margin-right:10px; font-weight:700;">EDIT</button>
                <button onclick="window.deleteProductConsole('${p.id}')" style="color:#ef4444; font-weight:700;">DELETE</button>
            </div>
        </div>
    `).join('');
}

function renderAdminOrdersMatrix(orders) {
    const list = document.getElementById('adminOrdersList');
    if (!list) return;

    if (orders.length === 0) {
        list.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#9ca3af;">Zero transaction manifests active in tracking database loop.</td></tr>`;
        return;
    }

    list.innerHTML = orders.map(o => `
        <tr>
            <td style="font-size:11px;"><strong>Client:</strong> ${o.customerName}<br><strong>Destination:</strong> ${o.address}, ${o.city}<br><strong>Contact Cell:</strong> ${o.phone}</td>
            <td style="font-size:11px; max-width:200px; white-space:normal; word-break:break-word;">${o.items}</td>
            <td style="font-weight:700; color:#facc15;">${o.cost}</td>
            <td>
                <select onchange="window.changeStatusAction('${o.id}', this.value)" style="margin:0; padding:5px; font-size:11px; background:#14141c; color:white; border-color:#374151; border-radius:4px;">
                    <option value="Pending Verification" ${o.status === 'Pending Verification' ? 'selected' : ''}>Pending</option>
                    <option value="Placed" ${o.status === 'Placed' ? 'selected' : ''}>Placed</option>
                    <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
        </tr>
    `).join('');
}

window.editProductConsole = function(id) {
    const p = products.find(item => item.id === id);
    if (!p) return;
    document.getElementById('editIndex').value = id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pCategory').value = p.category;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pImage').value = p.image;
    document.getElementById('pDesc').value = p.description || '';
    document.getElementById('formSubmitBtn').innerText = "UPDATE PRODUCT";
};

window.deleteProductConsole = async function(id) {
    if (confirm("Permanently erase product record block from database arrays?")) {
        await deleteDoc(doc(db, "products", id));
    }
};

window.changeStatusAction = async function(docId, statusValue) {
    await setDoc(doc(db, "orders", docId), { status: statusValue }, { merge: true });
    alert("Logistics status route dynamically patched successfully!");
};

// Auto-run baseline system ticks on script load
updateCartHUDCounters();
