// =========================================================================
// FIREBASE LIFETIME MULTI-DEVICE LOGIN & REGISTER SYSTEM (INTEGRATED)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Your web app's NEW Firebase configuration (Bazaarhubnew) - UNTOUCHED & SAFE
const firebaseConfig = {
  apiKey: "AIzaSyAPlpnfGWTiUQlyl2vH6uM_Ae6_EQ8YW5E",
  authDomain: "bazaarhubnew-79dee.firebaseapp.com",
  projectId: "bazaarhubnew-79dee",
  storageBucket: "bazaarhubnew-79dee.firebasestorage.app",
  messagingSenderId: "452492018395",
  appId: "1:452492018395:web:6c3cf8d956ce7fe45b42fe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserNode = null;
let products = [];

// DYNAMIC TOAST NOTIFICATION ENGINE
function showToast(message) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i class="fas fa-info-circle" style="color:#facc15; margin-right:8px;"></i> <span>${message}</span>`;
    
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 50);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { toast.remove(); }, 400);
    }, 3000);
}

// AUTH HANDLERS
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const phone = document.getElementById('regPhone').value;
        const password = document.getElementById('regPass').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), { name, email, phone, uid: user.uid, role: 'client' });
            showToast("Account Registered Successfully!");
            setTimeout(() => { window.location.href = "index.html"; }, 2000); 
        } catch (error) {
            showToast("Error: " + error.message);
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPass').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast("Secure Access Granted! Redirecting...");
            setTimeout(() => { window.location.href = "index.html"; }, 2000);
        } catch (error) {
            showToast("Invalid Credentials!");
        }
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserNode = user.email;
        const userNavState = document.getElementById('userNavState');
        if(userNavState) {
            userNavState.innerHTML = `
                <span class="hud-badge-online" style="background:#22c55e; color:white; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:700;">ONLINE</span>
                <span style="font-size:13px; color:#facc15; margin-left:5px;">${user.email}</span>
                <button id="logoutActionBtn" style="color:#ef4444; font-size:12px; font-weight:700; margin-left:15px; cursor:pointer;">LOGOUT</button>
            `;
            document.getElementById('logoutActionBtn').addEventListener('click', () => {
                auth.signOut().then(() => { window.location.reload(); });
            });
        }
    } else {
        currentUserNode = null;
        const userNavState = document.getElementById('userNavState');
        if(userNavState) {
            userNavState.innerHTML = `<button onclick="window.location.href='auth.html'" class="form-btn bg-yellow" style="width:auto; margin-top:0; padding:6px 14px; font-size:12px;">CLIENT LOGIN / REGISTER</button>`;
        }
    }
});

// PRODUCTS CATALOG READ
if (document.getElementById('productsDisplayGrid')) {
    onSnapshot(collection(db, "products"), (snapshot) => {
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderStorefrontGrid(products);
    });
}

function renderStorefrontGrid(dataArray) {
    const container = document.getElementById('productsDisplayGrid');
    if(!container) return;
    if(dataArray.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#9ca3af;">No products found.</div>`;
        return;
    }
    container.innerHTML = dataArray.map(p => `
        <div class="product-premium-card">
            <div class="p-img-frame"><img src="${p.image}" alt="${p.name}"></div>
            <div class="p-card-body">
                <span class="p-tag-category">${p.category}</span>
                <h3 class="p-title-node">${p.name}</h3>
                <p style="font-size:12px; color:#9ca3af; margin-bottom:12px; height:34px; overflow:hidden;">${p.description || ''}</p>
                <div class="p-card-footer-flex">
                    <div class="p-price-metric">Rs. ${p.price}</div>
                    <button onclick="commitCartAddition('${p.id}')" class="cart-action-trigger-btn"><i class="fas fa-shopping-basket"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

window.commitCartAddition = function(id) {
    if(!currentUserNode) {
        showToast("Please login first.");
        setTimeout(() => { window.location.href = "auth.html"; }, 1500);
        return;
    }
    const match = products.find(p => p.id === id);
    if(!match) return;
    let userCart = JSON.parse(localStorage.getItem(`cart_${currentUserNode}`)) || [];
    const target = userCart.find(item => item.id === id);
    if(target) { target.qty += 1; } else { userCart.push({ id: match.id, name: match.name, price: match.price, image: match.image, qty: 1 }); }
    localStorage.setItem(`cart_${currentUserNode}`, JSON.stringify(userCart));
    showToast(`${match.name} added to cart!`);
};

// CHECKOUT WORKFLOW
if(document.getElementById('checkoutForm')) {
    const checkoutSummaryItemsContainer = document.getElementById('checkoutSummaryItemsContainer');
    const checkoutSummaryTotalDisplay = document.getElementById('checkoutSummaryTotalDisplay');
    
    onAuthStateChanged(auth, (user) => {
        if(user) {
            const currentSessionUser = user.email;
            let currentCartArray = JSON.parse(localStorage.getItem(`cart_${currentSessionUser}`)) || [];
            if(currentCartArray.length === 0) return;

            let computedFinancialTotal = 0;
            checkoutSummaryItemsContainer.innerHTML = currentCartArray.map(item => {
                computedFinancialTotal += (item.price * item.qty);
                return `<div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:13px;"><div><span style="font-weight:700; color:#facc15;">${item.qty}x</span> ${item.name}</div><div>Rs. ${item.price * item.qty}</div></div>`;
            }).join('');
            checkoutSummaryTotalDisplay.innerText = `Rs. ${computedFinancialTotal}`;

            document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const combinedMetadataPayload = {
                    user: currentSessionUser,
                    customerName: document.getElementById('custFirstName').value + " " + document.getElementById('custLastName').value,
                    address: document.getElementById('custAddress').value,
                    city: document.getElementById('custCity').value,
                    phone: document.getElementById('custPhone').value,
                    items: currentCartArray.map(i => `${i.qty}x ${i.name}`).join(', '),
                    cost: `Rs. ${computedFinancialTotal}`,
                    status: "Pending Verification",
                    timestamp: new Date().toISOString()
                };
                try {
                    await addDoc(collection(db, "orders"), combinedMetadataPayload);
                    localStorage.removeItem(`cart_${currentSessionUser}`);
                    showToast("Order Transmitted safely!");
                    setTimeout(() => { window.location.href = "index.html"; }, 1500);
                } catch(err) { showToast("Database failure."); }
            });
        }
    });
}

