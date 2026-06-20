// =========================================================================
// BAZAARHUB ADVANCED INTERCONNECTED OPERATION LOGIC
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPlpnfGWTiUQlyl2vH6uM_Ae6_EQ8YW5E",
  authDomain: "bazaarhubnew-79dee.firebaseapp.com",
  projectId: "bazaarhubnew-79dee",
  storageBucket: "bazaarhubnew-79dee.firebasestorage.app",
  messagingSenderId: "452492018395",\n  appId: "1:452492018395:web:6c3cf8d956ce7fe45b42fe"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let globalProducts = [];
let localCart = JSON.parse(localStorage.getItem('bhub_cart')) || [];

// 1. LIFETIME ROUTER GATEWAY CONTROL
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname.split("/").pop();
    
    if (user) {
        // Agar user logged in hai aur auth page par hai to use seedha main page bhejein
        if (currentPath === "auth.html" || currentPath === "") {
            window.location.href = "index.html";
        }
    } else {
        // Agar logged in nahi hai to use sirf auth.html par rehne dein
        if (currentPath !== "auth.html") {
            window.location.href = "auth.html";
        }
    }
    updateCartVisuals();
});

// 2. REGISTRATION CONTROLLER
const regForm = document.getElementById('registerForm');
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPass').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name: name,
                email: email,
                role: "client"
            });
            alert("Account created successfully!");
            window.location.href = "index.html";
        } catch (error) {
            alert("Registration Fault: " + error.message);
        }
    });
}

// 3. LOGIN INTERFACE CONTROLLER
const logForm = document.getElementById('loginForm');
if (logForm) {
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPass').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Welcome back!");
            window.location.href = "index.html";
        } catch (error) {
            alert("Access Denied: " + error.message);
        }
    });
}

// 4. LOGOUT ENGINE
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = "auth.html";
        });
    });
}

// 5. MARKET REALTIME PRODUCTS LISTENER
const productsGrid = document.getElementById('productsGrid');
if (productsGrid) {
    onSnapshot(collection(db, "products"), (snapshot) => {
        globalProducts = [];
        snapshot.forEach(doc => {
            globalProducts.push({ id: doc.id, ...doc.data() });
        });
        renderMarketplaceCatalog();
    });
}

function renderMarketplaceCatalog() {
    if (!productsGrid) return;
    if (globalProducts.length === 0) {
        productsGrid.innerHTML = `<p style="color:#94a3b8; font-size:13px;">No assets inside the vault yet.</p>`;
        return;
    }
    productsGrid.innerHTML = globalProducts.map(p => `
        <div class="product-card">
            <img src="${p.img}" class="product-img" alt="product"/>
            <h3 style="font-size:15px; margin:12px 0 6px 0; font-weight:700;">${p.name}</h3>
            <p style="color:#94a3b8; font-size:12px; height:36px; overflow:hidden; margin-bottom:12px;">${p.desc}</p>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#facc15; font-weight:800; font-size:15px;">Rs. ${p.price}</span>
                <button class="form-btn bg-yellow add-to-cart-btn" data-id="${p.id}" style="width:auto; padding:6px 12px; font-size:11px; border-radius:8px;">+ Add</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pid = e.target.getAttribute('data-id');
            const item = globalProducts.find(prod => prod.id === pid);
            if (item) {
                localCart.push(item);
                localStorage.setItem('bhub_cart', JSON.stringify(localCart));
                updateCartVisuals();
                alert(`${item.name} added to data basket!`);
            }
        });
    });
}

// 6. ADMINISTRATIVE ADD ASSET ROUTINE
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('pName').value.trim(),
            price: Number(document.getElementById('pPrice').value),
            img: document.getElementById('pImg').value.trim(),
            desc: document.getElementById('pDesc').value.trim()
        };
        try {
            await addDoc(collection(db, "products"), payload);
            alert("Asset successfully injected into the system database!");
            addProductForm.reset();
        } catch (err) {
            alert("Database Error: " + err.message);
        }
    });
}

// 7. BACKEND ORDERS LOGS DISPATCHER
const adminOrdersList = document.getElementById('adminOrdersList');
if (adminOrdersList) {
    onSnapshot(collection(db, "orders"), (snapshot) => {
        let ordersHtml = "";
        snapshot.forEach(doc => {
            const o = doc.data();
            ordersHtml += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                    <td style="padding:12px; color:#e2e8f0;">${o.address}, ${o.city}</td>
                    <td style="padding:12px; color:#94a3b8;">${o.phone}</td>
                    <td style="padding:12px; color:#facc15; font-weight:700;">Received Process</td>
                </tr>
            `;
        });
        adminOrdersList.innerHTML = ordersHtml || `<tr><td colspan="3" style="padding:15px; color:#94a3b8;">No incoming active orders.</td></tr>`;
    });
}

// 8. CHECKOUT CONSOLE MANAGER
const checkSummaryItems = document.getElementById('checkoutSummaryItemsContainer');
const checkSummaryTotal = document.getElementById('checkoutSummaryTotalDisplay');
const checkoutForm = document.getElementById('checkoutForm');

if (checkSummaryItems && checkSummaryTotal) {
    if (localCart.length === 0) {
        checkSummaryItems.innerHTML = `<p style="color:#94a3b8; font-size:13px; padding:10px 0;">Your dynamic basket terminal is empty.</p>`;
    } else {
        let total = 0;
        checkSummaryItems.innerHTML = localCart.map(item => {
            total += Number(item.price);
            return `
                <div style="display:flex; justify-content:space-between; font-size:13px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                    <span>${item.name}</span>
                    <span style="color:#facc15;">Rs. ${item.price}</span>
                </div>
            `;
        }).join('');
        checkSummaryTotal.innerText = `Rs. ${total}`;
    }
}

if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (localCart.length === 0) {
            alert("Cannot process! Cart pipeline has 0 assets.");
            return;
        }
        const orderData = {
            address: document.getElementById('custAddress').value.trim(),
            city: document.getElementById('custCity').value.trim(),
            phone: document.getElementById('custPhone').value.trim(),
            itemsCount: localCart.length,
            timestamp: new Date().toISOString()
        };
        try {
            await addDoc(collection(db, "orders"), orderData);
            alert("Order parameters transmitted successfully!");
            localCart = [];
            localStorage.removeItem('bhub_cart');
            window.location.href = "index.html";
        } catch (err) {
            alert("Transmission Error: " + err.message);
        }
    });
}

function updateCartVisuals() {
    const countDisplay = document.getElementById('cartCount');
    if (countDisplay) {
        countDisplay.innerText = localCart.length;
    }
}
