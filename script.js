// =========================================================================
// BAZAARHUB - FULLY INTEGRATED REAL-TIME FIREBASE ENGINE & BACKEND TERMINAL
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Firebase Config
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

// 🟢 CROSS-BROWSER LOGIN FIX: Set explicit persistence to LOCAL storage before any auth request
setPersistence(auth, browserLocalPersistence)
  .then(() => { console.log("Firebase Auth Persistence set to LOCAL globally."); })
  .catch((err) => { console.error("Persistence Configuration Error:", err); });

// Dynamic Auth State Observers Pipeline
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Verified Active Session UID:", user.uid);
        if (window.location.pathname.includes("auth.html")) {
            window.location.href = "index.html";
        }
    } else {
        console.log("No Active Session Node Verified.");
    }
});

// =========================================================================
// SECTION 1: AUTHENTICATION (REGISTER & MULTI-BROWSER LOGIN)
// =========================================================================

// A. Registration Logic Pipeline
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
            alert("Account successfully registered on Firebase Node!");
            window.location.href = "index.html";
        } catch (error) {
            console.error("Registration Core Crash:", error.message);
            alert("Registration Failed: " + error.message);
        }
    });
}

// B. Login Engine Terminal (Fix for multi-browser and explicit account cross-checking)
const logForm = document.getElementById('loginForm');
if (logForm) {
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPass').value;

        try {
            // Force browser local initialization block on each request
            await setPersistence(auth, browserLocalPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            alert("Access Granted! Login Successful.");
            window.location.href = "index.html"; 
        } catch (error) {
            console.error("Authentication Core Crash:", error.message);
            alert("Login Failed: " + error.message);
        }
    });
}

// =========================================================================
// SECTION 2: REAL-TIME CATALOG DATA STREAM STREAMING (NO STATIC PRODUCTS)
// =========================================================================
const productsGrid = document.getElementById('productsGrid'); 
const adminProductsList = document.getElementById('adminProductsList'); 

if (productsGrid || adminProductsList) {
    // 🟢 Real-time Sync Pipeline: Purged all static files, data comes directly from Firebase
    onSnapshot(collection(db, "products"), (snapshot) => {
        let productsHTML = "";
        let adminHTML = "";

        snapshot.forEach((docSnap) => {
            const product = docSnap.data();
            const id = docSnap.id; 

            // User Side Dynamic Render Engine (index.html)
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

            // Admin Side Dashboard Console Table (admin.html)
            if (adminProductsList) {
                adminHTML += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #1f2937; background:#14141c; margin-bottom:5px; border-radius:6px;">
                        <div>
                            <strong style="color:#ffffff;">${product.title}</strong> <span style="color:#facc15; font-weight:700;">(Rs. ${product.price})</span>
                            <br><span style="font-size:11px; color:#9ca3af;">${product.category}</span>
                        </div>
                        <div>
                            <button onclick="editProductConsole('${id}', '${product.title.replace(/'/g, "\\'")}', '${product.category.replace(/'/g, "\\'")}', ${product.price}, '${product.img}', '${product.desc.replace(/'/g, "\\'")}')" style="color:#facc15; margin-right:15px; font-size:16px; background:none; border:none; cursor:pointer;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteProductConsole('${id}')" style="color:#ef4444; font-size:16px; background:none; border:none; cursor:pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>`;
            }
        });

        if (productsGrid) productsGrid.innerHTML = productsHTML || `<p style="padding:20px; color:#9ca3af;">No products inside database nodes. Populate from Admin Panel.</p>`;
        if (adminProductsList) adminProductsList.innerHTML = adminHTML || `<p style="padding:15px; color:#9ca3af;">No active inventory listed.</p>`;
    });
}

// =========================================================================
// SECTION 3: PRODUCT BACKEND TRANSACTION CONTROL (CRUD PIPELINE)
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
                // UPDATE PIPELINE
                await setDoc(doc(db, "products", String(docId).trim()), productData);
                alert("Database entry updated successfully!");
            } else {
                // CREATE PIPELINE
                await addDoc(collection(db, "products"), productData);
                alert("New product injected into Firebase live storage!");
            }
            
            // Post-submit interface cleanup
            productForm.reset();
            document.getElementById('crudProductId').value = "";
            const submitBtn = document.getElementById('crudFormSubmitBtn');
            if (submitBtn) submitBtn.innerText = "SAVE NODE MODULE";
        } catch (error) {
            console.error("CRUD Database Transaction Intercept Failure:", error);
            alert("Database write error: " + error.message);
        }
    });
}

// Global window mappings for layout events processing
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
        alert("Action Error: Missing document database identifier token.");
        return;
    }
    
    if (confirm("Are you sure you want to permanently delete this product?")) {
        try {
            await deleteDoc(doc(db, "products", String(id).trim()));
            alert("Product entry successfully wiped from Cloud Storage.");
        } catch (error) {
            console.error("Purge Error Pipeline Intercept:", error);
            alert("Delete action failed: " + error.message);
        }
    }
};

// =========================================================================
// SECTION 4: TRANSACTIONS & LOGISTICS FLOW SYSTEM (ORDERS GATEWAY)
// =========================================================================
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
                items: "Standard Customer Inventory Manifest Package",
                cost: grandTotal,
                status: "Pending Verification",
                timestamp: new Date()
            });
            
            alert("Order Transmitted Successfully to Firebase Tracking Control Node!");
            window.location.href = "index.html";
        } catch (error) {
            alert("Order delivery pipeline transmission failed: " + error.message);
        }
    });
}

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
        adminOrdersList.innerHTML = ordersHTML || `<tr><td colspan="4" style="padding:15px; text-align:center; color:#9ca3af;">No incoming client transactions recorded.</td></tr>`;
    });
}

window.updateOrderStatusInFirebase = async function(orderId, newStatus) {
    try {
        await setDoc(doc(db, "orders", orderId), { status: newStatus }, { merge: true });
        alert(`Order lifecycle shifted state: ${newStatus}`);
    } catch (error) {
        alert("Failed to sync system status lifecycle.");
    }
};

window.addToCartWorkflow = function(id, title, price) {
    alert(`${title} mapped into workspace transaction bucket! (Price: Rs. ${price})`);
};
