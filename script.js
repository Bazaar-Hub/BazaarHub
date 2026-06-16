// =========================================================================
// FIREBASE LIFETIME MULTI-DEVICE LOGIN & REGISTER SYSTEM (INTEGRATED)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQ5JXRZUqW75b78Lf90SgsncohByPHaoE",
  authDomain: "bazaarhub-7fad9.firebaseapp.com",
  projectId: "bazaarhub-7fad9",
  storageBucket: "bazaarhub-7fad9.firebasestorage.app",
  messagingSenderId: "234144258685",
  appId: "1:234144258685:web:01743589d514f78a64ef14",
  databaseURL: "https://bazaarhub-7fad9-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// GLOBAL MEMORY STATES SYSTEM
let products = [];
let cart = JSON.parse(localStorage.getItem('bazaarCartPool')) || [];
let currentCategoryFilter = 'ALL';
let currentUserRef = null;

// ELEMENT LOOKUPS (FAIL-SAFE TO SUPPORT ALL PAGES SHARING SCRIPT)
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const globalCatalogProductsGridContainer = document.getElementById('globalCatalogProductsGridContainer');
const adminProductsList = document.getElementById('adminProductsList');
const adminOrdersList = document.getElementById('adminOrdersList');
const checkoutSummaryItemsContainer = document.getElementById('checkoutSummaryItemsContainer');

// =========================================================================
// IDENTITY CORE AUTH ROUTINES
// =========================================================================
if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPass').value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            alert("Cryptographic Signature Verified. Redirecting node...");
            window.location.href = 'index.html';
        } catch(err) {
            alert(`Authentication Error Node: ${err.message}`);
        }
    });
}

if(registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const pass = document.getElementById('regPass').value;
        
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", credential.user.uid), {
                uid: credential.user.uid, name, email, phone, role: 'client'
            });
            alert("Identity registered successfully onto Cloud Node Cluster!");
            window.location.href = 'index.html';
        } catch(err) {
            alert(`Registration Pipeline Aborted: ${err.message}`);
        }
    });
}

// REALTIME IDENTITY LIFECYCLE MONITOR
onAuthStateChanged(auth, async (user) => {
    const displayArea = document.getElementById('userStateProfileSection');
    if (user) {
        currentUserRef = user;
        const uDoc = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
        let userData = { name: user.email };
        uDoc.forEach(d => userData = d.data());
        
        if(displayArea) {
            displayArea.innerHTML = `
                <div class="user-profile-identity">
                    <i class="fas fa-user-shield accent-yellow"></i>
                    <span>${userData.name.toUpperCase()}</span>
                    <i class="fas fa-sign-out-alt" id="authLogoutTriggerAction" style="cursor:pointer; margin-left:8px; color:#ef4444;" title="Terminate Session"></i>
                </div>
            `;
            document.getElementById('authLogoutTriggerAction').addEventListener('click', () => {
                signOut(auth).then(() => window.location.reload());
            });
        }
    } else {
        currentUserRef = null;
        if(displayArea) {
            displayArea.innerHTML = `<button onclick="window.location.href='auth.html'" class="form-btn bg-yellow" style="width:auto; padding: 8px 18px; margin-top:0; font-size:12px;">SECURE PORTAL</button>`;
        }
    }
});

// =========================================================================
// REALTIME DATA MATRIX LISTENERS
// =========================================================================
onSnapshot(collection(db, "products"), (snapshot) => {
    products = [];
    snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
    });
    renderMainCatalogViewInterface();
    renderAdminProductsConsoleList();
});

onSnapshot(collection(db, "orders"), (snapshot) => {
    let ordersArr = [];
    snapshot.forEach(doc => ordersArr.push({ id: doc.id, ...doc.data() }));
    renderAdminOrdersTrackingMatrix(ordersArr);
});

