# BazaarHub

A Firebase-powered storefront: product catalog, basket, checkout, and an admin console for managing inventory and orders.

## What's inside

| File | Purpose |
|---|---|
| `index.html` | Product catalog with search + category filters |
| `checkout.html` | Basket review and shipping form |
| `auth.html` | Sign in / register |
| `admin.html` | Admin-only console (products + orders) |
| `style.css` | Shared design system |
| `script.js` | Firebase Auth/Firestore logic, UI behavior |
| `firestore.rules` | Recommended Firestore security rules |

It already uses your existing Firebase project (`bazaarhubnew-79dee`) — the config in `script.js` doesn't need to change.

## WhatsApp chat button

A floating WhatsApp button now appears on every page. Open `script.js`, find this line near the bottom, and put in your real number (country code, no `+`, no spaces, no leading zero):

```js
const WHATSAPP_NUMBER = "923001234567";
```

## Why "admin" login isn't working

There's no admin signup form on purpose — every new account is created with `role: "client"`. You make yourself admin by hand, and this is the part that's usually missed:

1. Register/login normally first so your user document exists.
2. Firebase Console → **Firestore Database → Data → `users` collection**.
3. Find **your** document (the doc ID is your Firebase Auth UID — check Authentication tab if unsure which one is you).
4. Change the `role` field from `client` to `admin` exactly (lowercase, no quotes typed twice, no trailing space).
5. **Log out and log back in** on the site — the role is only re-checked at login, so staying logged in won't pick up the change.
6. The "Admin Panel" link should now show in the nav, and `admin.html` should let you in.

If it still fails: check that your Firestore rules (`firestore.rules`) are published, and that the field is literally named `role` (not `Role` or `userRole`).

## 1. Put it on GitHub

```bash
cd bazaarhub
git init
git add .
git commit -m "Redesign BazaarHub"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 2. Turn on GitHub Pages

1. On GitHub, open your repo → **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch** → branch `main`, folder `/ (root)`.
3. Save. GitHub will give you a URL like `https://<your-username>.github.io/<your-repo>/`.
4. Wait a minute or two, then visit the URL.

## 3. Tell Firebase about your new domain

Firebase Auth blocks sign-in from domains it doesn't recognize.

1. Firebase Console → your project → **Authentication → Settings → Authorized domains**.
2. Click **Add domain** and add `<your-username>.github.io`.
3. Confirm **Authentication → Sign-in method → Email/Password** is enabled.

## 4. Lock down your database (important before sharing the link)

Your Firebase `apiKey` is meant to be public — that's normal and not a leak. What actually protects your data is **Firestore Security Rules**, and a fresh project is often left wide open ("test mode").

1. Firebase Console → **Firestore Database → Rules**.
2. Paste in the contents of `firestore.rules` from this project and click **Publish**.

These rules make sure only admins can add/delete products or change order status, and that customers can only see their own orders.

## 5. Make yourself an admin

There's no sign-up option for admin accounts on purpose — you grant it by hand:

1. Register a normal account on the site (or use one you already made).
2. Firebase Console → **Firestore Database → Data → `users` collection**.
3. Open the document with your UID, change `role` from `client` to `admin`, save.
4. Log out and back in on the site — the **Admin Panel** link will appear in the nav, and `admin.html` will let you in.

## Notes

- The whole site requires sign-in — visiting any page while logged out redirects to `auth.html`.
- Cart contents are stored in the browser (`localStorage`), so they're per-device, not per-account.
- The order **status** dropdown in the admin console writes straight to Firestore (`Pending Dispatch → Shipped → Delivered → Cancelled`).
