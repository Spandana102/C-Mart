// ============================================================
// C-MART COMPLETE JAVASCRIPT PROJECT
// UI + CSS + PRODUCTS + SEARCH + CATEGORY + SELLER DASHBOARD
// ============================================================


// ============================================================
// 1. CSS
// ============================================================

const css = `

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, Helvetica, sans-serif;
}

body {
    background: #f5f6fb;
    color: #222;
}

/* ================= HEADER ================= */

header {
    background: white;
    box-shadow: 0 2px 12px rgba(0,0,0,.08);
    position: sticky;
    top: 0;
    z-index: 1000;
}

.top-header {
    min-height: 75px;
    display: flex;
    align-items: center;
    padding: 12px 5%;
    gap: 25px;
}

/* CATEGORY */

.category-container {
    position: relative;
}

.category-btn {
    border: none;
    background: #6c3cff;
    color: white;
    padding: 12px 18px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 15px;
    font-weight: bold;
}

.category-btn:hover {
    background: #5425d8;
}

.category-menu {
    position: absolute;
    top: 52px;
    left: 0;
    width: 210px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0,0,0,.15);
    overflow: hidden;
    display: none;
    z-index: 3000;
}

.category-menu.show {
    display: block;
}

.category-menu div {
    padding: 14px 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
}

.category-menu div:hover {
    background: #f0ebff;
    color: #6c3cff;
}

/* LOGO */

.logo {
    font-size: 28px;
    font-weight: bold;
    color: #6c3cff;
    white-space: nowrap;
}

.logo span {
    color: #222;
}

/* SEARCH */

.search-box {
    flex: 1;
    max-width: 550px;
    position: relative;
}

.search-box input {
    width: 100%;
    padding: 13px 45px 13px 18px;
    border: 1px solid #ddd;
    border-radius: 25px;
    outline: none;
    font-size: 15px;
    background: #f7f7fa;
}

.search-box input:focus {
    border-color: #6c3cff;
    background: white;
}

.search-box i {
    position: absolute;
    right: 18px;
    top: 14px;
    color: #777;
}

/* HEADER ICONS */

.header-icons {
    display: flex;
    gap: 18px;
}

.header-icons i {
    font-size: 20px;
    color: #555;
    cursor: pointer;
}

.header-icons i:hover {
    color: #6c3cff;
}

/* ================= NAVIGATION ================= */

.navigation {
    border-top: 1px solid #eee;
    padding: 0 5%;
}

.navigation ul {
    display: flex;
    list-style: none;
    gap: 30px;
    height: 48px;
    align-items: center;
}

.navigation a {
    text-decoration: none;
    color: #444;
    font-size: 14px;
    cursor: pointer;
}

.navigation a:hover {
    color: #6c3cff;
}

/* ================= HERO ================= */

.hero {
    margin: 25px 5%;
    min-height: 310px;
    border-radius: 22px;
    background: linear-gradient(135deg,#6c3cff,#9b6cff);
    color: white;
    display: flex;
    align-items: center;
    padding: 45px;
}

.hero-content {
    max-width: 650px;
}

.hero h1 {
    font-size: 42px;
    line-height: 1.15;
    margin-bottom: 18px;
}

.hero p {
    font-size: 17px;
    line-height: 1.6;
    margin-bottom: 25px;
}

.hero-btn {
    border: none;
    background: white;
    color: #6c3cff;
    padding: 13px 25px;
    border-radius: 25px;
    font-weight: bold;
    cursor: pointer;
}

/* ================= PRODUCTS ================= */

.products-section {
    padding: 20px 5% 50px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.section-header h2 {
    font-size: 28px;
}

.selected-category {
    color: #6c3cff;
    font-weight: bold;
}

.products-grid {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 25px;
}

.product-card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,.08);
    transition: .3s;
}

.product-card:hover {
    transform: translateY(-5px);
}

.product-image {
    height: 210px;
    position: relative;
    overflow: hidden;
    background: #eee;
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.wishlist {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: none;
    background: white;
    cursor: pointer;
    font-size: 18px;
    color: #777;
}

.wishlist.active {
    color: red;
}

.product-info {
    padding: 20px;
}

.category {
    display: inline-block;
    background: #eee9ff;
    color: #6c3cff;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 10px;
}

.product-info h3 {
    margin-bottom: 15px;
    font-size: 19px;
}

.view-btn {
    width: 100%;
    padding: 11px;
    border: none;
    border-radius: 8px;
    background: #6c3cff;
    color: white;
    cursor: pointer;
    font-weight: bold;
}

.view-btn:hover {
    background: #5425d8;
}

.no-products {
    display: none;
    text-align: center;
    padding: 60px 20px;
    background: white;
    border-radius: 15px;
    color: #777;
}

/* ================= FEATURES ================= */

.features {
    background: white;
    padding: 50px 5%;
}

.features h2 {
    text-align: center;
    margin-bottom: 35px;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(4,1fr);
    gap: 25px;
}

.feature {
    text-align: center;
    padding: 25px;
    border-radius: 15px;
    background: #f8f7ff;
}

.feature i {
    font-size: 32px;
    color: #6c3cff;
    margin-bottom: 15px;
}

.feature h3 {
    margin-bottom: 8px;
}

.feature p {
    color: #777;
    font-size: 14px;
    line-height: 1.5;
}

/* ================= FOOTER ================= */

footer {
    background: #171322;
    color: white;
    padding: 45px 5% 20px;
}

.footer-content {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 35px;
}

.footer-logo {
    font-size: 28px;
    color: #9b7aff;
    font-weight: bold;
    margin-bottom: 15px;
}

.footer-section h3 {
    margin-bottom: 15px;
}

.footer-section p,
.footer-section a {
    color: #bbb;
    font-size: 14px;
    line-height: 1.8;
    text-decoration: none;
    display: block;
    cursor: pointer;
}

/* ================= MODALS ================= */

.modal,
.seller-modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.65);
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 5000;
}

.modal.show,
.seller-modal.show {
    display: flex;
}

.modal-content {
    background: white;
    width: 850px;
    max-width: 100%;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
}

.close-modal,
.seller-close {
    position: absolute;
    right: 18px;
    top: 18px;
    width: 38px;
    height: 38px;
    border: none;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    z-index: 2;
}

.modal-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
}

.modal-image {
    height: 450px;
}

.modal-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.modal-details {
    padding: 45px 35px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.modal-details h2 {
    font-size: 30px;
    margin-bottom: 20px;
}

.modal-price {
    font-size: 26px;
    font-weight: bold;
    color: #6c3cff;
    margin-bottom: 18px;
}

.description {
    line-height: 1.6;
    color: #666;
}

.modal-buttons {
    display: flex;
    gap: 12px;
    margin-top: 30px;
}

.modal-buttons button {
    flex: 1;
    padding: 13px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
}

.buy-btn {
    background: #6c3cff;
    color: white;
}

.sell-btn {
    background: #eee9ff;
    color: #6c3cff;
}

/* ================= SELLER ================= */

.seller-panel {
    width: 1050px;
    max-width: 100%;
    max-height: 92vh;
    overflow-y: auto;
    background: white;
    border-radius: 20px;
    padding: 30px;
    position: relative;
}

.seller-title {
    margin-bottom: 25px;
}

.seller-title h2 {
    color: #6c3cff;
    margin-bottom: 6px;
}

.seller-title p {
    color: #777;
}

.seller-layout {
    display: grid;
    grid-template-columns: 1fr 1.3fr;
    gap: 30px;
}

.product-form,
.seller-products {
    background: #f8f7ff;
    padding: 25px;
    border-radius: 15px;
}

.product-form h3,
.seller-products h3 {
    margin-bottom: 20px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 7px;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 11px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    outline: none;
    background: white;
}

.form-group textarea {
    height: 90px;
    resize: vertical;
}

.add-btn {
    width: 100%;
    padding: 13px;
    border: none;
    border-radius: 8px;
    background: #6c3cff;
    color: white;
    cursor: pointer;
    font-weight: bold;
}

.seller-product {
    background: white;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
    display: flex;
    gap: 15px;
    align-items: center;
    border: 1px solid #eee;
}

.seller-product img {
    width: 75px;
    height: 75px;
    object-fit: cover;
    border-radius: 8px;
}

.seller-product-info {
    flex: 1;
}

.seller-product-info h4 {
    margin-bottom: 6px;
}

.seller-product-info p {
    font-size: 13px;
    color: #777;
    margin-bottom: 4px;
}

.seller-price {
    color: #6c3cff !important;
    font-weight: bold;
}

.seller-actions {
    display: flex;
    gap: 8px;
}

.edit-btn,
.delete-btn {
    border: none;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    cursor: pointer;
}

.edit-btn {
    background: #eee9ff;
    color: #6c3cff;
}

.delete-btn {
    background: #ffecec;
    color: #e22;
}

/* ================= RESPONSIVE ================= */

@media(max-width:900px) {

    .products-grid {
        grid-template-columns: repeat(2,1fr);
    }

    .feature-grid {
        grid-template-columns: repeat(2,1fr);
    }

    .seller-layout {
        grid-template-columns: 1fr;
    }
}

@media(max-width:650px) {

    .top-header {
        flex-wrap: wrap;
    }

    .search-box {
        flex-basis: 100%;
    }

    .products-grid {
        grid-template-columns: 1fr;
    }

    .feature-grid {
        grid-template-columns: 1fr;
    }

    .footer-content {
        grid-template-columns: 1fr;
    }

    .modal-body {
        grid-template-columns: 1fr;
    }

    .modal-image {
        height: 250px;
    }

    .seller-layout {
        grid-template-columns: 1fr;
    }
}

`;

