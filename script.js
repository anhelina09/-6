let cart = [];
let globalData = [];

const saveCart = () => localStorage.setItem('my_electronics_store_cart', JSON.stringify(cart));

const loadCart = (data) => {
    const saved = localStorage.getItem('my_electronics_store_cart');
    if (saved) {
        cart = JSON.parse(saved);
        cart.forEach(cItem => {
            const product = data.find(p => p.id === cItem.id);
            if (product) product.availableCount -= cItem.count;
        });
        updateCounterUI();
    }
};

const updateCounterUI = () => {
    const counter = document.querySelector('#cart-counter');
    const sum = cart.reduce((acc, cur) => acc + cur.count, 0);
    counter.textContent = sum > 9 ? "+9" : sum;
    counter.classList.toggle('hide', sum === 0);
};

const updateItemNode = (id, count) => {
    const node = document.querySelector(`.item[item-id="${id}"]`);
    if (node) {
        node.querySelector('.item-available-count').textContent = `Count: ${count}`;
        node.querySelector('.item-add').classList.toggle('disabled', count <= 0);
    }
};

const applyFilters = () => {
    const search = document.querySelector('#search-input').value.toLowerCase();
    const cat = document.querySelector('#category-select').value;
    const ratingNode = document.querySelector('input[name="rating-selector"]:checked');
    const minRating = ratingNode ? parseFloat(ratingNode.value) : 0;

    globalData.forEach(item => {
        const node = document.querySelector(`.item[item-id="${item.id}"]`);
        if (!node) return;
        const matches = item.name.toLowerCase().includes(search) &&
                        (cat === 'All' || item.category === cat) &&
                        (item.rating >= minRating);
        node.classList.toggle('hide', !matches);
    });
};

const createItem = (item) => {
    const div = document.createElement('div');
    div.classList.add('item');
    div.setAttribute('item-id', item.id);
    div.innerHTML = `
        <div class="item-image" style="--bgURL:url(${item.imageUrl})"></div>
        <div class="item-title">${item.name}</div>
        <div class="item-short-description">${item.shortDescription}</div>
        <div class="item-bottom">
            <div>Rating: ${item.rating}</div>
            <div class="item-available-count">Count: ${item.availableCount}</div>
            <div style="font-weight:bold">${item.price} USD</div>
            <div class="item-add ${item.availableCount <= 0 ? 'disabled' : ''}">Add to cart</div>
        </div>
    `;

    div.querySelector('.item-add').onclick = () => {
        if (item.availableCount > 0) {
            const existed = cart.find(c => c.id === item.id);
            if (existed) existed.count++;
            else cart.push({ ...item, count: 1 });
            item.availableCount--;
            updateItemNode(item.id, item.availableCount);
            updateCounterUI();
            saveCart();
        }
    };
    return div;
};

const createViewItem = (item) => {
    const product = globalData.find(p => p.id === item.id);
    const div = document.createElement('div');
    div.classList.add('cart-view-item');
    div.style.padding = "15px 0";
    
    div.innerHTML = `
        <img src="${item.imageUrl}" style="width:100px; height:100px; object-fit:cover; border-radius:10px; border:1px solid #ddd;">
        <div style="flex:1; margin-left:15px; display:flex; flex-direction:column; gap:5px;">
            <span style="font-weight:bold; font-size:16px;">${item.name}</span>
            <span style="color:#666;">${item.price} USD</span>
            <div style="display:flex; align-items:center; gap:12px; margin-top:5px;">
                <button class="btn-minus" style="width:30px; height:30px; cursor:pointer; background:white; border:1px solid #333; border-radius:5px;">-</button>
                <span style="font-weight:bold; min-width:20px; text-align:center;">${item.count}</span>
                <button class="btn-plus" style="width:30px; height:30px; cursor:pointer; background:white; border:1px solid #333; border-radius:5px;">+</button>
            </div>
        </div>
        <div style="text-align:right; font-weight:bold; min-width:80px;">
            ${(item.count * item.price).toFixed(2)} USD
        </div>
    `;

    div.querySelector('.btn-plus').onclick = () => {
        if (product.availableCount > 0) {
            item.count++;
            product.availableCount--;
            renderCart();
        }
    };

    div.querySelector('.btn-minus').onclick = () => {
        item.count--;
        product.availableCount++;
        if (item.count === 0) {
            cart = cart.filter(c => c.id !== item.id);
        }
        renderCart();
    };

    return div;
};

const renderCart = () => {
    const list = document.querySelector('.cart-view-list');
    list.innerHTML = '';
    cart.forEach(i => list.appendChild(createViewItem(i)));
    
    const total = cart.reduce((acc, i) => acc + (i.count * i.price), 0);
    document.querySelector('#total-price-value').textContent = total.toFixed(2);
    
    globalData.forEach(p => updateItemNode(p.id, p.availableCount));
    updateCounterUI();
    saveCart();
};

document.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch('./electronic_items_dataset.json');
    globalData = await res.json();
    
    loadCart(globalData);
    
    const grid = document.querySelector('.items');
    globalData.forEach(item => grid.appendChild(createItem(item)));

    const cats = ['All', ...new Set(globalData.map(i => i.category))];
    document.querySelector('#category-select').innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');

    document.querySelectorAll('#search-input, #category-select, input[name="rating-selector"]')
            .forEach(el => el.addEventListener('input', applyFilters));

    document.querySelector('.cart').onclick = () => {
        renderCart();
        document.querySelector('.cart-view-wrapper').classList.remove('hide');
    };
    
    document.querySelector('#cart-view-close').onclick = () => document.querySelector('.cart-view-wrapper').classList.add('hide');
    document.querySelector('.blur').onclick = () => document.querySelector('.cart-view-wrapper').classList.add('hide');
    
    document.querySelector('.loader').classList.add('hide');
});