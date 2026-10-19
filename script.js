const products = [
  { id: "tide-vase", name: "Tide pool vase", maker: "Mara Studio · hand-thrown stoneware", price: 68, category: "Ceramics", badge: "Bestseller", image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=800&q=85", alt: "Sculptural, handmade ceramic vase" },
  { id: "everyday-linen", name: "Everyday linen throw", maker: "Atelier Sunday · washed European flax", price: 112, category: "Textiles", badge: "Small batch", image: "https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?auto=format&fit=crop&w=800&q=85", alt: "Soft, natural linen throw draped over a chair" },
  { id: "little-sun-bowl", name: "Little sun bowl", maker: "Mara Studio · hand-glazed ceramic", price: 42, category: "Ceramics", badge: "", image: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=800&q=85", alt: "Handmade ceramic bowl in warm natural tones" },
  { id: "soft-place-mat", name: "Soft place mat, set of 2", maker: "Loom & Field · handwoven cotton", price: 54, category: "Textiles", badge: "", image: "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=800&q=85", alt: "Natural woven table linens" },
  { id: "good-day-candle", name: "Good day candle", maker: "Sunday Ritual · soy wax, cedar + fig", price: 36, category: "Objects", badge: "Almost gone", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=85", alt: "Hand-poured candle in a simple glass vessel" },
  { id: "clay-mug", name: "Slow morning mug", maker: "Mara Studio · hand-thrown stoneware", price: 48, category: "Ceramics", badge: "", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=85", alt: "Handmade ceramic mug for a slow morning" },
  { id: "market-tote", name: "The market tote", maker: "Loom & Field · sturdy organic cotton", price: 64, category: "Textiles", badge: "", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=85", alt: "Everyday natural fabric tote bag" },
  { id: "little-catchall", name: "Little catchall dish", maker: "June Objects · carved by hand", price: 32, category: "Objects", badge: "One of a kind", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=85", alt: "Small handmade decorative dish" },
];

const productGrid = document.querySelector("#product-grid");
const cart = new Map();
let activeCategory = "All";
let searchTerm = "";

const formatPrice = (price) => `$${price.toFixed(2)}`;

function getVisibleProducts() {
  const sort = document.querySelector("#sort-products").value;
  let visible = products.filter((product) => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesSearch = `${product.name} ${product.maker} ${product.category}`.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });
  if (sort === "low") visible = [...visible].sort((a, b) => a.price - b.price);
  if (sort === "high") visible = [...visible].sort((a, b) => b.price - a.price);
  return visible;
}

function renderProducts() {
  const visible = getVisibleProducts();
  productGrid.innerHTML = visible.length
    ? visible.map((product) => `
      <article class="product-card">
        <div class="product-image-wrap">
          <img class="product-image" src="${product.image}" alt="${product.alt}" loading="lazy">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
          <button class="quick-add" data-add="${product.id}">Add to bag&nbsp; +</button>
        </div>
        <div class="product-info">
          <div><h3 class="product-name">${product.name}</h3><span class="product-maker">${product.maker}</span></div>
          <span class="product-price">${formatPrice(product.price)}</span>
        </div>
      </article>`).join("")
    : `<p class="no-results">No little lovelies found. Try another search.</p>`;
}

function updateCart() {
  const items = [...cart.entries()].map(([id, quantity]) => ({
    product: products.find((product) => product.id === id),
    quantity,
  }));
  const count = items.reduce((total, item) => total + item.quantity, 0);
  document.querySelector(".cart-count").textContent = count;
  document.querySelector(".drawer-count").textContent = `(${count})`;
  document.querySelector("#cart-subtotal").textContent = formatPrice(
    items.reduce((total, item) => total + item.product.price * item.quantity, 0),
  );
  document.querySelector("#cart-items").innerHTML = items.map(({ product, quantity }) => `
    <div class="cart-item">
      <img src="${product.image}" alt="${product.alt}">
      <div>
        <h3>${product.name}</h3><p>${product.maker}</p>
        <div class="quantity-control">
          <button data-quantity="${product.id}" data-change="-1" aria-label="Remove one ${product.name}">−</button>
          <span>${quantity}</span>
          <button data-quantity="${product.id}" data-change="1" aria-label="Add one ${product.name}">+</button>
        </div>
      </div>
      <span class="cart-item-price">${formatPrice(product.price * quantity)}</span>
    </div>`).join("");
  document.querySelector("#empty-cart").classList.toggle("show", count === 0);
  document.querySelector("#cart-footer").classList.toggle("hidden", count === 0);
}

const overlay = document.querySelector("#overlay");
const drawer = document.querySelector("#cart-drawer");
const accountStorageKey = "hearth-hand.accounts.v1";
const sessionStorageKey = "hearth-hand.session.v1";
const passwordHashIterations = 210000;

function getSavedAccounts() {
  const savedAccounts = localStorage.getItem(accountStorageKey);
  if (!savedAccounts) return [];
  const accounts = JSON.parse(savedAccounts);
  if (!Array.isArray(accounts)) {
    throw new Error("Saved account data is invalid. Clear this site's local storage and try again.");
  }
  return accounts;
}

function encodeBytes(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

async function hashPassword(password, salt) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Secure password storage is unavailable in this browser. Open the site on localhost or HTTPS.");
  }
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: passwordHashIterations, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return encodeBytes(hash);
}

function updateAccountView() {
  let account = null;
  let accountError = "";
  try {
    const signedInEmail = localStorage.getItem(sessionStorageKey);
    account = signedInEmail
      ? getSavedAccounts().find((savedAccount) => savedAccount.email === signedInEmail)
      : null;
  } catch (error) {
    accountError = error instanceof Error
      ? error.message
      : "We couldn’t load your saved account. Please try again.";
  }
  const isSignedIn = Boolean(account);
  const loginSelected = document.querySelector("#login-tab").getAttribute("aria-selected") === "true";
  document.querySelector("#login-form").hidden = isSignedIn || !loginSelected;
  document.querySelector("#signup-form").hidden = isSignedIn || loginSelected;
  document.querySelector(".account-tabs").hidden = isSignedIn;
  document.querySelector(".social-login").hidden = isSignedIn;
  document.querySelector("#signed-in-view").hidden = !isSignedIn;
  if (accountError) document.querySelector("#login-message").textContent = accountError;
  if (isSignedIn) {
    document.querySelector("#account-name").textContent = account.name;
    document.querySelector("#account-email").textContent = account.email;
    document.querySelector("#account-heading").textContent = "Your account";
    document.querySelector(".account-toggle").setAttribute("aria-label", `Account for ${account.name}`);
  } else {
    document.querySelector(".account-toggle").setAttribute("aria-label", "Open your account");
  }
}

function openCart() {
  closePanels();
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  overlay.classList.add("visible");
}
function openAccount() {
  closePanels();
  const accountPanel = document.querySelector("#account-panel");
  accountPanel.classList.add("open");
  accountPanel.setAttribute("aria-hidden", "false");
  overlay.classList.add("visible");
  updateAccountView();
  const signedIn = !document.querySelector("#signed-in-view").hidden;
  if (!signedIn) document.querySelector("#login-email").focus();
}
function closePanels() {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  overlay.classList.remove("visible");
  document.querySelector("#search-panel").classList.remove("open");
  document.querySelector("#search-panel").setAttribute("aria-hidden", "true");
  document.querySelector("#account-panel").classList.remove("open");
  document.querySelector("#account-panel").setAttribute("aria-hidden", "true");
}

let toastTimeout;
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2200);
}

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  const id = button.dataset.add;
  cart.set(id, (cart.get(id) || 0) + 1);
  updateCart();
  showToast(`${products.find((product) => product.id === id).name} added to your bag`);
});