const style = document.createElement("style");
style.textContent = css;
document.head.appendChild(style);


// ============================================================
// 2. PRODUCT DATA
// ============================================================

const defaultProducts = [

    {
        id: 1,
        name: "Dell Inspiron Laptop",
        category: "Electronics",
        price: 45000,
        image:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        description:
        "Dell Inspiron laptop suitable for students, programming, projects and daily academic work."
    },

    {
        id: 2,
        name: "Wireless Headphones",
        category: "Electronics",
        price: 2500,
        image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        description:
        "Wireless headphones suitable for online classes, music and entertainment."
    },

    {
        id: 3,
        name: "Engineering Books",
        category: "Books",
        price: 1200,
        image:
        "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80",
        description:
        "Engineering textbooks and reference books useful for students."
    },

    {
        id: 4,
        name: "Student Stationery Kit",
        category: "Stationery",
        price: 500,
        image:
        "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=800&q=80",
        description:
        "Complete stationery kit containing pens, pencils and notebooks."
    },

    {
        id: 5,
        name: "College Backpack",
        category: "Bags",
        price: 1500,
        image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
        description:
        "Durable college backpack with multiple compartments."
    },

    {
        id: 6,
        name: "Football",
        category: "Sports",
        price: 900,
        image:
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
        description:
        "Football suitable for college sports activities."
    },

    {
        id: 7,
        name: "Gaming Controller",
        category: "Gaming",
        price: 2200,
        image:
        "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=800&q=80",
        description:
        "Gaming controller suitable for PC gaming."
    },

    {
        id: 8,
        name: "Bluetooth Speaker",
        category: "Electronics",
        price: 1800,
        image:
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
        description:
        "Portable Bluetooth speaker suitable for music and entertainment."
    },

    {
        id: 9,
        name: "Programming Book",
        category: "Books",
        price: 700,
        image:
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80",
        description:
        "Programming reference book for students."
    },

    {
        id: 10,
        name: "Notebook Set",
        category: "Stationery",
        price: 300,
        image:
        "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80",
        description:
        "Notebook set suitable for classroom notes and assignments."
    }

];


