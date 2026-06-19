// =========================================================================
// BAZAARHUB - FULLY INTEGRATED REAL-TIME FIREBASE ENGINE & BACKEND TERMINAL
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Firebase App Config
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

// 🟢 FIX FOR MULTI-DEVICE LOGIN: Global Auth Session Persistence configuration
// Is se kisi bhi device ya browser par user logging out ke bagair persisted rahega
setPersistence(auth, browserLocalPersistence)
  .then(() => { console.log("Auth Persistence State initialized to LOCAL."); })
  .catch((err) => { console.error("Persistence Initialization Error:", err); });

// Global Auth Monitor State Pipeline
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Active Session Token Identifier Detected:", user.uid);
        // Agar user login hone ke baad ghalti se register/auth page par ho, to index.html bhej dein
        if (window.location.pathname.includes("auth.html")) {
            window.location.href = "index.html";
        }
    } else {
        console.log("No Active Session Node Verified.");
    }
});

// =========================================================================
// SECTION 1: AUTHENTICATION (REGISTER & LOGIN FIXES)
// =========================================================================

// A. Account Creation Router Engine
const regForm = document.getElementById('registerForm');
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPass').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // User Meta Cluster in Firestore Architecture
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name: name,
                email: email,
                role: "client"
            });
            alert("Account successfully created inside Cloud Node!");
            window.location.href = "index.html";
        } catch (error) {
            console.error("Reg Error Node:", error.message);
            alert("Registration Failed: " + error.message);
        }
    });
}

// B. Secure Access Terminal Login Router (Fix for different users login check)
const logForm = document.getElementById('loginForm');
if (logForm) {
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPass').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Access Granted! Login Successful.");
            window.location.href = "index.html"; 
        } catch (error) {
            console.error("Authentication Matrix Error:", error.message);
            alert("Login Failed: Unverified Credentials - " + error.message);
        }
    });
}

// =========================================================================
// SECTION 2: REAL-TIME CATALOG SYNCHRONIZATION (ADMIN + CUSTOMER VIEW)
// =========================================================================
const productsGrid = document.getElementById('productsGrid'); // index.html grid layout
const adminProductsList = document.getElementById('adminProductsList'); // admin.html catalog box

if (productsGrid || adminProductsList) {
    // 🟢 Snapshot data streaming listeners: Real-time update for ALL customer tabs globally!
    onSnapshot(collection(db, "products"), (snapshot) => {
        let productsHTML = "";
        let adminHTML = "";

        snapshot.forEach((docSnap) => {
            const product = docSnap.data();
            const id = docSnap.id; // Cloud String Data Identifier Document ID

            // Customer Dynamic Cards Compilation (index.html)
            if (productsGrid) {
                productsHTML += `
                    <div class="product-card">
                        <img src="${product.img || 'https://via.placeholder.com/150'}" class="product-img" alt="${product.title}">
                        <div class="product-info">
                            <span class="category-tag">${product.category}</span>
                            <h3 class="product-title">${product.title}</h3>
                            <p class="product-desc">${product.desc}</p>
                            <div class="product-price-row">
                                <span class="price-amount">Rs. ${product.price}</span>
                                <button class="add-to-cart-btn" onclick="addToCartWorkflow('${id}', '${product.title.replace(/'/g, "\\'")}', ${product.price})">Add</button>
                            </div>
                        </div>
                    </div>`;
            }

            // Admin List Vault Entries Compilation (admin.html)
            if (adminProductsList) {
                adminHTML += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #1f2937; background:#14141c; margin-bottom:5px; border-radius:6px;">
                        <div>
                            <strong style="color:#ffffff;">${product.title}</strong> <span style="color:#facc15; font-weight:700;">(Rs. ${product.price})</span>
                            <br><span style="font-size:11px; color:#9ca3af;">${product.category}</span>
                        </div>
                        <div>
                            <button onclick="editProductConsole('${id}', '${product.title.replace(/'/g, "\\'")}', '${product.category.replace(/'/g, "\\'")}', ${product.price}, '${product.img}', '${product.desc.replace(/'/g, "\\'")}')" style="color:#facc15; margin-right:15px; font-size:16px; background:none; cursor:pointer;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteProductConsole('${id}')" style="color:#ef4444; font-size:16px; background:none; cursor:pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>`;
            }
        });

        if (productsGrid) productsGrid.innerHTML = productsHTML;
        if (adminProductsList) adminProductsList.innerHTML = adminHTML;
    });
}

