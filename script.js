// =========================================================================
// FIREBASE CORE LIFETIME MULTI-DEVICE LOGISTICS STORAGE CONSOLE ARCHITECTURE
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, deleteDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Your web app's Firebase configuration 
const firebaseConfig = {
  apiKey: "AIzaSyAPlpnfGWTiUQlyl2vH6uM_Ae6_EQ8YW5E",
  authDomain: "bazaarhubnew-79dee.firebaseapp.com",
  projectId: "bazaarhubnew-79dee",
  storageBucket: "bazaarhubnew-79dee.firebasestorage.app",
  messagingSenderId: "452492018395",
  appId: "1:452492018395:web:6c3cf8d956ce7fe45b42fe"
};

// Initialize Core Engines
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentSessionUser = null;
let cachedUserProfileData = null;
let systemProductsArray = [];
let localCartCache = JSON.parse(localStorage.getItem('bazaarhub_cart_cache')) || [];
let activeTargetCategory = "ALL";
let IS_ADMIN_MODE = false;

// Simulated cache variable placeholder variables for verification code matching pipelines
let temporaryRegistrationPayload = null;

// =========================================================================
// 1. LIFETIME MULTI-DEVICE AUTO AUTH REDIRECT CHANNEL GATEWAY PIPELINE
// =========================================================================
onAuthStateChanged(auth, async (user) => {
    const adminSessionFlag = localStorage.getItem('activeAdminSession');
    
    if (adminSessionFlag === "true") {
        IS_ADMIN_MODE = true;
        currentSessionUser = { email: "OwnerBH", uid: "ADMIN-MASTER-ROOT" };
        bootAppFramework();
        return;
    }

    if (user) {
        currentSessionUser = user;
        IS_ADMIN_MODE = false;
        
        // Fetch User Data to push inside profile mapping console checkout inputs
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            cachedUserProfileData = userDocSnap.data();
        }
        
        bootAppFramework();
    } else {
        currentSessionUser = null;
        cachedUserProfileData = null;
        IS_ADMIN_MODE = false;
        showAuthScreenStructure();
    }
});

function bootAppFramework() {
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminScreen').classList.add('hidden');
    document.getElementById('verificationScreen').classList.add('hidden');
    document.getElementById('mainAppHub').classList.remove('hidden');

    if (IS_ADMIN_MODE) {
        document.getElementById('clientNavLinks').classList.add('hidden');
        document.getElementById('navCartWidget').classList.add('hidden');
        document.getElementById('adminNavLinks').classList.remove('hidden');
        showSection('admin-panel');
    } else {
        document.getElementById('clientNavLinks').classList.remove('hidden');
        document.getElementById('navCartWidget').classList.remove('hidden');
        document.getElementById('adminNavLinks').classList.add('hidden');
        showSection('catalog');
    }
    initializeDataRealtimeStreams();
}

function showAuthScreenStructure() {
    document.getElementById('mainAppHub').classList.add('hidden');
    switchScreen('register');
}

// Global scope attachment actions
window.switchScreen = function(type) {
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminScreen').classList.add('hidden');
    document.getElementById('verificationScreen').classList.add('hidden');
    
    if(type === 'register') document.getElementById('registerScreen').classList.remove('hidden');
    if(type === 'login') document.getElementById('loginScreen').classList.remove('hidden');
    if(type === 'admin') document.getElementById('adminScreen').classList.remove('hidden');
};

// =========================================================================
// 2. INTERACTIVE ACCOUNT CREATION & DUAL VERIFICATION SIMULATORS
// =========================================================================
window.registerUserAccount = function(e) {
    e.preventDefault();
    
    // Core parameters mapping trace data capture layout pipeline
    temporaryRegistrationPayload = {
        name: document.getElementById('regName').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        phone: document.getElementById('regPhone').value.trim(),
        pass: document.getElementById('regPass').value
    };

    // Dispatch simulated system alerts to signify incoming 6 digit tracking payloads
    alert("Verification codes dispatched!\nEmail Code Simulation: 123456\nSMS Code Simulation: 789012");
    
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('verificationScreen').classList.remove('hidden');
};

