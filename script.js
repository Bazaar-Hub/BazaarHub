// =========================================================================
// FIREBASE LIFETIME MULTI-DEVICE LOGIN & REGISTER SYSTEM (INTEGRATED)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global Variables
let products = [];
let orders = [];
let systemCartCache = [];
// --- 1. REALTIME AUTH & CART SYNC (Cross-Browser Fix) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        localStorage.setItem('loggedInUser', user.email);
        
        // Listen to Cart changes in Realtime from Cloud
        onSnapshot(doc(db, "carts", user.uid), (cartSnap) => {
            if (cartSnap.exists()) {
                systemCartCache = cartSnap.data().items || [];
            } else {
                systemCartCache = [];
            }
            localStorage.setItem('systemCartCache', JSON.stringify(systemCartCache));
            if (typeof renderEcomCartWorkspace === 'function') renderEcomCartWorkspace();
        });

        // Authorization Gateway Redirects
        if(window.location.pathname.includes('auth.html')) {
            if (user.email === "admin@bazaarhub.com") {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        }
    } else {
        localStorage.removeItem('loggedInUser');
        systemCartCache = [];
        if (typeof renderEcomCartWorkspace === 'function') renderEcomCartWorkspace();
    }
});        

// --- 2. AUTH CARD TAB SWITCHING LOGIC ---
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (loginTab && registerTab && loginForm && registerForm) {
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });
}

// --- 3. CLOUD RECORDBASE REGISTRATION HANDLING ---
if(registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const phone = document.getElementById('regPhone').value;
        const password = document.getElementById('regPass').value;

        try {
            const q = query(collection(db, "users"), where("phone", "==", phone));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                alert("Yeh Phone Number pehle se register hai! Baraye meharbani dusra number istemal karein.");
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                phone: phone,
                createdAt: new Date().toISOString()
            });

            alert("Account Lifetime ke liye register ho gaya hai! Ab kisi bhi browser se login chalega.");
            window.location.href = 'index.html'; 
        } catch (error) {
            alert("Registration Failed: " + error.message);
        }
    });
}

// --- 4. MULTI-DEVICE LOGIN HANDLING ---
if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPass').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                localStorage.setItem('loggedInUser', email);
                alert("Login Successful! Access Granted.");
                window.location.href = 'index.html';
            })
            .catch((error) => {
                alert("Login Failed: Email ya Password galat hai ya account majood nahi hai.");
            });
    });
}