// ============================================================
// 3. LOAD PRODUCTS
// ============================================================

let products =
    JSON.parse(localStorage.getItem("cmartProducts"))
    || defaultProducts;


// ============================================================
// 4. CREATE HTML USING JAVASCRIPT
// ============================================================

document.body.innerHTML = `

<header>

    <div class="top-header">

        <div class="category-container">

            <button
                class="category-btn"
                id="categoryBtn">

                <i class="fa-solid fa-list"></i>
                Categories

            </button>

            <div
                class="category-menu"
                id="categoryMenu">

                <div data-category="Electronics">
                    <i class="fa-solid fa-laptop"></i>
                    Electronics
                </div>

                <div data-category="Books">
                    <i class="fa-solid fa-book"></i>
                    Books
                </div>

                <div data-category="Stationery">
                    <i class="fa-solid fa-pen"></i>
                    Stationery
                </div>

                <div data-category="Bags">
                    <i class="fa-solid fa-bag-shopping"></i>
                    Bags
                </div>

                <div data-category="Sports">
                    <i class="fa-solid fa-futbol"></i>
                    Sports
                </div>

                <div data-category="Gaming">
                    <i class="fa-solid fa-gamepad"></i>
                    Gaming
                </div>

            </div>

        </div>


        <div class="logo">
            C<span>-Mart</span>
        </div>


        <div class="search-box">

            <input
                id="searchInput"
                type="text"
                placeholder="Search products...">

            <i class="fa-solid fa-magnifying-glass"></i>

        </div>


        <div class="header-icons">

            <i class="fa-regular fa-heart"></i>

            <i class="fa-regular fa-bell"></i>

            <i class="fa-regular fa-user"></i>

        </div>

    </div>


    <nav class="navigation">

        <ul>

            <li>
                <a id="homeBtn">Home</a>
            </li>

            <li>
                <a>Buy</a>
            </li>

            <li>
                <a id="sellBtn">Sell</a>
            </li>

            <li>
                <a>Swap</a>
            </li>

            <li>
                <a>Rent</a>
            </li>

            <li>
                <a>Bargain</a>
            </li>

            <li>
                <a>Meet Point</a>
            </li>

            <li>
                <a id="sellProductBtn">
                    Sell Product
                </a>
            </li>

        </ul>

    </nav>

</header>


<section class="hero">

    <div class="hero-content">

        <h1>
            Buy, Sell, Swap & Rent
            Within Your Campus
        </h1>

        <p>
            C-Mart is your campus marketplace
            where students can easily buy,
            sell, swap and rent products.
        </p>

        <button
            class="hero-btn"
            id="exploreBtn">

            Explore Products
            <i class="fa-solid fa-arrow-right"></i>

        </button>

    </div>

</section>


<section
    class="products-section"
    id="productsSection">

    <div class="section-header">

        <h2>
            Featured Products
        </h2>

        <div
            class="selected-category"
            id="selectedCategory">

            All Products

        </div>

    </div>


    <div
        class="products-grid"
        id="productsGrid">

    </div>


    <div
        class="no-products"
        id="noProducts">

        <i class="fa-solid fa-box-open"></i>

        <h3>
            No products found
        </h3>

        <p>
            Try another category or search term.
        </p>

    </div>

</section>


<section class="features">

    <h2>
        Why Choose C-Mart?
    </h2>

    <div class="feature-grid">

        <div class="feature">

            <i class="fa-solid fa-shield-halved"></i>

            <h3>
                Secure Deals
            </h3>

            <p>
                Connect with campus users
                for safer transactions.
            </p>

        </div>


        <div class="feature">

            <i class="fa-solid fa-comments"></i>

            <h3>
                Instant Chat
            </h3>

            <p>
                Communicate directly with buyers
                and sellers.
            </p>

        </div>


        <div class="feature">

            <i class="fa-solid fa-location-dot"></i>

            <h3>
                Meet Point
            </h3>

            <p>
                Choose convenient campus
                meeting points.
            </p>

        </div>


        <div class="feature">

            <i class="fa-solid fa-tags"></i>

            <h3>
                Best Deals
            </h3>

            <p>
                Find useful products from
                students on campus.
            </p>

        </div>

    </div>

</section>


<footer>

    <div class="footer-content">

        <div class="footer-section">

            <div class="footer-logo">
                C-Mart
            </div>

            <p>
                Your campus marketplace for
                buying, selling, swapping and
                renting products.
            </p>

        </div>


        <div class="footer-section">

            <h3>
                Marketplace
            </h3>

            <a>Buy</a>

            <a id="footerSell">
                Sell
            </a>

            <a>Swap</a>

            <a>Rent</a>

        </div>


        <div class="footer-section">

            <h3>
                Categories
            </h3>

            <a data-footer-category="Electronics">
                Electronics
            </a>

            <a data-footer-category="Books">
                Books
            </a>

            <a data-footer-category="Stationery">
                Stationery
            </a>

            <a data-footer-category="Bags">
                Bags
            </a>

        </div>


        <div class="footer-section">

            <h3>
                Support
            </h3>

            <a>Help Center</a>
            <a>Contact Us</a>
            <a>Privacy Policy</a>
            <a>Terms & Conditions</a>

        </div>

    </div>

</footer>


<!-- PRODUCT DETAILS -->

<div
    class="modal"
    id="productModal">

    <div class="modal-content">

        <button
            class="close-modal"
            id="closeProductModal">

            <i class="fa-solid fa-xmark"></i>

        </button>


        <div class="modal-body">

            <div class="modal-image">

                <img
                    id="modalImage"
                    src=""
                    alt="Product">

            </div>


            <div class="modal-details">

                <div
                    class="category"
                    id="modalCategory">
                </div>


                <h2 id="modalName">
                </h2>


                <div
                    class="modal-price"
                    id="modalPrice">
                </div>


                <div class="description">

                    <strong>
                        Product Description
                    </strong>

                    <p id="modalDescription">
                    </p>

                </div>


                <div class="modal-buttons">

                    <button
                        class="buy-btn"
                        id="buyBtn">

                        <i class="fa-solid fa-cart-shopping"></i>
                        Buy Now

                    </button>


                    <button
                        class="sell-btn"
                        id="modalSellBtn">

                        <i class="fa-solid fa-tag"></i>
                        Sell Product

                    </button>

                </div>

            </div>

        </div>

    </div>

</div>


<!-- SELLER DASHBOARD -->

<div
    class="seller-modal"
    id="sellerModal">

    <div class="seller-panel">

        <button
            class="seller-close"
            id="closeSeller">

            <i class="fa-solid fa-xmark"></i>

        </button>


        <div class="seller-title">

            <h2>
                <i class="fa-solid fa-store"></i>
                Seller Dashboard
            </h2>

            <p>
                Add, edit and delete your products.
            </p>

        </div>


        <div class="seller-layout">


            <!-- ADD PRODUCT -->

            <div class="product-form">

                <h3>
                    <i class="fa-solid fa-plus"></i>
                    Add Product
                </h3>


                <form id="productForm">

                    <div class="form-group">

                        <label>
                            Product Name
                        </label>

                        <input
                            id="productName"
                            type="text"
                            placeholder="Enter product name"
                            required>

                    </div>


                    <div class="form-group">

                        <label>
                            Category
                        </label>

                        <select
                            id="productCategory"
                            required>

                            <option value="">
                                Select Category
                            </option>

                            <option>
                                Electronics
                            </option>

                            <option>
                                Books
                            </option>

                            <option>
                                Stationery
                            </option>

                            <option>
                                Bags
                            </option>

                            <option>
                                Sports
                            </option>

                            <option>
                                Gaming
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Price
                        </label>

                        <input
                            id="productPrice"
                            type="number"
                            min="0"
                            placeholder="Enter price"
                            required>

                    </div>


                    <div class="form-group">

                        <label>
                            Product Image URL
                        </label>

                        <input
                            id="productImage"
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            required>

                    </div>


                    <div class="form-group">

                        <label>
                            Description
                        </label>

                        <textarea
                            id="productDescription"
                            placeholder="Enter product description"
                            required></textarea>

                    </div>


                    <button
                        class="add-btn"
                        type="submit">

                        <i class="fa-solid fa-plus"></i>
                        Add Product

                    </button>

                </form>

            </div>


            <!-- MY PRODUCTS -->

            <div class="seller-products">

                <h3>
                    <i class="fa-solid fa-box"></i>
                    My Products
                </h3>

                <div id="sellerProductList">
                </div>

            </div>

        </div>

    </div>

</div>
`;


