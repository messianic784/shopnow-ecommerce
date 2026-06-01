# ShopNow - Full-Stack eCommerce Platform

A complete, production-ready eCommerce application built with HTML/CSS/JavaScript (frontend) and Node.js/Express/MongoDB (backend).

---

## Features

### Customer Side
- Home page with hero, featured products, categories
- Product listing with search, filters (category, price, rating), and sorting
- Product detail page with image gallery, reviews, and related products
- Shopping cart (localStorage-based) with quantity controls
- Wishlist (synced with backend)
- User registration and login with JWT authentication
- User profile management (name, email, phone, address)
- Password change
- Order history with detailed view modal
- Checkout with address, payment selection, and order placement
- Responsive design (mobile-first)
- Dark mode toggle (persisted in localStorage)

### Admin Dashboard
- Admin login (role-based access control)
- Dashboard with live stats (users, products, orders, revenue)
- Monthly sales bar chart
- Order status donut chart
- Recent orders and top products tables
- Full product CRUD with image upload
- User management (activate/deactivate, role toggle, delete)
- Order management (update status inline)
- Sidebar navigation with mobile support

---

## Tech Stack

| Layer     | Technology                     |
|-----------|-------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript |
| Backend   | Node.js, Express.js            |
| Database  | MongoDB with Mongoose ODM       |
| Auth      | JWT (JSON Web Tokens)           |
| Security  | bcryptjs (password hashing)     |
| Upload    | Multer (image upload)           |
| Validation| express-validator               |

---

## Project Structure

```
ecommer/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Register, login, getMe
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── userController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT protect middleware
│   │   ├── admin.js           # Admin role guard
│   │   ├── errorHandler.js    # Global error handler
│   │   └── upload.js          # Multer image upload
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── users.js
│   │   └── admin.js
│   ├── uploads/               # Uploaded product images
│   ├── utils/
│   │   └── seeder.js          # Database seeder
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Express app entry point
│
└── frontend/
    ├── admin/
    │   ├── dashboard.html
    │   ├── products.html
    │   ├── users.html
    │   └── orders.html
    ├── css/
    │   ├── style.css          # Main stylesheet (dark mode)
    │   └── admin.css          # Admin dashboard styles
    ├── js/
    │   ├── api.js             # All API calls
    │   ├── main.js            # Shared: navbar, footer, toasts, cart helpers
    │   ├── auth.js            # Login & register logic
    │   ├── cart.js            # Cart page
    │   ├── wishlist.js        # Wishlist page
    │   ├── products.js        # Product listing + filters
    │   ├── product-detail.js  # Single product + reviews
    │   ├── checkout.js        # Checkout flow
    │   ├── profile.js         # User profile
    │   ├── orders.js          # Order history
    │   └── admin.js           # Admin dashboard
    ├── index.html
    ├── products.html
    ├── product-detail.html
    ├── cart.html
    ├── wishlist.html
    ├── checkout.html
    ├── login.html
    ├── register.html
    ├── profile.html
    └── orders.html
```

---

## Prerequisites

- **Node.js** v18+ → https://nodejs.org
- **MongoDB** v6+ (local or Atlas) → https://www.mongodb.com
- **VS Code** with **Live Server extension** (for frontend)

---

## Step-by-Step Setup

### Step 1 — Clone / Open the project

Open the `ecommer` folder in VS Code.

### Step 2 — Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3 — Configure Environment Variables

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommer
JWT_SECRET=ecommer_super_secret_jwt_key_2024_change_in_production
JWT_EXPIRE=30d
CLIENT_URL=http://127.0.0.1:5500
NODE_ENV=development
```

> **MongoDB Atlas** users: replace `MONGODB_URI` with your Atlas connection string.

### Step 4 — Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas** — just paste your connection string in `.env`.

### Step 5 — Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- **Admin**: `admin@ecommer.com` / `admin123`
- **User**: `jane@example.com` / `user123`
- 20 sample products
- 3 sample orders

### Step 6 — Start the Backend Server

```bash
cd backend
npm run dev
```

Server starts at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

### Step 7 — Open the Frontend

In VS Code:
1. Right-click `frontend/index.html`
2. Select **"Open with Live Server"**

The site opens at `http://127.0.0.1:5500/frontend/index.html`