window.handleVerificationSubmit = async function(e) {
    e.preventDefault();
    const emailCodeInput = document.getElementById('emailCode').value.trim();
    const phoneCodeInput = document.getElementById('phoneCode').value.trim();

    if (emailCodeInput === "123456" && phoneCodeInput === "789012" && temporaryRegistrationPayload) {
        try {
            // Commit permanent cloud authentication instance node registry cluster mapping data
            const credentials = await createUserWithEmailAndPassword(
                auth, 
                temporaryRegistrationPayload.email, 
                temporaryRegistrationPayload.pass
            );
            
            // Save inside Firestore to make data structure permanent and protected from lifetime clearing loops
            await setDoc(doc(db, "users", credentials.user.uid), {
                uid: credentials.user.uid,
                fullName: temporaryRegistrationPayload.name,
                emailAddress: temporaryRegistrationPayload.email,
                telemetryPhone: temporaryRegistrationPayload.phone,
                role: "client"
            });

            alert("Account verified and securely registered permanently inside database console!");
            temporaryRegistrationPayload = null;
            document.getElementById('verifyForm').reset();
        } catch (err) {
            alert("Cryptographic Registry Write Failure: " + err.message);
        }
    } else {
        alert("Verification clearance validation failed! Invalid code metrics matched.");
    }
};

window.loginUserPortal = async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    try {
        localStorage.removeItem('activeAdminSession');
        await signInWithEmailAndPassword(auth, email, pass);
        alert("Authentication clearing logged successfully!");
    } catch (err) {
        alert("Login Failure sequence: " + err.message);
    }
};

window.handleAdminLogin = function(e) {
    e.preventDefault();
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value;

    if (user === "OwnerBH" && pass === "bh26_777!@") {
        IS_ADMIN_MODE = true;
        localStorage.setItem('activeAdminSession', "true");
        currentSessionUser = { email: "OwnerBH", uid: "ADMIN-MASTER-ROOT" };
        bootAppFramework();
        alert("Root configuration panel deployment authorization sequence completed.");
    } else {
        alert("Access Keys Invalid! Admin terminal deployment protocol rejected.");
    }
};

window.handleLogout = async function() {
    localStorage.removeItem('activeAdminSession');
    await signOut(auth);
    location.reload();
};