// ============================================================
// 5. SAVE PRODUCTS
// ============================================================

function saveProducts() {

    localStorage.setItem(
        "cmartProducts",
        JSON.stringify(products)
    );

}


// ============================================================
// 6. DISPLAY PRODUCTS
// ============================================================

function displayProducts(list = products) {

    const grid =
        document.getElementById("productsGrid");

    const noProducts =
        document.getElementById("noProducts");

    grid.innerHTML = "";

    if (list.length === 0) {

        noProducts.style.display = "block";
        return;

    }

    noProducts.style.display = "none";


    list.forEach(product => {

        const card =
            document.createElement("div");

        card.className = "product-card";


        card.innerHTML = `

            <div class="product-image">

                <img
                    src="${product.image}"
                    alt="${product.name}">

                <button
                    class="wishlist">

                    <i class="fa-regular fa-heart"></i>

                </button>

            </div>


            <div class="product-info">

                <div class="category">
                    ${product.category}
                </div>

                <h3>
                    ${product.name}
                </h3>

                <button
                    class="view-btn">

                    View Details

                </button>

            </div>

        `;


        card
            .querySelector(".view-btn")
            .addEventListener(
                "click",
                () => viewDetails(product.id)
            );


        card
            .querySelector(".wishlist")
            .addEventListener(
                "click",
                function() {

                    this.classList.toggle("active");

                    const icon =
                        this.querySelector("i");

                    icon.classList.toggle("fa-regular");
                    icon.classList.toggle("fa-solid");

                }
            );


        grid.appendChild(card);

    });

}


