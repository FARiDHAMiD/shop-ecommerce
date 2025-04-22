// Global variables
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const elements = {
    productsContainer: document.getElementById('products-container'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    categoryBtns: document.querySelectorAll('.category-btn'),
    cartCounts: document.querySelectorAll('.cart-count'),
    decreaseQty: document.getElementById('decrease-qty'),
    increaseQty: document.getElementById('increase-qty'),
    quantity: document.getElementById('quantity'),
    addToCart: document.getElementById('add-to-cart'),
    productTitle: document.getElementById('product-title'),
    productCategory: document.getElementById('product-category'),
    productRating: document.getElementById('product-rating'),
    productPrice: document.getElementById('product-price'),
    productDescription: document.getElementById('product-description'),
    productImage: document.getElementById('product-image'),
    cartItems: document.getElementById('cart-items'),
    subtotal: document.getElementById('subtotal'),
    shipping: document.getElementById('shipping'),
    total: document.getElementById('total'),
    checkoutForm: document.getElementById('checkout-form'),
    placeOrder: document.getElementById('place-order'),
    contactForm: document.getElementById('contact-form'),
    carouselInner: document.querySelector('.carousel-inner'),
    carouselItems: document.querySelectorAll('.carousel-item'),
    prevBtn: document.querySelector('.carousel-control.prev'),
    nextBtn: document.querySelector('.carousel-control.next'),
    indicatorsContainer: document.querySelector('.carousel-indicators'),
    scrollToTopBtn: document.getElementById('scrollToTop')
};

// Initialize the app based on current page

function init() {
    updateCartCount();

    const path = window.location.pathname.split('/').pop() || 'index.html';

    if (path === 'index.html' || path === '') {
        fetchProducts();
        setupEventListeners();
        setupCarousel(); // Add this line
        setupScrollToTop(); // Add this line
    } else if (path === 'product.html') {
        loadProductDetails();
        setupScrollToTop(); // Add this line
    } else if (path === 'checkout.html') {
        loadCartItems();
        setupCheckoutForm();
        setupScrollToTop(); // Add this line
    } else if (path === 'contact.html') {
        setupContactForm();
        setupScrollToTop(); // Add this line
    }
}

// Add these new functions
function setupCarousel() {
    if (!elements.carouselInner) return;

    let currentIndex = 0;
    const itemCount = elements.carouselItems.length;

    // Create indicators
    elements.carouselItems.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.classList.add('carousel-indicator');
        if (index === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => {
            goToSlide(index);
        });
        elements.indicatorsContainer.appendChild(indicator);
    });

    const indicators = document.querySelectorAll('.carousel-indicator');

    function updateCarousel() {
        elements.carouselInner.style.transform = `translateX(-${currentIndex * 100}%)`;

        // Update active indicator
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % itemCount;
        updateCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + itemCount) % itemCount;
        updateCarousel();
    }

    // Set up event listeners
    elements.nextBtn.addEventListener('click', nextSlide);
    elements.prevBtn.addEventListener('click', prevSlide);

    // Auto-advance slides every 5 seconds
    let slideInterval = setInterval(nextSlide, 5000);

    // Pause on hover
    const carousel = document.querySelector('.carousel');
    carousel.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });

    carousel.addEventListener('mouseleave', () => {
        slideInterval = setInterval(nextSlide, 5000);
    });
}

function setupScrollToTop() {
    if (!elements.scrollToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            elements.scrollToTopBtn.classList.add('visible');
        } else {
            elements.scrollToTopBtn.classList.remove('visible');
        }
    });

    elements.scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Fetch products from API
async function fetchProducts() {
    try {
        elements.productsContainer.innerHTML = '<div class="loading">Loading products...</div>';
        const response = await fetch('https://fakestoreapi.com/products');
        products = await response.json();
        displayProducts(products);
    } catch (error) {
        elements.productsContainer.innerHTML = '<div class="loading">Error loading products. Please try again later.</div>';
        console.error('Error fetching products:', error);
    }
}

// Display products in the grid
function displayProducts(productsToDisplay) {
    if (!productsToDisplay || productsToDisplay.length === 0) {
        elements.productsContainer.innerHTML = '<div class="loading">No products found.</div>';
        return;
    }

    elements.productsContainer.innerHTML = productsToDisplay.map(product => `
        <div class="product-card" data-id="${product.id}">
            <img src="${product.image}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <div class="product-meta">
                    <span class="product-category">${product.category}</span>
                    <span class="product-rating">${'★'.repeat(Math.round(product.rating.rate))} (${product.rating.count})</span>
                </div>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <button class="view-details">View Details</button>
            </div>
        </div>
    `).join('');

    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.closest('.product-card').dataset.id;
            window.location.href = `product.html?id=${productId}`;
        });
    });
}

