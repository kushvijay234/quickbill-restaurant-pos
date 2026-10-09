# QuickBill POS - Mobile Application

Professional, deployment-ready React Native POS application built with **Expo**, tailored for restaurants, cafes, and quick-service diners. Designed for waiters (handheld phones) and cashiers (counter tablets).

> **Note:** Platform SuperAdmin features are strictly excluded from this mobile client.

---

## 📁 Directory Architecture (`src/`)

```text
mobile/src/
├── constants/             # Design tokens, color schemes (Light/Dark), currencies & API config
│   ├── colors.js
│   ├── currencies.js
│   └── config.js
│
├── services/              # Services logic & networking layer
│   ├── api.js             # HTTP client injecting JWT Bearer & X-Tenant-ID headers
│   ├── authService.js     # Multi-tenant login & credential caching
│   ├── menuService.js     # Menu CRUD & variant sync
│   ├── orderService.js    # Order submission, count, and past bills fetching
│   ├── profileService.js  # Restaurant details & tax configuration
│   ├── adminService.js    # Staff user management & audit logs
│   ├── subscriptionService.js # SaaS plan limits & days remaining
│   ├── printService.js    # Native 58mm/80mm thermal receipt generator & PDF sharing
│   └── storageService.js  # AsyncStorage persistent session engine
│
├── context/               # Global state providers
│   ├── AuthContext.js     # Tenant session, user role & restaurant profile
│   ├── CartContext.js     # Live ticket, variants, quantities, taxes & haptics
│   └── ThemeContext.js    # Sleek dark and light mode toggle
│
├── menu/                  # Menu catalog components & modals
│   ├── MenuItemCard.js       # Food card with variant badge & quick-add
│   ├── MenuCategoryFilter.js # Scrollable category filter chips
│   ├── VariantPickerModal.js # Bottom-sheet portion/size selector
│   ├── AddMenuItemModal.js   # Create food items with custom variants
│   └── EditMenuItemModal.js  # Edit food item pricing & details
│
├── components/            # Reusable UI elements
│   ├── Header.js          # Tenant indicator, theme switcher & sign-out
│   ├── common/            # Button, Input, Badge, ModalContainer
│   ├── cart/              # CartItemRow (with stepper) & CustomerInputForm
│   ├── orders/            # OrderCard, PaymentModal & ReceiptModal
│   └── saas/              # SubscriptionBanner for trial/expiry notices
│
├── screens/               # Screen views
│   ├── auth/              # TenantSelectScreen, LoginScreen
│   ├── pos/               # PosBillingScreen (Dual Phone/Tablet POS), CartCheckoutScreen
│   ├── orders/            # PastOrdersScreen (with date filters & thermal receipt reprint)
│   ├── admin/             # AdminDashboardScreen, StaffManagementScreen, AuditLogsScreen
│   ├── profile/           # RestaurantProfileScreen
│   └── subscription/      # SubscriptionScreen
│
└── navigations/           # Navigation infrastructure
    ├── AppNavigator.js    # Root conditional switch between Auth & Main stacks
    ├── AuthNavigator.js   # Restaurant select & credentials flow
    └── MainTabNavigator.js# POS, Orders, Admin (role-gated), and Profile tabs
```

---

## 🚀 Running the App Locally

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start the Expo Development Server
```bash
npx expo start
```
- Press `a` to open in Android Emulator
- Press `i` to open in iOS Simulator
- Scan the QR code using the **Expo Go** app on your physical Android or iPhone device

### 3. Connecting to your Backend
The mobile app defaults to the production cloud API (`https://quickbill-restaurant-pos-1.onrender.com/api`).
If testing with a local backend:
- On Android Emulator: use `http://10.0.2.2:5000/api`
- On Physical Phone: on the **Find Your Restaurant** screen, tap **"Configure Backend Server URL"** and enter your computer's LAN IP (e.g., `http://192.168.1.10:5000/api`).

---

## 🖨️ Thermal Receipt Printing & Sharing
- **Thermal Receipt Printing:** Uses `expo-print` to render 58mm / 80mm ESC/POS compatible receipts directly to Bluetooth thermal printers, AirPrint (iOS), or Android Print Spooler.
- **Instant Social Sharing:** Generates a vector PDF receipt and opens the native share drawer (`expo-sharing`) for one-tap WhatsApp, Email, or SMS delivery to customers.

---

## 📱 Dual-Mode Phone & Tablet Responsive Layout
- **Handheld Phones (Waiters):** 2-column food grid with search, category chips, and a sticky bottom cart bar leading to the checkout sheet.
- **Counter Tablets (Cashiers):** Responsive split-screen (62% Menu Catalog on the left, permanent 38% active ticket with live calculations on the right) for rapid billing.

---

## 📦 Building Production Binaries (EAS Build)

### Direct Android APK (for sideloading / testing):
```bash
npx eas-cli build -p android --profile preview
```

### Google Play Store Bundle (.aab) & Apple App Store (.ipa):
```bash
npx eas-cli build -p android --profile production
npx eas-cli build -p ios --profile production
```
