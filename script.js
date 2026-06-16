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

// Initialize Firebase App Instance
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Globals arrays data storage node caches
let products = [];
let cart = JSON.parse(localStorage.getItem('bazaar_cart')) || [];

// =========================================================================
// 1. AUTHENTICATION CONTROLLER HANDLERS (MULTI-DEVICE ECOSYSTEM)
// =========================================================================

// Global Auth State Observer Routine Pipeline
onAuthStateChanged(auth, async (user) => {
    const authStatusBadge = document.getElementById('authStatusBadge');
    const adminLinkButton = document.getElementById('adminLinkButton');
    
    if (user) {
        // User logged in state routine
        if(authStatusBadge) {
            authStatusBadge.innerHTML = `<i class="fas fa-user-circle"></i> ${user.email.split('@')[0].toUpperCase()} | <span id="signOutTrigger" style="color:#facc15; cursor:pointer; margin-left:5px; font-weight:700;">LOGOUT</span>`;
            
            // Attach logout trigger safely
            setTimeout(() => {
                const trigger = document.getElementById('signOutTrigger');
                if(trigger) {
                    trigger.addEventListener('click', async () => {
                        await signOut(auth);
                        alert("Session terminated successfully.");
                        window.location.reload();
                    });
                }
            }, 300);
        }

        // Fetch User profile metadata record role level
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if(userDocSnap.exists() && userDocSnap.data().role === 'admin') {
                if(adminLinkButton) adminLinkButton.classList.remove('hidden');
            } else {
                if(adminLinkButton) adminLinkButton.classList.add('hidden');
            }
        } catch(err) {
            console.error("Profile security clearance query error:", err);
        }
    } else {
        // Guest user state structural layout routing
        if(authStatusBadge) {
            authStatusBadge.innerHTML = `<button onclick="window.location.href='auth.html'" class="form-btn bg-yellow" style="margin:0; padding:4px 10px; font-size:11px; width:auto;">LOGIN / REGISTER</button>`;
        }
        if(adminLinkButton) adminLinkButton.classList.add('hidden');
    }
});

// User Account Registration Form Stream Pipeline
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const pass = document.getElementById('regPass').value;

        if(pass.length < 6) {
            alert("Security matrix failure: Password must be at least 6 characters.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const user = userCredential.user;

            // Transmit database user mapping node
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                phone: phone,
                role: "client", // Default access standard route pipeline mapping
                timestamp: new Date().toISOString()
            });

            alert("Account provisioning system complete! Redirecting to Store.");
            window.location.href = "index.html";
        } catch (error) {
            console.error("Auth Register Exception Error:", error);
            alert("Registration aborted: " + error.message);
        }
    });
}

// User Portal Secure Authentication Pipeline Form Linker
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPass').value;

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            alert("Security authentication authorized! Loading account profile.");
            window.location.href = "index.html";
        } catch (error) {
            console.error("Auth Sign-In Error Event Logged:", error);
            alert("Access Denied: Invalid email address credentials or password mismatch block.");
        }
    });
}

// =========================================================================
// 2. PRODUCT VAULT PIPELINE MANAGEMENT (REAL-TIME SNAPSHOT CORE)
// =========================================================================
if(document.getElementById('storefrontGridContainer') || document.getElementById('adminProductsList')) {
    onSnapshot(collection(db, "products"), (snapshot) => {
        products = [];
        snapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        // Execute conditional rendering matrices nodes layouts
        if(document.getElementById('storefrontGridContainer')) renderStorefrontCatalogUI();
        if(document.getElementById('adminProductsList')) renderAdminConsoleCatalogUI();
    });
}