// =========================================================================
// 3. UI TAB NAVIGATION SYSTEM CONTROLLER FLUID DYNAMICS
// =========================================================================
window.showSection = function(sectionId) {
    const pages = ['catalogPage', 'checkoutPage', 'myOrdersPage', 'adminPanelPage', 'supportPage'];
    pages.forEach(p => document.getElementById(p).classList.add('hidden'));

    if(sectionId === 'catalog') document.getElementById('catalogPage').classList.remove('hidden');
    if(sectionId === 'checkout') {
        document.getElementById('checkoutPage').classList.remove('hidden');
        populateCheckoutFieldsAuto();
    }
    if(sectionId === 'my-orders') document.getElementById('myOrdersPage').classList.remove('hidden');
    if(sectionId === 'admin-panel') document.getElementById('adminPanelPage').classList.remove('hidden');
    if(sectionId === 'support') document.getElementById('supportPage').classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.scrollToShopSection = function() {
    window.showSection('catalog');
    setTimeout(() => {
        document.getElementById('shopCatalogSection').scrollIntoView({ behavior: 'smooth' });
    }, 150);
};

// =========================================================================
// 4. DATA LOGISTICS & REALTIME CONTENT STREAMS
// =========================================================================
function initializeDataRealtimeStreams() {
    // Realtime Products Synchronizer Pipeline Channels Stream
    onSnapshot(collection(db, "products"), (snapshot) => {
        systemProductsArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderClientCatalogUI();
        renderCategoryCapsulesUI();
        if (IS_ADMIN_MODE) renderAdminConsoleProductsVault();
    });

    // Realtime Global/Client Orders Synchronizer Tracking System Architecture Channels
    if (IS_ADMIN_MODE) {
        onSnapshot(collection(db, "orders"), (snapshot) => {
            const globalOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderAdminGlobalOrdersMatrixTable(globalOrders);
        });
    } else if (currentSessionUser) {
        const userOrdersQuery = query(collection(db, "orders"), where("userUid", "==", currentSessionUser.uid));
        onSnapshot(userOrdersQuery, (snapshot) => {
            const clientOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderClientPersonalOrdersTrackingList(clientOrders);
        });
    }
}

function renderCategoryCapsulesUI() {
    const chipsBox = document.getElementById('categoryChipsBox');
    if(!chipsBox) return;
    const baseCategories = ["ALL", ...new Set(systemProductsArray.map(p => p.category))];
    chipsBox.innerHTML = baseCategories.map(cat => `
        <button class="capsule ${activeTargetCategory === cat ? 'active' : ''}" onclick="window.filterProductsByCategoryStream('${cat}')">${cat}</button>
    `).join('');
}

window.filterProductsByCategoryStream = function(category) {
    activeTargetCategory = category;
    renderCategoryCapsulesUI();
    renderClientCatalogUI();
};

function renderClientCatalogUI() {
    const targetGrid = document.getElementById('productsGrid');
    if (!targetGrid) return;
    
    const visibleFilteredItems = systemProductsArray.filter(p => activeTargetCategory === "ALL" || p.category === activeTargetCategory);
    
    if (visibleFilteredItems.length === 0) {
        targetGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:30px; color:#9ca3af;">No products are deployed inside this instance matrix pipeline.</p>`;
        return;
    }

    targetGrid.innerHTML = visibleFilteredItems.map(p => `
        <div class="product-card">
            <img src="${p.image}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500'">
            <div>
                <div class="product-title">${p.name}</div>
                <div style="font-size:10px; color:#facc15; font-weight:bold; text-transform:uppercase; margin-bottom:5px;">${p.category}</div>
                <div class="product-desc">${p.description}</div>
            </div>
            <div>
                <div class="product-price">Rs. ${parseFloat(p.price).toLocaleString()}</div>
                <button class="bg-yellow card-btn" onclick="window.addBasketNodeItem('${p.id}')">Add To Cart</button>
            </div>
        </div>
    `).join('');
}

// =========================================================================
// 5. MEMORY CART MATRIX SLIDER DRAWER & PROCESSING LOGIC
// =========================================================================
window.toggleCartSidebar = function(state) {
    const drawer = document.getElementById('cartSidebarOverlay');
    if (state) drawer.classList.add('open');
    else drawer.classList.remove('open');
};

window.addBasketNodeItem = function(id) {
    const selection = systemProductsArray.find(p => p.id === id);
    if (!selection) return;

    const existingMatch = localCartCache.find(item => item.id === id);
    if(existingMatch) existingMatch.quantity++;
    else localCartCache.push({ id: selection.id, name: selection.name, price: selection.price, image: selection.image, quantity: 1 });
    
    commitCartStateToMemoryStorage();
};

window.changeCartQtyNode = function(id, delta) {
    const record = localCartCache.find(item => item.id === id);
    if(!record) return;
    record.quantity += delta;
    if(record.quantity <= 0) localCartCache = localCartCache.filter(item => item.id !== id);
    commitCartStateToMemoryStorage();
};

function commitCartStateToMemoryStorage() {
    localStorage.setItem('bazaarhub_cart_cache', JSON.stringify(localCartCache));
    updateLiveBasketCountWidgetUI();
}

function updateLiveBasketCountWidgetUI() {
    const totalQtyCount = localCartCache.reduce((acc, current) => acc + current.quantity, 0);
    document.getElementById('cartCount').innerText = totalQtyCount;
    
    const wrapper = document.getElementById('cartItemsContainer');
    if (!wrapper) return;

    if (localCartCache.length === 0) {
        wrapper.innerHTML = `<p style="text-align:center; color:#9ca3af; margin-top:40px; font-size:12px;">Your basket allocation memory data stream is zero.</p>`;
        document.getElementById('cartAggregatedTotal').innerText = "Rs. 0";
        return;
    }

    let computationTotal = 0;
    wrapper.innerHTML = localCartCache.map(i => {
        computationTotal += (i.price * i.quantity);
        return `
            <div class="cart-item">
                <img src="${i.image}" class="cart-item-img">
                <div style="flex:1;">
                    <div style="font-size:13px; font-weight:700;">${i.name}</div>
                    <div style="color:#facc15; font-size:12px; font-weight:bold; margin-top:2px;">Rs. ${i.price}</div>
                </div>
                <div class="qty-control">
                    <button class="qty-btn" onclick="window.changeCartQtyNode('${i.id}', -1)">-</button>
                    <span class="qty-val">${i.quantity}</span>
                    <button class="qty-btn" onclick="window.changeCartQtyNode('${i.id}', 1)">+</button>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('cartAggregatedTotal').innerText = "Rs. " + computationTotal.toLocaleString();
}

// =========================================================================
// 6. CHECKOUT FORM VERIFICATION INTEGRITY PIPELINES
// =========================================================================
function populateCheckoutFieldsAuto() {
    if (cachedUserProfileData) {
        document.getElementById('custFName').value = cachedUserProfileData.fullName || "";
        document.getElementById('custEmail').value = cachedUserProfileData.emailAddress || "";
        document.getElementById('custPhone').value = cachedUserProfileData.telemetryPhone || "";
    }
    
    const checkoutSummaryItemsContainer = document.getElementById('checkoutSummaryItemsContainer');
    let totalDueAccumulator = 0;

    checkoutSummaryItemsContainer.innerHTML = localCartCache.map(item => {
        totalDueAccumulator += (item.price * item.quantity);
        return `
            <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #14141c;">
                <span>${item.name} <strong>(x${item.quantity})</strong></span>
                <span style="color:#facc15; font-weight:700;">Rs. ${(item.price * item.quantity).toLocaleString()}</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('checkoutSummaryTotalDisplay').innerText = "Rs. " + totalDueAccumulator.toLocaleString();
}

document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(localCartCache.length === 0) {
        alert("Checkout aborted: Empty cart schema.");
        return;
    }

    const orderPayloadNodeStructure = {
        orderId: "BZH-" + Math.floor(100000 + Math.random() * 900000),
        userUid: currentSessionUser.uid,
        customerName: cachedUserProfileData ? cachedUserProfileData.fullName : "Client Base Node",
        customerEmail: cachedUserProfileData ? cachedUserProfileData.emailAddress : currentSessionUser.email,
        customerPhone: cachedUserProfileData ? cachedUserProfileData.telemetryPhone : "N/A",
        deliveryAddress: document.getElementById('custAddress').value.trim(),
        paymentMethod: document.getElementById('custPaymentMode').value,
        itemsSummaryStream: localCartCache.map(i => `${i.name} [x${i.quantity}]`).join(', '),
        aggregatedCost: document.getElementById('checkoutSummaryTotalDisplay').innerText,
        logisticsStatus: "Pending Verification",
        ratingScore: 0,
        epochTimestamp: Date.now()
    };

    try {
        await addDoc(collection(db, "orders"), orderPayloadNodeStructure);
        localCartCache = [];
        commitCartStateToMemoryStorage();
        document.getElementById('checkoutForm').reset();
        alert("Logistics sequence order transmission target placed inside cloud data logs successfully!");
        window.showSection('my-orders');
    } catch (err) {
        alert("Database transaction crash error: " + err.message);
    }
});

// =========================================================================
// 7. CLIENT TRACKING MATRIX & ACTIVE RATING DESK LAYOUTS
// =========================================================================
function renderClientPersonalOrdersTrackingList(orders) {
    const tbody = document.getElementById('myOrdersTableBody');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#9ca3af;">No order historical items trace detected.</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(o => {
        let currentClassTrackingBadge = "status-otw";
        if (o.logisticsStatus === "Delivered") currentClassTrackingBadge = "status-delivered";
        if (o.logisticsStatus === "Out of stock") currentClassTrackingBadge = "status-oos";
        
        let ratingsInterfaceModuleHtml = "";
        if (o.logisticsStatus === "Delivered") {
            const activeRatingValue = o.ratingScore || 0;
            ratingsInterfaceModuleHtml = `<div style="margin-top:6px;"><span style="font-size:11px; color:#9ca3af; display:block; margin-bottom:2px;">Rate Item:</span>`;
            for (let starsCount = 1; starsCount <= 5; starsCount++) {
                ratingsInterfaceModuleHtml += `<i class="fas fa-star star-node ${starsCount <= activeRatingValue ? 'selected' : ''}" onclick="window.commitCustomerRatingScoreTarget('${o.id}', ${starsCount})"></i>`;
            }
            ratingsInterfaceModuleHtml += `</div>`;
        }

        return `
            <tr>
                <td style="font-weight:bold; color:#facc15;">${o.orderId}</td>
                <td>${o.itemsSummaryStream}</td>
                <td style="font-weight:700;">${o.aggregatedCost}</td>
                <td>
                    <span class="status-badge ${currentClassTrackingBadge}">${o.logisticsStatus}</span>
                    ${ratingsInterfaceModuleHtml}
                </td>
            </tr>
        `;
    }).join('');
}