> **Without Live Server**: Open `frontend/index.html` directly in your browser. CORS is configured to allow `null` origin for file:// access too.

---

## API Reference

### Auth Endpoints
| Method | Endpoint              | Access  | Description        |
|--------|-----------------------|---------|--------------------|
| POST   | `/api/auth/register`  | Public  | Register new user  |
| POST   | `/api/auth/login`     | Public  | Login user         |
| GET    | `/api/auth/me`        | Private | Get current user   |

### Product Endpoints
| Method | Endpoint                    | Access  | Description            |
|--------|-----------------------------|---------|------------------------|
| GET    | `/api/products`             | Public  | Get all products        |
| GET    | `/api/products/featured`    | Public  | Get featured products   |
| GET    | `/api/products/categories`  | Public  | Get category list       |
| GET    | `/api/products/:id`         | Public  | Get single product      |
| POST   | `/api/products/:id/reviews` | Private | Submit a review         |

### Order Endpoints
| Method | Endpoint               | Access  | Description       |
|--------|------------------------|---------|-------------------|
| POST   | `/api/orders`          | Private | Create order      |
| GET    | `/api/orders/myorders` | Private | Get my orders     |
| GET    | `/api/orders/:id`      | Private | Get single order  |
| PUT    | `/api/orders/:id/pay`  | Private | Mark as paid      |

### User Endpoints
| Method | Endpoint                       | Access  | Description         |
|--------|--------------------------------|---------|---------------------|
| GET    | `/api/users/profile`           | Private | Get profile         |
| PUT    | `/api/users/profile`           | Private | Update profile      |
| PUT    | `/api/users/password`          | Private | Change password     |
| GET    | `/api/users/wishlist`          | Private | Get wishlist        |
| POST   | `/api/users/wishlist/:id`      | Private | Toggle wishlist     |

### Admin Endpoints (Admin only)
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/admin/stats`      | Dashboard statistics     |
| GET    | `/api/admin/products`   | All products (paginated) |
| POST   | `/api/admin/products`   | Create product           |
| PUT    | `/api/admin/products/:id` | Update product         |
| DELETE | `/api/admin/products/:id` | Delete product         |
| GET    | `/api/admin/users`      | All users                |
| PUT    | `/api/admin/users/:id`  | Update user              |
| DELETE | `/api/admin/users/:id`  | Delete user              |
| GET    | `/api/admin/orders`     | All orders               |
| PUT    | `/api/admin/orders/:id` | Update order status      |

---

## Demo Credentials

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | admin@ecommer.com      | admin123  |
| User  | jane@example.com       | user123   |
| User  | john@example.com       | user123   |

---

## Quick Commands

```bash
# Start backend (development with auto-reload)
cd backend && npm run dev

# Start backend (production)
cd backend && npm start

# Seed database with sample data
cd backend && npm run seed

# Destroy all seeded data
cd backend && npm run seed:destroy
```

---

## Environment Variables

| Variable       | Description                    | Default                          |
|----------------|--------------------------------|----------------------------------|
| `PORT`         | Backend server port             | `5000`                           |
| `MONGODB_URI`  | MongoDB connection string       | `mongodb://localhost:27017/ecommer` |
| `JWT_SECRET`   | JWT signing secret (change!)    | —                                |
| `JWT_EXPIRE`   | Token expiry duration           | `30d`                            |
| `CLIENT_URL`   | Allowed frontend origin (CORS)  | `http://127.0.0.1:5500`          |
| `NODE_ENV`     | Environment mode                | `development`                    |

---

## Troubleshooting

**Backend won't start**
- Make sure MongoDB is running
- Check that port 5000 is not in use
- Verify your `.env` file exists in the `backend/` folder

**CORS errors**
- Make sure the backend is running on port 5000
- Use VS Code Live Server (port 5500) — already configured in `.env`

**Images not loading**
- Products seeded with Unsplash URLs — requires internet connection
- Uploaded images are served from `/uploads/` by the backend

**Login fails after seeding**
- The seeder creates fresh users. Run `npm run seed` only once or `npm run seed:destroy` first.
