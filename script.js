// =========================================================================
// BAZAARHUB - CORE MASTER JS MODULE
// Includes: Firebase Init, Authentication Pipelines, Cart System, 
// Order Processing, & Admin Panel Tracking Dashboard.
// =========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Your Firebase Config Block
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
let localCart = JSON.parse(localStorage.getItem('bh_cart')) || [];
const currentPage = window.location.pathname;

// Advanced Marketing Notification System
const bhNotif = (message, type = 'info') => {
    let container = document.getElementById('bh-notif-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'bh-notif-container';
        container.style.cssText = 'position: fixed; top: 30px; right: 30px; z-index: 2500; display: flex; flex-direction: column; gap: 12px;';
        document.body.appendChild(container);
    }
    const notif = document.createElement('div');
    notif.style.cssText = `background: #0b0b12; color: #fff; padding: 16px 24px; border-radius: 14px; font-weight: 800; font-size: 13px; box-shadow: 0 15px 35px rgba(0,0,0,0.5); border-left: 4px solid var(--accent); animation: fadeInLeft var(--transition-slow) forwards;`;
    if(type === 'success') notif.style.borderColor = '#10b981';
    if(type === 'danger') notif.style.borderColor = '#ef4444';
    notif.innerText = message;
    container.appendChild(notif);
    setTimeout(() => { notif.remove(); }, 3500);
};

// Route Security Guard
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (currentPage.includes('auth.html')) window.location.href = "index.html";
        setupAppRealtimeStreams();
    } else {
        if (!currentPage.includes('auth.html')) window.location.href = "auth.html";
    }
});

// Authentication Handlers
const regForm = document.getElementById('regForm');
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, document.getElementById('regEmail').value.trim(), document.getElementById('regPass').value);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name: document.getElementById('regName').value.trim(),
                phone: document.getElementById('regPhone').value.trim(),
                role: "client"
            });
            window.location.href = "index.html"; 
        } catch (error) { bhNotif(error.message, 'danger'); }
    });
}

const logForm = document.getElementById('logForm');
if (logForm) {
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, document.getElementById('loginEmail').value.trim(), document.getElementById('loginPass').value);
            window.location.href = "index.html"; 
        } catch (error) { bhNotif("Invalid Cipher Credentials.", 'danger'); }
    });
}

const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn) { logoutBtn.addEventListener('click', async () => { await signOut(auth); window.location.href = "auth.html"; }); }

// Realtime Flow Pipelines
function setupAppRealtimeStreams() {
    onSnapshot(collection(db, "products"), (snapshot) => {
        globalProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if(document.getElementById('productGrid')) renderCatalogUI();
        if(document.getElementById('adminProductsList')) renderAdminProducts();
    });

    if(document.getElementById('adminOrdersList')) {
        onSnapshot(collection(db, "orders"), (snapshot) => {
            const orders = snapshot.docs.map(doc => doc.data());
            renderAdminOrders(orders);
        });
    }
}

// UI Render Templates
function renderCatalogUI() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = globalProducts.map((p, i) => `
        <div class="product-card" style="animation-delay: ${i*0.05}s">
            <img src="${p.image}" class="product-image" alt="Asset">
            <div class="product-title">${p.name}</div>
            <div class="product-desc">${p.description}</div>
            <div class="product-price">PKR ${parseFloat(p.price).toLocaleString()}</div>
            <button class="btn-primary addToCartBtn" data-id="${p.id}">Add To Basket</button>
        </div>
    `).join('');
    
    document.querySelectorAll('.addToCartBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = globalProducts.find(x => x.id === e.target.dataset.id);
            if(item) {
                localCart.push(item);
                localStorage.setItem('bh_cart', JSON.stringify(localCart));
                bhNotif(`${item.name} pushed to basket!`, 'success');
            }
        });
    });
}

// Admin Panel Interactivity Layouts
const addProductForm = document.getElementById('addProductForm');
if(addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('pName').value.trim(),
            price: document.getElementById('pPrice').value,
            image: document.getElementById('pImg').value.trim(),
            description: document.getElementById('pDesc').value.trim()
        };
        try {
            await addDoc(collection(db, "products"), payload);
            bhNotif("Asset data node injected perfectly!", 'success');
            addProductForm.reset();
        } catch(err) { bhNotif(err.message, 'danger'); }
    });
}

