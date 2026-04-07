## ٤ زمانی NexPOS

| کۆد | زمان | ئاڕاستە | فۆنت | فایل |
|-----|------|---------|------|------|
| `en` | English | LTR | Inter | `src/messages/en.ts` |
| `ckb` | کوردی سۆرانی | RTL | NRT / Noto Sans Arabic | `src/messages/ckb.ts` |
| `ar` | العربية | RTL | Noto Sans Arabic | `src/messages/ar.ts` |
| `tr` | Türkçe | LTR | Inter | `src/messages/tr.ts` |

---

## ١٥ بەش — ناوەڕۆک و وەرگێڕان و i18n و RTL

---

### §1. بنچینەکانی وەرگێڕانی سروشتی — نەک وشە بە وشە

ئەمە گرنگترین بنچینەیە. وەرگێڕانی NexPOS **وەرگێڕانی ماشینی نییە** — هەموو شتێک وەک ئاخێوەری ڕەسەنی ئەو زمانە نووسراوە.

```typescript
// ═══════════════════════════════════════════════════
// ❌ وەرگێڕانی ماشینی (وشە بە وشە) — قەدەغەیە!
// ═══════════════════════════════════════════════════

// مثال ١:
en: "Add to cart"
ckb: "زیادکردن بۆ سەبەتە"   // ❌ ناسروشتی — کەس وا ناڵێت
ar: "إضافة إلى العربة"      // ❌ ترجمة حرفية
tr: "Sepete ekleme"          // ❌ isim hali — fiil olmalı

// مثال ٢:
en: "Out of stock"
ckb: "لە ئەمبار نییە"       // ❌ ناسروشتی — دەگمەنە وا بڵێیت
ar: "خارج المخزون"          // ❌ ترجمة حرفية
tr: "Stok dışında"           // ❌ alışılmadık ifade

// مثال ٣:
en: "Something went wrong"
ckb: "شتێک هەڵە چوو"       // ❌ ئینگلیزی بە کوردییەوە
ar: "شيء ذهب خطأ"           // ❌ ترجمة حرفية مضحكة
tr: "Bir şey yanlış gitti"   // ❌ doğrudan çeviri

// ═══════════════════════════════════════════════════
// ✅ وەرگێڕانی سروشتی (وەک خەڵکی ئەو زمانە) — هەمیشە ئەمە!
// ═══════════════════════════════════════════════════

// مثال ١:
en: "Add to Cart"
ckb: "خستنە سەبەتە"         // ✅ سروشتی — کورت و ڕوون
ar: "أضف إلى السلة"         // ✅ فعل أمر — طبيعي
tr: "Sepete Ekle"            // ✅ doğal fiil

// مثال ٢:
en: "Out of Stock"
ckb: "نەماوە"                // ✅ کورت — خەڵکی وا دەڵێت
ar: "نفذ"                   // ✅ مختصر وطبيعي
tr: "Tükendi"                // ✅ kısa ve anlaşılır

// مثال ٣:
en: "Something went wrong"
ckb: "هەڵەیەک ڕوویدا"       // ✅ سروشتی
ar: "حدث خطأ ما"            // ✅ طبيعي
tr: "Bir hata oluştu"        // ✅ doğal ifade

// مثال ٤:
en: "Your order has been placed successfully"
ckb: "داواکارییەکەت بە سەرکەوتوویی نۆندرا"  // ✅
ar: "تم تقديم طلبك بنجاح"                   // ✅
tr: "Siparişiniz başarıyla oluşturuldu"       // ✅

// مثال ٥:
en: "Free shipping on orders over $50"
ckb: "گەیاندنی بەخۆڕایی بۆ داواکاری سەرووی $٥٠"  // ✅
ar: "شحن مجاني للطلبات فوق ٥٠$"                  // ✅
tr: "50$ üzeri siparişlerde ücretsiz kargo"        // ✅

// مثال ٦:
en: "Sign in to continue"
ckb: "بچۆ ژوورەوە بۆ بەردەوامبوون"  // ✅ نەک "داخل ببە"
ar: "سجّل دخولك للمتابعة"           // ✅ نەک "وقّع الدخول"
tr: "Devam etmek için giriş yapın"   // ✅

// مثال ٧:
en: "Remove from wishlist"
ckb: "لادان لە لیستی دڵخواز"   // ✅
ar: "إزالة من المفضلة"         // ✅
tr: "İstek listesinden kaldır"  // ✅

// مثال ٨:
en: "Apply coupon"
ckb: "کوپۆن بەکاربهێنە"   // ✅ نەک "دابنرخیکی کوپۆن"
ar: "تطبيق الكوبون"        // ✅
tr: "Kuponu uygula"         // ✅
```

#### ڕێسای وەرگێڕانی سروشتی:
```
١. وشە بە وشە مەوەرگێ‌ڕە — مانا بگەیەنە
٢. بیر بکەوە "خەڵکی ئەو زمانە چۆن دەیڵێت؟"
٣. کورت بە — بەتایبەتی بۆ دوگمەکان و لەیبڵەکان
٤. context بزانە — "cart" لە فرۆشتندا "سەبەتە" نییە بەڵکو "سەبەتەی کڕین"
٥. تۆنی brand بپارێزە — NexPOS professional/friendly-ە
٦. ئیدیۆمەکان وەرگێڕانی ڕاستەوخۆ نیین:
   - "break a leg" ≠ "قاچت بشکێنە" 😂
   - "out of the box" ≠ "لە سندوقەکاوە"
٧. UI copy کورت دەبێت — ٣-٥ وشە بۆ دوگمەکان
٨. Error messages ڕوون دەبێت — بەکارهێنەر بزانێت چی بکات
```

---

### §2. تۆنی دەنگ و کەلتووری هەر زمانێک

```
═══════════════════════════════════════════════════
🇺🇸 ENGLISH — Professional, Clean, Direct
═══════════════════════════════════════════════════
تۆن:      Friendly professional
فۆرمالیتی: Medium — نەک formale بێزاوی زۆر، نەک casual زۆر
You/Your:  "You" بەکاربهێنە — ڕاستەوخۆ بقسێ
Contractions: "don't", "we'll" — باشە لە UI
Active voice: "We shipped your order" نەک "Your order was shipped"
Sentence case: "Add to cart" نەک "Add To Cart" (جگە لە headings)

نمونەکان:
  Success:  "Your order has been placed!"
  Error:    "Something went wrong. Please try again."
  Empty:    "Your cart is empty."
  Confirm:  "Are you sure you want to delete this item?"
  Welcome:  "Welcome back! Here's what's new."
  CTA:      "Shop Now" / "Get Started" / "Learn More"

═══════════════════════════════════════════════════
🟢 کوردی سۆرانی — گەرم، هاوڕێیانە، ڕوون
═══════════════════════════════════════════════════
تۆن:      هاوڕێیانە و پڕۆفیشناڵ — وەک هاوڕێیەکی پسپۆڕ
فۆرمالیتی: نزم-ناوەند — ڕسەن و خۆمانی
تۆ/ئێوە:  "تۆ" بەکاربهێنە — ئاسایی و گەرمە
هەست:     emoji بەکاربهێنە لە success messages 🎉 ✅
ڕستە:     کورت و ڕوون — بوێری لە کردار (imperative)

نمونەکان:
  Success:  "داواکارییەکەت بە سەرکەوتوویی نۆندرا! 🎉"
  Error:    "هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدەوە."
  Empty:    "سەبەتەکەت بەتاڵە."
  Confirm:  "دڵنیایت دەتەوێت ئەمە بسڕیتەوە؟"
  Welcome:  "بەخێربێیتەوە! ئەمانە نوێترینەکانن."
  CTA:      "ئێستا بکڕە" / "دەستپێبکە" / "زیاتر بزانە"

═══════════════════════════════════════════════════
🟡 العربية — رسمی، محترم، واضح
═══════════════════════════════════════════════════
تۆن:      رسمي ومحترم — فصحى مبسطة (نەک عامية)
فۆرمالیتی: ناوەند-بەرز — أكثر رسمية من الكردي
أنت/أنتِ: "أنت" — مذكر (default لـ UI)
الأفعال:  فعل أمر: "أضف", "احذف", "سجّل"
الأسلوب:  MSA (Modern Standard Arabic) — نەک لهجة

نمونەکان:
  Success:  "تم تقديم طلبك بنجاح"
  Error:    "حدث خطأ ما. يرجى المحاولة مرة أخرى."
  Empty:    "سلة التسوق فارغة."
  Confirm:  "هل أنت متأكد من حذف هذا العنصر؟"
  Welcome:  "مرحباً بعودتك! إليك آخر المستجدات."
  CTA:      "اشترِ الآن" / "ابدأ" / "اعرف المزيد"

═══════════════════════════════════════════════════
🔴 TÜRKÇE — Samimi, Net, Profesyonel
═══════════════════════════════════════════════════
تۆن:      Resmi ama sıcak — müşteriye yakın
فۆرمالیتی: ناوەند — siz (formal)
Sen/Siz:  "Siz" — UI'da resmi hitap
Fiiller:  Emir kipi: "Ekle", "Sil", "Kaydet"
Ünlem:    Türkçe doğallığı koru — "Harika!", "Tebrikler!"

نمونەکان:
  Success:  "Siparişiniz başarıyla oluşturuldu!"
  Error:    "Bir hata oluştu. Lütfen tekrar deneyin."
  Empty:    "Sepetiniz boş."
  Confirm:  "Bu öğeyi silmek istediğinizden emin misiniz?"
  Welcome:  "Tekrar hoş geldiniz! İşte yenilikler."
  CTA:      "Hemen Al" / "Başla" / "Daha Fazla"
```

