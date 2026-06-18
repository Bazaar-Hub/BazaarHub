// =========================================================================
// FIREBASE LIFETIME MULTI-DEVICE LOGIN & REGISTER SYSTEM (INTEGRATED)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Your web app's NEW Firebase configuration (Bazaarhubnew)
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

let currentSessionUser = null;

// Expose Auth functions to window object
window.loginUserPortal = async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        alert("Authentication node established successfully.");
        window.location.href = "index.html";
    } catch (err) {
        alert("Error mapping access profile: " + err.message);
    }
};

window.registerUserAccount = async function(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const pass = document.getElementById('regPass').value;

    try {
        const credentials = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", credentials.user.uid), {
            uid: credentials.user.uid,
            fullName: name,
            emailAddress: email,
            telemetryPhone: phone,
            role: "client"
        });
        alert("User cryptography profile registered successfully inside cluster database.");
        window.location.href = "index.html";
    } catch(err) {
        alert("Failed to create user sequence node: " + err.message);
    }
};

// Global Auth State Change Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentSessionUser = user;
        if (document.getElementById('checkoutForm')) {
            loadCheckoutModuleProfileData(user.uid);
        }
    } else {
        currentSessionUser = null;
    }
});

async function loadCheckoutModuleProfileData(uid) {
    try {
        const querySnapshot = await getDocs(query(collection(db, "users"), where("uid", "==", uid)));
        if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            const fullNameArray = data.fullName ? data.fullName.split(" ") : ["", ""];
            if (document.getElementById('custFName')) document.getElementById('custFName').value = fullNameArray[0] || "";
            if (document.getElementById('custLName')) document.getElementById('custLName').value = fullNameArray[1] || "";
            if (document.getElementById('custPhone')) document.getElementById('custPhone').value = data.telemetryPhone || "";
            if (document.getElementById('custEmail')) document.getElementById('custEmail').value = data.emailAddress || "";
        }
    } catch(err) {
        console.error("Profile extraction runtime halt: ", err);
    }
}

// =========================================================================
// PRODUCTS ENGINE (REAL-TIME FIRESTORE MULTI-BROWSER VIEWS & FILTERING)
// =========================================================================

// Global Cart Array Implementation
let globalCartArray = JSON.parse(localStorage.getItem('bazaarhub_cart_cache')) || [];

function saveCartCacheToMemory() {
    localStorage.setItem('bazaarhub_cart_cache', JSON.stringify(globalCartArray));
    updateCartIconDisplayBadge();
}

function updateCartIconDisplayBadge() {
    const badge = document.getElementById('cartBadgeCount');
    if (badge) {
        const totalItems = globalCartArray.reduce((acc, curr) => acc + curr.quantity, 0);
        badge.textContent = totalItems;
        if(totalItems > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }
}

window.addCatalogItemToCart = function(id, title, price, image) {
    const existingItem = globalCartArray.find(item => item.id === id);
    if(existingItem) {
        existingItem.quantity += 1;
    } else {
        globalCartArray.push({ id, title, price, image, quantity: 1 });
    }
    saveCartCacheToMemory();
    alert(`"${title}" added to your checkout pipeline layout.`);
};

// Admin panel integration block for injection
const productForm = document.getElementById('adminProductForm');
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('prodTitle').value;
        const price = parseFloat(document.getElementById('prodPrice').value);
        const img = document.getElementById('prodImg').value;
        const desc = document.getElementById('prodDesc').value;
        const categoryElement = document.getElementById('prodCategory');
        const category = categoryElement ? categoryElement.value : "General";

        const newProduct = {
            title,
            price,
            image: img,
            description: desc,
            category: category,
            timestamp: new Date()
        };

        try {
            await addDoc(collection(db, "products"), newProduct);
            alert("Product submitted to central Cloud Infrastructure successfully!");
            productForm.reset();
        } catch(err) {
            alert("Product injection error: " + err.message);
        }
    });
}

// Global real-time rendering logic for multi-browsers
const clientGrid = document.getElementById('productsGrid'); 
const adminGridList = document.getElementById('adminProductsList'); 

