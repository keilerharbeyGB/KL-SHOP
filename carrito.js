const CART_STORAGE_KEY = "kl-shop-carrito";
const cartItemsElement = document.getElementById("cart-items");
const cartCountElement = document.getElementById("cart-count");
const cartTotalElement = document.getElementById("cart-total");
const cartPanel = document.getElementById("cart-panel");
const cartBackdrop = document.getElementById("cart-backdrop");
const clearCartButton = document.getElementById("cart-clear");
const whatsappCartButton = document.getElementById("cart-whatsapp");
const cart = loadCart();
const cartSizes = {
    camisas: ["S", "M", "L", "XL"],
    pantalones: ["S", "M", "L", "XL"],
    gorras: ["Unitalla"],
    zapatos: ["38", "39", "40", "41", "42", "43", "44"]
};

function loadCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
        return Array.isArray(savedCart) ? savedCart.filter(item => item && item.id && item.name && item.price > 0 && item.quantity > 0) : [];
    } catch {
        return [];
    }
}

function getItemCategory(item) {
    if (cartSizes[item.category]) return item.category;
    if (/jean|pantal[oó]n/i.test(item.name)) return "pantalones";
    if (/gorra|hat|b[eé]isbol/i.test(item.name)) return "gorras";
    if (/zapato|air|nike|skate|louis/i.test(item.name)) return "zapatos";
    return "camisas";
}