function renderAdminProducts() {
    const adminList = document.getElementById('adminProductsList');
    adminList.innerHTML = globalProducts.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#121220; padding:14px 18px; border-radius:14px; border:1px solid var(--border-bright); transition: var(--transition-fast);">
            <span><b style="color:var(--accent);">${p.name}</b> (PKR ${parseFloat(p.price).toLocaleString()})</span>
            <button class="deleteProductBtn" data-id="${p.id}" style="color:var(--danger); font-weight:900; font-size:12px;"><i class="fas fa-trash-alt"></i> REMOVE</button>
        </div>
    `).join('');

    document.querySelectorAll('.deleteProductBtn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(confirm("Confirm destructive erasure of this product?")) {
                await deleteDoc(doc(db, "products", e.target.dataset.id));
                bhNotif("Asset wiped from database registry.", 'info');
            }
        });
    });
}

function renderAdminOrders(orders) {
    const list = document.getElementById('adminOrdersList');
    if(!list) return;
    if(orders.length === 0) {
        list.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:30px; color:var(--text-secondary);">No client pipelines active.</td></tr>`;
        return;
    }
    list.innerHTML = orders.map(o => `
        <tr style="border-bottom:1px solid var(--border-dim); transition: var(--transition-fast);">
            <td style="padding:14px; font-weight:800;">${o.city} <br><span style="font-size:11px; color:var(--text-secondary); font-weight:400;">${o.address}</span></td>
            <td style="padding:14px; color:var(--text-secondary);">${o.items.map(i => i.name).join(', ')}</td>
            <td style="padding:14px; font-weight:900; color:var(--accent);">PKR ${parseFloat(o.total).toLocaleString()}</td>
        </tr>
    `).join('');
}


// =========================================================================
// BAZAARHUB - CORE JS MODULE
// Includes: Firebase Init, Authenticaion Pipelines, Cart Management,
// Order Processing, and Professional UI Micro-Feedback Animations.
// =========================================================================

// 1. Firebase System Configuration
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// !!! CRITICAL: Replace with your actual Firebase Configuration !!!
const firebaseConfig = {
  apiKey: "AIzaSy_REPLACE_WITH_YOUR_KEY_HERE",
  authDomain: "bazaarhub-REPLACE.firebaseapp.com",
  projectId: "bazaarhub-REPLACE",
  storageBucket: "bazaarhub-REPLACE.firebasestorage.app",
  messagingSenderId: "REPLACE",
  appId: "REPLACE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 2. State & Utilities
// ==========================================
let globalProducts = [];
let localCart = JSON.parse(localStorage.getItem('bh_cart')) || [];
const currentPage = window.location.pathname;

// Advanced Notification Utility (Instead of alerts)
const bhNotif = (message, type = 'info') => {
    // Check if container exists, else create
    let container = document.getElementById('bh-notif-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'bh-notif-container';
        container.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 10px;';
        document.body.appendChild(container);
    }

    const notif = document.createElement('div');
    notif.style.cssText = `background: #0b0b12; color: #fff; padding: 16px 24px; border-radius: 12px; font-weight: bold; font-size: 14px; min-width: 280px; box-shadow: 0 10px 20px rgba(0,0,0,0.4); border-left: 4px solid #facc15; animation: fadeInLeft 0.4s ease forwards;`;
    
    if(type === 'success') notif.style.borderColor = '#10b981';
    if(type === 'danger') notif.style.borderColor = '#ef4444';

    notif.innerText = message;
    container.appendChild(notif);

    // Fade out and remove
    setTimeout(() => {
        notif.style.animation = 'fadeInLeft 0.4s ease reverse forwards';
        setTimeout(() => notif.remove(), 400);
    }, 3000);
}

// 3. Global Auth Monitor & Redirect Protection
// ==========================================
onAuthStateChanged(auth, (user) => {
    // Handle Page Restrictions
    if (user) {
        // User is logged in
        if (currentPage.includes('auth.html')) {
            window.location.href = "index.html"; // Block login page access
        }
        setupAppRealtimeStreams(); // Load protected data
    } else {
        // User is logged out
        if (!currentPage.includes('auth.html')) {
            window.location.href = "auth.html"; // Force login for all other pages
        }
    }
});

// 4. Authentication Pipeline Mechanisms
// ==========================================

// Handle Client Registration
const regForm = document.getElementById('regForm');
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = regForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CREATING...';

        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPass').value;

        try {
            // Create Firebase Auth Account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Inject additional user details into Firestore DB
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name: name,
                email: email,
                phone: phone,
                role: "client" // Standard role
            });
            bhNotif("Marketplace Account Activated!", 'success');
            window.location.href = "index.html"; 
        } catch (error) {
            bhNotif(`Error: ${error.message}`, 'danger');
            submitBtn.innerText = 'CREATE ACCOUNT';
        }
    });
}