function renderStorefrontCatalogUI() {
    const container = document.getElementById('storefrontGridContainer');
    if(!container) return;
    if(products.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#9ca3af;">No asset items loaded inside standard database array stacks.</div>`;
        return;
    }
    container.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-badge">${p.category || 'General Asset'}</div>
            <img src="${p.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500'}" class="product-img" alt="${p.name}">
            <div class="product-info-panel">
                <h3 class="product-name-title">${p.name}</h3>
                <p class="product-desc-block">${p.description || 'No digital manifest description file index allocated.'}</p>
                <div class="product-action-row">
                    <span class="product-price-tag">Rs. ${p.price}</span>
                    <button onclick="window.injectItemIntoCartQueue('${p.id}')" class="buy-btn"><i class="fas fa-shopping-cart-plus"></i> ADD TO CART</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderAdminConsoleCatalogUI() {
    const container = document.getElementById('adminProductsList');
    if(!container) return;
    if(products.length === 0) {
        container.innerHTML = `<p style="font-size:12px; color:#9ca3af;">0 items loaded.</p>`;
        return;
    }
    container.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#14141c; padding:10px; border-radius:6px; border:1px solid #1f2937; margin-bottom:8px; font-size:12px;">
            <div><strong>${p.name}</strong> (Rs. ${p.price})</div>
            <div style="display:flex; gap:6px;">
                <button onclick="window.editProductConsole('${p.id}')" style="color:#facc15;"><i class="fas fa-edit"></i></button>
                <button onclick="window.deleteProductConsole('${p.id}')" style="color:#ef4444;"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('');
}

// =========================================================================
// 3. CART ARCHITECTURE DATA MANIPULATION LOGIC ARRAYS
// =========================================================================
window.injectItemIntoCartQueue = function(id) {
    const refItem = products.find(p => p.id === id);
    if(!refItem) return;

    const existingMatch = cart.find(item => item.id === id);
    if(existingMatch) {
        existingMatch.qty += 1;
    } else {
        cart.push({ id: refItem.id, name: refItem.name, price: refItem.price, image: refItem.image, qty: 1 });
    }
    syncCartGlobalState();
    alert(`Successfully allocated "${refItem.name}" to structural cart manifest.`);
};

function syncCartGlobalState() {
    localStorage.setItem('bazaar_cart', JSON.stringify(cart));
    renderGlobalCartInterfaceOverlay();
}

function renderGlobalCartInterfaceOverlay() {
    const qtyBadge = document.getElementById('cartNotificationCounterBadge');
    const container = document.getElementById('cartMasterItemsDisplayContainer');
    const totalDisplay = document.getElementById('cartMasterTotalDueValueText');

    let runningSum = 0;
    let itemsCount = 0;

    cart.forEach(c => {
        runningSum += (c.price * c.qty);
        itemsCount += c.qty;
    });

    if(qtyBadge) qtyBadge.innerText = itemsCount;
    if(totalDisplay) totalDisplay.innerText = `Rs. ${runningSum}`;

    if(!container) return;

    if(cart.length === 0) {
        container.innerHTML = `<p style="color:#9ca3af; font-size:12px; text-align:center; padding:30px;">Cart registry array pipeline is empty.</p>`;
        return;
    }

    container.innerHTML = cart.map(c => `
        <div style="display:flex; gap:10px; align-items:center; background:#14141c; padding:8px; border-radius:6px; border:1px solid #1f2937; margin-bottom:8px; font-size:11px;">
            <img src="${c.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500'}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
            <div style="flex:1;">
                <div style="font-weight:700; color:white;">${c.name}</div>
                <div style="color:#9ca3af;">Rs. ${c.price} x ${c.qty}</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
                <button onclick="window.modifyCartItemQtyNode('${c.id}', 1)" style="color:#facc15;"><i class="fas fa-plus-circle"></i></button>
                <button onclick="window.modifyCartItemQtyNode('${c.id}', -1)" style="color:#ef4444;"><i class="fas fa-minus-circle"></i></button>
            </div>
        </div>
    `).join('');
}

window.modifyCartItemQtyNode = function(id, offset) {
    const idx = cart.findIndex(c => c.id === id);
    if(idx === -1) return;
    
    cart[idx].qty += offset;
    if(cart[idx].qty <= 0) {
        cart.splice(idx, 1);
    }
    syncCartGlobalState();
};

// =========================================================================
// 4. CHECKOUT PIPELINE ORDER DISPATCH ENGINE SYSTEM
// =========================================================================
const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    // Inject Live Summary Data Block view elements
    const checkoutContainer = document.getElementById('checkoutSummaryItemsContainer');
    const checkoutTotalDisplay = document.getElementById('checkoutSummaryTotalDisplay');
    
    let subTotalSum = 0;
    cart.forEach(i => subTotalSum += (i.price * i.qty));
    
    if(checkoutTotalDisplay) checkoutTotalDisplay.innerText = `Rs. ${subTotalSum}`;
    if(checkoutContainer) {
        if(cart.length === 0) {
            checkoutContainer.innerHTML = `<p style="color:#ef4444; font-size:12px;">Manifest Error: Cannot route layout checkout for empty item lists array pipeline nodes.</p>`;
        } else {
            checkoutContainer.innerHTML = cart.map(i => `
                <div style="display:flex; justify-content:space-between; font-size:13px; color:#9ca3af; margin-bottom:8px;">
                    <span>${i.name} <strong>(x${i.qty})</strong></span>
                    <span style="color:#fff;">Rs. ${i.price * i.qty}</span>
                </div>
            `).join('');
        }
    }

    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(cart.length === 0) {
            alert("Aborted: Empty selection queue.");
            return;
        }

        const authenticatedUser = auth.currentUser;
        const serializedItemsPayload = cart.map(c => `${c.name} (x${c.qty})`).join(', ');

        const globalCheckoutObjectNode = {
            user: authenticatedUser ? authenticatedUser.email : "Unverified Anonymous Client Token Guest Node",
            userId: authenticatedUser ? authenticatedUser.uid : "GUEST_NODE_ROUTING",
            name: `${document.getElementById('custFirstName').value} ${document.getElementById('custLastName').value}`,
            address: `${document.getElementById('custAddress').value}, ${document.getElementById('custCity').value}`,
            phone: document.getElementById('custPhone').value,
            items: serializedItemsPayload,
            cost: `Rs. ${subTotalSum}`,
            status: "Pending Verification",
            timestamp: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "orders"), globalCheckoutObjectNode);
            alert("LOGISTICS SYSTEM DISPATCH SUCCESSFUL: Telemetry transmission array logged to cloud storage system pipeline clusters database rows!");
            cart = [];
            syncCartGlobalState();
            window.location.href = "index.html";
        } catch(err) {
            console.error("Order dispatch exception logged error: ", err);
            alert("Transmission Error: " + err.message);
        }
    });
}