window.commitCustomerRatingScoreTarget = async function(docId, calculatedScoreValue) {
    try {
        await setDoc(doc, db, "orders", docId), { ratingScore: calculatedScoreValue }, { merge: true };
        alert(`Thank you for rating this dispatch item module with ${calculatedScoreValue} Stars!`);
    } catch (err) {
        console.error("Failed to commit star log to matrix platform structural tree", err);
    }
};

// =========================================================================
// 8. ADMINISTRATIVE ENGINE PANEL CONTROLS TERMINAL DESK
// =========================================================================
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('editIndex').value;
    
    const structuralFormPayload = {
        name: document.getElementById('pName').value.trim(),
        category: document.getElementById('pCategory').value.trim(),
        price: parseInt(document.getElementById('pPrice').value),
        image: document.getElementById('pImage').value.trim(),
        description: document.getElementById('pDesc').value.trim()
    };

    try {
        if (editId !== '') {
            await setDoc(doc(db, "products", editId), structuralFormPayload);
            document.getElementById('editIndex').value = '';
            document.getElementById('formSubmitBtn').innerText = "Save Asset Node Module";
        } else {
            await addDoc(collection(db, "products"), structuralFormPayload);
        }
        document.getElementById('addProductForm').reset();
        alert("Cloud storage assets array structural configuration data changed successfully!");
    } catch (err) {
        alert("Operation runtime halting anomaly encountered: " + err.message);
    }
});