---

### §3. Messages Structure — ڕێکخستنی تەواوی فایلی messages

```typescript
// ═══════════════════════════════════════════════════
// src/messages/en.ts — ڕێکخستنی تەواو
// ═══════════════════════════════════════════════════
const en = {
  // ─────────────────────────────────────────────────
  // NAV — نەویگەیشن
  // ─────────────────────────────────────────────────
  nav: {
    home: 'Home',
    shop: 'Shop',
    products: 'Products',
    cart: 'Cart',
    wishlist: 'Wishlist',
    orders: 'Orders',
    settings: 'Settings',
    contact: 'Contact Us',
    terms: 'Terms & Conditions',
    privacy: 'Privacy Policy',
    admin: 'Admin Panel',
    login: 'Log In',
    register: 'Sign Up',
    logout: 'Log Out',
    search: 'Search...',
    account: 'My Account',
    language: 'Language',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
  },

  // ─────────────────────────────────────────────────
  // PRODUCT — بەرهەم
  // ─────────────────────────────────────────────────
  product: {
    addToCart: 'Add to Cart',
    removeFromCart: 'Remove from Cart',
    buyNow: 'Buy Now',
    outOfStock: 'Out of Stock',
    inStock: 'In Stock',
    lowStock: 'Only {count} left',
    price: 'Price',
    originalPrice: 'Original Price',
    salePrice: 'Sale Price',
    discount: '{percent}% Off',
    quantity: 'Quantity',
    color: 'Color',
    size: 'Size',
    brand: 'Brand',
    category: 'Category',
    description: 'Description',
    specifications: 'Specifications',
    reviews: '{count, plural, =0 {No Reviews} =1 {1 Review} other {# Reviews}}',
    rating: '{rating} out of 5',
    writeReview: 'Write a Review',
    addToWishlist: 'Add to Wishlist',
    removeFromWishlist: 'Remove from Wishlist',
    share: 'Share',
    compare: 'Compare',
    sku: 'SKU',
    availability: 'Availability',
    freeShipping: 'Free Shipping',
    warranty: 'Warranty',
    returnPolicy: 'Return Policy',
    relatedProducts: 'Related Products',
    recentlyViewed: 'Recently Viewed',
    newArrival: 'New',
    bestSeller: 'Best Seller',
    featured: 'Featured',
    sale: 'Sale',
    notifyMe: 'Notify When Available',
    askQuestion: 'Ask a Question',
  },

  // ─────────────────────────────────────────────────
  // CART — سەبەتە
  // ─────────────────────────────────────────────────
  cart: {
    title: 'Shopping Cart',
    empty: 'Your cart is empty',
    emptyDescription: 'Looks like you haven\'t added anything yet.',
    continueShopping: 'Continue Shopping',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    tax: 'Tax',
    total: 'Total',
    freeShipping: 'Free Shipping',
    calculatedAtCheckout: 'Calculated at checkout',
    updateQuantity: 'Update Quantity',
    remove: 'Remove',
    clearCart: 'Clear Cart',
    itemCount: '{count, plural, =0 {No items} =1 {1 item} other {# items}}',
    proceedToCheckout: 'Proceed to Checkout',
    coupon: 'Coupon Code',
    applyCoupon: 'Apply',
    removeCoupon: 'Remove Coupon',
    couponApplied: 'Coupon applied: {discount} off',
    invalidCoupon: 'Invalid coupon code',
    expiredCoupon: 'This coupon has expired',
    cartUpdated: 'Cart updated',
    itemAdded: 'Item added to cart',
    itemRemoved: 'Item removed from cart',
  },

  // ─────────────────────────────────────────────────
  // CHECKOUT — پارەدان
  // ─────────────────────────────────────────────────
  checkout: {
    title: 'Checkout',
    shippingAddress: 'Shipping Address',
    billingAddress: 'Billing Address',
    sameAsShipping: 'Same as shipping address',
    paymentMethod: 'Payment Method',
    creditCard: 'Credit Card',
    orderSummary: 'Order Summary',
    placeOrder: 'Place Order',
    processing: 'Processing...',
    orderPlaced: 'Order placed successfully!',
    orderFailed: 'Failed to place order. Please try again.',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    state: 'State/Province',
    zipCode: 'ZIP/Postal Code',
    country: 'Country',
    notes: 'Order Notes (Optional)',
    secureCheckout: 'Secure Checkout',
    poweredByStripe: 'Payments powered by Stripe',
    backToCart: 'Back to Cart',
  },

  // ─────────────────────────────────────────────────
  // ORDERS — داواکاری
  // ─────────────────────────────────────────────────
  orders: {
    title: 'My Orders',
    empty: 'No orders yet',
    emptyDescription: 'When you place an order, it will appear here.',
    orderNumber: 'Order #{number}',
    date: 'Date',
    status: 'Status',
    total: 'Total',
    items: 'Items',
    viewDetails: 'View Details',
    trackOrder: 'Track Order',
    cancelOrder: 'Cancel Order',
    returnOrder: 'Request Return',
    reorder: 'Order Again',
    // Statuses:
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned',
    refunded: 'Refunded',
  },

  // ─────────────────────────────────────────────────
  // AUTH — چوونەژوورەوە
  // ─────────────────────────────────────────────────
  auth: {
    login: 'Log In',
    register: 'Sign Up',
    logout: 'Log Out',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    newPassword: 'New Password',
    rememberMe: 'Remember Me',
    noAccount: 'Don\'t have an account?',
    hasAccount: 'Already have an account?',
    signUpNow: 'Sign up now',
    loginNow: 'Log in now',
    orContinueWith: 'Or continue with',
    google: 'Google',
    termsAgree: 'By signing up, you agree to our {terms} and {privacy}',
    verifyEmail: 'Check your email for verification link',
    resetSent: 'Password reset link sent to your email',
    loginSuccess: 'Welcome back!',
    registerSuccess: 'Account created successfully!',
    invalidCredentials: 'Invalid email or password',
    emailInUse: 'This email is already registered',
    weakPassword: 'Password must be at least 8 characters',
    passwordMismatch: 'Passwords do not match',
  },

  // ─────────────────────────────────────────────────
  // ADMIN — ئەدمین
  // ─────────────────────────────────────────────────
  admin: {
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
    users: 'Users',
    brands: 'Brands',
    categories: 'Categories',
    coupons: 'Coupons',
    messages: 'Messages',
    notifications: 'Notifications',
    settings: 'Settings',
    backup: 'Backup',
    trash: 'Trash',
    promotions: 'Promotions',
    analytics: 'Analytics',
    // Dashboard stats:
    totalRevenue: 'Total Revenue',
    totalOrders: 'Total Orders',
    totalUsers: 'Total Users',
    totalProducts: 'Total Products',
    recentOrders: 'Recent Orders',
    topProducts: 'Top Products',
    salesChart: 'Sales Chart',
    // CRUD:
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search...',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    bulkAction: 'Bulk Action',
    selectAll: 'Select All',
    noResults: 'No results found',
    showing: 'Showing {from}-{to} of {total}',
    perPage: 'Per Page',
    actions: 'Actions',
    status: 'Status',
    created: 'Created',
    updated: 'Updated',
    confirmDelete: 'Are you sure you want to delete this?',
    deleteWarning: 'This action cannot be undone.',
    savedSuccess: 'Saved successfully',
    deletedSuccess: 'Deleted successfully',
  },

  // ─────────────────────────────────────────────────
  // CONTACT — پەیوەندی
  // ─────────────────────────────────────────────────
  contact: {
    title: 'Contact Us',
    name: 'Your Name',
    email: 'Your Email',
    subject: 'Subject',
    message: 'Message',
    send: 'Send Message',
    sending: 'Sending...',
    sent: 'Message sent successfully!',
    error: 'Failed to send message. Please try again.',
    address: 'Our Address',
    phone: 'Phone',
    workingHours: 'Working Hours',
    followUs: 'Follow Us',
  },

  // ─────────────────────────────────────────────────
  // COMMON — هاوبەش
  // ─────────────────────────────────────────────────
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try Again',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search...',
    noResults: 'No results found',
    viewAll: 'View All',
    showMore: 'Show More',
    showLess: 'Show Less',
    yes: 'Yes',
    no: 'No',
    or: 'or',
    and: 'and',
    optional: 'Optional',
    required: 'Required',
    select: 'Select',
    upload: 'Upload',
    download: 'Download',
    copy: 'Copy',
    copied: 'Copied!',
    share: 'Share',
    print: 'Print',
    refresh: 'Refresh',
    sortBy: 'Sort by',
    filterBy: 'Filter by',
    all: 'All',
    none: 'None',
    from: 'From',
    to: 'To',
    date: 'Date',
    time: 'Time',
    amount: 'Amount',
    total: 'Total',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    enabled: 'Enabled',
    disabled: 'Disabled',
    on: 'On',
    off: 'Off',
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
  },

  // ─────────────────────────────────────────────────
  // VALIDATION — پشتڕاستکردنەوە
  // ─────────────────────────────────────────────────
  validation: {
    required: 'This field is required',
    email: 'Please enter a valid email',
    minLength: 'Must be at least {min} characters',
    maxLength: 'Must be at most {max} characters',
    min: 'Must be at least {min}',
    max: 'Must be at most {max}',
    pattern: 'Invalid format',
    phone: 'Please enter a valid phone number',
    url: 'Please enter a valid URL',
    number: 'Please enter a valid number',
    positive: 'Must be a positive number',
    integer: 'Must be a whole number',
    passwordStrength: 'Password must contain uppercase, lowercase, number, and special character',
    fileSize: 'File size must be less than {size}',
    fileType: 'File type must be {types}',
    imageDimensions: 'Image must be at least {width}x{height}',
  },

  // ─────────────────────────────────────────────────
  // NOTIFICATIONS — ئاگادارکردنەوە
  // ─────────────────────────────────────────────────
  notifications: {
    title: 'Notifications',
    empty: 'No notifications',
    markAllRead: 'Mark all as read',
    newOrder: 'New order #{number} received',
    orderShipped: 'Your order #{number} has been shipped',
    orderDelivered: 'Your order #{number} has been delivered',
    newMessage: 'New message from {name}',
    lowStock: '{product} is running low on stock',
    priceDropped: 'Price dropped on {product}',
    backInStock: '{product} is back in stock',
    couponExpiring: 'Your coupon expires soon',
    welcomeNew: 'Welcome to NexPOS! Start shopping now.',
  },

  // ─────────────────────────────────────────────────
  // SETTINGS — ڕێکخستنەکان
  // ─────────────────────────────────────────────────
  settings: {
    title: 'Settings',
    profile: 'Profile',
    addresses: 'Addresses',
    security: 'Security',
    preferences: 'Preferences',
    notifications: 'Notifications',
    language: 'Language',
    theme: 'Theme',
    currency: 'Currency',
    editProfile: 'Edit Profile',
    changePassword: 'Change Password',
    addAddress: 'Add Address',
    editAddress: 'Edit Address',
    deleteAddress: 'Delete Address',
    defaultAddress: 'Default Address',
    setDefault: 'Set as Default',
    savedSuccessfully: 'Settings saved!',
  },

  // ─────────────────────────────────────────────────
  // FOOTER — پێی لاپەڕە
  // ─────────────────────────────────────────────────
  footer: {
    about: 'About NexPOS',
    aboutDescription: 'Your trusted destination for POS hardware and accessories.',
    quickLinks: 'Quick Links',
    customerService: 'Customer Service',
    newsletter: 'Newsletter',
    newsletterDescription: 'Subscribe for the latest updates and offers.',
    emailPlaceholder: 'Enter your email',
    subscribe: 'Subscribe',
    subscribed: 'Thanks for subscribing!',
    copyright: '© {year} NexPOS. All rights reserved.',
    madeWith: 'Made with ❤️ in Erbil',
  },

  // ─────────────────────────────────────────────────
  // SEO & META — بۆ SEO
  // ─────────────────────────────────────────────────
  meta: {
    homeTitle: 'NexPOS — POS Hardware & Accessories',
    homeDescription: 'Shop the best POS hardware, receipt printers, barcode scanners, and accessories.',
    productsTitle: 'Products — NexPOS',
    productsDescription: 'Browse our complete collection of POS hardware and accessories.',
    cartTitle: 'Shopping Cart — NexPOS',
    checkoutTitle: 'Checkout — NexPOS',
    contactTitle: 'Contact Us — NexPOS',
    loginTitle: 'Log In — NexPOS',
    registerTitle: 'Sign Up — NexPOS',
    ordersTitle: 'My Orders — NexPOS',
    settingsTitle: 'Settings — NexPOS',
    notFoundTitle: '404 — Page Not Found',
    notFoundDescription: 'The page you\'re looking for doesn\'t exist.',
  },
}
```