// =========================================================================
// 5. ADMIN GLOBAL ECOSYSTEM CONTROLLER GRID REAL-TIME CHANNELS
// =========================================================================
if (document.getElementById('adminOrdersList')) {
    onSnapshot(collection(db, "orders"), (snapshot) => {
        let structuralOrdersCacheArray = [];
        snapshot.forEach((doc) => {
            structuralOrdersCacheArray.push({ id: doc.id, ...doc.data() });
        });
        renderAdminConsoleGlobalOrdersLogisticsTable(structuralOrdersCacheArray);
    });
}

function renderAdminConsoleGlobalOrdersLogisticsTable(arrayNodes) {
    const listElement = document.getElementById('adminOrdersList');
    if(!listElement) return;
    if(arrayNodes.length === 0) {
        listElement.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#9ca3af; font-size:12px;">No incoming dispatches detected in system memory.</td></tr>`;
        return;
    }

    listElement.innerHTML = arrayNodes.map(o => `
        <tr style="border-bottom:1px solid #1f2937; font-size:11px; text-align:left;">
            <td style="padding:10px; color:#fff;">
                <strong>${o.name}</strong><br>
                <span style="color:#9ca3af;">M: ${o.user}<br>A: ${o.address}<br>P: ${o.phone}</span>
            </td>
            <td style="padding:10px; color:#9ca3af;">${o.items}</td>
            <td style="padding:10px; font-weight:700; color:#facc15;">${o.cost}</td>
            <td style="padding:10px;">
                <select onchange="window.changeStatusAction('${o.id}', this.value)" style="margin:0; padding:5px; font-size:11px; background:#14141c; color:white; border-color:#374151; border-radius:4px;">
                    <option value="Pending Verification" ${o.status === 'Pending Verification' ? 'selected' : ''}>Pending</option>
                    <option value="Placed" ${o.status === 'Placed' ? 'selected' : ''}>Placed</option>
                    <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
                <button onclick="window.eraseOrderAction('${o.id}')" style="margin-left:10px; color:#ef4444; background:none; border:none; cursor:pointer;" title="Delete Record"><i class="fas fa-trash"></i></button>
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
    try {
        await setDoc(doc(db, "orders", docId), { status: statusValue }, { merge: true });
        alert("Logistics status route dynamically patched successfully!");
    } catch(err) {
        console.error("Status update failure: ", err);
    }
};

window.eraseOrderAction = async function(docId) {
    if (confirm("Erase order record block from cloud network database rows?")) {
        try {
            await deleteDoc(doc(db, "orders", docId));
            alert("Order node dropped successfully.");
        } catch(err) {
            console.error("Deletion exception error: ", err);
        }
    }
};

// Form submission handler block for Admin Panel
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
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

        try {
            if (editId !== '') {
                await setDoc(doc(db, "products", editId), dynamicPayloadStructure);
                document.getElementById('editIndex').value = '';
                document.getElementById('formSubmitBtn').innerText = "SAVE NODE MODULE";
                alert("Product configuration modified successfully.");
            } else { 
                await addDoc(collection(db, "products"), dynamicPayloadStructure); 
                alert("New product asset allocated to cloud ledger.");
            }
            addProductForm.reset(); 
        } catch(err) {
            console.error("Catalog operation write fault error: ", err);
            alert("Database Error: " + err.message);
        }
    });
}

// Auto-run current active view cart allocations rendering
renderGlobalCartInterfaceOverlay();
