const productDetail = document.getElementById("product-detail");

const productSizes = {
    camisas: ["S", "M", "L", "XL"],
    pantalones: ["S", "M", "L", "XL"],
    gorras: ["Unitalla"],
    zapatos: ["38", "39", "40", "41", "42", "43", "44"]
};

function getProductCategory(name, pageCategory) {
    if (["camisas", "pantalones", "gorras", "zapatos"].includes(pageCategory)) {
        return pageCategory;
    }
    if (/jean|pantal[oó]n/i.test(name)) return "pantalones";
    if (/gorra|hat|b[eé]isbol/i.test(name)) return "gorras";
    if (/zapato|air|nike|skate|louis/i.test(name)) return "zapatos";
    return "camisas";
}

function setupProductFilters() {
    const grid = document.querySelector(".grid-productos");
    if (!grid) return;

    const pageCategory = window.location.pathname.split("/").pop().replace(".html", "");
    const products = [...grid.querySelectorAll(".producto")];
    products.forEach((product, index) => {
        const name = product.querySelector("h3").textContent.trim();
        const category = getProductCategory(name, pageCategory);
        const priceText = product.querySelector(".precio-boton").textContent;
        product.dataset.category = category;
        product.dataset.price = String(Number(priceText.replace(/[^\d]/g, "")));
        product.dataset.search = `${name} ${product.querySelector("p").textContent}`.toLocaleLowerCase("es");
        product.dataset.originalOrder = String(index);
    });

    const filterMenu = document.createElement("div");
    filterMenu.className = "product-filter-menu";

    const toggleButton = document.createElement("button");
    toggleButton.className = "product-filter-toggle";
    toggleButton.type = "button";
    toggleButton.textContent = "Filtros ☰";
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.setAttribute("aria-controls", "product-filters");
    filterMenu.append(toggleButton);

    const filters = document.createElement("form");
    filters.id = "product-filters";
    filters.className = "product-filters";
    filters.setAttribute("aria-label", "Filtros de productos");
    filters.hidden = true;
    filters.addEventListener("submit", event => event.preventDefault());
    filterMenu.append(filters);

    const closeFilters = () => {
        filters.hidden = true;
        toggleButton.setAttribute("aria-expanded", "false");
    };

    toggleButton.addEventListener("click", () => {
        const isOpen = !filters.hidden;
        filters.hidden = isOpen;
        toggleButton.setAttribute("aria-expanded", String(!isOpen));
    });
    document.addEventListener("click", event => {
        if (!filterMenu.contains(event.target)) closeFilters();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !filters.hidden) {
            closeFilters();
            toggleButton.focus();
        }
    });

    const createControl = (labelText, name, control) => {
        const field = document.createElement("label");
        field.className = "product-filter-field";
        field.append(document.createTextNode(labelText), control);
        control.name = name;
        filters.append(field);
        return control;
    };
    const createSelect = (options) => {
        const select = document.createElement("select");
        options.forEach(([value, label]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            select.append(option);
        });
        return select;
    };

    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Nombre o marca";
    search.setAttribute("aria-label", "Buscar por nombre o marca");
    createControl("Buscar", "search", search);

    const category = createControl("Categoría", "category", createSelect([
        ["all", "Todas"],
        ["camisas", "Camisas"],
        ["pantalones", "Pantalones"],
        ["gorras", "Gorras"],
        ["zapatos", "Zapatos"]
    ]));

    const priceRange = createControl("Precio", "price", createSelect([
        ["all", "Cualquier precio"],
        ["0-149999", "Menos de $150.000"],
        ["150000-299999", "$150.000 a $299.999"],
        ["300000-499999", "$300.000 a $499.999"],
        ["500000-", "$500.000 o más"]
    ]));

    const size = createControl("Talla", "size", createSelect([
        ["all", "Todas las tallas"],
        ["S", "S"],
        ["M", "M"],
        ["L", "L"],
        ["XL", "XL"],
        ["38", "38"],
        ["39", "39"],
        ["40", "40"],
        ["41", "41"],
        ["42", "42"],
        ["43", "43"],
        ["44", "44"],
        ["Unitalla", "Unitalla"]
    ]));

    const sort = createControl("Ordenar", "sort", createSelect([
        ["featured", "Destacados"],
        ["price-asc", "Precio: menor a mayor"],
        ["price-desc", "Precio: mayor a menor"],
        ["name", "Nombre: A-Z"]
    ]));

    const emptyMessage = document.createElement("p");
    emptyMessage.className = "product-filter-empty";
    emptyMessage.textContent = "No hay productos que coincidan con esos filtros.";
    emptyMessage.hidden = true;
    grid.before(filterMenu);
    grid.after(emptyMessage);

    const applyFilters = () => {
        let visibleProducts = products.filter(product => {
            const matchesSearch = product.dataset.search.includes(search.value.trim().toLocaleLowerCase("es"));
            const matchesCategory = category.value === "all" || product.dataset.category === category.value;
            const productPrice = Number(product.dataset.price);
            const [minimum, maximum] = priceRange.value.split("-").map(value => value ? Number(value) : null);
            const matchesPrice = priceRange.value === "all" ||
                (productPrice >= minimum && (maximum === null || productPrice <= maximum));
            const matchesSize = size.value === "all" || productSizes[product.dataset.category].includes(size.value);
            return matchesSearch && matchesCategory && matchesPrice && matchesSize;
        });

        if (sort.value === "price-asc") {
            visibleProducts.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
        } else if (sort.value === "price-desc") {
            visibleProducts.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
        } else if (sort.value === "name") {
            visibleProducts.sort((a, b) => a.querySelector("h3").textContent.localeCompare(b.querySelector("h3").textContent, "es"));
        } else {
            visibleProducts.sort((a, b) => Number(a.dataset.originalOrder) - Number(b.dataset.originalOrder));
        }

        products.forEach(product => {
            product.hidden = !visibleProducts.includes(product);
        });
        visibleProducts.forEach(product => grid.append(product));
        emptyMessage.hidden = visibleProducts.length > 0;
    };

    [search, category, priceRange, size, sort].forEach(control => {
        control.addEventListener(control === search ? "input" : "change", applyFilters);
    });
}

