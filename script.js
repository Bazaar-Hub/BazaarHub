import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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
let localCart = JSON.parse(localStorage.getItem('bazaarhub_cart')) || [];

// Custom Floating Animation Popup Injector
function showAnimatedPopup(message, iconClass = "fas fa-check-circle") {
    const toast = document.getElementById('popupToast');
    if(toast) {
        toast.innerHTML = `<i class="${iconClass}" style="color: #facc15; font-size: 18px;"></i> <span>${message}</span>`;
        toast.classList.remove('show');
        void toast.offsetWidth; // Force CSS animation restart mechanism
        toast.classList.add('show');
    } else {
        alert(message);
    }
}

// 1. Auth Status Tracker Routing
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname;
    if (user) {
        if (currentPage.includes('auth.html')) { window.location.href = "index.html"; }
        setupAppRealtimeStreams();
    } else {
        if (!currentPage.includes('auth.html')) { window.location.href = "auth.html"; }
    }
});

// 2. Register Form Submission (Account Database Save - Untouched)
const regForm = document.getElementById('registerForm');
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPass').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name: name, email: email, phone: phone, role: "client"
            });
            showAnimatedPopup("REGISTERED SUCCESSFUL!");
            setTimeout(() => { window.location.href = "index.html"; }, 1600);
        } catch (error) {
            showAnimatedPopup(error.message, "fas fa-exclamation-triangle");
        }
    });
}

// 3. Login Form Submission
const logForm = document.getElementById('loginForm');
if (logForm) {
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPass').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showAnimatedPopup("LOGIN SUCCESSED!");
            setTimeout(() => { window.location.href = "index.html"; }, 1600);
        } catch (error) {
            showAnimatedPopup(error.message, "fas fa-exclamation-triangle");
        }
    });
}

// Logout Engine
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = "auth.html";
    });
}

// 4. Admin Panel Snapshot Streams (Safely Preserved)
function setupAppRealtimeStreams() {
    onSnapshot(collection(db, "products"), (snapshot) => {
        globalProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCatalogUI();
        renderAdminProducts();
    });

    const adminOrdersList = document.getElementById('adminOrdersList');
    if (adminOrdersList) {
        onSnapshot(collection(db, "orders"), (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            adminOrdersList.innerHTML = orders.map(o => `
                <tr>
                    <td><b>Addr:</b> ${o.address}<br><span style="color:#a1a1aa;"><b>Phone:</b> ${o.phone}</span></td>
                    <td style="font-weight:600;">${o.itemsSummary || 'Items'}</td>
                    <td class="accent-yellow" style="font-weight:800;">Rs. ${o.totalCost}</td>
                    <td><span style="background:#131525; padding:6px 12px; border-radius:8px; color:#facc15;">${o.status}</span></td>
                </tr>
            `).join('');
        });
    }
}

// 5. Render Catalog UI Cards
function renderCatalogUI() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    if (globalProducts.length === 0) {
        grid.innerHTML = `<p style="color:#a1a1aa; text-align:center; grid-column:1/-1;">No products available in vault.</p>`;
        return;
    }
    grid.innerHTML = globalProducts.map(p => `
        <div class="product-card">
            <img src="${p.image}" class="product-img">
            <div class="product-title">${p.name}</div>
            <div class="product-desc">${p.description}</div>
            <div class="product-price">Rs. ${p.price}</div>
            <button class="form-btn bg-yellow addToCartBtn" data-id="${p.id}">Add To Basket</button>
        </div>
    `).join('');

    document.querySelectorAll('.addToCartBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pId = e.target.getAttribute('data-id');
            const item = globalProducts.find(x => x.id === pId);
            if(item) {
                localCart.push(item);
                localStorage.setItem('bazaarhub_cart', JSON.stringify(localCart));
                if(document.getElementById('cartCount')) document.getElementById('cartCount').innerText = localCart.length;
                showAnimatedPopup(`${item.name} ADDED TO BASKET!`);
            }
        });
    });
}

// 6. Admin Panel Product Logic (Unbroken)
function renderAdminProducts() {
    const adminList = document.getElementById('adminProductsList');
    if (!adminList) return;
    adminList.innerHTML = globalProducts.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#0a0b14; padding:12px 16px; border-radius:12px; margin-bottom:12px; font-size:13px; border:1px solid #131525;">
            <span><b>${p.name}</b></span>
            <button class="deleteProductBtn" data-id="${p.id}" style="color:#f87171; font-weight:700;">Delete</button>
        </div>
    `).join('');
}