// =========================================================================
// LUXURY MODERN PRESENTATION DESIGN RENDER ENGINES
// =========================================================================
function renderMainCatalogViewInterface() {
    if(!globalCatalogProductsGridContainer) return;
    
    const targetPool = (currentCategoryFilter === 'ALL') 
        ? products 
        : products.filter(p => p.category === currentCategoryFilter);
        
    if(targetPool.length === 0) {
        globalCatalogProductsGridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#6b7280; font-size:13px;">No asset clusters detected for category index [${currentCategoryFilter}]</div>`;
        return;
    }
    
    globalCatalogProductsGridContainer.innerHTML = targetPool.map(p => `
        <div class="luxury-product-card">
            <div>
                <div class="card-media-wrapper">
                    <img src="${p.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80'}" alt="Vault Asset Profile">
                    <button class="card-wishlist-trigger"><i class="far fa-heart"></i></button>
                </div>
                <div class="product-meta-category">${p.category}</div>
                <h3 class="product-meta-title">${p.name}</h3>
                <p class="product-meta-desc">${p.description || 'No alternative meta descriptors structural array mapped to record.'}</p>
            </div>
            <div class="card-action-row">
                <div class="product-price-node"><span>Rs.</span>${Number(p.price).toLocaleString()}</div>
                <button class="card-purchase-btn" data-id="${p.id}" title="Allocate to Payload Matrix">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Dynamic Binding hooks for purchases
    globalCatalogProductsGridContainer.querySelectorAll('.card-purchase-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = btn.getAttribute('data-id');
            allocateAssetToCartPool(itemId);
        });
    });
}

// Filter Navigation Trigger Matrix
window.filterCatalogStreamByCategory = function(categoryName) {
    currentCategoryFilter = categoryName;
    const ribbon = document.getElementById('dynamicCategoryRibbonContainer');
    if(ribbon) {
        ribbon.querySelectorAll('.category-pill').forEach(pill => {
            if(pill.innerText.toUpperCase().includes(categoryName.toUpperCase())) pill.classList.add('active');
            else pill.classList.remove('active');
        });
    }
    renderMainCatalogViewInterface();
};

// =========================================================================
// ALLOCATION MANIFEST (CART ENGINE INTERACTIVE LIFECYCLE)
// =========================================================================
function allocateAssetToCartPool(id) {
    const referenceItem = products.find(p => p.id === id);
    if(!referenceItem) return;
    
    const existingEntry = cart.find(item => item.id === id);
    if(existingEntry) {
        existingEntry.qty += 1;
    } else {
        cart.push({ id: referenceItem.id, name: referenceItem.name, price: referenceItem.price, image: referenceItem.image, qty: 1 });
    }
    synchronizeCartGlobalMatrices();
    toggleCartDrawerMatrix(true);
}

function synchronizeCartGlobalMatrices() {
    localStorage.setItem('bazaarCartPool', JSON.stringify(cart));
    
    // Updates Navbar Total Count Badge Accumulator
    const totalCount = cart.reduce((acc, current) => acc + current.qty, 0);
    const globalBadge = document.getElementById('cartGlobalBadgeDisplay');
    if(globalBadge) globalBadge.innerText = totalCount;
    
    // Render Drawers
    const drawerContainer = document.getElementById('cartDrawerItemsDataFlowContainer');
    const drawerTotalText = document.getElementById('cartDrawerTotalValueDisplay');
    
    let compiledCost = 0;
    if(drawerContainer) {
        if(cart.length === 0) {
            drawerContainer.innerHTML = `<div style="text-align:center; padding:50px 0; color:#4b5563; font-size:12px;">Selection Allocation Manifest Empty.</div>`;
        } else {
            drawerContainer.innerHTML = cart.map(item => {
                compiledCost += Number(item.price) * item.qty;
                return `
                    <div class="cart-modular-card">
                        <img src="${item.image}" class="cart-card-media" alt="Manifest Thumb">
                        <div class="cart-card-details">
                            <h4 class="cart-card-title">${item.name}</h4>
                            <div class="cart-card-price">Rs. ${Number(item.price).toLocaleString()}</div>
                            <div class="cart-qty-cluster">
                                <button class="qty-adjust-action dec-qty-btn" data-id="${item.id}"><i class="fas fa-minus"></i></button>
                                <span class="qty-value-node">${item.qty}</span>
                                <button class="qty-adjust-action inc-qty-btn" data-id="${item.id}"><i class="fas fa-plus"></i></button>
                            </div>
                        </div>
                        <button class="cart-remove-trash-action delete-manifest-item-btn" data-id="${item.id}"><i class="far fa-trash-alt"></i></button>
                    </div>
                `;
            }).join('');

            // Drawer Action Listener Maps
            drawerContainer.querySelectorAll('.inc-qty-btn').forEach(b => b.addEventListener('click', () => adjustQtyRef(b.getAttribute('data-id'), 1)));
            drawerContainer.querySelectorAll('.dec-qty-btn').forEach(b => b.addEventListener('click', () => adjustQtyRef(b.getAttribute('data-id'), -1)));
            drawerContainer.querySelectorAll('.delete-manifest-item-btn').forEach(b => b.addEventListener('click', () => removeManifestItemCompletely(b.getAttribute('data-id'))));
        }
    }
    if(drawerTotalText) drawerTotalText.innerText = `Rs. ${compiledCost.toLocaleString()}`;
    
    // Auto Update checkout summaries if currently rendering on screen space asset pipeline
    if(checkoutSummaryItemsContainer) renderCheckoutSummaryStaticMatrix();
}

function adjustQtyRef(id, delta) {
    const targetedItem = cart.find(i => i.id === id);
    if(!targetedItem) return;
    targetedItem.qty += delta;
    if(targetedItem.qty <= 0) cart = cart.filter(i => i.id !== id);
    synchronizeCartGlobalMatrices();
}

function removeManifestItemCompletely(id) {
    cart = cart.filter(i => i.id !== id);
    synchronizeCartGlobalMatrices();
}

window.toggleCartDrawerMatrix = function(shouldOpen) {
    const el = document.getElementById('globalCartDrawerMatrixElement');
    if(!el) return;
    if(shouldOpen) el.classList.add('active');
    else el.classList.remove('active');
};

window.clearCartManifestPool = function() {
    cart = [];
    synchronizeCartGlobalMatrices();
};

window.routeUserToCheckoutPipeline = function() {
    if(cart.length === 0) { alert("Manifest empty. Cannot generate transaction transmission path."); return; }
    window.location.href = 'checkout.html';
};

// =========================================================================
// CHECKOUT & LOGISTICS ROUTINES
// =========================================================================
function renderCheckoutSummaryStaticMatrix() {
    let accumulatedBill = 0;
    checkoutSummaryItemsContainer.innerHTML = cart.map(item => {
        accumulatedBill += Number(item.price) * item.qty;
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.01); border:1px solid #1f2937; padding:12px; border-radius:8px; margin-bottom:10px;">
                <div>
                    <div style="font-size:13px; font-weight:700;">${item.name} <span style="color:#facc15; font-size:11px;">x${item.qty}</span></div>
                    <div style="font-size:11px; color:#9ca3af; margin-top:2px;">Unit: Rs. ${Number(item.price).toLocaleString()}</div>
                </div>
                <div style="font-size:13px; font-weight:700; color:#facc15;">Rs. ${(Number(item.price)*item.qty).toLocaleString()}</div>
            </div>
        `;
    }).join('');
    document.getElementById('checkoutSummaryTotalDisplay').innerText = `Rs. ${accumulatedBill.toLocaleString()}`;
}