// Handle Secure Login
const logForm = document.getElementById('logForm');
if (logForm) {
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = logForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AUTHENTICATING...';

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPass').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            bhNotif("Login Successful. Welcome back!", 'success');
            window.location.href = "index.html"; 
        } catch (error) {
            bhNotif("Credentials Rejected. Check details.", 'danger');
            submitBtn.innerText = 'SECURE LOGIN';
        }
    });
}

// Handle Logout Pipeline
const logoutBtns = document.querySelectorAll('.nav-logout');
logoutBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = "auth.html";
    });
});

// 5. Realtime Cloud Data Pipeline Stream
// ==========================================
function setupAppRealtimeStreams() {
    // 1. Stream Products Stream (Loads the Catalog)
    const productGrid = document.getElementById('productGrid');
    if(productGrid) {
        onSnapshot(collection(db, "products"), (snapshot) => {
            globalProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderCatalogUI();
        });
    }

    // 2. Admin Specific Data Streams (If added later)
    // Add logic here for orders list on an admin page if needed.
}

// 6. UI Renderers & Feedback Mechanics
// ==========================================

// Render Product Catalog UI
function renderCatalogUI() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    if (globalProducts.length === 0) {
        grid.innerHTML = `<div style="color:var(--text-secondary); text-align:center; grid-column: 1/-1; padding: 60px 0; font-weight:700;">Marketplace is currently initializing... <br><br> Add assets via Firebase Firestore 'products' collection.</div>`;
        return;
    }

    grid.innerHTML = globalProducts.map((p, index) => `
        <div class="product-card" style="animation-delay: ${index * 0.1}s">
            <img src="${p.image}" class="product-image" alt="${p.name}">
            <div class="product-title">${p.name}</div>
            <div class="product-desc">${p.description}</div>
            <div class="product-price">PKR ${parseFloat(p.price).toLocaleString()}</div>
            <button class="btn-primary addToCartBtn" data-id="${p.id}">Add To Basket</button>
        </div>
    `).join('');

    // Attach Event Listeners to New Buttons
    document.querySelectorAll('.addToCartBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleAddToCart(e);
        });
    });
}

// Handle Add to Cart Logic & Button Feedback Animation
function handleAddToCart(e) {
    const pId = e.target.getAttribute('data-id');
    const item = globalProducts.find(x => x.id === pId);
    
    if(item) {
        localCart.push(item);
        localStorage.setItem('bh_cart', JSON.stringify(localCart));
        updateCartWidgetCount();
        
        // Micro-feedback UI alert animation
        const originalText = e.target.innerText;
        e.target.innerText = "ADDED! ✓";
        e.target.classList.add('btn-added');
        e.target.disabled = true; // Temporary disable
        
        setTimeout(() => {
            e.target.innerText = originalText;
            e.target.classList.remove('btn-added');
            e.target.disabled = false;
        }, 1200);
    }
}

// Update the Navigation Cart Counter
function updateCartWidgetCount() {
    const counter = document.getElementById('cartCount');
    if(counter) {
        counter.innerText = localCart.length;
        if(localCart.length > 0) {
            counter.classList.remove('hidden');
        } else {
            counter.classList.add('hidden');
        }
    }
}

// Initial Widget Sync
updateCartWidgetCount();
