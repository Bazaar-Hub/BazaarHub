// =========================================================================
// BAZAARHUB ADVANCED DYNAMIC LIFETIME SECURITY & CLOUD FIRESTORE LOG ENGINE
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, deleteDoc, updateDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

function showAnimatedPopup(message, iconClass = "fas fa-check-circle") {
    const toast = document.getElementById('popupToast');
    if(toast) {
        toast.innerHTML = `<i class="${iconClass}" style="color: #facc15;"></i> <span>${message}</span>`;
        toast.classList.remove('show');
        void toast.offsetWidth; // Force hardware reset reflow
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, 2800);
    } else {
        alert(message);
    }
}

// 1. Dual Authentication Tracker Security Router Guard
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

// 2. Account Registration Submissions 
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
            setTimeout(() => { window.location.href = "index.html"; }, 1400);
        } catch (error) {
            showAnimatedPopup(error.message, "fas fa-exclamation-triangle");
        }
    });
}

// 3. User Login Authenticator Session 
const logForm = document.getElementById('loginForm');
if (logForm) {
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPass').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showAnimatedPopup("LOGIN SUCCESSFUL!");
            setTimeout(() => { window.location.href = "index.html"; }, 1400);
        } catch (error) {
            showAnimatedPopup(error.message, "fas fa-exclamation-triangle");
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

// 4. Firestore Stream Listeners Matrix
function setupAppRealtimeStreams() {
    // Sync Products Collection
    onSnapshot(collection(db, "products"), (snapshot) => {
        globalProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCatalogUI(globalProducts);
        renderAdminProducts();
    });

    // Sync Current Logged-In Client Orders List View Tab 
    const userPersonalOrdersList = document.getElementById('userPersonalOrdersList');
    if (userPersonalOrdersList && auth.currentUser) {
        const userOrdersQuery = query(collection(db, "orders"), where("userUid", "==", auth.currentUser.email));
        onSnapshot(userOrdersQuery, (snapshot) => {
            if(snapshot.empty) {
                userPersonalOrdersList.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#9ca3af;">No active checking logs found for your profile account.</td></tr>`;
                return;
            }
            userPersonalOrdersList.innerHTML = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return `
                    <tr>
                        <td style="font-family:monospace; color:#9ca3af;">${docSnap.id.substring(0,8)}...</td>
                        <td><b>${data.itemsSummary || 'Products Array'}</b></td>
                        <td class="accent-yellow" style="font-weight:700;">Rs. ${parseFloat(data.totalCost).toLocaleString()}</td>
                        <td><span style="background:#14141c; padding:4px 10px; border-radius:6px; font-size:12px; border:1px solid #1f2937; color:#facc15;">${data.status}</span></td>
                    </tr>
                `;
            }).join('');
        });
    }

    // Full Admin Control Desk Monitor Stream
    const adminOrdersList = document.getElementById('adminOrdersList');
    if (adminOrdersList) {
        onSnapshot(collection(db, "orders"), (snapshot) => {
            adminOrdersList.innerHTML = snapshot.docs.map(docSnapshot => {
                const o = docSnapshot.data();
                const docId = docSnapshot.id;
                return `
                    <tr>
                        <td><b>Client:</b> ${o.userUid || 'Guest'}<br><b>Addr:</b> ${o.address}</td>
                        <td>${o.itemsSummary || 'Data entries'}</td>
                        <td class="accent-yellow" style="font-weight:700;">Rs. ${parseFloat(o.totalCost).toLocaleString()}</td>
                        <td><span style="color:#facc15; font-weight:700;">${o.status}</span></td>
                        <td>
                            <select class="orderWorkflowStateSelect" data-id="${docId}" style="margin:0; padding:4px; font-size:12px;">
                                <option value="Pending Verification" ${o.status === 'Pending Verification' ? 'selected' : ''}>Pending</option>
                                <option value="Placed" ${o.status === 'Placed' ? 'selected' : ''}>Placed</option>
                                <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            </select>
                        </td>
                    </tr>
                `;
            }).join('');

            document.querySelectorAll('.orderWorkflowStateSelect').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    const value = e.target.value;
                    try {
                        await updateDoc(doc(db, "orders", id), { status: value });
                        showAnimatedPopup("TRACKING STATUS UPDATED!");
                    } catch(err) {
                        showAnimatedPopup(err.message, "fas fa-exclamation-triangle");
                    }
                });
            });
        });
    }
}