if (clientGrid || adminGridList) {
    onSnapshot(collection(db, "products"), (snapshot) => {
        let productsArray = [];
        snapshot.forEach((doc) => {
            productsArray.push({ id: doc.id, ...doc.data() });
        });

        // Update main user application grid layout view
        if (clientGrid) {
            if(productsArray.length === 0) {
                clientGrid.innerHTML = `<p style='text-align:center; grid-column:1/-1; color:#9ca3af;'>No dynamic products found inside Cloud Database Cluster.</p>`;
            } else {
                renderClientGridInterface(productsArray);
            }
        }

        // Update internal admin dashboard listing matrix
        if (adminGridList) {
            if(productsArray.length === 0) {
                adminGridList.innerHTML = `<p style="font-size:12px; color:#9ca3af; padding:15px;">Vault arrays are currently empty.</p>`;
            } else {
                adminGridList.innerHTML = productsArray.map(prod => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #1f2937; background:rgba(255,255,255,0.01); margin-bottom:4px; border-radius:6px;">
                        <span style="font-size:13px; font-weight:500;">${prod.title} <strong style="color:#facc15; font-size:11px;">[${prod.category || 'General'}]</strong> - Rs. ${prod.price}</span>
                        <div style="display:flex; gap:12px;">
                            <button onclick="triggerProductEditWorkflow('${prod.id}', '${prod.title.replace(/'/g, "\\'")}', ${prod.price}, '${prod.image}', '${prod.description ? prod.description.replace(/'/g, "\\'") : ''}', '${prod.category || 'General'}')" style="color:#facc15; font-size:14px; background:none; border:none; cursor:pointer;"><i class="fas fa-edit"></i></button>
                            <button onclick="terminateProductDocument('${prod.id}')" style="color:#ef4444; font-size:14px; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('');
            }
        }
    });
}

function renderClientGridInterface(items) {
    clientGrid.innerHTML = items.map(prod => `
        <div class="product-card" data-category="${prod.category || 'General'}">
            <img src="${prod.image}" class="product-img" onerror="this.src='https://via.placeholder.com/250'">
            <div style="padding: 15px;">
                <h3 class="product-title">${prod.title}</h3>
                <p class="product-desc" style="font-size:12px; color:#9ca3af; margin: 5px 0;">${prod.description || ''}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                    <div class="product-price" style="font-weight:700; color:#facc15;">Rs. ${prod.price}</div>
                    <span style="font-size:10px; background:rgba(250,204,21,0.1); padding:3px 8px; border-radius:12px; color:#facc15;">${prod.category || 'General'}</span>
                </div>
                <button onclick="addCatalogItemToCart('${prod.id}', '${prod.title.replace(/'/g, "\\'")}', ${prod.price}, '${prod.image}')" class="card-btn bg-yellow" style="width:100%; margin-top:12px; padding:10px; border-radius:8px; font-size:12px;">Add to Matrix</button>
            </div>
        </div>
    `).join('');
}