---

### §4. وەرگێڕانی تەواو — ckb (کوردی سۆرانی)

```typescript
// ═══════════════════════════════════════════════════
// src/messages/ckb.ts — وەرگێڕانی تەواو بە کوردی
// ═══════════════════════════════════════════════════
const ckb = {
  nav: {
    home: 'سەرەتا',
    shop: 'فرۆشگا',
    products: 'بەرهەمەکان',
    cart: 'سەبەتە',
    wishlist: 'لیستی دڵخواز',
    orders: 'داواکاریەکان',
    settings: 'ڕێکخستنەکان',
    contact: 'پەیوەندیمان پێوە بکە',
    terms: 'مەرجەکان',
    privacy: 'سیاسەتی تایبەتمەندی',
    admin: 'پانێڵی بەڕێوەبردن',
    login: 'چوونەژوورەوە',
    register: 'تۆمارکردن',
    logout: 'چوونەدەرەوە',
    search: 'گەڕان...',
    account: 'هەژمارەکەم',
    language: 'زمان',
    theme: 'ڕووکار',
    darkMode: 'ڕووکاری تاریک',
    lightMode: 'ڕووکاری ڕوون',
  },
  product: {
    addToCart: 'خستنە سەبەتە',
    removeFromCart: 'لادان لە سەبەتە',
    buyNow: 'ئێستا بکڕە',
    outOfStock: 'نەماوە',
    inStock: 'بەردەستە',
    lowStock: 'تەنیا {count} ماوە',
    price: 'نرخ',
    originalPrice: 'نرخی ئەسڵی',
    salePrice: 'نرخی داشکاندوو',
    discount: '{percent}% داشکاندن',
    quantity: 'ژمارە',
    color: 'ڕەنگ',
    size: 'قەبارە',
    brand: 'براند',
    category: 'هاوپۆل',
    description: 'وەسف',
    specifications: 'تایبەتمەندییەکان',
    reviews: '{count, plural, =0 {هیچ هەڵسەنگاندنێک} =1 {١ هەڵسەنگاندن} other {# هەڵسەنگاندن}}',
    rating: '{rating} لە ٥',
    writeReview: 'هەڵسەنگاندن بنووسە',
    addToWishlist: 'خستنە لیستی دڵخواز',
    removeFromWishlist: 'لادان لە لیستی دڵخواز',
    share: 'هاوبەشکردن',
    compare: 'بەراوردکردن',
    sku: 'کۆد',
    availability: 'بەردەستبوون',
    freeShipping: 'گەیاندنی بەخۆڕایی',
    warranty: 'گەرەنتی',
    returnPolicy: 'سیاسەتی گەڕاندنەوە',
    relatedProducts: 'بەرهەمی هاوشێوە',
    recentlyViewed: 'دواین بینراوەکان',
    newArrival: 'نوێ',
    bestSeller: 'پڕفرۆش',
    featured: 'تایبەت',
    sale: 'داشکاندن',
    notifyMe: 'ئاگادارم بکەوە کاتێک بەردەست بوو',
    askQuestion: 'پرسیارێک بکە',
  },
  cart: {
    title: 'سەبەتەی کڕین',
    empty: 'سەبەتەکەت بەتاڵە',
    emptyDescription: 'وا دیارە هێشتا هیچ شتێکت زیاد نەکردووە.',
    continueShopping: 'بەردەوامبوون لە کڕین',
    subtotal: 'کۆی لاوەکی',
    shipping: 'گەیاندن',
    tax: 'باج',
    total: 'کۆی گشتی',
    freeShipping: 'گەیاندنی بەخۆڕایی',
    calculatedAtCheckout: 'لە کاتی پارەدان حیساب دەکرێت',
    updateQuantity: 'گۆڕینی ژمارە',
    remove: 'لابردن',
    clearCart: 'بەتاڵکردنی سەبەتە',
    itemCount: '{count, plural, =0 {هیچ شتێک} =1 {١ دانە} other {# دانە}}',
    proceedToCheckout: 'بەردەوامبوون بۆ پارەدان',
    coupon: 'کۆدی کوپۆن',
    applyCoupon: 'بەکارهێنان',
    removeCoupon: 'لابردنی کوپۆن',
    couponApplied: 'کوپۆن جێبەجێ کرا: {discount} داشکاندن',
    invalidCoupon: 'کۆدی کوپۆن هەڵەیە',
    expiredCoupon: 'ئەم کوپۆنە بەسەرچووە',
    cartUpdated: 'سەبەتە نوێکرایەوە',
    itemAdded: 'خرایە سەبەتە',
    itemRemoved: 'لە سەبەتە لابرا',
  },
  checkout: {
    title: 'پارەدان',
    shippingAddress: 'ناونیشانی گەیاندن',
    billingAddress: 'ناونیشانی پارەدان',
    sameAsShipping: 'هەمان ناونیشانی گەیاندن',
    paymentMethod: 'شێوازی پارەدان',
    creditCard: 'کارتی بانکی',
    orderSummary: 'خولاسەی داواکاری',
    placeOrder: 'داواکاری بکە',
    processing: 'چاوەڕوان بە...',
    orderPlaced: 'داواکارییەکەت بە سەرکەوتوویی نۆندرا!',
    orderFailed: 'داواکاری سەرنەکەوت. تکایە دووبارە هەوڵ بدەوە.',
    firstName: 'ناوی یەکەم',
    lastName: 'ناوی خێزان',
    email: 'ئیمەیڵ',
    phone: 'ژمارەی مۆبایل',
    address: 'ناونیشان',
    city: 'شار',
    state: 'پارێزگا',
    zipCode: 'کۆدی پۆستە',
    country: 'وڵات',
    notes: 'تێبینی (ئارەزوومەندانە)',
    secureCheckout: 'پارەدانی ئەمین',
    poweredByStripe: 'پارەدان لەڕێگەی Stripe',
    backToCart: 'گەڕانەوە بۆ سەبەتە',
  },
  // ... باقی بەشەکان بە هەمان ڕێکخستن
}
```