function renderAdminConsoleProductsVault() {
    const targetRef = document.getElementById('adminProductsList');
    if (!targetRef) return;

    if (systemProductsArray.length === 0) {
        targetRef.innerHTML = `<p style="font-size:12px; color:#9ca3af; padding:10px 0;">Vault container returns null registers.</p>`;
        return;
    }

    targetRef.innerHTML = systemProductsArray.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#14141c; padding:10px; border-radius:6px; margin-bottom:8px; border:1px solid #1f2937;">
            <div style="max-width:70%;">
                <div style="font-weight:700; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
                <span style="font-size:11px; color:#facc15;">Rs. ${p.price} [${p.category}]</span>
            </div>
            <div style="display:flex; gap:6px;">
                <button onclick="window.loadTargetProductEditInstance('${p.id}')" style="color:#facc15; font-size:12px; background:#1f2937; padding:4px 8px; border-radius:4px;"><i class="fas fa-edit"></i></button>
                <button onclick="window.eraseProductTargetCloudLog('${p.id}')" style="color:#ef4444; font-size:12px; background:rgba(239,68,68,0.1); padding:4px 8px; border-radius:4px;"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('');
}

window.loadTargetProductEditInstance = function(id) {
    const itemTarget = systemProductsArray.find(p => p.id === id);
    if(!itemTarget) return;

    document.getElementById('editIndex').value = id;
    document.getElementById('pName').value = itemTarget.name;
    document.getElementById('pCategory').value = itemTarget.category;
    document.getElementById('pPrice').value = itemTarget.price;
    document.getElementById('pImage').value = itemTarget.image;
    document.getElementById('pDesc').value = itemTarget.description;
    document.getElementById('formSubmitBtn').innerText = "Update Existing Product Data Node";
};

