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
