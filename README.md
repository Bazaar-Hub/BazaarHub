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

## 3b. Turn on phone (SMS) verification

New accounts now have to confirm a real phone number by SMS code before they can browse or order — this is what stops fake signups and fake orders. It needs two things set up in Firebase first, or registration will get stuck on the "Send Code" step:

1. **Upgrade to the Blaze (pay-as-you-go) plan.** Firebase Console → **Upgrade project**. Phone Auth doesn't work on the free Spark plan. SMS costs roughly $0.01–$0.06 per code depending on the recipient's country — Firebase gives you a small free daily quota for testing on top of that.
2. Firebase Console → **Authentication → Sign-in method** → enable **Phone**.
3. Make sure the same domain from step 3 (`<your-username>.github.io`, plus `localhost` while testing) is in **Authorized domains** — phone sign-in uses reCAPTCHA, which checks this list too.

While testing, Firebase lets you add **test phone numbers** (Authentication → Sign-in method → Phone → Phone numbers for testing) with a fixed code like `123456` — these don't send real SMS or cost anything, which is handy before you've upgraded billing.

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
- New accounts must verify a phone number (Pakistani format, e.g. `03001234567`) before they can browse or order. Admin accounts are exempt, since you vet those by hand anyway.
- The actual fraud-blocking happens in `firestore.rules`, via Firebase's own verified-phone record on the account (not a value sitting in a document) — so it can't be bypassed by editing data directly in the browser.
- Cart contents are stored in the browser (`localStorage`), so they're per-device, not per-account.
- The order **status** dropdown in the admin console writes straight to Firestore (`Pending Dispatch → Shipped → Delivered → Cancelled`).