// ============================================================
// 7. CATEGORY MENU
// ============================================================

const categoryBtn =
    document.getElementById("categoryBtn");

const categoryMenu =
    document.getElementById("categoryMenu");


categoryBtn.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();

        categoryMenu.classList.toggle("show");

    }
);


document
    .querySelectorAll(
        "#categoryMenu div"
    )
    .forEach(item => {

        item.addEventListener(
            "click",
            function() {

                filterCategory(
                    this.dataset.category
                );

            }
        );

    });


// ============================================================
// 8. CATEGORY FILTER
// ============================================================

function filterCategory(category) {

    const filtered =
        products.filter(
            product =>
                product.category === category
        );


    displayProducts(filtered);


    document
        .getElementById("selectedCategory")
        .textContent = category;


    categoryMenu.classList.remove("show");


    document
        .getElementById("productsSection")
        .scrollIntoView({
            behavior: "smooth"
        });

}


// ============================================================
// 9. SHOW ALL PRODUCTS
// ============================================================

function showAllProducts() {

    displayProducts(products);

    document
        .getElementById("selectedCategory")
        .textContent = "All Products";

}


// ============================================================
// 10. SEARCH
// ============================================================

document
    .getElementById("searchInput")
    .addEventListener(
        "input",
        function() {

            const search =
                this.value
                    .toLowerCase()
                    .trim();


            const filtered =
                products.filter(product =>

                    product.name
                        .toLowerCase()
                        .includes(search)

                    ||

                    product.category
                        .toLowerCase()
                        .includes(search)

                );


            displayProducts(filtered);


            document
                .getElementById("selectedCategory")
                .textContent =
                search
                ? `Search: ${search}`
                : "All Products";

        }
    );