---

### §5. وەرگێڕانی تەواو — ar (العربية)

```typescript
// ═══════════════════════════════════════════════════
// src/messages/ar.ts — الترجمة الكاملة
// ═══════════════════════════════════════════════════
const ar = {
  nav: {
    home: 'الرئيسية',
    shop: 'المتجر',
    products: 'المنتجات',
    cart: 'سلة التسوق',
    wishlist: 'المفضلة',
    orders: 'الطلبات',
    settings: 'الإعدادات',
    contact: 'اتصل بنا',
    terms: 'الشروط والأحكام',
    privacy: 'سياسة الخصوصية',
    admin: 'لوحة التحكم',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    search: 'بحث...',
    account: 'حسابي',
    language: 'اللغة',
    theme: 'المظهر',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
  },
  product: {
    addToCart: 'أضف إلى السلة',
    removeFromCart: 'إزالة من السلة',
    buyNow: 'اشترِ الآن',
    outOfStock: 'نفذ',
    inStock: 'متوفر',
    lowStock: 'باقي {count} فقط',
    price: 'السعر',
    originalPrice: 'السعر الأصلي',
    salePrice: 'سعر العرض',
    discount: 'خصم {percent}%',
    quantity: 'الكمية',
    color: 'اللون',
    size: 'الحجم',
    brand: 'العلامة التجارية',
    category: 'الفئة',
    description: 'الوصف',
    specifications: 'المواصفات',
    reviews: '{count, plural, =0 {لا مراجعات} =1 {مراجعة واحدة} two {مراجعتان} few {# مراجعات} many {# مراجعة} other {# مراجعة}}',
    rating: '{rating} من 5',
    writeReview: 'اكتب مراجعة',
    addToWishlist: 'أضف إلى المفضلة',
    removeFromWishlist: 'إزالة من المفضلة',
    share: 'مشاركة',
    compare: 'مقارنة',
    notifyMe: 'أبلغني عند التوفر',
    askQuestion: 'اطرح سؤالاً',
  },
  cart: {
    title: 'سلة التسوق',
    empty: 'سلتك فارغة',
    emptyDescription: 'لم تضف أي منتجات بعد.',
    continueShopping: 'متابعة التسوق',
    subtotal: 'المجموع الفرعي',
    shipping: 'الشحن',
    tax: 'الضريبة',
    total: 'الإجمالي',
    proceedToCheckout: 'متابعة الدفع',
    coupon: 'كود الكوبون',
    applyCoupon: 'تطبيق',
    couponApplied: 'تم تطبيق الكوبون: خصم {discount}',
    invalidCoupon: 'كود كوبون غير صالح',
    itemAdded: 'تمت الإضافة إلى السلة',
    itemRemoved: 'تمت الإزالة من السلة',
  },
  // ... باقي الأقسام بنفس التنسيق
}
```

---

### §6. وەرگێڕانی تەواو — tr (Türkçe)

```typescript
// ═══════════════════════════════════════════════════
// src/messages/tr.ts — Tam Çeviri
// ═══════════════════════════════════════════════════
const tr = {
  nav: {
    home: 'Ana Sayfa',
    shop: 'Mağaza',
    products: 'Ürünler',
    cart: 'Sepet',
    wishlist: 'İstek Listesi',
    orders: 'Siparişler',
    settings: 'Ayarlar',
    contact: 'İletişim',
    terms: 'Şartlar ve Koşullar',
    privacy: 'Gizlilik Politikası',
    admin: 'Yönetim Paneli',
    login: 'Giriş Yap',
    register: 'Kayıt Ol',
    logout: 'Çıkış Yap',
    search: 'Ara...',
    account: 'Hesabım',
    language: 'Dil',
    theme: 'Tema',
    darkMode: 'Karanlık Mod',
    lightMode: 'Aydınlık Mod',
  },
  product: {
    addToCart: 'Sepete Ekle',
    removeFromCart: 'Sepetten Kaldır',
    buyNow: 'Hemen Al',
    outOfStock: 'Tükendi',
    inStock: 'Stokta',
    lowStock: 'Son {count} adet',
    price: 'Fiyat',
    originalPrice: 'Orijinal Fiyat',
    salePrice: 'İndirimli Fiyat',
    discount: '%{percent} İndirim',
    quantity: 'Adet',
    color: 'Renk',
    size: 'Boyut',
    brand: 'Marka',
    category: 'Kategori',
    description: 'Açıklama',
    specifications: 'Özellikler',
    reviews: '{count, plural, =0 {Değerlendirme yok} =1 {1 Değerlendirme} other {# Değerlendirme}}',
    rating: '{rating} / 5',
    writeReview: 'Değerlendirme Yaz',
    addToWishlist: 'İstek Listesine Ekle',
    removeFromWishlist: 'İstek Listesinden Kaldır',
    share: 'Paylaş',
    compare: 'Karşılaştır',
    notifyMe: 'Stoka girince haber ver',
    askQuestion: 'Soru Sor',
  },
  cart: {
    title: 'Alışveriş Sepeti',
    empty: 'Sepetiniz boş',
    emptyDescription: 'Henüz ürün eklememişsiniz.',
    continueShopping: 'Alışverişe Devam Et',
    subtotal: 'Ara Toplam',
    shipping: 'Kargo',
    tax: 'Vergi',
    total: 'Toplam',
    proceedToCheckout: 'Ödemeye Geç',
    coupon: 'Kupon Kodu',
    applyCoupon: 'Uygula',
    couponApplied: 'Kupon uygulandı: {discount} indirim',
    invalidCoupon: 'Geçersiz kupon kodu',
    itemAdded: 'Sepete eklendi',
    itemRemoved: 'Sepetten kaldırıldı',
  },
  // ... diğer bölümler aynı formatta
}
```

---

### §7. RTL Support — ئەنسایکلۆپیدیای تەواو

#### ٧.١ — Logical Properties Reference (CSS)
```css
/* ═══════════════════════════════════════════════════
   Physical → Logical Properties — تەواو
   ═══════════════════════════════════════════════════ */

/* ── MARGIN ── */
margin-left     → margin-inline-start
margin-right    → margin-inline-end
margin-top      → margin-block-start
margin-bottom   → margin-block-end

/* ── PADDING ── */
padding-left    → padding-inline-start
padding-right   → padding-inline-end
padding-top     → padding-block-start
padding-bottom  → padding-block-end

/* ── BORDER ── */
border-left     → border-inline-start
border-right    → border-inline-end
border-top      → border-block-start
border-bottom   → border-block-end

/* ── BORDER RADIUS ── */
border-top-left-radius      → border-start-start-radius
border-top-right-radius     → border-start-end-radius
border-bottom-left-radius   → border-end-start-radius
border-bottom-right-radius  → border-end-end-radius

/* ── POSITIONING ── */
left   → inset-inline-start
right  → inset-inline-end
top    → inset-block-start
bottom → inset-block-end

/* ── TEXT ── */
text-align: left   → text-align: start
text-align: right  → text-align: end

/* ── FLOAT ── */
float: left   → float: inline-start
float: right  → float: inline-end

/* ── SIZING ── */
width      → inline-size
height     → block-size
min-width  → min-inline-size
max-width  → max-inline-size
```