const checkoutForm = document.getElementById('checkoutForm');
if(checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(cart.length === 0) { alert("Core pipeline allocation validation failed. Empty selection stack."); return; }
        
        const customerManifestPayload = {
            firstName: document.getElementById('custFirstName').value.trim(),
            lastName: document.getElementById('custLastName').value.trim(),
            address: document.getElementById('custAddress').value.trim(),
            city: document.getElementById('custCity').value.trim(),
            phone: document.getElementById('custPhone').value.trim(),
            items: cart.map(i => `${i.name} (x${i.qty})`).join(', '),
            cost: document.getElementById('checkoutSummaryTotalDisplay').innerText,
            status: "Pending Verification",
            user: currentUserRef ? currentUserRef.email : "Anonymous Guest Node",
            timestamp: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "orders"), customerManifestPayload);
            alert("Logistics Manifest Data Transmitted Successfully via Cloud Pipeline Matrix!");
            cart = [];
            localStorage.removeItem('bazaarCartPool');
            window.location.href = 'index.html';
        } catch(err) {
            alert(`Logistics Transmission Pipeline Dropped: ${err.message}`);
        }
    });
}

// =========================================================================
// ADMINISTRATIVE PRIVILEGE MANAGEMENT MATRIX
// =========================================================================
const addProductForm = document.getElementById('addProductForm');
if(addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editIndex').value;
        const dynamicPayloadStructure = {
            name: document.getElementById('pName').value.trim(),
            category: document.getElementById('pCategory').value,
            price: Number(document.getElementById('pPrice').value),
            image: document.getElementById('pImage').value.trim() || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80',
            description: document.getElementById('pDesc').value.trim()
        };

        if(editId) {
            await setDoc(doc(db, "products", editId), dynamicPayloadStructure);
            document.getElementById('editIndex').value = '';
            document.getElementById('formSubmitBtn').innerText = "SAVE NODE MODULE";
        } else { 
            await addDoc(collection(db, "products"), dynamicPayloadStructure); 
        }
        addProductForm.reset(); 
    });
}