document.querySelector("#cart-items").addEventListener("click", (event) => {
  const button = event.target.closest("[data-quantity]");
  if (!button) return;
  const id = button.dataset.quantity;
  const quantity = (cart.get(id) || 0) + Number(button.dataset.change);
  if (quantity <= 0) cart.delete(id);
  else cart.set(id, quantity);
  updateCart();
});

document.querySelector(".cart-button").addEventListener("click", openCart);
document.querySelector(".close-button").addEventListener("click", closePanels);
document.querySelector(".account-toggle").addEventListener("click", openAccount);
document.querySelector(".account-close").addEventListener("click", closePanels);
overlay.addEventListener("click", closePanels);
document.querySelector(".continue-shopping").addEventListener("click", closePanels);
document.querySelector(".checkout-button").addEventListener("click", () => showToast("Checkout is coming soon — thanks for shopping small!"));

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    document.querySelector(".filter-button.active").classList.remove("active");
    button.classList.add("active");
    renderProducts();
  });
});
document.querySelector("#sort-products").addEventListener("change", renderProducts);

const searchPanel = document.querySelector("#search-panel");
let searchHasScrolled = false;
document.querySelector(".search-toggle").addEventListener("click", () => {
  searchPanel.classList.add("open");
  searchPanel.setAttribute("aria-hidden", "false");
  searchHasScrolled = false;
  document.querySelector("#search-input").focus();
});
document.querySelector(".search-close").addEventListener("click", closePanels);
document.querySelector("#search-input").addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderProducts();
  if (searchTerm && !searchHasScrolled) {
    searchHasScrolled = true;
    document.querySelector("#shop").scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

function selectAccountTab(tabName) {
  document.querySelectorAll(".account-tab").forEach((tab) => {
    const isSelected = tab.dataset.accountTab === tabName;
    tab.classList.toggle("active", isSelected);
    tab.setAttribute("aria-selected", String(isSelected));
  });
  document.querySelector("#login-form").hidden = tabName !== "login";
  document.querySelector("#signup-form").hidden = tabName !== "signup";
}

document.querySelectorAll("[data-account-tab]").forEach((tab) => {
  tab.addEventListener("click", () => selectAccountTab(tab.dataset.accountTab));
});
document.querySelectorAll("[data-switch-account]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#login-message").textContent = "";
    document.querySelector("#signup-message").textContent = "";
    selectAccountTab(button.dataset.switchAccount);
  });
});
document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const email = form.elements.email.value.trim().toLowerCase();
  const password = form.elements.password.value;
  const message = document.querySelector("#login-message");
  message.textContent = "";
  try {
    const account = getSavedAccounts().find((savedAccount) => savedAccount.email === email);
    if (!account) {
      message.textContent = "We couldn’t find an account with that email. Check it or create an account.";
      return;
    }
    const salt = Uint8Array.from(atob(account.salt), (character) => character.charCodeAt(0));
    if (await hashPassword(password, salt) !== account.passwordHash) {
      message.textContent = "That password doesn’t match this account. Please try again.";
      return;
    }
    localStorage.setItem(sessionStorageKey, account.email);
    form.reset();
    updateAccountView();
  } catch (error) {
    message.textContent = error instanceof Error
      ? error.message
      : "We couldn’t sign you in. Please try again.";
  }
});
document.querySelector("#signup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const password = document.querySelector("#signup-password");
  const confirmPassword = document.querySelector("#signup-confirm");
  const message = document.querySelector("#signup-message");
  message.textContent = "";
  if (password.value !== confirmPassword.value) {
    confirmPassword.setCustomValidity("Please make sure both passwords match.");
    confirmPassword.reportValidity();
    confirmPassword.setCustomValidity("");
    return;
  }
  try {
    const email = form.elements.email.value.trim().toLowerCase();
    const name = form.elements.name.value.trim();
    if (!name) {
      message.textContent = "Please enter your name.";
      return;
    }
    const accounts = getSavedAccounts();
    if (accounts.some((account) => account.email === email)) {
      message.textContent = "An account with that email already exists. Please log in instead.";
      return;
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const account = {
      name,
      email,
      salt: encodeBytes(salt),
      passwordHash: await hashPassword(password.value, salt),
    };
    accounts.push(account);
    localStorage.setItem(accountStorageKey, JSON.stringify(accounts));
    localStorage.setItem(sessionStorageKey, account.email);
    form.reset();
    updateAccountView();
  } catch (error) {
    message.textContent = error instanceof Error
      ? error.message
      : "We couldn’t create your account. Please try again.";
  }
});
document.querySelector(".forgot-password").addEventListener("click", () => {
  document.querySelector("#login-message").textContent =
    "Password reset isn’t available in this browser-only demo. Please contact us for help.";
});
document.querySelector("#account-signout").addEventListener("click", () => {
  try {
    localStorage.removeItem(sessionStorageKey);
    document.querySelector("#login-message").textContent = "";
    document.querySelector("#signup-message").textContent = "";
    selectAccountTab("login");
    updateAccountView();
    document.querySelector("#login-email").focus();
  } catch (error) {
    showToast(error instanceof Error ? error.message : "We couldn’t sign you out. Please try again.");
  }
});
document.querySelectorAll("[data-provider]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#social-message").textContent =
      `${button.dataset.provider} sign-in isn't connected yet. OAuth setup is required before you can continue.`;
  });
});

const menuToggle = document.querySelector(".menu-toggle");
menuToggle.addEventListener("click", () => {
  const nav = document.querySelector(".main-nav");
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll(".main-nav a").forEach((link) => link.addEventListener("click", () => {
  document.querySelector(".main-nav").classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#email");
  document.querySelector("#newsletter-message").textContent = `You're on the list — keep an eye on ${email.value}.`;
  event.target.reset();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePanels();
});

renderProducts();
updateCart();
updateAccountView();
