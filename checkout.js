const CART_STORAGE_KEY = "kl-shop-carrito";
const ORDER_STORAGE_KEY = "kl-shop-pedidos";
const checkoutItems = document.getElementById("checkout-items");
const checkoutTotal = document.getElementById("checkout-total");
const checkoutForm = document.getElementById("checkout-form");
const checkoutStatus = document.getElementById("checkout-status");
const checkoutSuccess = document.getElementById("checkout-success");
const checkoutSubmit = document.getElementById("checkout-submit");
const cardNumberInput = document.getElementById("card-number");
const cardExpiryInput = document.getElementById("card-expiry");
let cart;

function formatPrice(price) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(price);
}

function showCheckoutError(message) {
    checkoutStatus.textContent = message;
}

function loadCheckoutCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
        if (!Array.isArray(savedCart)) throw new Error("El contenido del carrito no es válido.");
        return savedCart.filter(item =>
            item && typeof item.id === "string" && typeof item.name === "string" &&
            Number.isFinite(item.price) && item.price > 0 &&
            Number.isInteger(item.quantity) && item.quantity > 0
        );
    } catch (error) {
        showCheckoutError("No se pudo leer el carrito. Vuelve a la tienda e inténtalo nuevamente.");
        console.error("No se pudo cargar el carrito para el checkout:", error);
        return [];
    }
}

function renderCheckoutCart() {
    checkoutItems.replaceChildren();
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    checkoutTotal.textContent = formatPrice(total);

    cart.forEach(item => {
        const row = document.createElement("div");
        row.className = "checkout-order-item";
        const name = document.createElement("span");
        name.textContent = `${item.quantity} × ${item.name}${item.size ? ` (talla ${item.size})` : ""}`;
        const price = document.createElement("strong");
        price.textContent = formatPrice(item.price * item.quantity);
        row.append(name, price);
        checkoutItems.append(row);
    });

    if (cart.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "tracking-help";
        emptyMessage.textContent = "Tu carrito está vacío. Regresa a la tienda para elegir productos.";
        checkoutItems.append(emptyMessage);
        checkoutSubmit.disabled = true;
    }
}

function createTrackingCode(existingOrders) {
    if (!window.crypto || typeof window.crypto.getRandomValues !== "function") {
        throw new Error("Este navegador no permite generar un código seguro.");
    }

    let code;
    do {
        const bytes = new Uint8Array(4);
        window.crypto.getRandomValues(bytes);
        const suffix = [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
        code = `KL-${new Date().getFullYear()}-${suffix}`;
    } while (existingOrders.some(order => order.code === code));
    return code;
}

function loadOrders() {
    const savedOrders = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || "[]");
    if (!Array.isArray(savedOrders) || savedOrders.some(order => !order || typeof order.code !== "string")) {
        throw new Error("El registro local de pedidos no tiene un formato válido.");
    }
    return savedOrders;
}

function formatCardNumber() {
    const digits = cardNumberInput.value.replace(/\D/g, "").slice(0, 19);
    cardNumberInput.value = digits.replace(/(.{4})/g, "$1 ").trim();
}

function finishDemoOrder(event) {
    event.preventDefault();
    cardNumberInput.setCustomValidity("");
    if (cart.length === 0 || !checkoutForm.reportValidity()) return;

    const cardDigits = cardNumberInput.value.replace(/\D/g, "");
    if (cardDigits.length < 12 || cardDigits.length > 19) {
        cardNumberInput.setCustomValidity("Revisa el número de tarjeta.");
        cardNumberInput.reportValidity();
        return;
    }

    checkoutStatus.textContent = "";
    checkoutSubmit.disabled = true;

    try {
        const orders = loadOrders();
        const code = createTrackingCode(orders);
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const order = {
            code,
            createdAt: new Date().toISOString(),
            total,
            status: "Pedido de demostración. Sin cobro real.",
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                size: item.size || ""
            }))
        };

        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify([order, ...orders].slice(0, 100)));
        localStorage.removeItem(CART_STORAGE_KEY);

        checkoutForm.reset();
        checkoutForm.hidden = true;
        document.getElementById("checkout-customer-title").hidden = true;
        checkoutSubmit.disabled = false;
        checkoutSuccess.hidden = false;
        checkoutSuccess.replaceChildren();

        const heading = document.createElement("h2");
        heading.textContent = "¡Pedido registrado!";
        const message = document.createElement("p");
        message.textContent = "Pago exitoso Gracias por tu compra en KL-SHOP";
        const codeLabel = document.createElement("p");
        codeLabel.textContent = "Código de seguimiento:";
        const codeValue = document.createElement("strong");
        codeValue.className = "tracking-code";
        codeValue.textContent = code;
        const trackingLink = document.createElement("a");
        trackingLink.className = "cart-checkout checkout-tracking-link";
        trackingLink.href = `seguimiento.html?codigo=${encodeURIComponent(code)}`;
        trackingLink.textContent = "Consultar código de seguimiento";
        const storeLink = document.createElement("a");
        storeLink.className = "checkout-back-link";
        storeLink.href = "index.html";
        storeLink.textContent = "Volver a la tienda";
        checkoutSuccess.append(heading, message, codeLabel, codeValue, trackingLink, storeLink);
    } catch (error) {
        console.error("No se pudo registrar el pedido de demostración:", error);
        showCheckoutError("No se pudo completar la simulación. Revisa el almacenamiento del navegador e inténtalo nuevamente.");
        checkoutSubmit.disabled = false;
    }
}

cart = loadCheckoutCart();
renderCheckoutCart();
cardNumberInput.addEventListener("input", () => {
    cardNumberInput.setCustomValidity("");
    formatCardNumber();
});
cardExpiryInput.min = new Date().toISOString().slice(0, 7);
checkoutForm.addEventListener("submit", finishDemoOrder);