function renderAdminProductsConsoleList() {
    if(!adminProductsList) return;
    adminProductsList.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#14141c; border:1px solid #1f2937; padding:10px 15px; border-radius:8px; margin-bottom:8px; font-size:12px;">
            <div style="min-width:0; flex:1; padding-right:10px;">
                <strong class="accent-yellow">${p.name}</strong> <span style="color:#6b7280; margin-left:5px;">[${p.category}]</span>
                <div style="color:#9ca3af; margin-top:2px;">Rs. ${Number(p.price).toLocaleString()}</div>
            </div>
            <div style="display:flex; gap:8px;">
                <button onclick="editProductConsole('${p.id}')" style="color:#facc15; padding:4px;"><i class="fas fa-edit"></i></button>
                <button onclick="deleteProductConsole('${p.id}')" style="color:#ef4444; padding:4px;"><i class="far fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('');
}

window.editProductConsole = function(id) {
    const itemRef = products.find(p => p.id === id);
    if(!itemRef) return;
    document.getElementById('editIndex').value = id;
    document.getElementById('pName').value = itemRef.name; 
    document.getElementById('pCategory').value = itemRef.category;
    document.getElementById('pPrice').value = itemRef.price; 
    document.getElementById('pImage').value = itemRef.image;
    document.getElementById('pDesc').value = itemRef.description || ''; 
    document.getElementById('formSubmitBtn').innerText = "UPDATE PRODUCT";
};

window.deleteProductConsole = async function(id) { 
    if(confirm("Confirm asset record removal from Cloud Storage Node?")) { 
        await deleteDoc(doc(db, "products", id));
    } 
};

function renderAdminOrdersTrackingMatrix(orders) {
    if(!adminOrdersList) return;
    if(orders.length === 0) {
        adminOrdersList.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#4b5563;">Zero tracking arrays detected.</td></tr>`;
        return;
    }
    adminOrdersList.innerHTML = orders.map(o => `
        <tr>
            <td style="font-size:11px;">
                <strong>${o.firstName} ${o.lastName}</strong><br>
                <span style="color:#9ca3af;">M: ${o.user}<br>A: ${o.address}, ${o.city}<br>P: ${o.phone}</span>
            </td>
            <td style="font-size:11px; max-width:200px; overflow:hidden; text-overflow:ellipsis;">${o.items}</td>
            <td style="font-weight:700; color:#facc15; font-size:12px;">${o.cost}</td>
            <td>
                <select onchange="changeStatusAction('${o.id}', this.value)" style="margin:0; padding:6px; font-size:11px; background:#14141c; color:white; border:1px solid #1f2937; border-radius:6px;">
                    <option value="Pending Verification" ${o.status === 'Pending Verification' ? 'selected' : ''}>Pending</option>
                    <option value="Placed" ${o.status === 'Placed' ? 'selected' : ''}>Placed</option>
                    <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
                <button onclick="eraseOrderAction('${o.id}')" style="color:#ef4444; margin-left:8px; font-size:12px;" title="Wipe Order Archival"><i class="far fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');
}

window.changeStatusAction = async function(docId, newStatus) { 
    await setDoc(doc(db, "orders", docId), { status: newStatus }, { merge: true });
    alert(`Order node lifecycle state updated successfully to: ${newStatus}`);
};

window.eraseOrderAction = async function(docId) { 
    if(confirm("Wipe this order history element permanently from cluster metadata?")) {
        await deleteDoc(doc(db, "orders", docId));
    }
};

// INITIALIZATION TRIGNOMETRY FLOW RUNNER
synchronizeCartGlobalMatrices();