setupProductFilters();

if (typeof window.mostrarMensaje !== "function") {
    window.mostrarMensaje = function() {
        const message = document.getElementById("toast");
        if (!message) return;

        message.classList.add("mostrar");
        clearTimeout(window.toastTimer);
        window.toastTimer = setTimeout(() => {
            message.classList.remove("mostrar");
        }, 2500);
    };
}

document.querySelectorAll(".producto img").forEach(image => {
    const product = image.closest(".producto");
    const name = product.querySelector("h3").textContent.trim();
    image.tabIndex = 0;
    image.setAttribute("role", "link");
    image.setAttribute("aria-label", `Ver detalles de ${name}`);
});

if (productDetail) {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("nombre");
    const brand = params.get("marca");
    const price = Number(params.get("precio"));
    const image = params.get("imagen");
    const category = params.get("categoria");

    if (!name || !brand || !Number.isFinite(price) || price <= 0 || !image || !category) {
        productDetail.textContent = "No se pudo cargar el producto. Regresa al catálogo e inténtalo de nuevo.";
    } else {
        const categoryNames = {
            camisas: "Camiseta",
            pantalones: "Pantalón",
            gorras: "Gorra",
            zapatos: "Calzado"
        };
        const descriptions = {
            "CAMISETA DE FIRMA": "Una camiseta de Coach con un diseño clásico y versátil para combinar con tus prendas favoritas.",
            "CLEMONT EREBO BLACK": "Una camiseta Clemont en tono negro, con una propuesta urbana para completar tu estilo diario.",
            "HELIOS PHASES": "Una camiseta Undergold con un diseño gráfico llamativo y una estética urbana.",
            "CAMISETA BÁSICA": "Una camiseta Boss de estilo sencillo y versátil, ideal para crear diferentes combinaciones.",
            "CAMISETA REVELATION BLACK": "Una camiseta negra UnderGold de estilo urbano, ideal para combinar con jeans y zapatillas.",
            "CAMISETA OVERSIZED URBAN": "Una camiseta de corte oversized con una silueta relajada y un estilo casual para el día a día.",
            "CAMISA COACH": "Una camisa Coach de diseño versátil, pensada para complementar conjuntos casuales o más arreglados.",
            "CAMISETA LOGO": "Una camiseta con logo visible y estilo casual, fácil de combinar con prendas urbanas.",
            "CAMISETA CLASSIC LOGO": "Una camiseta de estilo clásico con logo, ideal para crear conjuntos sencillos y versátiles.",
            "CAMISETA MONOGRAM STYLE": "Una camiseta con diseño monogramado y una apariencia distintiva para completar un look urbano.",
            "GORRA ARGENTO GRIS": "Una gorra Clemont en tono gris oscuro, un complemento urbano para llevar todos los días.",
            "EL BARBAS HATS CHROME": "Una gorra Drop Shop con diseño llamativo, pensada para complementar un estilo urbano.",
            "BOSS BORDADA": "Una gorra Boss con detalle bordado y un diseño fácil de combinar.",
            "BÉISBOL JACQUARD": "Una gorra Coach de estilo clásico con diseño jacquard.",
            "GORRA BEISBOL UNISEX": "Una gorra de béisbol de estilo clásico, diseñada para complementar atuendos casuales.",
            "GORRA PSYCHO": "Una gorra Psycho Bunny de estilo urbano, ideal para añadir un detalle llamativo al conjunto.",
            "GORRA MONASTERY": "Una gorra Monastery de inspiración urbana, fácil de combinar con ropa casual.",
            "GORRA HIGH HORSE CARRUSEL": "Una gorra High Horse con diseño distintivo para completar un look streetwear.",
            "JEANS BAGGY AZUL": "Un jean azul de corte baggy para un look relajado y contemporáneo.",
            "JEANS DE ESTILO SKATE": "Un jean Louis Vuitton de estilo skate, con una silueta relajada para un look urbano.",
            "JEANS BAGGY 501 ORIGINAL": "Un jean Levi's 501 de corte baggy que combina el estilo clásico de mezclilla con una silueta más relajada.",
            "ADIDAS JOGGERS": "Un pantalón jogger Adidas Originals cómodo y versátil para un conjunto deportivo o casual.",
            "ADICOLOR CLASSICS FIREBIRD": "Un pantalón Adidas Adicolor Classics Firebird de inspiración deportiva y estilo clásico.",
            "JORDAN SPORT CROSSOVER": "Un pantalón Jordan Sport Crossover pensado para un estilo deportivo y cómodo.",
            "ZAPATILLAS AIR FORCE ONE 1.1": "Unas zapatillas Nike de inspiración clásica para acompañar tus conjuntos diarios.",
            "ZAPATILLAS AIR FORCE ONE DRAKE 1.1": "Unas zapatillas Nike con un estilo llamativo inspirado en la línea Air Force.",
            "NIKE AIR MAX PLUS": "Unas zapatillas Nike de silueta deportiva y diseño distintivo.",
            "LOUIS VUITTON SKATE": "Unas zapatillas Louis Vuitton de estilo skate y estética urbana.",
            "AIR MAX PLUS": "Unas zapatillas Nike de silueta deportiva y diseño distintivo.",
            "ADIDAS SAMBA RETRO": "Unas zapatillas Adidas Samba de inspiración retro, ideales para combinar con atuendos casuales.",
            "NEW BALANCE 9060": "Unas zapatillas New Balance 9060 de apariencia deportiva y diseño contemporáneo.",
            "TENIS DEPORTIVOS AIR": "Unos tenis deportivos de estilo urbano para acompañar conjuntos casuales y activos.",
            "ADIDAS CAMPUS URBAN": "Unas zapatillas Adidas Campus de estilo urbano, versátiles para el uso diario.",
            "TENIS URBAN STREET": "Unos tenis de inspiración streetwear para completar un conjunto casual."
        };
        const categoryLabel = categoryNames[category];
        const sizes = productSizes[category];

        if (!categoryLabel || !sizes) {
            productDetail.textContent = "La categoría de este producto no es válida.";
        } else {
            productDetail.dataset.name = name;
            productDetail.dataset.price = String(price);
            productDetail.dataset.image = image;
            productDetail.dataset.category = category;
            document.title = `${name} | KL SHOP`;
            document.getElementById("product-image").src = image;
            document.getElementById("product-image").alt = name;
            document.getElementById("product-name").textContent = name;
            document.getElementById("product-brand").textContent = brand;
            document.getElementById("product-category").textContent = categoryLabel;
            document.getElementById("product-price").textContent = new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0
            }).format(price);
            document.getElementById("product-description").textContent =
                descriptions[name.toLocaleUpperCase("es")] || `${name} de ${brand}, una opción versátil para completar tu estilo.`;
            const origin = params.get("origen");
            document.querySelector(".product-back-link").href =
                ["index", "camisas", "pantalones", "gorras", "zapatos"].includes(origin)
                    ? `${origin}.html`
                    : "index.html";

            const sizeSelect = document.getElementById("product-size");
            sizes.forEach(size => {
                const option = document.createElement("option");
                option.value = size;
                option.textContent = size;
                sizeSelect.append(option);
            });
        }
    }
}

function openProduct(product) {
    const name = product.querySelector("h3").textContent.trim();
    const priceText = product.querySelector(".precio-boton").textContent;
    const price = Number(priceText.replace(/[^\d]/g, ""));
    const image = product.querySelector("img").src;
    const cardBrand = product.querySelector("p").textContent.trim();
    const brand = /^\$/.test(cardBrand) ? name.split(" ")[0] : cardBrand;
    const pageCategory = window.location.pathname.split("/").pop().replace(".html", "");
    const category = getProductCategory(name, pageCategory);
    const origin = ["index", "camisas", "pantalones", "gorras", "zapatos"].includes(pageCategory)
        ? pageCategory
        : "index";
    const params = new URLSearchParams({
        nombre: name,
        marca: brand,
        precio: String(price),
        imagen: image,
        categoria: category,
        origen: origin
    });

    window.location.href = `producto.html?${params.toString()}`;
}

document.addEventListener("click", event => {
    const image = event.target.closest(".producto img");
    if (image) openProduct(image.closest(".producto"));
});

document.addEventListener("keydown", event => {
    const image = event.target.closest(".producto img[role='link']");
    if (image && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openProduct(image.closest(".producto"));
    }
});