#### ٧.٢ — Tailwind CSS RTL Classes
```html
<!-- ═══════════════════════════════════════════════════
     Tailwind Logical Properties — بۆ RTL
     ═══════════════════════════════════════════════════ -->

<!-- ── MARGIN ── -->
<!-- ml-4 → ms-4 (margin-start) -->
<!-- mr-4 → me-4 (margin-end) -->
<div className="ms-4 me-2" /> <!-- ئۆتۆماتیک flip دەبێت -->

<!-- ── PADDING ── -->
<!-- pl-4 → ps-4 (padding-start) -->
<!-- pr-4 → pe-4 (padding-end) -->
<div className="ps-6 pe-4" />

<!-- ── TEXT ALIGN ── -->
<!-- text-left → text-start -->
<!-- text-right → text-end -->
<p className="text-start">RTL-ready text</p>

<!-- ── BORDER ── -->
<!-- border-l → border-s -->
<!-- border-r → border-e -->
<div className="border-s-2 border-s-blue-500" />

<!-- ── ROUNDED ── -->
<!-- rounded-tl → rounded-ss -->
<!-- rounded-tr → rounded-se -->
<!-- rounded-bl → rounded-es -->
<!-- rounded-br → rounded-ee -->
<div className="rounded-ss-lg rounded-se-lg" />

<!-- ── POSITION ── -->
<!-- left-0 → start-0 -->
<!-- right-0 → end-0 -->
<div className="absolute start-0 top-0" />

<!-- ── SPACE ── -->
<!-- space-x → needs special handling for RTL -->
<div className="flex gap-4" /> <!-- gap هەمیشە RTL-safe -->

<!-- ── SCROLL ── -->
<!-- scroll-ml → scroll-ms -->
<!-- scroll-mr → scroll-me -->
<div className="scroll-ms-4" />
```

#### ٧.٣ — RTL Icon Flipping
```typescript
// ═══════════════════════════════════════════════════
// ئایکۆنەکانی کە دەبێت flip بکرێن لە RTL
// ═══════════════════════════════════════════════════

// ✅ دەبێت flip بکرێن (ئاڕاستەییە):
const flipIcons = [
  'ChevronLeft',      // ← ئەمە دەبێتە → لە RTL
  'ChevronRight',     // → ئەمە دەبێتە ← لە RTL
  'ArrowLeft',        // ← 
  'ArrowRight',       // →
  'ExternalLink',     // ← ئاڕاستەی لینک
  'Undo',             // ← ئاڕاستەی گەڕانەوە
  'Redo',             // → ئاڕاستەی ڕۆیشتنەپێش
  'Reply',            // ← 
  'Forward',          // →
  'Logout',           // ← ئاڕاستەی چوونەدەرەوە
  'TextAlignLeft',    // ←
  'TextAlignRight',   // →
  'Indent',           // →
  'Outdent',          // ←
]

// ❌ نابێت flip بکرێن (universal):
const noFlipIcons = [
  'Search',           // لوپە هەمیشە هەمان شێوە
  'Close',            // X هەمیشە X
  'Check',            // ✓ هەمیشە ✓
  'Plus',             // + 
  'Minus',            // -
  'Home',             // universal
  'User',             // universal
  'Heart',            // ♥
  'Star',             // ★
  'Clock',            // ⏰ (ساتێکی ئادی RTL نییە!)
  'Calendar',         // universal
  'Phone',            // universal (نەک ساتی analogue)
  'Mail',             // universal
  'Download',         // ↓ vertical
  'Upload',           // ↑ vertical
  'Trash',            // universal
  'Settings',         // gear is symmetric
  'Eye',              // universal
]

// ✅ CSS بۆ flip — بەکاربهێنە لەسەر ئایکۆنی ئاڕاستەیی:
// .icon-flip {
//   [dir="rtl"] & { transform: scaleX(-1); }
// }

// ✅ Tailwind بۆ flip:
// <ChevronRight className="rtl:scale-x-[-1]" />
```

#### ٧.٤ — BiDi (Bidirectional Text) Patterns
```typescript
// ═══════════════════════════════════════════════════
// BiDi — کاتێک LTR و RTL تێکەڵ دەبن
// ═══════════════════════════════════════════════════

// ✅ ژمارەکان هەمیشە LTR:
<span dir="ltr" className="inline-block">$49.99</span>  // نرخ
<span dir="ltr" className="inline-block">+964 750 123 4567</span>  // تەلەفۆن
<span dir="ltr" className="inline-block">ABC-123-XYZ</span>  // کۆد/SKU
<span dir="ltr" className="inline-block">2024-01-15</span>  // بەروار (ISO)

// ✅ Input fields بۆ LTR data:
<input type="tel" dir="ltr" className="text-start" />
<input type="email" dir="ltr" className="text-start" />
<input type="url" dir="ltr" className="text-start" />
<input type="number" dir="ltr" className="text-start" />

// ✅ Code/technical strings:
<code dir="ltr">{product.sku}</code>
<span dir="ltr">{order.tracking_number}</span>

// ✅ Unicode BiDi control characters (بۆ تێکەڵی پێچەوانە):
// U+200F — Right-to-Left Mark (RLM)
// U+200E — Left-to-Right Mark (LRM)
// بەکاربهێنە کاتێک ژمارە و تەکست تێکەڵ دەبن:
const orderLabel = `داواکاری #\u200E${orderNumber}`
// بەبێ LRM: "داواکاری #123" ← ژمارەکە لەلای چەپ دەردەکەوێت
// بە LRM: "داواکاری #123" ← ژمارەکە لەلای ڕاست دەردەکەوێت ✅

// ✅ Tailwind isolate بۆ BiDi:
<span className="isolate">{mixedContent}</span>
```

#### ٧.٥ — RTL Layout Patterns
```typescript
// ═══════════════════════════════════════════════════
// Layout Patterns — RTL-safe
// ═══════════════════════════════════════════════════

// ✅ Sidebar Layout (admin panel):
<div className="flex">
  <aside className="w-64 border-e">  {/* نەک border-r */}
    <nav className="ps-4 pe-2">      {/* نەک pl/pr */}
      {/* menu items */}
    </nav>
  </aside>
  <main className="flex-1 ps-6">     {/* نەک pl */}
    {children}
  </main>
</div>

// ✅ Product Card:
<div className="flex gap-4">
  <img className="w-20 rounded-ss-lg rounded-es-lg" /> {/* نەک rounded-tl/bl */}
  <div className="flex-1 text-start">  {/* نەک text-left */}
    <h3>{product.name}</h3>
    <span className="text-end" dir="ltr">${product.price}</span>
  </div>
</div>

// ✅ Breadcrumb:
<nav className="flex items-center gap-2">
  <a>سەرەتا</a>
  <ChevronRight className="rtl:scale-x-[-1] w-4 h-4" />  {/* flip */}
  <a>بەرهەمەکان</a>
  <ChevronRight className="rtl:scale-x-[-1] w-4 h-4" />
  <span>پرینتەری POS</span>
</nav>

// ✅ Back button:
<button className="flex items-center gap-2">
  <ArrowLeft className="rtl:scale-x-[-1]" />  {/* flip */}
  <span>{t('common.back')}</span>
</button>

// ✅ Progress stepper:
<div className="flex items-center">
  <Step label="سەبەتە" />
  <div className="flex-1 h-px bg-gray-300" />  {/* خەتی نێوان — RTL-safe */}
  <Step label="پارەدان" />
  <div className="flex-1 h-px bg-gray-300" />
  <Step label="تەواو" />
</div>

// ✅ Table actions (admin):
<td className="text-end">  {/* نەک text-right */}
  <button className="me-2">Edit</button>  {/* نەک mr */}
  <button>Delete</button>
</td>

// ✅ Toast/Notification position:
// toast container: "fixed end-4 top-4"  نەک "right-4"
<div className="fixed end-4 top-4 z-50">
  {toasts.map(t => <Toast key={t.id} />)}
</div>

// ✅ Modal/Dialog close button:
<button className="absolute end-4 top-4">  {/* نەک right-4 */}
  <X />
</button>

// ✅ Dropdown menu alignment:
<div className="relative">
  <button>Menu</button>
  <div className="absolute end-0 top-full">  {/* نەک right-0 */}
    {/* menu items */}
  </div>
</div>
```

---

### §8. Kurdish Typography — ئەنسایکلۆپیدیای تایپۆگرافی کوردی

```css
/* ═══════════════════════════════════════════════════
   Kurdish & Arabic Typography — زانیاری تەواو
   ═══════════════════════════════════════════════════ */

/* ── §8.1 فۆنت ── */

