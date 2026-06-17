// =========================================================================
// FIREBASE LIFETIME MULTI-DEVICE LOGIN & REGISTER SYSTEM (INTEGRATED)
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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
let products = [];

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

// Listen to auth state channel changes
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

// Checkout specific script logic
async function loadCheckoutModuleProfileData(uid) {
    try {
        const querySnapshot = await getDocs(query(collection(db, "users"), where("uid", "==", uid)));
        if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            const fullNameArray = data.fullName ? data.fullName.split(" ") : ["", ""];
            if (document.getElementById('custFName')) document.getElementById('custFName').value = fullNameArray[0] || "";
            if (document.getElementById('custLName')) document.getElementById('custLName').value = fullNameArray[1] || "";
            if (document.getElementById('custPhone')) document.getElementById('custPhone').value = data.telemetryPhone || "";
        }
    } catch(err) {
        console.error("Profile extraction runtime halt: ", err);
    }
}

if (document.getElementById('checkoutForm')) {
    const checkoutForm = document.getElementById('checkoutForm');
    const localCartArray = JSON.parse(localStorage.getItem('bazaarhub_cart_cache')) || [];
    const summaryContainer = document.getElementById('checkoutSummaryItemsContainer');
    const totalDisplay = document.getElementById('checkoutSummaryTotalDisplay');

    const calculatedTotalSum = localCartArray.reduce((acc, currentItem) => acc + (currentItem.price * currentItem.quantity), 0);
    if(totalDisplay) totalDisplay.innerText = "Rs. " + calculatedTotalSum;

    if (summaryContainer) {
        if(localCartArray.length === 0) {
            summaryContainer.innerHTML = `<p style="font-size:12px; color:#9ca3af;">No items detected in local cart array trace.</p>`;
        } else {
            summaryContainer.innerHTML = localCartArray.map(item => `
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; padding-bottom:6px; border-bottom:1px dashed #1f2937;">
                    <span>${item.name} (x${item.quantity})</span>
                    <span style="color:#facc15; font-weight:700;">Rs. ${item.price * item.quantity}</span>
                </div>
            `).join('');
        }
    }

    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(localCartArray.length === 0) {
            alert("Checkout queue contains zero entries. Aborting payload transmission.");
            return;
        }

        const serializedItemsPayloadString = localCartArray.map(i => `${i.name} [x${i.quantity}]`).join(', ');
        const structuralOrderDocumentNode = {
            firstName: document.getElementById('custFName').value,
            lastName: document.getElementById('custLName').value,
            address: document.getElementById('custAddress').value,
            city: document.getElementById('custCity').value,
            phone: document.getElementById('custPhone').value,
            items: serializedItemsPayloadString,
            cost: "Rs. " + calculatedTotalSum,
            status: "Pending Verification",
            timestamp: Date.now(),
            user: currentSessionUser ? currentSessionUser.email : "anonymous-node"
        };

        try {
            await addDoc(collection(db, "orders"), structuralOrderDocumentNode);
            localStorage.removeItem('bazaarhub_cart_cache');
            alert("Order dispatch metadata trace transmitted into Firestore console successfully!");
            window.location.href = "index.html";
        } catch(err) {
            alert("Logistics order database execution failure: " + err.message);
        }
    });
}

// =========================================================================
// REALTIME DATA FETCH FOR ADMIN MANAGEMENT PORTAL (INTEGRATED SNAPSHOTS)
// =========================================================================
if (document.getElementById('adminProductsList') || document.getElementById('adminOrdersList')) {
    onSnapshot(collection(db, "products"), (snapshot) => {
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAdminConsoleUIProducts();
    });

    onSnapshot(collection(db, "orders"), (snapshot) => {
        const activeOrdersArr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAdminConsoleUIOrders(activeOrdersArr);
    });
}

function renderAdminConsoleUIProducts() {
    const listRef = document.getElementById('adminProductsList');
    if(!listRef) return;
    if(products.length === 0) {
        listRef.innerHTML = `<p style="font-size:12px; color:#9ca3af;">Zero entries inside cloud collection module.</p>`;
        return;
    }
    listRef.innerHTML = products.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#14141c; padding:10px; border-radius:6px; margin-bottom:8px; border:1px solid #1f2937;">
            <div>
                <span style="font-weight:700; font-size:13px;">${p.name}</span>
                <span style="font-size:11px; color:#facc15; margin-left:10px;">Rs. ${p.price} [${p.category}]</span>
            </div>
            <div style="display:flex; gap:8px;">
                <button onclick="window.editProductConsole('${p.id}')" style="background:#1f2937; color:#facc15; font-size:11px; padding:4px 8px; border-radius:4px;"><i class="fas fa-edit"></i></button>
                <button onclick="window.deleteProductConsole('${p.id}')" style="background:rgba(239,68,68,0.1); color:#ef4444; font-size:11px; padding:4px 8px; border-radius:4px;"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('');
}

function renderAdminConsoleUIOrders(orders) {
    const listRef = document.getElementById('adminOrdersList');
    if(!listRef) return;
    if(orders.length === 0) {
        listRef.innerHTML = `<tr><td colspan="4" style="text-align:center; font-size:12px; color:#9ca3af; padding:20px 0;">No logs caught inside order intercept channel.</td></tr>`;
        return;
    }
    listRef.innerHTML = orders.map(o => `
        <tr style="border-bottom:1px solid #1f2937;">
            <td style="font-size:11px; padding:10px 5px;">
                <strong>${o.firstName} ${o.lastName}</strong><br>
                <span style="color:#9ca3af;">M: ${o.user}<br>Tel: ${o.phone}<br>A: ${o.address}, ${o.city}</span>
            </td>
            <td style="font-size:11px; padding:10px 5px; color:#9ca3af;">${o.items}</td>
            <td style="font-size:12px; font-weight:800; color:#facc15; padding:10px 5px;">${o.cost}</td>
            <td style="padding:10px 5px;">
                <select onchange="window.changeStatusAction('${o.id}', this.value)" style="margin:0; padding:4px; font-size:11px; background:#14141c; color:white; border-color:#374151;">
                    <option value="Pending Verification" ${o.status === 'Pending Verification' ? 'selected' : ''}>Pending</option>
                    <option value="Placed" ${o.status === 'Placed' ? 'selected' : ''}>Placed</option>
                    <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
                <button onclick="window.eraseOrderAction('${o.id}')" style="background:transparent; color:#ef4444; margin-left:8px; font-size:11px;"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
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
    if(confirm("Confirm asset record removal?")) { 
        await deleteDoc(doc(db, "products", id));
    } 
};

window.changeStatusAction = async function(docId, newStatus) { 
    await setDoc(doc(db, "orders", docId), { status: newStatus }, { merge: true });
};

window.eraseOrderAction = async function(docId) { 
    if(confirm("Erase order record?")) { 
        try {
            await deleteDoc(doc(db, "orders", docId));
        } catch(err) {
            console.error("Order deletion error: ", err);
        }
    } 
};

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
}