// GLOBAL ADMIN CONTROL SYSTEM (ATTACHED TO WINDOW OBJECT)
if(document.getElementById('adminProductsList')) {
    onSnapshot(collection(db, "products"), (snapshot) => {
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        document.getElementById('adminProductsList').innerHTML = products.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#14141c; padding:8px 12px; border-radius:6px; margin-bottom:8px; border:1px solid #1f2937; font-size:12px;">
                <span>${p.name} (Rs. ${p.price})</span>
                <div>
                    <button onclick="window.editProductConsole('${p.id}')" style="color:#facc15; margin-right:10px; cursor:pointer;"><i class="fas fa-edit"></i></button>
                    <button onclick="window.deleteProductConsole('${p.id}')" style="color:#ef4444; cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `).join('');
    });
}

if(document.getElementById('adminOrdersList')) {
    onSnapshot(collection(db, "orders"), (snapshot) => {
        const orderData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        document.getElementById('adminOrdersList').innerHTML = orderData.map(o => `
            <tr>
                <td style="font-size:11px;"><strong>${o.customerName}</strong><br><span style="color:#9ca3af;">M: ${o.user}<br>A: ${o.address}<br>P: ${o.phone}</span></td>
                <td style="font-size:11px; color:#9ca3af;">${o.items}</td>
                <td style="font-weight:700; color:#facc15; font-size:12px;">${o.cost}</td>
                <td>
                    <select onchange="window.changeStatusAction('${o.id}', this.value)" style="background:#14141c; color:white; border-color:#374151;">
                        <option value="Pending Verification" ${o.status === 'Pending Verification' ? 'selected' : ''}>Pending</option>
                        <option value="Placed" ${o.status === 'Placed' ? 'selected' : ''}>Placed</option>
                        <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                    <button onclick="window.eraseOrderAction('${o.id}')" style="color:#ef4444; margin-left:8px; cursor:pointer;"><i class="fas fa-minus-circle"></i></button>
                </td>
            </tr>
        `).join('');
    });
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
    if(confirm("Confirm asset record removal?")) { 
        await deleteDoc(doc(db, "products", id));
        showToast("Product deleted successfully.");
    } 
};

window.changeStatusAction = async function(docId, newStatus) { 
    await setDoc(doc(db, "orders", docId), { status: newStatus }, { merge: true });
    showToast("Order status updated.");
};

window.eraseOrderAction = async function(docId) { 
    if(confirm("Erase order record?")) { 
        await deleteDoc(doc(db, "orders", docId));
        showToast("Order record removed.");
    } 
};

if (document.getElementById('addProductForm')) {
    document.getElementById('addProductForm').addEventListener('submit', async (e) => {
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
            showToast("Product updated successfully.");
        } else { 
            await addDoc(collection(db, "products"), dynamicPayloadStructure); 
            showToast("Product added successfully.");
        }
        document.getElementById('addProductForm').reset(); 
    });
}
