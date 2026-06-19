// =========================================================================
// FIREBASE REAL-TIME MULTI-DEVICE MANAGEMENT SYSTEM (BAZAARHUB)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, deleteDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Firebase Configuration (Corrected & Finalized)
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

// Global Arrays for Live Updates
let localProductsArray = [];

// Custom Left-Top Toast Notification Setup
function showLeftTopToast(message, isSuccess = false) {
    let toastContainer = document.getElementById('custom-toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'custom-toast-container';
        toastContainer.style.cssText = "position: fixed; top: 20px; left: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        background-color: ${isSuccess ? '#22c55e' : '#ef4444'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        opacity: 0;
        transform: translateX(-50px);
        transition: all 0.4s ease;
    `;
    toast.innerText = message;
    toastContainer.appendChild(toast);

    // Trigger Animation
    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(0)";
    }, 50);

    // Remove Toast after 4 seconds
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50px)";
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ==========================================
// AUTHENTICATION: RE-DIRECTION & SESSION TRACKING
// ==========================================
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname.split("/").pop();
    if (user) {
        // User logged in hai, agar auth page pr hai tu home pr bhejein
        if (currentPage === "auth.html") {
            window.location.href = "index.html";
        }
    } else {
        // Agar logged in nahi hai aur protect pages pr hai tu login pr bhejein
        if (currentPage === "checkout.html" || currentPage === "admin.html") {
            window.location.href = "auth.html";
        }
    }
});

// 1. REGISTER ACCOUNT SYSTEM
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
            
            // Save Meta Profiles data inside Firestore
            await setDoc(doc(db, "users", userCredential.user.uid), {
                name: name,
                email: email,
                phone: phone,
                role: "client"
            });

            // Switch directly to Login Tab dynamically
            showLeftTopToast("Account successfully created! Please login.", true);
            registerForm.reset();
            
            const loginTab = document.getElementById('loginTab');
            const registerTab = document.getElementById('registerTab');
            const loginForm = document.getElementById('loginForm');
            
            if(loginTab && loginForm) {
                loginTab.classList.add('active');
                if(registerTab) registerTab.classList.remove('active');
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            }
        } catch (error) {
            console.error("Registration Error: ", error.message);
            showLeftTopToast("Registration Failed: " + error.message, false);
        }
    });
}

// 2. LOGIN ACCOUNT SYSTEM (Multi-Device Setup)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('Email').value;
        const password = document.getElementById('Password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Login Error: ", error.message);
            showLeftTopToast("Login Failed: " + error.message, false);
        }
    });
}

// Logout Utility
window.logoutUserSession = async function() {
    await signOut(auth);
    window.location.href = "auth.html";
};

// ==========================================
// REAL-TIME PRODUCTS SYNC (ALL USERS & BROWSERS)
// ==========================================
const productsContainer = document.getElementById('productsContainer');
const adminProductsList = document.getElementById('adminProductsList');

onSnapshot(collection(db, "products"), (snapshot) => {
    localProductsArray = [];
    snapshot.forEach((doc) => {
        localProductsArray.push({ id: doc.id, ...doc.data() });
    });

    // Automatically Render on Client Storefront if view container exists
    if (productsContainer) {
        renderStorefrontProducts(localProductsArray);
    }
    // Automatically Render on Admin Dashboard if container exists
    if (adminProductsList) {
        renderAdminDashboardProducts(localProductsArray);
    }
});

function renderStorefrontProducts(products) {
    if(!productsContainer) return;
    if(products.length === 0) {
        productsContainer.innerHTML = `<p style="color:#9ca3af; text-align:center; width:100%;">No products available in vault.</p>`;
        return;
    }
    productsContainer.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.image}" class="product-img" alt="${p.name}">
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <h3 class="product-title">${p.name}</h3>
                <p style="font-size:12px; color:#9ca3af; margin:5px 0;">${p.description || ''}</p>
                <div class="product-price-row">
                    <span class="price">Rs. ${p.price}</span>
                    <button onclick="addToCartPipeline('${p.id}')" class="add-to-cart-btn"><i class="fas fa-shopping-cart"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderAdminDashboardProducts(products) {
    if(!adminProductsList) return;
    adminProductsList.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#14141c; padding:10px; border-radius:8px; margin-bottom:8px; border:1px solid #1f2937;">
            <div style="display:flex; gap:10px; align-items:center;">
                <img src="${p.image}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                <div>
                    <h4 style="font-size:13px; color:white;">${p.name}</h4>
                    <span style="color:#facc15; font-size:12px;">Rs. ${p.price}</span>
                </div>
            </div>
            <div style="display:flex; gap:5px;">
                <button onclick="editProductConsole('${p.id}')" style="background:#1e3a8a; color:white; padding:4px 8px; font-size:11px; border-radius:4px;"><i class="fas fa-edit"></i></button>
                <button onclick="deleteProductConsole('${p.id}')" style="background:#7f1d1d; color:white; padding:4px 8px; font-size:11px; border-radius:4px;"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// Admin Action: Add or Edit Product Submit
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editIndex').value;
        const name = document.getElementById('pName').value;
        const category = document.getElementById('pCategory').value;
        const price = document.getElementById('pPrice').value;
        const image = document.getElementById('pImage').value;
        const description = document.getElementById('pDesc').value;

        const payload = { name, category, price, image, description };

        try {
            if (editId) {
                // Update product seamlessly across all nodes
                await setDoc(doc(db, "products", editId), payload, { merge: true });
                document.getElementById('editIndex').value = '';
                document.getElementById('formSubmitBtn').innerText = "SAVE NODE MODULE";
                showLeftTopToast("Product updated successfully!", true);
            } else {
                // Add new product
                await addDoc(collection(db, "products"), payload);
                showLeftTopToast("Product added successfully!", true);
            }
            addProductForm.reset();
        } catch (err) {
            showLeftTopToast("Operation failed: " + err.message, false);
        }
    });
}

window.editProductConsole = function(id) {
    const itemRef = localProductsArray.find(p => p.id === id);
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
        try {
            await deleteDoc(doc(db, "products", id));
            showLeftTopToast("Product removed successfully!", true);
        } catch(err) {
            showLeftTopToast("Error deleting: " + err.message, false);
        }
    } 
};

// ==========================================
// REAL-TIME ORDER ARCHITECTURE (Live Transmission)
// ==========================================
const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get active items from local storage cart system
        const cartItems = JSON.parse(localStorage.getItem('bazaarhub_cart')) || [];
        if(cartItems.length === 0) {
            alert("Your cart is completely empty!");
            return;
        }

        const totalCost = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        const orderPayload = {
            firstName: document.getElementById('custFirstName').value,
            lastName: document.getElementById('custLastName').value,
            address: document.getElementById('custAddress').value,
            city: document.getElementById('custCity').value,
            phone: document.getElementById('custPhone').value,
            items: cartItems.map(i => `${i.name} (x${i.quantity})`).join(', '),
            cost: "Rs. " + totalCost,
            status: "Pending Verification",
            timestamp: Date.now()
        };

        try {
            await addDoc(collection(db, "orders"), orderPayload);
            localStorage.removeItem('bazaarhub_cart'); // Clear cart data
            alert("Order Transmitted Successfully to Central Hub!");
            window.location.href = "index.html";
        } catch(err) {
            alert("Order submission failed: " + err.message);
        }
    });
}

// Live Orders Tracker for Admin Dashboards
const adminOrdersList = document.getElementById('adminOrdersList');
if (adminOrdersList) {
    onSnapshot(collection(db, "orders"), (snapshot) => {
        let ordersHTML = "";
        snapshot.forEach((docSnap) => {
            const o = docSnap.data();
            const docId = docSnap.id;
            
            ordersHTML += `
                <tr style="border-bottom: 1px solid #1f2937;">
                    <td style="padding:12px; font-size:12px;">
                        <strong>${o.firstName} ${o.lastName}</strong><br>
                        <span style="color:#9ca3af;">Ph: ${o.phone}</span><br>
                        <span style="color:#9ca3af;">Add: ${o.address}, ${o.city}</span>
                    </td>
                    <td style="padding:12px; font-size:12px; color:#e5e7eb;">${o.items}</td>
                    <td style="padding:12px; font-size:12px; font-weight:700; color:#facc15;">${o.cost}</td>
                    <td style="padding:12px;">
                        <select onchange="changeStatusAction('${docId}', this.value)" style="padding:6px; font-size:12px; background:#14141c; color:white; border:1px solid #374151; border-radius:6px; cursor:pointer;">
                            <option value="Pending Verification" ${o.status === 'Pending Verification' ? 'selected' : ''}>Pending</option>
                            <option value="On the Way" ${o.status === 'On the Way' ? 'selected' : ''}>On the Way</option>
                            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="Out of Stock" ${o.status === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option>
                        </select>
                        <button onclick="eraseOrderAction('${docId}')" style="margin-left:8px; background:#7f1d1d; color:white; padding:6px 10px; font-size:11px; border-radius:6px; cursor:pointer;"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                </tr>
            `;
        });
        
        if(!ordersHTML) {
            ordersHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#9ca3af; font-size:13px;">No incoming dispatches found.</td></tr>`;
        }
        adminOrdersList.innerHTML = ordersHTML;
    });
}

window.changeStatusAction = async function(docId, newStatus) { 
    try {
        const orderRef = doc(db, "orders", docId);
        await updateDoc(orderRef, { status: newStatus });
        showLeftTopToast(`Order status updated to: ${newStatus}`, true);
    } catch(err) {
        showLeftTopToast("Failed to update status: " + err.message, false);
    }
};

window.eraseOrderAction = async function(docId) { 
    if(confirm("Are you sure you want to completely delete this order node?")) {
        try {
            await deleteDoc(doc(db, "orders", docId));
            showLeftTopToast("Order deleted successfully!", true);
        } catch(err) {
            showLeftTopToast("Failed to delete order: " + err.message, false);
        }
    }
};