// ============================================================
// 11. PRODUCT DETAILS
// ============================================================

function viewDetails(id) {

    const product =
        products.find(
            product => product.id === id
        );


    if (!product) return;


    document
        .getElementById("modalImage")
        .src = product.image;


    document
        .getElementById("modalName")
        .textContent = product.name;


    document
        .getElementById("modalCategory")
        .textContent = product.category;


    document
        .getElementById("modalPrice")
        .textContent =
        "₹" +
        Number(product.price)
            .toLocaleString("en-IN");


    document
        .getElementById("modalDescription")
        .textContent =
        product.description;


    document
        .getElementById("productModal")
        .classList.add("show");

}


// ============================================================
// 12. CLOSE PRODUCT MODAL
// ============================================================

document
    .getElementById("closeProductModal")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("productModal")
                .classList.remove("show");

        }
    );


// ============================================================
// 13. SELLER DASHBOARD
// ============================================================

const sellerModal =
    document.getElementById("sellerModal");


function openSellerDashboard() {

    sellerModal.classList.add("show");

    renderSellerProducts();

}


function closeSellerDashboard() {

    sellerModal.classList.remove("show");

}


document
    .getElementById("sellBtn")
    .addEventListener(
        "click",
        openSellerDashboard
    );


document
    .getElementById("sellProductBtn")
    .addEventListener(
        "click",
        openSellerDashboard
    );