function formatPrice(price) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(price);
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function addCartItem(item) {
    const existingItem = cart.find(product => product.id === item.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    saveCart();
    renderCart();
}

function createCartButton(label, text, className, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.setAttribute("aria-label", label);
    button.addEventListener("click", action);
    return button;
}

function renderCart() {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartCountElement.textContent = itemCount;
    cartTotalElement.textContent = formatPrice(total);
    cartItemsElement.replaceChildren();
    document.querySelectorAll("[data-cart-count]").forEach(badge => {
        badge.textContent = itemCount;
    });

    if (cart.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "cart-empty";
        emptyMessage.textContent = "Tu carrito está vacío.";
        cartItemsElement.append(emptyMessage);
    }

    cart.forEach(item => {
        const row = document.createElement("article");
        row.className = "cart-item";

        const image = document.createElement("img");
        image.src = item.image;
        image.alt = item.name;

        const details = document.createElement("div");
        details.className = "cart-item-details";

        const name = document.createElement("h3");
        name.textContent = item.name;
        const price = document.createElement("p");
        price.textContent = formatPrice(item.price);
        details.append(name, price);

        const category = getItemCategory(item);
        item.category = category;
        if (cartSizes[category]) {
            const sizeLabel = document.createElement("label");
            sizeLabel.className = "cart-item-size-label";
            sizeLabel.textContent = "Talla";
            const sizeSelect = document.createElement("select");
            sizeSelect.className = "cart-item-size";
            sizeSelect.dataset.cartSize = item.id;
            sizeSelect.setAttribute("aria-label", `Talla de ${item.name}`);

            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "Selecciona";
            placeholder.disabled = true;
            placeholder.selected = !item.size;
            sizeSelect.append(placeholder);
            cartSizes[category].forEach(sizeValue => {
                const option = document.createElement("option");
                option.value = sizeValue;
                option.textContent = sizeValue;
                option.selected = item.size === sizeValue;
                sizeSelect.append(option);
            });
            sizeLabel.append(sizeSelect);
            details.append(sizeLabel);
        }

        const quantity = document.createElement("div");
        quantity.className = "cart-quantity";
        quantity.append(
            createCartButton("Restar una unidad", "−", "cart-quantity-button", () => changeQuantity(item.id, -1)),
            Object.assign(document.createElement("span"), { textContent: item.quantity }),
            createCartButton("Agregar una unidad", "+", "cart-quantity-button", () => changeQuantity(item.id, 1))
        );
        details.append(quantity);

        const remove = createCartButton("Quitar producto", "×", "cart-remove", () => removeItem(item.id));
        row.append(image, details, remove);
        cartItemsElement.append(row);
    });
    const checkoutButton = document.getElementById("cart-checkout");
    if (checkoutButton) checkoutButton.disabled = cart.length === 0;
    if (clearCartButton) clearCartButton.disabled = cart.length === 0;
    if (whatsappCartButton) whatsappCartButton.disabled = cart.length === 0;
}

function clearCart() {
    cart.splice(0, cart.length);
    saveCart();
    renderCart();
}

function changeQuantity(id, amount) {
    const item = cart.find(product => product.id === id);
    if (!item) return;

    item.quantity += amount;
    if (item.quantity <= 0) {
        removeItem(id);
        return;
    }

    saveCart();
    renderCart();
}

function removeItem(id) {
    const itemIndex = cart.findIndex(product => product.id === id);
    if (itemIndex !== -1) cart.splice(itemIndex, 1);
    saveCart();
    renderCart();
}

function updateItemSize(id, size) {
    const itemIndex = cart.findIndex(product => product.id === id);
    if (itemIndex === -1 || !size) return;

    const item = cart[itemIndex];
    const updatedId = `${item.name}|${item.price}|${size}`;
    const duplicate = cart.find((product, index) => index !== itemIndex && product.id === updatedId);
    if (duplicate) {
        duplicate.quantity += item.quantity;
        cart.splice(itemIndex, 1);
    } else {
        item.size = size;
        item.id = updatedId;
    }

    saveCart();
    renderCart();
}

function getMissingSizeItem() {
    return cart.find(item => cartSizes[getItemCategory(item)] && !item.size);
}

function focusMissingSize(missingSize) {
    const sizeSelector = [...cartItemsElement.querySelectorAll("[data-cart-size]")]
        .find(select => select.dataset.cartSize === missingSize.id);
    if (sizeSelector) sizeSelector.focus();
}

function setupCheckoutForm() {
    const checkoutButton = document.getElementById("cart-checkout");
    checkoutButton.textContent = "Proceder al pago";
    checkoutButton.addEventListener("click", () => {
        if (cart.length === 0) return;

        const missingSize = getMissingSizeItem();
        if (missingSize) {
            focusMissingSize(missingSize);
            return;
        }
        window.location.href = "checkout.html";
    });

    if (whatsappCartButton) {
        whatsappCartButton.addEventListener("click", () => {
            if (cart.length === 0) return;

            const missingSize = getMissingSizeItem();
            if (missingSize) {
                focusMissingSize(missingSize);
                return;
            }

            const lines = cart.map(item =>
                `${item.quantity} x ${item.name}${item.size ? ` (talla ${item.size})` : ""} - ${formatPrice(item.price * item.quantity)}`
            );
            lines.push(`Total: ${formatPrice(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}`);
            const message = encodeURIComponent(`Hola, quiero realizar este pedido en KL SHOP:\n${lines.join("\n")}`);
            window.open(`https://wa.me/573238207335?text=${message}`, "_blank", "noopener,noreferrer");
        });
    }
}

function openCart() {
    cartPanel.hidden = false;
    cartBackdrop.hidden = false;
    document.body.classList.add("cart-open");
    document.querySelector("[data-cart-close]").focus();
}

function closeCart() {
    cartPanel.hidden = true;
    cartBackdrop.hidden = true;
    document.body.classList.remove("cart-open");
    document.querySelector("[data-cart-open]").focus();
}

document.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-to-cart]");
    if (addButton) {
        const product = document.getElementById("product-detail");
        const size = document.getElementById("product-size").value;
        const { name, price, image } = product.dataset;
        addCartItem({
            id: `${name}|${price}|${size}`,
            name,
            price: Number(price),
            image,
            size
        });
        if (typeof window.mostrarMensaje === "function") window.mostrarMensaje();
        return;
    }

    const cardButton = event.target.closest(".producto button");
    if (!cardButton) return;

    const product = cardButton.closest(".producto");
    const name = product.querySelector("h3").textContent.trim();
    const priceText = product.querySelector(".precio-boton").textContent;
    const price = Number(priceText.replace(/[^\d]/g, ""));
    const image = product.querySelector("img").src;
    const pageCategory = window.location.pathname.split("/").pop().replace(".html", "");
    const category = ["camisas", "pantalones", "gorras", "zapatos"].includes(pageCategory)
        ? pageCategory
        : getItemCategory({ name });
    addCartItem({ id: `${name}|${price}`, name, price, image, category });
});

cartItemsElement.addEventListener("change", event => {
    const sizeSelect = event.target.closest("[data-cart-size]");
    if (sizeSelect) updateItemSize(sizeSelect.dataset.cartSize, sizeSelect.value);
});
if (clearCartButton) clearCartButton.addEventListener("click", clearCart);
document.querySelector("[data-cart-open]").addEventListener("click", openCart);
document.querySelectorAll("[data-cart-close]").forEach(button => button.addEventListener("click", closeCart));
cartBackdrop.addEventListener("click", closeCart);
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !cartPanel.hidden) closeCart();
});
setupCheckoutForm();

renderCart();