/* NRT — فۆنتی سەرەکی بۆ کوردی سۆرانی */
@font-face {
  font-family: 'NRT';
  src: url('/fonts/NRT-Reg.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0600-06FF, U+FB50-FDFF, U+FE70-FEFF; /* Arabic/Kurdish range */
}

@font-face {
  font-family: 'NRT';
  src: url('/fonts/NRT-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0600-06FF, U+FB50-FDFF, U+FE70-FEFF;
}

/* Noto Sans Arabic — fallback بۆ کوردی و سەرەکی بۆ عەرەبی */
/* لە Google Fonts بەردەستە — variable weight */

/* ── §8.2 Line Height ── */

/* کوردی/عەرەبی پێویستی بە line-height زیاترە لە ئینگلیزی:
   - ئینگلیزی: 1.5 باشە
   - کوردی: 1.7-1.8 پێویستە (بەهۆی diacritics, خاڵەکان)
   - عەرەبی: 1.7-1.8 (هەمان هۆکار)
   - تورکی: 1.5 (وەک ئینگلیزی)
*/
:lang(ckb), :lang(ar) {
  line-height: 1.8;
}
:lang(en), :lang(tr) {
  line-height: 1.5;
}

/* ── §8.3 Letter Spacing ── */

/* ❌ هەرگیز letter-spacing بۆ کوردی/عەرەبی!
   ئینگلیزی: letter-spacing: 0.05em باشە بۆ headings
   کوردی: letter-spacing خەتی نووسین دەشکێنێت!
   عەرەبی: هەمان مەسەلە — خەتی پەیوەست دابڕدەکات
*/
:lang(ckb), :lang(ar) {
  letter-spacing: 0 !important;
}

/* ── §8.4 Word Spacing ── */

/* کەمێک word-spacing باشە بۆ خوێندنەوە لە عەرەبی/کوردی */
:lang(ckb), :lang(ar) {
  word-spacing: 0.05em;
}

/* ── §8.5 Font Features ── */

:lang(ckb), :lang(ar) {
  font-feature-settings: 
    'liga' 1,   /* Ligatures — گرنگە بۆ عەرەبی */
    'calt' 1,   /* Contextual Alternates */
    'kern' 1;   /* Kerning */
  /* 'numr' 1 → بۆ ژمارەی عەرەبی ئارەزوومەندانە */
}

/* ── §8.6 Font Size Adjustment ── */

/* عەرەبی/کوردی کەمێک بچووکتر دەردەکەوێت — زیادی بکە */
:lang(ckb) { font-size-adjust: 0.53; }
:lang(ar)  { font-size-adjust: 0.52; }

/* ── §8.7 Kurdish-specific Characters ── */

/* پیتەکانی تایبەت بە کوردی سۆرانی (نە عەرەبی):
   ڕ (ṟ) — U+0695 — RA بە خاڵەوە
   ژ (ž) — U+0698 — ZHE
   ڤ (v) — U+06A4 — VE
   ۆ (o) — U+06C6 — O
   ێ (ê) — U+06CE — Ê
   ڵ (ḷ) — U+06B5 — LA بە خاڵەوە
   گ (g) — U+06AF — GAF
   پ (p) — U+067E — PE
   چ (ç) — U+0686 — CHE
   
   پشت ڕاست بکەوە فۆنتەکەت ئەم پیتانە ڕاست نیشان دەدات!
*/

/* ── §8.8 Number Display ── */

/* ژمارەی عەرەبی vs ژمارەی لاتین:
   ٠١٢٣٤٥٦٧٨٩ — عەرەبی (Eastern Arabic)
   0123456789   — لاتین (Western)
   
   NexPOS بڕیار: ژمارەی لاتین بەکاربهێنە بۆ هەموو زمانەکان
   هۆکار: کاری بازرگانی + consistency
   Exception: بەکارهێنەر ئەگەر ویستی بگۆڕێت لە settings
*/
.price, .quantity, .order-number, .phone {
  font-variant-numeric: tabular-nums;  /* ژمارەکان هاوئاندازە بن */
  direction: ltr;
  unicode-bidi: embed;
}
```

---

### §9. next-intl API — ئەنسایکلۆپیدیای تەواو

```typescript
// ═══════════════════════════════════════════════════
// next-intl — هەموو API ـەکان بە وردی
// ═══════════════════════════════════════════════════

// ── §9.1 useTranslations (Client Component) ──
import { useTranslations } from 'next-intl'

export function ProductCard({ product }: { product: Product }) {
  const t = useTranslations('product')
  
  return (
    <div>
      {/* Basic key */}
      <button>{t('addToCart')}</button>
      
      {/* با variable */}
      <span>{t('discount', { percent: 20 })}</span>
      {/* → "20% Off" / "٢٠% داشکاندن" */}
      
      {/* Pluralization (ICU format) */}
      <span>{t('reviews', { count: product.review_count })}</span>
      {/* count=0 → "No Reviews" / "هیچ هەڵسەنگاندنێک" */}
      {/* count=1 → "1 Review" / "١ هەڵسەنگاندن" */}
      {/* count=5 → "5 Reviews" / "٥ هەڵسەنگاندن" */}
      
      {/* Nested keys */}
      <span>{t('lowStock', { count: 3 })}</span>
      {/* → "Only 3 left" / "تەنیا ٣ ماوە" */}
      
      {/* Rich text (با HTML) */}
      <p>
        {t.rich('termsAgree', {
          terms: (chunks) => <a href="/terms">{chunks}</a>,
          privacy: (chunks) => <a href="/privacy">{chunks}</a>,
        })}
      </p>
      
      {/* Raw HTML (بەبێ escape) — بەئاگاییەوە! */}
      <div>{t.raw('htmlContent')}</div>
      
      {/* Check if key exists */}
      {t.has('someKey') && <span>{t('someKey')}</span>}
    </div>
  )
}

// ── §9.2 getTranslations (Server Component) ──
import { getTranslations } from 'next-intl/server'

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const t = await getTranslations('product')
  
  // هەمان API وەک useTranslations:
  const title = t('addToCart')
  const reviews = t('reviews', { count: 10 })
  
  return <h1>{title}</h1>
}

// ── §9.3 useFormatter (ژمارە، بەروار، دراو) ──
import { useFormatter } from 'next-intl'

export function PriceDisplay({ price, date }: { price: number; date: Date }) {
  const format = useFormatter()
  
  // ── Currency (دراو) ──
  const formatted = format.number(price, {
    style: 'currency',
    currency: 'USD',
  })
  // en: "$49.99"
  // ckb: "٤٩٫٩٩ $" (ئەگەر ژمارەی عەرەبی) یان "$49.99"
  // ar: "٤٩٫٩٩ US$"
  // tr: "49,99 $"
  
  // ── IQD (دینار) بۆ NexPOS ──
  const iqd = format.number(75000, {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  })
  // en: "IQD 75,000"
  // ckb: "٧٥,٠٠٠ د.ع" 
  // ar: "٧٥٬٠٠٠ د.ع."
  // tr: "75.000 IQD"
  
  // ── Percentage ──
  const pct = format.number(0.2, { style: 'percent' })
  // en: "20%"
  // ckb: "٢٠٪" یان "20%"
  // ar: "٢٠٪"
  // tr: "%20"
  
  // ── Date/Time ──
  const dateStr = format.dateTime(date, {
    dateStyle: 'medium',
  })
  // en: "Jan 15, 2024"
  // ckb: "٢٠٢٤/١/١٥"
  // ar: "١٥ يناير ٢٠٢٤"
  // tr: "15 Oca 2024"
  
  const timeStr = format.dateTime(date, {
    timeStyle: 'short',
  })
  // en: "3:30 PM"
  // ckb: "٣:٣٠ دوای نیوەڕۆ" 
  // ar: "٣:٣٠ م"
  // tr: "15:30"
  
  const fullDate = format.dateTime(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  // en: "Monday, January 15, 2024"
  // ckb: "دووشەممە، ١٥ی کانوونی دووەم، ٢٠٢٤"
  // ar: "الاثنين، ١٥ يناير ٢٠٢٤"
  // tr: "Pazartesi, 15 Ocak 2024"
  
  // ── Relative Time ──
  const relative = format.relativeTime(date)
  // "2 hours ago" / "٢ کاتژمێر لەمەوبەر" / "منذ ساعتين" / "2 saat önce"
  
  const relative2 = format.relativeTime(date, { now: new Date() })
  // "in 3 days" / "لە ٣ ڕۆژدا" / "بعد ٣ أيام" / "3 gün içinde"
  
  // ── List Format ──
  const list = format.list(['Red', 'Blue', 'Green'], { type: 'conjunction' })
  // en: "Red, Blue, and Green"
  // ckb: "سوور، شین، و سەوز"
  // ar: "أحمر، وأزرق، وأخضر"
  // tr: "Kırmızı, Mavi ve Yeşil"
  
  return <span dir="ltr">{formatted}</span>
}

// ── §9.4 useLocale ──
import { useLocale } from 'next-intl'

export function LocaleAwareComponent() {
  const locale = useLocale() // 'en' | 'ckb' | 'ar' | 'tr'
  
  const isRTL = locale === 'ckb' || locale === 'ar'
  const fontFamily = isRTL ? "'NRT', 'Noto Sans Arabic', sans-serif" : "'Inter', sans-serif"
  
  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily }}
    >
      {/* Content */}
    </div>
  )
}

