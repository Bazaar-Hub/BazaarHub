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

// Global access ke liye (agar kisi dusri direct script me use karna ho)
window.auth = auth;
window.db = db;

// Lifetime Device Session Persistence (Login automatic save rahega dusre browsers me bhi)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Firebase Connected! User logged in:", user.email);
        // Agar user already logged in hai aur login/auth page par hai, toh direct home page bhejein
        if (window.location.pathname.includes("auth.html")) {
            window.location.href = "index.html";
        }
    } else {
        console.log("No user logged in currently.");
        // Agar authenticated nahi hai aur index/admin page par hai, toh auth page par redirect karein
        if (!window.location.pathname.includes("auth.html")) {
            window.location.href = "auth.html";
        }
    }
});

// ==========================================
// 1. REGISTER (Account Creation & Database Save)
// ==========================================
const regForm = document.getElementById('registerForm');
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const phone = document.getElementById('regPhone').value; 
        const password = document.getElementById('regPass').value;

        if (password.length < 6) {
            alert("Password must be at least 6 characters long!");
            return;
        }

        try {
            // Creating user identity instance record on Firebase Auth Cluster
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Saving telemetry records parameters safely inside centralized firestore catalog
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name: name,
                email: email,
                phone: phone,
                role: "client" // default role assignation protocol
            });

            alert("Account successfully created!");
            window.location.href = "index.html"; 
        } catch (error) {
            console.error("Reg Error:", error.message);
            alert("Registration Failed: " + error.message);
        }
    });
}

// ==========================================
// 2. LOGIN (Session Persistence Engine)
// ==========================================
const logForm = document.getElementById('loginForm');
if (logForm) {
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPass').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Login Successful!");
            window.location.href = "index.html"; 
        } catch (error) {
            console.error("Login Error:", error.message);
            alert("Login Failed: " + error.message);
        }
    });
}

// =========================================================================
// REALTIME PRODUCTS DATA MATRIX & DYNAMIC DISPATCH CATALOG CODES (DOM CONTROLS)
// =========================================================================
const adminProdContainer = document.getElementById('adminProductsList');
const storeProdContainer = document.getElementById('storefrontProductsGrid');

if (adminProdContainer || storeProdContainer) {
    onSnapshot(collection(db, "products"), (snapshot) => {
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (adminProdContainer) {
            adminProdContainer.innerHTML = products.map(p => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#14141c; padding:8px 12px; margin-bottom:8px; border-radius:6px; border:1px solid #1f2937;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${p.image}" style="width:35px; height:35px; border-radius:4px; object-fit:cover;">
                        <div>
                            <div style="font-size:13px; font-weight:700;">${p.name}</div>
                            <div style="font-size:11px; color:#facc15;">Rs. ${p.price} | ${p.category}</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button onclick="editProductConsole('${p.id}')" style="color:#facc15; font-size:12px;"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteProductConsole('${p.id}')" style="color:#ef4444; font-size:12px;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        }
        
        if (storeProdContainer) {
            if (products.length === 0) {
                storeProdContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:4px; color:#9ca3af;">No computational asset vectors loaded.</div>`;
            } else {
                storeProdContainer.innerHTML = products.map(p => `
                    <div class="product-card">
                        <img src="${p.image}" class="product-img" alt="${p.name}">
                        <div class="product-info">
                            <span class="product-tag">${p.category}</span>
                            <h3 class="product-title">${p.name}</h3>
                            <p style="font-size:11px; color:#9ca3af; margin:4px 0 8px 0; height:32px; overflow:hidden;">${p.description || ''}</p>
                            <div class="product-meta">
                                <span class="product-price">Rs. ${p.price}</span>
                                <button onclick="injectItemToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')" class="add-cart-btn"><i class="fas fa-shopping-basket"></i></button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    });
}

// =========================================================================
// CENTRAL REALTIME LOGISTICS DISPATCH MANAGERS (ADMIN MATRIX CONSOLE NODES)
// =========================================================================
const adminOrdersTableBody = document.getElementById('adminOrdersList');
if (adminOrdersTableBody) {
    onSnapshot(collection(db, "orders"), (snapshot) => {
        orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        orders.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

        adminOrdersTableBody.innerHTML = orders.map(o => `
            <tr>
                <td>
                    <div style="font-weight:700; font-size:13px; color:#ffffff;">${o.customerName}</div>
                    <div style="font-size:11px; color:#9ca3af; margin-top:2px;">
                        <i class="fas fa-phone" style="font-size:10px;"></i> ${o.customerPhone}<br>
                        <i class="fas fa-envelope" style="font-size:10px;"></i> ${o.userEmail || 'Guest'}<br>
                        <i class="fas fa-map-marker-alt" style="font-size:10px;"></i> ${o.customerAddress}, ${o.customerCity}
                    </div>
                </td>
                <td style="font-size:12px; max-width:250px; white-space:normal; word-break:break-word;">
                    ${o.cartItems ? o.cartItems.map(i => `<div style="margin-bottom:2px;">• ${i.name} <span style="color:#9ca3af;">(x${i.quantity})</span></div>`).join('') : ''}
                </td>
                <td style="font-weight:700; color:#facc15; font-size:13px;">Rs. ${o.totalAmount}</td>
                <td>
                    <select onchange="changeStatusAction('${o.id}', this.value)" style="margin:0; padding:6px; font-size:12px; background:#14141c; color:white; border:1px solid #374151; border-radius:6px;">
                        <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Dispatched" ${o.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
                        <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                    <button onclick="eraseOrderAction('${o.id}')" style="margin-left:8px; color:#ef4444; font-size:12px;"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `).join('');
    });
}

// =========================================================================
// ADMIN CONTROL PANEL INTERFACES EXPOSED LOGICAL METHODS
// =========================================================================
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editIndex').value;
        const dynamicPayloadStructure = {
            name: document.getElementById('pName').value,
            category: document.getElementById('pCategory').value,
            price: parseFloat(document.getElementById('pPrice').value),
            image: document.getElementById('pImage').value,
            description: document.getElementById('pDesc').value
        };

        if (id) {
            await setDoc(doc(db, "products", id), dynamicPayloadStructure);
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
        if(confirm("Delete this logistics routing track entry?")) {
            await deleteDoc(doc(db, "orders", docId));
        }
    };
}
