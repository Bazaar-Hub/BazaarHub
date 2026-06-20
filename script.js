// =========================================================================
// FIREBASE LIFETIME MULTI-DEVICE LOGIN & REGISTER SYSTEM (INTERCONNECTED)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

// ==========================================
// 1. GLOBAL AUTH MONITOR & REDIRECT LOOPS GUARD
// ==========================================
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname;

    if (user) {
        if (currentPage.includes('auth.html')) {
            window.location.href = "index.html";
        }
        setupAppRealtimeStreams();
    } else {
        if (!currentPage.includes('auth.html')) {
            window.location.href = "auth.html";
        }
    }
});

// ==========================================
// 2. DIRECT REGISTRATION PIPELINE (NO OTP)
// ==========================================
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
                name: name,
                email: email,
                phone: phone,
                role: "client"
            });
            alert("Account successfully created without verification!");
            window.location.href = "index.html"; 
        } catch (error) {
            alert("Registration Failed: " + error.message);
        }
    });
}

// ==========================================
// 3. SECURE LOGIN PIPELINE PROCESS
// ==========================================
const logForm = document.getElementById('loginForm');
if (logForm) {
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPass').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Login Successful!");
            window.location.href = "index.html"; 
        } catch (error) {
            alert("Login Failed: " + error.message);
        }
    });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = "auth.html";
    });
}

// ==========================================
// 4. REALTIME CLOUD CHANNELS DATA PIPELINE
// ==========================================
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
                    <td><b>Addr:</b> ${o.address}<br><b>Phone:</b> ${o.phone}</td>
                    <td>${o.itemsSummary}</td>
                    <td class="accent-yellow" style="font-weight:800; color:#facc15;">Rs. ${o.totalCost}</td>
                    <td><span style="background:#1e2235; padding:6px 10px; border-radius:6px; font-size:11px; font-weight:700; color:#facc15; box-shadow: 0 0 10px rgba(250,204,21,0.15);">${o.status}</span></td>
                </tr>
            `).join('');
        });
    }
}

// ==========================================
// 5. CATALOG UI INTERACTIVE RENDERERS
// ==========================================
function renderCatalogUI() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (globalProducts.length === 0) {
        grid.innerHTML = `<p style="color:#9ca3af; text-align:center; grid-column: 1/-1; padding: 40px 0;">No products deployed inside cloud pipeline.</p>`;
        return;
    }

    grid.innerHTML = globalProducts.map(p => `
        <div class="product-card">
            <img src="${p.image}" class="product-img">
            <div class="product-title">${p.name}</div>
            <div class="product-desc">${p.description}</div>
            <div class="product-price">Rs. ${parseFloat(p.price).toLocaleString()}</div>
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
                updateCartWidgetCount();
                
                // Micro-feedback UI alert animation
                e.target.innerText = "ADDED TO BASKET! ✓";
                e.target.style.background = "#10b981";
                e.target.style.color = "#ffffff";
                e.target.style.boxShadow = "0 0 15px rgba(16,185,129,0.4)";
                setTimeout(() => {
                    e.target.innerText = "Add To Basket";
                    e.target.style.background = "linear-gradient(135deg, #fff293 0%, #facc15 50%, #b48c04 100%)";
                    e.target.style.color = "#000000";
                    e.target.style.boxShadow = "0 4px 15px rgba(250, 204, 21, 0.2)";
                }, 1500);
            }
        });
    });
}

function updateCartWidgetCount() {
    const counter = document.getElementById('cartCount');
    if(counter) counter.innerText = localCart.length;
}

// ==========================================
// 6. ORDER PROCESSING MATRIX
// ==========================================
const checkoutItemsWrap = document.getElementById('checkoutSummaryItemsContainer');
if (checkoutItemsWrap) {
    let priceSum = 0;
    checkoutItemsWrap.innerHTML = localCart.map(i => {
        priceSum += parseFloat(i.price);
        return `<div class="summary-item"><span>${i.name}</span><span style="font-weight:700; color:#facc15;">Rs. ${i.price}</span></div>`;
    }).join('');
    
    const displayTotal = document.getElementById('checkoutSummaryTotalDisplay');
    if(displayTotal) displayTotal.innerText = "Rs. " + priceSum.toLocaleString();

    const checkForm = document.getElementById('checkoutForm');
    if(checkForm) {
        checkForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(localCart.length === 0) { alert("Your basket matrix is empty."); return; }

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

            try {
                await addDoc(collection(db, "orders"), orderPayload);
                alert("Order successfully transmitted directly to cloud dashboard pipeline!");
                localCart = [];
                localStorage.removeItem('bazaarhub_cart');
                window.location.href = "index.html";
            } catch (err) {
                alert("Order Registry Error: " + err.message);
            }
        });
    }
}

// ==========================================
// 7. ADMIN TERMINAL CONTROL PARAMETERS
// ==========================================
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('pName').value.trim(),
            category: document.getElementById('pCategory').value.trim().toUpperCase(),
            price: parseFloat(document.getElementById('pPrice').value),
            image: document.getElementById('pImage').value.trim(),
            description: document.getElementById('pDesc').value.trim()
        };

        try {
            await addDoc(collection(db, "products"), payload);
            alert("Asset parameters injected perfectly!");
            addProductForm.reset();
        } catch(err) {
            alert("Database write error: " + err.message);
        }
    });
}

function renderAdminProducts() {
    const adminList = document.getElementById('adminProductsList');
    if (!adminList) return;

    adminList.innerHTML = globalProducts.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:12px 16px; border-radius:10px; margin-bottom:10px; font-size:12.5px; border:1px solid rgba(255,255,255,0.04);">
            <span><b>${p.name}</b> (Rs. ${p.price})</span>
            <button class="deleteProductBtn" data-id="${p.id}" style="color:#ef4444; font-weight:bold; cursor:pointer;"><i class="fas fa-trash-alt"></i> Delete</button>
        </div>
    `).join('');

    document.querySelectorAll('.deleteProductBtn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const targetId = e.currentTarget.getAttribute('data-id');
            if(confirm("Are you sure you want to delete this product?")) {
                await deleteDoc(doc(db, "products", targetId));
                alert("Product asset deleted from Cloud database.");
            }
        });
    });
}

updateCartWidgetCount();