// Load product details for product page
function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    fetch(`https://fakestoreapi.com/products/${productId}`)
        .then(res => res.json())
        .then(product => {
            elements.productTitle.textContent = product.title;
            elements.productCategory.textContent = product.category;
            elements.productRating.textContent = `${'★'.repeat(Math.round(product.rating.rate))} (${product.rating.count} reviews)`;
            elements.productPrice.textContent = `$${product.price.toFixed(2)}`;
            elements.productDescription.textContent = product.description;
            elements.productImage.src = product.image;
            elements.productImage.alt = product.title;

            // Set up add to cart functionality
            setupAddToCart(product);
        })
        .catch(() => {
            window.location.href = 'index.html';
        });
}

// Set up add to cart functionality
function setupAddToCart(product) {
    let quantity = 1;

    elements.decreaseQty.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            elements.quantity.textContent = quantity;
        }
    });

    elements.increaseQty.addEventListener('click', () => {
        quantity++;
        elements.quantity.textContent = quantity;
    });

    elements.addToCart.addEventListener('click', () => {
        addToCart(product, quantity);
    });
}

// Add product to cart
function addToCart(product, quantity = 1) {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            ...product,
            quantity
        });
    }

    updateCart();
    alert(`${quantity} ${product.title} added to cart!`);
}

// Remove product from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

// Update cart quantity
function updateCartItemQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCart();
        }
    }
}

// Update cart in localStorage and UI
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // If on checkout page, reload cart items
    if (window.location.pathname.includes('checkout.html')) {
        loadCartItems();
    }
}

// Update cart count in header
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    elements.cartCounts.forEach(el => {
        el.textContent = count;
    });
}

// Load cart items for checkout page
function loadCartItems() {
    if (cart.length === 0) {
        elements.cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        updateOrderTotals();
        return;
    }

    elements.cartItems.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-details">
                <h3 class="cart-item-title">${item.title}</h3>
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                <div class="cart-item-quantity">
                    <button class="decrease">-</button>
                    <span>${item.quantity}</span>
                    <button class="increase">+</button>
                </div>
                <span class="cart-item-remove">Remove</span>
            </div>
        </div>
    `).join('');

    // Add event listeners to quantity buttons
    document.querySelectorAll('.cart-item .decrease').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.closest('.cart-item').dataset.id);
            const item = cart.find(item => item.id === productId);
            if (item) {
                updateCartItemQuantity(productId, item.quantity - 1);
            }
        });
    });

    document.querySelectorAll('.cart-item .increase').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.closest('.cart-item').dataset.id);
            const item = cart.find(item => item.id === productId);
            if (item) {
                updateCartItemQuantity(productId, item.quantity + 1);
            }
        });
    });

    // Add event listeners to remove buttons
    document.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.closest('.cart-item').dataset.id);
            removeFromCart(productId);
        });
    });

    updateOrderTotals();
}

// Update order totals in checkout
function updateOrderTotals() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 5 : 0;
    const total = subtotal + shipping;

    elements.subtotal.textContent = `$${subtotal.toFixed(2)}`;
    elements.shipping.textContent = `$${shipping.toFixed(2)}`;
    elements.total.textContent = `$${total.toFixed(2)}`;
}

// Set up checkout form
function setupCheckoutForm() {
    elements.checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // In a real app, you would process payment here
        alert('Order placed successfully! Thank you for your purchase.');
        cart = [];
        updateCart();
        elements.checkoutForm.reset();
    });
}

// Set up contact form
function setupContactForm() {
    if (elements.contactForm) {
        elements.contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            elements.contactForm.reset();
        });
    }
}

// Set up event listeners for home page
function setupEventListeners() {
    // Search functionality
    elements.searchBtn.addEventListener('click', () => {
        const searchTerm = elements.searchInput.value.trim().toLowerCase();
        if (searchTerm) {
            const filteredProducts = products.filter(product =>
                product.title.toLowerCase().includes(searchTerm)
            );
            displayProducts(filteredProducts);
        } else {
            displayProducts(products);
        }
    });

    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.searchBtn.click();
        }
    });

    // Category filter functionality
    elements.categoryBtns.forEach(button => {
        button.addEventListener('click', () => {
            elements.categoryBtns.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const category = button.dataset.category;
            if (category === 'all') {
                displayProducts(products);
            } else {
                const filteredProducts = products.filter(product =>
                    product.category.toLowerCase() === category
                );
                displayProducts(filteredProducts);
            }
        });
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);