// =========================================================================
// REALTIME CLOUD SYNC FOR PRODUCTS & ORDERS (Works Globally Across Browsers)
// =========================================================================
function setupRealtimeCloudListeners() {
    // Realtime Products Sync
    onSnapshot(collection(db, "products"), (snapshot) => {
        products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        // If Database is empty, inject default nodes
        if (products.length === 0) {
            const defaultProducts = [
                { name: "uefe Running Shoes", category: "shoes", price: 545, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff", description: "Premium tracking sports wear edition." },
                { name: "Alpha Cyber Hoodie", category: "clothes", price: 3200, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7", description: "Heavy knit tailored futuristic variant fabric core." },
                { name: "Chrono Gold Edition", category: "watches", price: 8900, image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3", description: "Water resistant tactical luxury configuration metrics." }
            ];
            defaultProducts.forEach(async (p) => {
                await addDoc(collection(db, "products"), p);
            });
        }

        if (document.getElementById('productCatalogGridPulse')) renderStorefrontCatalog();
        if (document.getElementById('addProductForm')) renderAdminConsole();
    });

    // Realtime Orders Sync
    onSnapshot(collection(db, "orders"), (snapshot) => {
        orders = [];
        snapshot.forEach(doc => {
            orders.push({ docId: doc.id, ...doc.data() });
        });
        if (document.getElementById('addProductForm')) renderAdminConsole();
    });
}

async function saveCartToCloud() {
    if (auth.currentUser) {
        await setDoc(doc(db, "carts", auth.currentUser.uid), { items: systemCartCache });
    } else {
        localStorage.setItem('systemCartCache', JSON.stringify(systemCartCache));
    }
}

// Initialize listeners
setupRealtimeCloudListeners();

// =========================================================================
// RENDER: PRODUCTS CATALOG SYSTEM GRID
// =========================================================================
function renderStorefrontCatalog(filteredArray = products) {
    const catalogGrid = document.getElementById('productCatalogGridPulse');
    if (!catalogGrid) return;
    
    if(filteredArray.length === 0) {
        catalogGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#9ca3af;">No matching items found.</div>`;
        return;
    }
    catalogGrid.innerHTML = filteredArray.map(p => {
        const globalIdx = products.findIndex(item => item.name === p.name);
        return `
            <div class="product-card">
                <div class="card-badge">${p.category.toUpperCase()}</div>
                <img src="${p.image}" alt="${p.name}" class="product-image">
                <div class="card-details">
                    <h3 class="product-title">${p.name}</h3>
                    <p class="product-description">${p.description || 'No description available.'}</p>
                    <div class="price-row">
                        <span class="product-price">Rs. ${p.price}</span>
                        <button onclick="appendItemToCartWorkspace(${globalIdx})" class="form-btn bg-yellow" style="width:auto; margin:0; padding:6px 12px; font-size:12px;">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

const searchFilterNode = document.getElementById('searchFilterNode');
const categorySelectorNode = document.getElementById('categorySelectorNode');

function triggerStorefrontFilters() {
    if (!searchFilterNode || !categorySelectorNode) return;
    const queryStr = searchFilterNode.value.toLowerCase();
    const category = categorySelectorNode.value;
    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(queryStr) || (p.description && p.description.toLowerCase().includes(queryStr));
        const matchesCategory = category === 'all' || p.category === category;
        return matchesSearch && matchesCategory;
    });
    renderStorefrontCatalog(filtered);
}

if(searchFilterNode) searchFilterNode.addEventListener('input', triggerStorefrontFilters);
if(categorySelectorNode) categorySelectorNode.addEventListener('change', triggerStorefrontFilters);

window.appendItemToCartWorkspace = function(idx) {
    const targetItem = products[idx];
    const existing = systemCartCache.find(c => c.name === targetItem.name);
    if (existing) { existing.quantity += 1; } 
    else { systemCartCache.push({ ...targetItem, quantity: 1 }); }
    saveCartToCloud(); 
    renderEcomCartWorkspace();
    alert(`${targetItem.name} added to cart.`);
};

// =========================================================================
// CART MANIFEST SIDEBAR WORKSPACE SYSTEM
// =========================================================================
const cartSidebar = document.getElementById('shoppingCartSidebarNode');
const cartItemsContainer = document.getElementById('cartItemsListContainer');
const cartTotalDisplay = document.getElementById('cartTotalCounterDisplay');
const cartCountBadge = document.getElementById('cartCountBadge');

function renderEcomCartWorkspace() {
    if(!cartItemsContainer) return;
    
    const totalQty = systemCartCache.reduce((acc, c) => acc + c.quantity, 0);
    if(cartCountBadge) cartCountBadge.innerText = totalQty;

    if (systemCartCache.length === 0) {
        cartItemsContainer.innerHTML = `<div style="text-align:center; color:#9ca3af; padding:30px;">Your cart is empty.</div>`;
        if(cartTotalDisplay) cartTotalDisplay.innerText = "Rs. 0";
        return;
    }

    cartItemsContainer.innerHTML = systemCartCache.map((c, idx) => `
        <div class="cart-item">
            <img src="${c.image}" alt="${c.name}">
            <div class="cart-item-details">
                <h4>${c.name}</h4>
                <p>Rs. ${c.price} x ${c.quantity}</p>
                <div style="display:flex; gap:5px; margin-top:5px;">
                    <button onclick="alterCartQtyAction(${idx}, -1)" style="color:#facc15; font-weight:bold; font-size:16px;">-</button>
                    <button onclick="alterCartQtyAction(${idx}, 1)" style="color:#facc15; font-weight:bold; font-size:16px;">+</button>
                    <button onclick="alterCartQtyAction(${idx}, 0)" style="color:#ef4444; margin-left:auto; font-size:11px;">Remove</button>
                </div>
            </div>
        </div>
    `).join('');

    const totalCost = systemCartCache.reduce((acc, c) => acc + (c.price * c.quantity), 0);
    if(cartTotalDisplay) cartTotalDisplay.innerText = `Rs. ${totalCost}`;
}

window.toggleCartSidebarView = function() { if(cartSidebar) cartSidebar.classList.toggle('active'); };
window.clearCartWorkspaceCache = function() { systemCartCache = []; saveCartToCloud(); renderEcomCartWorkspace(); };

window.alterCartQtyAction = function(idx, delta) {
    if (delta === 0) { systemCartCache.splice(idx, 1); } 
    else {
        systemCartCache[idx].quantity += delta;
        if (systemCartCache[idx].quantity <= 0) { systemCartCache.splice(idx, 1); }
    }
    saveCartToCloud(); renderEcomCartWorkspace();
};

window.routeToCheckoutPipeline = function() {
    if (systemCartCache.length === 0) { alert("Cart is empty."); return; }
    window.location.href = 'checkout.html';
};

// =========================================================================
// CHECKOUT PIPELINE & ORDERS LOGISTICS TRANSMISSION
// =========================================================================
if (document.getElementById('checkoutForm')) {
    const checkoutSummaryContainer = document.getElementById('checkoutSummaryItemsContainer');
    const checkoutTotalDisplay = document.getElementById('checkoutSummaryTotalDisplay');
    const checkoutForm = document.getElementById('checkoutForm');

    function renderCheckoutSummary() {
        if(!checkoutSummaryContainer) return;
        checkoutSummaryContainer.innerHTML = systemCartCache.map(c => `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:13px; color:#9ca3af;">
                <span style="flex:1;">${c.name} (x${c.quantity})</span>
                <span>Rs. ${c.price * c.quantity}</span>
            </div>
        `).join('');
        const grandTotal = systemCartCache.reduce((acc, c) => acc + (c.price * c.quantity), 0);
        if(checkoutTotalDisplay) checkoutTotalDisplay.innerText = `Rs. ${grandTotal}`;
    }

    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const grandTotal = systemCartCache.reduce((acc, c) => acc + (c.price * c.quantity), 0);
        const orderId = 'BZH-' + Math.floor(100000 + Math.random() * 900000);
        
        const orderPayload = {
            id: orderId,
            user: document.getElementById('custFirst').value + ' ' + document.getElementById('custLast').value,
            items: systemCartCache.map(c => `${c.name}(x${c.quantity})`).join(', '),
            cost: `Rs. ${grandTotal}`,
            address: document.getElementById('custAddress').value + ', ' + document.getElementById('custCity').value,
            phone: document.getElementById('custPhone').value,
            status: 'Pending Verification',
            createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, "orders"), orderPayload);
        
        systemCartCache = [];
        await saveCartToCloud();
        checkoutForm.reset();
        alert(`Order Placed Successfully! ID: ${orderId}`);
        window.location.href = 'index.html';
    });

    const cachedCart = localStorage.getItem('systemCartCache');
    if (cachedCart) {
        systemCartCache = JSON.parse(cachedCart);
    }
    renderCheckoutSummary();
}

// =========================================================================
// ADMIN CONSOLE INTERACTION SYSTEM 
// =========================================================================
function renderAdminConsole() {
    const adminProductsList = document.getElementById('adminProductsList');
    const adminOrdersList = document.getElementById('adminOrdersList');

    if(adminProductsList) {
        adminProductsList.innerHTML = products.map((p, idx) => `
            <div style="display:flex; align-items:center; justify-content:space-between; background:#14141c; padding:10px; border-radius:6px; margin-bottom:8px; border:1px solid #1f2937;">
                <span style="font-size:13px;">${p.name} (Rs. ${p.price})</span>
                <div>
                    <button onclick="editProductConsole('${p.id}')" style="color:#facc15; font-size:12px; margin-right:10px;">Edit</button>
                    <button onclick="deleteProductConsole('${p.id}')" style="color:#ef4444; font-size:12px;">Delete</button>
                </div>
            </div>
        `).join('');
    }

    if(adminOrdersList) {
        if (orders.length === 0) {
            adminOrdersList.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#9ca3af;">No current logs.</td></tr>`;
            return;
        }
        adminOrdersList.innerHTML = orders.map((o) => `
            <tr>
                <td style="font-size:12px;"><strong>ID:</strong> ${o.id}<br><strong>Client:</strong> ${o.user}<br><strong>Tel:</strong> ${o.phone}<br><strong>Dest:</strong> ${o.address}</td>
                <td style="font-size:12px; color:#9ca3af;">${o.items}</td>
                <td><span style="padding:4px 8px; font-size:11px; border-radius:4px; font-weight:bold; background:${o.status === 'Delivered' ? '#10b981' : o.status === 'Placed' ? '#3b82f6' : '#facc15'}; color:#000;">${o.status}</span></td>
                <td>
                    <select onchange="changeStatusAction('${o.docId}', this.value)" style="padding:4px; font-size:11px; width:auto; display:inline-block;">
                        <option value="Pending Verification" ${o.status==='Pending Verification'?'selected':''}>Pending</option>
                        <option value="Placed" ${o.status==='Placed'?'selected':''}>Placed</option>
                        <option value="Delivered" ${o.status==='Delivered'?'selected':''}>Delivered</option>
                    </select>
                    <button onclick="eraseOrderAction('${o.docId}')" style="color:#ef4444; font-size:12px; margin-left:8px;">X</button>
                </td>
            </tr>
        `).join('');
    }
}

if (document.getElementById('addProductForm')) {
    const addProductForm = document.getElementById('addProductForm');

    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editIndex').value;
        const dynamicPayloadStructure = {
            name: document.getElementById('pName').value,
            category: document.getElementById('pCategory').value,
            price: parseInt(document.getElementById('pPrice').value),
            image: document.getElementById('pImage').value,
            description: document.getElementById('pDesc').value
        };

        if (editId !== '') {
            await setDoc(doc(db, "products", editId), dynamicPayloadStructure);
            document.getElementById('editIndex').value = '';
            document.getElementById('formSubmitBtn').innerText = "SAVE NODE MODULE";
        } else { 
            await addDoc(collection(db, "products"), dynamicPayloadStructure); 
        }
        addProductForm.reset(); 
    });

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
        if(confirm("Confirm asset record removal?")) { 
            await deleteDoc(doc(db, "products", id));
        } 
    };
    
    window.changeStatusAction = async function(docId, newStatus) { 
        await setDoc(doc(db, "orders", docId), { status: newStatus }, { merge: true });
    };
    
    window.eraseOrderAction = async function(docId) { 
        if(confirm("Erase order record?")) { 
            await deleteDoc(doc(db, "orders", docId));
        } 
    };
}