// 5. Build Dynamic Catalog Nodes 
function renderCatalogUI(productsArray) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (productsArray.length === 0) {
        grid.innerHTML = `<p style="color:#9ca3af; text-align:center; grid-column:1/-1; padding:30px 0;">No active elements inside system grid view matrix.</p>`;
        return;
    }

    grid.innerHTML = productsArray.map(p => `
        <div class="product-card">
            <img src="${p.image}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500'">
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
                updateCounterDisplay();
                showAnimatedPopup("ADDED TO BASKET!");
            }
        });
    });
}

// Live Filtering Real-time Logic Handler
const catalogSearch = document.getElementById('catalogSearch');
if (catalogSearch) {
    catalogSearch.addEventListener('input', (e) => {
        const queryTerm = e.target.value.toLowerCase().trim();
        const filtered = globalProducts.filter(p => 
            p.name.toLowerCase().includes(queryTerm) || p.description.toLowerCase().includes(queryTerm)
        );
        renderCatalogUI(filtered);
    });
}

function updateCounterDisplay() {
    const counter = document.getElementById('cartCount');
    if(counter) counter.innerText = localCart.length;
}

// 6. Transmit Checkout Array 
const checkoutItemsWrap = document.getElementById('checkoutSummaryItemsContainer');
if (checkoutItemsWrap) {
    let priceSum = 0;
    checkoutItemsWrap.innerHTML = localCart.map(i => {
        priceSum += parseFloat(i.price);
        return `<div class="summary-item"><span>${i.name}</span><span class="accent-yellow" style="font-weight:700;">Rs. ${parseFloat(i.price).toLocaleString()}</span></div>`;
    }).join('');
    
    const displayTotal = document.getElementById('checkoutSummaryTotalDisplay');
    if(displayTotal) displayTotal.innerText = "Rs. " + priceSum.toLocaleString();

    const checkForm = document.getElementById('checkoutForm');
    if(checkForm) {
        checkForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(localCart.length === 0) { showAnimatedPopup("Basket is currently empty.", "fas fa-exclamation-circle"); return; }

            const orderPayload = {
                userUid: auth.currentUser ? auth.currentUser.email : "GUEST",
                address: document.getElementById('custAddress').value.trim(),
                city: document.getElementById('custCity').value.trim(),
                phone: document.getElementById('custPhone').value.trim(),
                itemsSummary: localCart.map(i => i.name).join(', '),
                totalCost: priceSum,
                status: "Pending Verification",
                timestamp: new Date().toISOString()
            };

            try {
                await addDoc(collection(db, "orders"), orderPayload);
                showAnimatedPopup("ORDER PLACED SUCCESSFULLY!");
                localCart = [];
                localStorage.removeItem('bazaarhub_cart');
                setTimeout(() => { window.location.href = "index.html"; }, 1400);
            } catch (err) {
                showAnimatedPopup(err.message, "fas fa-exclamation-triangle");
            }
        });
    }
}

// 7. Inject Node Entry via Admin Panel Form
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
            showAnimatedPopup("ASSET INJECTED TO VAULT!");
            addProductForm.reset();
        } catch(err) {
            showAnimatedPopup(err.message, "fas fa-exclamation-triangle");
        }
    });
}

function renderAdminProducts() {
    const adminList = document.getElementById('adminProductsList');
    if (!adminList) return;

    adminList.innerHTML = globalProducts.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#14141c; padding:10px 14px; border-radius:8px; margin-bottom:10px; font-size:13px; border:1px solid #1f2937;">
            <span><b>${p.name}</b> <span class="accent-yellow" style="margin-left:6px;">Rs. ${parseFloat(p.price).toLocaleString()}</span></span>
            <button class="deleteProductBtn" data-id="${p.id}" style="color:#f87171; font-weight:600; background:none; border:none; cursor:pointer;"><i class="fas fa-trash-alt"></i> Delete</button>
        </div>
    `).join('');

    document.querySelectorAll('.deleteProductBtn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const targetId = e.currentTarget.getAttribute('data-id');
            if(confirm("Completely discard this product matrix module item node?")) {
                await deleteDoc(doc(db, "products", targetId));
                showAnimatedPopup("NODE DISCARDED.");
            }
        });
    });
}

updateCounterDisplay();