window.eraseProductTargetCloudLog = async function(id) {
    if(confirm("Confirm asset record removal action protocol trace?")) {
        await deleteDoc(doc(db, "products", id));
    }
};

function renderAdminGlobalOrdersMatrixTable(orders) {
    const listTableBodyRef = document.getElementById('adminOrdersList');
    if(!listTableBodyRef) return;

    if (orders.length === 0) {
        listTableBodyRef.innerHTML = `<tr><td colspan="4" style="text-align:center; font-size:12px; color:#9ca3af; padding:20px;">No operational logs caught inside intercept pipeline channels.</td></tr>`;
        return;
    }

    listTableBodyRef.innerHTML = orders.map(o => {
        // Multi-Day auto tracking garbage collection data manager loop parameters engine
        let automaticEraseOptionHtml = "";
        if (o.logisticsStatus === "Delivered" && o.epochTimestamp) {
            const timeDifferenceCalculatedInMilliseconds = Date.now() - o.epochTimestamp;
            const thresholdLimitInDaysConvert = 2 * 24 * 60 * 60 * 1000; // 2 to 3 days capacity buffer
            
            if (timeDifferenceCalculatedInMilliseconds >= thresholdLimitInDaysConvert) {
                automaticEraseOptionHtml = `<option value="Delete">4. Delete (Auto Expired)</option>`;
            }
        }

        return `
            <tr style="border-bottom:1px solid #1f2937;">
                <td style="padding:10px 5px; font-size:12px;">
                    <strong>${o.customerName}</strong><br>
                    <span style="color:#9ca3af; font-size:11px;">
                        M: ${o.customerEmail}<br>Tel: ${o.customerPhone}<br>A: ${o.deliveryAddress}
                    </span>
                </td>
                <td style="color:#d1d5db; font-size:12px;">${o.itemsSummaryStream}</td>
                <td style="font-weight:bold; color:#facc15;">${o.aggregatedCost}</td>
                <td>
                    <select onchange="window.executeAdminOrderStatusShiftAction('${o.id}', this.value)" style="margin:0; padding:6px; font-size:11px; background:#14141c; color:#fff; border:1px solid #374151;">
                        <option value="Pending Verification" ${o.logisticsStatus === 'Pending Verification' ? 'selected' : ''}>Pending</option>
                        <option value="On the way" ${o.logisticsStatus === 'On the way' ? 'selected' : ''}>1. On the way</option>
                        <option value="Delivered" ${o.logisticsStatus === 'Delivered' ? 'selected' : ''}>2. Delivered</option>
                        <option value="Out of stock" ${o.logisticsStatus === 'Out of stock' ? 'selected' : ''}>3. Out of stock</option>
                        <option value="Manual Delete" style="color:#ef4444;">4. Delete (Forced)</option>
                        ${automaticEraseOptionHtml}
                    </select>
                </td>
            </tr>
        `;
    }).join('');
}

window.executeAdminOrderStatusShiftAction = async function(docId, chosenStatePathValue) {
    if (chosenStatePathValue === "Manual Delete" || chosenStatePathValue === "Delete") {
        if(confirm("Confirm manual execution deletion trace command parameters to save cluster space?")) {
            await deleteDoc(doc(db, "orders", docId));
            alert("Order entry purged.");
        }
    } else {
        try {
            await setDoc(doc(db, "orders", docId), { logisticsStatus: chosenStatePathValue }, { merge: true });
            alert(`Logistics pipeline status shifted parameters to: ${chosenStatePathValue}`);
        } catch (err) {
            console.error("Failed to alter remote document matrix coordinates: ", err);
        }
    }
};

// =========================================================================
// 9. WHATSAPP ENGINE RADIAL WIDGET INTERACTIVE TOGGLES
// =========================================================================
window.toggleWhatsAppWidget = function() {
    const cardElement = document.getElementById('whatsappChatCard');
    cardElement.classList.toggle('active');
};

// Initialize App System Modules Loop Checkup On Initial Window Boot Instance Load
updateLiveBasketCountWidgetUI();