// Category filter trigger capsules initialization
document.addEventListener('DOMContentLoaded', () => {
    updateCartIconDisplayBadge();
    const filterCapsules = document.querySelectorAll('.capsule');
    filterCapsules.forEach(capsule => {
        capsule.addEventListener('click', () => {
            filterCapsules.forEach(c => c.classList.remove('active'));
            capsule.classList.add('active');
            const targetCategory = capsule.getAttribute('data-target') || capsule.textContent.trim();
            
            const productCards = document.querySelectorAll('.product-card');
            productCards.forEach(card => {
                const cardCat = card.getAttribute('data-category');
                if(targetCategory === 'All' || cardCat === targetCategory) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
});

window.terminateProductDocument = async function(id) {
    if (confirm("Permanently delete this product from central cloud database?")) {
        try {
            await deleteDoc(doc(db, "products", id));
            alert("Document deleted successfully.");
        } catch(err) {
            alert("Error: " + err.message);
        }
    }
};

window.triggerProductEditWorkflow = async function(id, title, price, image, description, category) {
    const newTitle = prompt("Update Product Title:", title);
    const newPrice = prompt("Update Product Price (Rs):", price);
    const newImg = prompt("Update Image URL:", image);
    const newDesc = prompt("Update Description:", description);
    const newCat = prompt("Update Category Name:", category);

    if (newTitle && newPrice) {
        try {
            await setDoc(doc(db, "products", id), {
                title: newTitle,
                price: parseFloat(newPrice),
                image: newImg || image,
                description: newDesc || description,
                category: newCat || category,
                timestamp: new Date()
            }, { merge: true });
            alert("Product configuration modified successfully across network browser layers.");
        } catch(err) {
            alert("Update runtime halted: " + err.message);
        }
    }
};

// =========================================================================
// ORDERS REPOSITORY (CUSTOMER TRANSMIT & REAL-TIME ADMIN MONITOR CONSOLE)
// =========================================================================

const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    // Populate simple summaries inside invoice container context
    const summaryContainer = document.getElementById('checkoutSummaryItemsContainer');
    const summaryTotal = document.getElementById('checkoutSummaryTotalDisplay');
    
    if(summaryContainer) {
        if(globalCartArray.length === 0) {
            summaryContainer.innerHTML = `<p style="font-size:12px; color:#9ca3af;">Pipeline array is empty.</p>`;
        } else {
            summaryContainer.innerHTML = globalCartArray.map(item => `
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; border-bottom:1px solid #1f2937; padding-bottom:4px;">
                    <span>${item.title} (x${item.quantity})</span>
                    <span style="color:#facc15;">Rs. ${item.price * item.quantity}</span>
                </div>
            `).join('');
            const sumTotal = globalCartArray.reduce((acc, c) => acc + (c.price * c.quantity), 0);
            if(summaryTotal) summaryTotal.textContent = "Rs. " + sumTotal;
        }
    }

    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (globalCartArray.length === 0) {
            alert("Transmission Error: Your cart is empty.");
            return;
        }

        const calculatedTotalSum = globalCartArray.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        const outboundOrderPayload = {
            customerInfo: {
                firstName: document.getElementById('custFName').value,
                lastName: document.getElementById('custLName').value,
                email: document.getElementById('custEmail').value,
                address: document.getElementById('custAddress').value,
                city: document.getElementById('custCity').value,
                phone: document.getElementById('custPhone').value
            },
            items: globalCartArray,
            totalCost: calculatedTotalSum,
            status: "On the way", 
            userRating: null,
            timestamp: new Date()
        };

        try {
            await addDoc(collection(db, "orders"), outboundOrderPayload);
            localStorage.removeItem('bazaarhub_cart_cache');
            globalCartArray = [];
            alert("Order transmitted successfully to the cloud center! Admin will track it now.");
            window.location.href = "index.html";
        } catch(err) {
            alert("Logistics transmission error: " + err.message);
        }
    });
}

const adminOrdersListContainer = document.getElementById('adminOrdersList');
if (adminOrdersListContainer) {
    onSnapshot(collection(db, "orders"), (snapshot) => {
        if (snapshot.empty) {
            adminOrdersListContainer.innerHTML = `<tr><td colspan="4" style="text-align:center; font-size:12px; color:#9ca3af; padding:20px;">No current dispatches inside central system cloud.</td></tr>`;
            return;
        }

        let ordersHtmlBuffer = "";
        snapshot.forEach((orderDoc) => {
            const orderId = orderDoc.id;
            const order = orderDoc.data();
            
            const itemsSummaryString = order.items.map(i => `${i.title} (x${i.quantity})`).join(", ");
            const clientDetails = `<strong>Name:</strong> ${order.customerInfo.firstName} ${order.customerInfo.lastName}<br><strong>Phone:</strong> ${order.customerInfo.phone}<br><strong>Address:</strong> ${order.customerInfo.address}, ${order.customerInfo.city}`;

            ordersHtmlBuffer += `
                <tr style="border-bottom: 1px solid #1f2937; background: rgba(255,255,255,0.005);">
                    <td style="padding: 12px; font-size: 12px; line-height: 1.5; color:#e5e7eb;">${clientDetails}</td>
                    <td style="padding: 12px; font-size: 12px; color:#9ca3af;">${itemsSummaryString}</td>
                    <td style="padding: 12px; font-size: 13px; font-weight: 700; color: #facc15;">Rs. ${order.totalCost}</td>
                    <td style="padding: 12px;">
                        <select onchange="modifyOrderWorkflowStatus('${orderId}', this.value)" style="margin:0; padding:6px; font-size:12px; background:#14141c; color:white; border:1px solid #374151; border-radius:6px; width:auto; display:inline-block;">
                            <option value="On the way" ${order.status === 'On the way' ? 'selected' : ''}>On the way</option>
                            <option value="Delivery" ${order.status === 'Delivery' ? 'selected' : ''}>Delivery</option>
                            <option value="Out of stock" ${order.status === 'Out of stock' ? 'selected' : ''}>Out of stock</option>
                            <option value="Delete">Delete</option>
                        </select>
                        <div style="font-size:11px; color:#9ca3af; margin-top:6px; font-weight:500;">Rating Trace: <span style="color:#facc15; font-weight:bold;">${order.userRating ? order.userRating + ' ★' : 'None Profiled'}</span></div>
                    </td>
                </tr>
            `;
        });
        
        adminOrdersListContainer.innerHTML = ordersHtmlBuffer;
    });
}

window.modifyOrderWorkflowStatus = async function(orderId, updatedStatusValue) {
    if (updatedStatusValue === "Delete") {
        if (confirm("Completely wipe this order history document out from cloud base infrastructure?")) {
            try {
                await deleteDoc(doc(db, "orders", orderId));
                alert("Order history dropped successfully.");
            } catch(err) {
                alert("Error dropping document node: " + err.message);
            }
        }
    } else {
        try {
            await updateDoc(doc(db, "orders", orderId), { status: updatedStatusValue });
            alert(`Order status transaction adjusted successfully to: ${updatedStatusValue}`);
        } catch(err) {
            alert("Error processing transition state: " + err.message);
        }
    }
};