// ── §9.5 useNow ──
import { useNow } from 'next-intl'

export function LiveClock() {
  const now = useNow({ updateInterval: 1000 }) // هەر ١ چرکە نوێ دەبێتەوە
  const format = useFormatter()
  
  return <span>{format.dateTime(now, { timeStyle: 'medium' })}</span>
}

// ── §9.6 useTimeZone ──
import { useTimeZone } from 'next-intl'

export function TimeZoneDisplay() {
  const timeZone = useTimeZone() // 'Asia/Baghdad' بۆ NexPOS
  return <span>{timeZone}</span>
}
```

---

### §10. ICU Message Syntax — Pluralization & Select

```typescript
// ═══════════════════════════════════════════════════
// ICU MessageFormat — بۆ هەموو زمانەکان
// ═══════════════════════════════════════════════════

// ── §10.1 Plural Rules ──

// ═══ ENGLISH — simple (one, other) ═══
reviews: '{count, plural, =0 {No reviews} =1 {1 review} other {# reviews}}'
items: '{count, plural, =0 {No items} =1 {1 item} other {# items}}'

// ═══ KURDISH SORANI — (one, other) وەک ئینگلیزی ═══
reviews: '{count, plural, =0 {هیچ هەڵسەنگاندنێک} =1 {١ هەڵسەنگاندن} other {# هەڵسەنگاندن}}'
items: '{count, plural, =0 {هیچ شتێک} =1 {١ دانە} other {# دانە}}'

// ═══ ARABIC — complex! (zero, one, two, few, many, other) ═══
// عەرەبی ٦ فۆرمی هەیە!
reviews: '{count, plural, =0 {لا مراجعات} =1 {مراجعة واحدة} =2 {مراجعتان} few {# مراجعات} many {# مراجعة} other {# مراجعة}}'
// 0 → "لا مراجعات"
// 1 → "مراجعة واحدة" 
// 2 → "مراجعتان" (مثنى!)
// 3-10 → "٣ مراجعات" (جمع تكسير)
// 11-99 → "١١ مراجعة" (مفرد!)
// 100 → "١٠٠ مراجعة"

// ═══ TURKISH — simple (one, other) ═══
reviews: '{count, plural, =0 {Değerlendirme yok} =1 {1 Değerlendirme} other {# Değerlendirme}}'
items: '{count, plural, =0 {Ürün yok} =1 {1 Ürün} other {# Ürün}}'

// ── §10.2 Select (Gender/Type) ──
orderStatus: '{status, select, pending {Pending} shipped {Shipped} delivered {Delivered} cancelled {Cancelled} other {Unknown}}'

// بە کوردی:
orderStatus: '{status, select, pending {چاوەڕوانە} shipped {نێردرا} delivered {گەیشت} cancelled {هەڵوەشێنرایەوە} other {نادیار}}'

// ── §10.3 Nested (Plural + Select) ──
cartSummary: '{count, plural, =0 {سەبەتەکەت بەتاڵە} =1 {١ بەرهەمت لە سەبەتە} other {# بەرهەمت لە سەبەتە}}'

// ── §10.4 Number/Date in messages ──
lastUpdated: 'دوایین نوێکردنەوە: {date, date, medium}'
totalPrice: 'کۆی گشتی: {price, number, ::currency/USD}'
```

---

### §11. Locale Routing & Detection

```typescript
// ═══════════════════════════════════════════════════
// Locale Routing — NexPOS Pattern
// ═══════════════════════════════════════════════════

// ── §11.1 locale لە Context (بەبێ URL prefix) ──
// NexPOS بەکاربهێنەر locale لە preferences دەهەڵبژێرێت
// لە cookie/localStorage پاشەکەوت دەکرێت
// URL بەبێ /en /ckb /ar prefix — پاکتر

// ── §11.2 Locale Provider ──
// src/contexts/locale.tsx
'use client'
import { createContext, useContext, useState, useEffect } from 'react'

type Locale = 'en' | 'ckb' | 'ar' | 'tr'

const LocaleContext = createContext<{
  locale: Locale
  setLocale: (l: Locale) => void
  dir: 'ltr' | 'rtl'
  isRTL: boolean
}>({
  locale: 'en',
  setLocale: () => {},
  dir: 'ltr',
  isRTL: false,
})

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  
  const dir = locale === 'ckb' || locale === 'ar' ? 'rtl' : 'ltr'
  const isRTL = dir === 'rtl'
  
  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale)
    document.documentElement.lang = newLocale
    document.documentElement.dir = newLocale === 'ckb' || newLocale === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('locale', newLocale)
  }
  
  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved && ['en', 'ckb', 'ar', 'tr'].includes(saved)) {
      setLocale(saved)
    }
  }, [])
  
  return (
    <LocaleContext.Provider value={{ locale, setLocale, dir, isRTL }}>
      {children}
    </LocaleContext.Provider>
  )
}

export const useLocaleContext = () => useContext(LocaleContext)

// ── §11.3 Language Switcher Component ──
export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleContext()
  
  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ckb', label: 'کوردی', flag: '🟢' },
    { code: 'ar', label: 'العربية', flag: '🟡' },
    { code: 'tr', label: 'Türkçe', flag: '🔴' },
  ] as const
  
  return (
    <select 
      value={locale} 
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="bg-transparent border rounded px-2 py-1"
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.label}
        </option>
      ))}
    </select>
  )
}
```

---

### §12. hreflang & SEO بۆ زمانەکان

```typescript
// ═══════════════════════════════════════════════════
// hreflang — بۆ SEO ی چەند-زمانە
// ═══════════════════════════════════════════════════

// ── §12.1 لە layout.tsx ──
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {/* hreflang tags — بۆ Google بزانێت ئەم سایتە چەند زمانی هەیە */}
        <link rel="alternate" hrefLang="en" href="https://nexpos.store" />
        <link rel="alternate" hrefLang="ckb" href="https://nexpos.store?lang=ckb" />
        <link rel="alternate" hrefLang="ar" href="https://nexpos.store?lang=ar" />
        <link rel="alternate" hrefLang="tr" href="https://nexpos.store?lang=tr" />
        <link rel="alternate" hrefLang="x-default" href="https://nexpos.store" />
      </head>
      <body>{children}</body>
    </html>
  )
}

// ── §12.2 Open Graph بۆ هەر زمانێک ──
export function generateMetadata({ params }: Props): Metadata {
  const locale = getCurrentLocale()
  const t = getTranslations('meta')
  
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    openGraph: {
      locale: locale === 'ckb' ? 'ku_IQ' : 
              locale === 'ar' ? 'ar_IQ' : 
              locale === 'tr' ? 'tr_TR' : 'en_US',
      alternateLocale: ['en_US', 'ku_IQ', 'ar_IQ', 'tr_TR'],
    },
  }
}
```

---

### §13. Email Template Localization

```typescript
// ═══════════════════════════════════════════════════
// Email Templates — بەپێی زمانی بەکارهێنەر
// ═══════════════════════════════════════════════════

