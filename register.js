  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
  import { getAuth createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js"; 

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCaxoBCeXg0Fof2XMbILhL35Y7qqkS0S18",
    authDomain: "bazaarhub-48838.firebaseapp.com",
    projectId: "bazaarhub-48838",
    storageBucket: "bazaarhub-48838.firebasestorage.app",
    messagingSenderId: "956905284940",
    appId: "1:956905284940:web:466534cbb0da1f71051be9"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);


  
// submit
const submit = document.getElementById("submit");
submit.addEventListener("click",function(){
  event.preventDefault()

    // input
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed up 
    const user = userCredential.user;
    alert("Creating Accpint...")
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    alert(errorMessage)
    // ..
  });
})