// =========================================================================
// SECTION 3: PRODUCT DATABASE MANAGEMENT (CRUD ENGINE LOGIC)
// =========================================================================
const productForm = document.getElementById('productCrudForm');
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const docId = document.getElementById('crudProductId').value;
        const title = document.getElementById('crudTitle').value.trim();
        const category = document.getElementById('crudCategory').value.trim();
        const price = parseFloat(document.getElementById('crudPrice').value);
        const img = document.getElementById('crudImg').value.trim();
        const desc = document.getElementById('crudDesc').value.trim();

        const productData = { title, category, price, img, desc };

        try {
            if (docId && docId.trim() !== "") {
                // UPDATE PIPELINE: Target specified document string
                await setDoc(doc(db, "products", String(docId).trim()), productData);
                alert("Database node structure changed successfully!");
            } else {
                // CREATE PIPELINE: Route a brand new generated asset entry data
                await addDoc(collection(db, "products"), productData);
                alert("New product asset injected successfully into cloud databases!");
            }
            
            // Clean Terminal UI Reset
            productForm.reset();
            document.getElementById('crudProductId').value = "";
            const submitBtn = document.getElementById('crudFormSubmitBtn');
            if (submitBtn) submitBtn.innerText = "SAVE NODE MODULE";
        } catch (error) {
            console.error("Database Write Crash Intercept:", error);
            alert("Transaction Write Process Terminated: " + error.message);
        }
    });
}

// Global scope initialization for UI console interactions
window.editProductConsole = function(id, title, category, price, img, desc) {
    document.getElementById('crudProductId').value = id;
    document.getElementById('crudTitle').value = title;
    document.getElementById('crudCategory').value = category;
    document.getElementById('crudPrice').value = price;
    document.getElementById('crudImg').value = img;
    document.getElementById('crudDesc').value = desc;
    
    const submitBtn = document.getElementById('crudFormSubmitBtn');
    if (submitBtn) submitBtn.innerText = "UPDATE PRODUCT DATA";
};

window.deleteProductConsole = async function(id) {
    if (!id) {
        alert("Operation Error: Unique data target tracking string parameter is null.");
        return;
    }
    
    if (confirm("Are you certain you want to purge this product entity entirely?")) {
        try {
            await deleteDoc(doc(db, "products", String(id).trim()));
            alert("Entity permanently wiped from database structure.");
        } catch (error) {
            console.error("Delete process crash:", error);
            alert("Purge failed: " + error.message);
        }
    }
};

// =========================================================================
// SECTION 4: LIVE LOGISTICS ORDERS MATRIX INJECTION
// =========================================================================

// Customer Checkout System integration to cloud database pipeline
const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('custFirstName')?.value || "";
        const lastName = document.getElementById('custLastName')?.value || "";
        const address = document.getElementById('custAddress')?.value || "";
        const city = document.getElementById('custCity')?.value || "";
        const phone = document.getElementById('custPhone')?.value || "";
        const grandTotal = document.getElementById('checkoutSummaryTotalDisplay')?.innerText || "Rs. 0";

        try {
            await addDoc(collection(db, "orders"), {
                user: `${firstName} ${lastName}`,
                address: `${address}, ${city}`,
                phone: phone,
                items: "Standard Purchased Cart Package", // Replace with array parsing if you want granular breakdowns
                cost: grandTotal,
                status: "Pending Verification",
                timestamp: new Date()
            });
            
            alert("Order Transmitted Successfully to Admin Matrix!");
            window.location.href = "index.html";
        } catch (error) {
            alert("Order delivery pipeline transmission crash: " + error.message);
        }
    });
}

// Admin Real-time Orders Matrix Terminal Renderer
const adminOrdersList = document.getElementById('adminOrdersList');
if (adminOrdersList) {
    onSnapshot(collection(db, "orders"), (snapshot) => {
        let ordersHTML = "";
        snapshot.forEach((docSnap) => {
            const order = docSnap.data();
            const orderId = docSnap.id;
            
            ordersHTML += `
                <tr style="border-bottom: 1px solid #1f2937;">
                    <td style="padding: 12px; font-size:11px; line-height:1.5;">
                        <strong>Client:</strong> ${order.user}<br>
                        <strong>Dest:</strong> ${order.address}<br>
                        <strong>Tel:</strong> ${order.phone}
                    </td>
                    <td style="padding: 12px;">${order.items}</td>
                    <td style="padding: 12px; font-weight:700; color:#facc15;">${order.cost}</td>
                    <td style="padding: 12px;">
                        <select onchange="updateOrderStatusInFirebase('${orderId}', this.value)" style="width:auto; padding:5px; font-size:11px; background:#14141c; color:white; border:1px solid #374151; border-radius:4px; cursor:pointer;">
                            <option value="Pending Verification" ${order.status === 'Pending Verification' ? 'selected' : ''}>Pending</option>
                            <option value="Placed" ${order.status === 'Placed' ? 'selected' : ''}>Placed</option>
                            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                    </td>
                </tr>`;
        });
        adminOrdersList.innerHTML = ordersHTML;
    });
}

window.updateOrderStatusInFirebase = async function(orderId, newStatus) {
    try {
        await setDoc(doc(db, "orders", orderId), { status: newStatus }, { merge: true });
        alert(`Order workflow condition metrics re-routed: ${newStatus}`);
    } catch (error) {
        alert("Failed to sync system lifecycle state modification.");
    }
};

// Simple Mock function for index.html button workflows compatibility mapping
window.addToCartWorkflow = function(id, title, price) {
    alert(`${title} mapped into workspace transaction bucket cache! (Price: Rs. ${price})`);
};