const emailTemplates = {
  orderConfirmation: {
    en: {
      subject: 'Order Confirmed — #{orderNumber}',
      greeting: 'Hi {name},',
      body: 'Your order has been confirmed and is being processed.',
      cta: 'View Order',
      footer: 'Thank you for shopping with NexPOS!',
    },
    ckb: {
      subject: 'داواکاری پشتڕاست کرایەوە — #{orderNumber}',
      greeting: 'سڵاو {name},',
      body: 'داواکارییەکەت پشتڕاست کرایەوە و لە ئامادەکردندایە.',
      cta: 'بینینی داواکاری',
      footer: 'سوپاس بۆ کڕین لە NexPOS!',
    },
    ar: {
      subject: 'تأكيد الطلب — #{orderNumber}',
      greeting: 'مرحباً {name}،',
      body: 'تم تأكيد طلبك وجارٍ تجهيزه.',
      cta: 'عرض الطلب',
      footer: 'شكراً لتسوقك من NexPOS!',
    },
    tr: {
      subject: 'Sipariş Onayı — #{orderNumber}',
      greeting: 'Merhaba {name},',
      body: 'Siparişiniz onaylandı ve hazırlanıyor.',
      cta: 'Siparişi Görüntüle',
      footer: 'NexPOS\'tan alışveriş yaptığınız için teşekkürler!',
    },
  },
  
  // ── Email Direction ──
  // HTML email: dir و lang دابنێ!
  // <html dir="rtl" lang="ckb"> بۆ کوردی
  // <html dir="rtl" lang="ar"> بۆ عەرەبی
  // <html dir="ltr" lang="en"> بۆ ئینگلیزی
  // <html dir="ltr" lang="tr"> بۆ تورکی
  
  welcomeEmail: {
    en: {
      subject: 'Welcome to NexPOS!',
      greeting: 'Welcome, {name}!',
      body: 'Thank you for creating an account. Start browsing our POS hardware collection.',
      cta: 'Start Shopping',
    },
    ckb: {
      subject: 'بەخێربێیت بۆ NexPOS!',
      greeting: 'بەخێربێیت، {name}!',
      body: 'سوپاس بۆ دروستکردنی هەژمار. دەستپێبکە بە بینینی کۆمەڵەی ئامێرەکانمان.',
      cta: 'دەستپێبکە بە کڕین',
    },
    ar: {
      subject: 'أهلاً بك في NexPOS!',
      greeting: 'أهلاً، {name}!',
      body: 'شكراً لإنشاء حسابك. ابدأ بتصفح مجموعة أجهزة نقاط البيع.',
      cta: 'ابدأ التسوق',
    },
    tr: {
      subject: 'NexPOS\'a Hoş Geldiniz!',
      greeting: 'Hoş geldiniz, {name}!',
      body: 'Hesabınızı oluşturduğunuz için teşekkürler. POS donanım koleksiyonumuzu keşfetmeye başlayın.',
      cta: 'Alışverişe Başla',
    },
  },
  
  passwordReset: {
    en: {
      subject: 'Reset Your Password',
      body: 'Click the link below to reset your password. This link expires in 1 hour.',
      cta: 'Reset Password',
      warning: 'If you didn\'t request this, please ignore this email.',
    },
    ckb: {
      subject: 'ووشەی نهێنی نوێ بکەوە',
      body: 'کلیک لەسەر لینکی خوارەوە بکە بۆ نوێکردنەوەی ووشەی نهێنی. ئەم لینکە لە ١ کاتژمێردا بەسەردەچێت.',
      cta: 'ووشەی نهێنی نوێ بکەوە',
      warning: 'ئەگەر تۆ ئەم داواکارییەت نەکردووە، ئەم ئیمەیڵە پشتگوێ بخە.',
    },
    ar: {
      subject: 'إعادة تعيين كلمة المرور',
      body: 'انقر على الرابط أدناه لإعادة تعيين كلمة المرور. تنتهي صلاحية الرابط خلال ساعة.',
      cta: 'إعادة تعيين كلمة المرور',
      warning: 'إذا لم تطلب ذلك، يرجى تجاهل هذا البريد.',
    },
    tr: {
      subject: 'Şifrenizi Sıfırlayın',
      body: 'Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın. Bu bağlantı 1 saat içinde geçersiz olur.',
      cta: 'Şifreyi Sıfırla',
      warning: 'Bu talebi siz yapmadıysanız, bu e-postayı dikkate almayın.',
    },
  },
}
```

---

### §14. هەڵەکانی باو لە Localization — مەکە!

```
═══════════════════════════════════════════════════
❌ Anti-Patterns — هەڵەکانی باو
═══════════════════════════════════════════════════

❌ #1: Hardcoded strings
  // ❌
  <button>Add to Cart</button>
  // ✅
  <button>{t('product.addToCart')}</button>

❌ #2: String concatenation بۆ وەرگێڕان
  // ❌ — ترتیبی وشەکان لە زمانەکان جیاوازە!
  t('hello') + ' ' + name + ', ' + t('welcome')
  // ✅ — variable لەناو message:
  t('greeting', { name })
  // message: "سڵاو {name}، بەخێربێیت"

❌ #3: margin-left/right لە جیاتی logical
  // ❌
  className="ml-4 mr-2 pl-6 pr-4 text-left"
  // ✅
  className="ms-4 me-2 ps-6 pe-4 text-start"

❌ #4: left/right positioning
  // ❌
  className="absolute right-4 top-4"
  // ✅
  className="absolute end-4 top-4"

❌ #5: letter-spacing بۆ عەرەبی/کوردی
  // ❌ — دەشکێنێت!
  :lang(ckb) { letter-spacing: 0.05em; }
  // ✅
  :lang(ckb) { letter-spacing: 0; }

❌ #6: Google Translate بۆ UI copy
  // ❌ — ڕاست نییە، ناسروشتیە
  Google: "أضف إلى عربة التسوق"
  // ✅ — ئاخێوەری ڕەسەن:
  Human: "أضف إلى السلة"

❌ #7: هەمان pluralization بۆ هەموو زمانەکان
  // ❌ — عەرەبی ٦ فۆرمی هەیە!
  ar: '{count} reviews'
  // ✅
  ar: '{count, plural, =0 {لا مراجعات} =1 {مراجعة واحدة} =2 {مراجعتان} few {# مراجعات} many {# مراجعة} other {# مراجعة}}'

❌ #8: بەبێ dir attribute لەسەر LTR content لە RTL page
  // ❌ — نرخ لەلای چەپ دەردەکەوێت
  <span>$49.99</span>
  // ✅
  <span dir="ltr">$49.99</span>

❌ #9: Icon نافلیپکرێت
  // ❌ — وا دیارە ئاڕاستەی چەپە لە RTL
  <ChevronRight />
  // ✅
  <ChevronRight className="rtl:scale-x-[-1]" />

❌ #10: ژمارەی تەلەفۆن بەبێ LTR
  // ❌
  <span>{phone}</span>
  // ✅
  <span dir="ltr">{phone}</span>

❌ #11: Date format hardcoded
  // ❌
  `${month}/${day}/${year}`
  // ✅
  format.dateTime(date, { dateStyle: 'medium' })

❌ #12: Currency hardcoded
  // ❌
  `$${price}`
  // ✅
  format.number(price, { style: 'currency', currency: 'USD' })

❌ #13: Tooltip/title بەبێ وەرگێڕان
  // ❌
  <button title="Delete">🗑️</button>
  // ✅
  <button title={t('common.delete')}>🗑️</button>

❌ #14: aria-label بەبێ وەرگێڕان
  // ❌
  <img alt="Product image" />
  // ✅
  <img alt={t('product.imageAlt', { name: product.name })} />

❌ #15: Placeholder بەبێ وەرگێڕان
  // ❌
  <input placeholder="Search..." />
  // ✅
  <input placeholder={t('common.search')} />
```

---

### §15. Checklist ی تەواو — بەکاربهێنە بۆ هەر پرۆژەیەک

```
═══════════════════════════════════════════════════
📋 i18n/RTL MASTER CHECKLIST — ٤٠ خاڵ
═══════════════════════════════════════════════════

── فایلەکان ──
□ src/messages/en.ts — تەواو و ڕێکخراو
□ src/messages/ckb.ts — وەرگێڕانی سروشتی (نەک ماشینی)
□ src/messages/ar.ts — فصحى مبسطة (نەک عامية)
□ src/messages/tr.ts — doğal Türkçe
□ هەموو key لە en → هەر ٣ فایلی تری هەمان key

── RTL Layout ──
□ dir="rtl" لەسەر <html> بۆ ckb/ar
□ هەموو margin → logical (ms, me)
□ هەموو padding → logical (ps, pe)
□ هەموو text-align → start/end
□ هەموو position → start/end (نەک left/right)
□ هەموو border → logical (border-s, border-e)
□ هەموو border-radius → logical (rounded-ss, rounded-se, rounded-es, rounded-ee)
□ هەموو float → inline-start/end
□ Flexbox/Grid → ئۆتۆماتیک flip (باشە)

── BiDi ──
□ ژمارەکان dir="ltr"
□ تەلەفۆن dir="ltr"
□ ئیمەیڵ dir="ltr"
□ نرخ dir="ltr" + unicode-bidi: embed
□ SKU/code dir="ltr"
□ URL dir="ltr"

── ئایکۆن ──
□ Arrow icons: rtl:scale-x-[-1]
□ Chevron icons: rtl:scale-x-[-1]
□ Universal icons (search, close, check): نافلیپکرێن

── تایپۆگرافی ──
□ font-family بۆ ckb/ar: NRT، Noto Sans Arabic
□ line-height: 1.8 بۆ ckb/ar
□ letter-spacing: 0 بۆ ckb/ar
□ ligatures: فعال بۆ ckb/ar
□ font-display: swap

── وەرگێڕان ──
□ هیچ hardcoded string لە JSX
□ هیچ string concatenation — variable لە message
□ Pluralization بەپێی قاعیدەی هەر زمانێک
□ Date/Number/Currency: useFormatter
□ alt/title/placeholder/aria-label وەرگێڕدراو

── SEO ──
□ hreflang tags بۆ هەموو ٤ زمان
□ lang attribute لەسەر <html>
□ Open Graph locale
□ Meta title/description وەرگێڕدراو

── Email ──
□ Email templates بۆ هەموو ٤ زمان
□ Email direction (dir="rtl" بۆ ckb/ar)
□ Email subject line وەرگێڕدراو

── تاقیکردنەوە ──
□ هەموو لاپەڕەکان لە هەر ٤ زمان تاقی بکەوە
□ RTL layout لە ckb و ar تاقی بکەوە
□ BiDi content (نرخ، ژمارە) لە RTL تاقی بکەوە
□ Mobile RTL تاقی بکەوە
□ Email rendering لە هەموو زمانەکان تاقی بکەوە
```

---