document
    .getElementById("footerSell")
    .addEventListener(
        "click",
        openSellerDashboard
    );


document
    .getElementById("modalSellBtn")
    .addEventListener(
        "click",
        function() {

            document
                .getElementById("productModal")
                .classList.remove("show");

            openSellerDashboard();

        }
    );


document
    .getElementById("closeSeller")
    .addEventListener(
        "click",
        closeSellerDashboard
    );


// ============================================================
// 14. ADD PRODUCT
// ============================================================

document
    .getElementById("productForm")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const product = {

                id: Date.now(),

                name:
                    document
                    .getElementById("productName")
                    .value
                    .trim(),

                category:
                    document
                    .getElementById("productCategory")
                    .value,

                price:
                    Number(
                        document
                        .getElementById("productPrice")
                        .value
                    ),

                image:
                    document
                    .getElementById("productImage")
                    .value
                    .trim(),

                description:
                    document
                    .getElementById("productDescription")
                    .value
                    .trim()

            };


            products.push(product);

            saveProducts();

            displayProducts(products);

            renderSellerProducts();


            this.reset();


            alert(
                "Product added successfully!"
            );

        }
    );


// ============================================================
// 15. SELLER PRODUCT LIST
// ============================================================

function renderSellerProducts() {

    const container =
        document.getElementById(
            "sellerProductList"
        );


    container.innerHTML = "";


    if (products.length === 0) {

        container.innerHTML = `
            <p>
                No products available.
            </p>
        `;

        return;

    }


    products.forEach(product => {

        const item =
            document.createElement("div");

        item.className =
            "seller-product";


        item.innerHTML = `

            <img
                src="${product.image}"
                alt="${product.name}">


            <div class="seller-product-info">

                <h4>
                    ${product.name}
                </h4>

                <p>
                    ${product.category}
                </p>

                <p class="seller-price">
                    ₹${Number(product.price)
                        .toLocaleString("en-IN")}
                </p>

            </div>


            <div class="seller-actions">

                <button
                    class="edit-btn"
                    title="Edit">

                    <i class="fa-solid fa-pen"></i>

                </button>


                <button
                    class="delete-btn"
                    title="Delete">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </div>

        `;


        item
            .querySelector(".edit-btn")
            .addEventListener(
                "click",
                () => editProduct(product.id)
            );


        item
            .querySelector(".delete-btn")
            .addEventListener(
                "click",
                () => deleteProduct(product.id)
            );


        container.appendChild(item);

    });

}


// ============================================================
// 16. EDIT PRODUCT
// ============================================================

function editProduct(id) {

    const product =
        products.find(
            product => product.id === id
        );


    if (!product) return;


    const name =
        prompt(
            "Product Name:",
            product.name
        );


    if (name === null) return;


    const price =
        prompt(
            "Product Price:",
            product.price
        );


    if (price === null) return;


    const category =
        prompt(
            "Category:",
            product.category
        );


    if (category === null) return;


    const description =
        prompt(
            "Description:",
            product.description
        );


    if (description === null) return;


    const image =
        prompt(
            "Image URL:",
            product.image
        );


    if (image === null) return;


    product.name =
        name.trim();


    product.price =
        Number(price);


    product.category =
        category.trim();


    product.description =
        description.trim();


    product.image =
        image.trim();


    saveProducts();

    displayProducts(products);

    renderSellerProducts();


    alert(
        "Product updated successfully!"
    );

}


// ============================================================
// 17. DELETE PRODUCT
// ============================================================

function deleteProduct(id) {

    const product =
        products.find(
            product => product.id === id
        );


    if (!product) return;


    const confirmDelete =
        confirm(
            `Delete "${product.name}"?`
        );


    if (!confirmDelete) return;


    products =
        products.filter(
            product => product.id !== id
        );


    saveProducts();

    displayProducts(products);

    renderSellerProducts();


    alert(
        "Product deleted successfully!"
    );

}


// ============================================================
// 18. HOME
// ============================================================

document
    .getElementById("homeBtn")
    .addEventListener(
        "click",
        showAllProducts
    );


// ============================================================
// 19. EXPLORE PRODUCTS
// ============================================================

document
    .getElementById("exploreBtn")
    .addEventListener(
        "click",
        function() {

            document
                .getElementById("productsSection")
                .scrollIntoView({
                    behavior: "smooth"
                });

        }
    );


// ============================================================
// 20. FOOTER CATEGORY
// ============================================================

document
    .querySelectorAll(
        "[data-footer-category]"
    )
    .forEach(item => {

        item.addEventListener(
            "click",
            function() {

                filterCategory(
                    this.dataset.footerCategory
                );

            }
        );

    });


// ============================================================
// 21. CLOSE DROPDOWN WHEN CLICKING OUTSIDE
// ============================================================

document.addEventListener(
    "click",
    function(event) {

        const container =
            document.querySelector(
                ".category-container"
            );


        if (
            !container.contains(
                event.target
            )
        ) {

            categoryMenu
                .classList
                .remove("show");

        }

    }
);


// ============================================================
// 22. CLOSE MODALS WHEN CLICKING OUTSIDE
// ============================================================

document
    .getElementById("productModal")
    .addEventListener(
        "click",
        function(event) {

            if (event.target === this) {

                this.classList.remove("show");

            }

        }
    );


sellerModal.addEventListener(
    "click",
    function(event) {

        if (event.target === this) {

            this.classList.remove("show");

        }

    }
);


// ============================================================
// 23. BUY BUTTON
// ============================================================

document
    .getElementById("buyBtn")
    .addEventListener(
        "click",
        function() {

            alert(
                "Buy request created!"
            );

        }
    );


// ============================================================
// 24. INITIAL DISPLAY
// ============================================================

displayProducts(products);
