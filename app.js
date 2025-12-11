// ========== VARIABLES GLOBALES ========== 
let products = []; 
const productForm = document.getElementById('productForm'); 
const productsList = document.getElementById('productsList'); 
const productCount = document.getElementById('productCount'); 
const filterCategory = document.getElementById('filterCategory'); 
const statusIndicator = document.getElementById('statusIndicator'); 
const statusText = document.getElementById('statusText'); 
 
// ========== INITIALISATION ========== 
document.addEventListener('DOMContentLoaded', () => { 
    loadProducts(); 
    loadTheme(); 
    displayProducts(); 
    setupEventListeners(); 
    setupInstallButton(); 
    monitorOnlineStatus(); 
    requestNotificationPermission(); 
}); 
 
// ========== GESTION DES PRODUITS ========== 
function loadProducts() { 
    const stored = localStorage.getItem('products'); 
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Nettoyer les produits invalides
            products = parsed.filter(p => p.name && p.price !== undefined);
            
            // Si des produits ont été supprimés, sauvegarder la version nettoyée
            if (products.length !== parsed.length) {
                console.log(`${parsed.length - products.length} produits invalides supprimés`);
                saveProducts();
            }
        } catch (e) {
            console.error('Erreur de chargement des produits:', e);
            products = [];
        }
    } else {
        products = [];
    }
} 
 
function saveProducts() { 
    localStorage.setItem('products', JSON.stringify(products)); 
} 
 
function addProduct(name, price, category) { 
    const product = { 
        id: Date.now(), 
        name, 
        price: parseFloat(price), 
        category, 
        createdAt: new Date().toISOString() 
    }; 
    products.unshift(product); 
    saveProducts(); 
    displayProducts(); 
    notifyProductAdded(name); 
} 
 
function deleteProduct(id) { 
    products = products.filter(p => p.id !== id); 
    saveProducts(); 
    displayProducts(); 
} 
 
function displayProducts(filter = 'all') { 
    const filtered = filter === 'all'  
        ? products  
        : products.filter(p => p.category === filter); 
     
    console.log('Affichage des produits:', filtered.length, 'produits');
    console.log('Produits filtrés:', filtered);
    
    productCount.textContent = filtered.length; 
     
    if (filtered.length === 0) { 
        productsList.innerHTML = '<p style="text-align:center; color:#999;">Aucun produit</p>'; 
        return; 
    } 
     
    productsList.innerHTML = filtered.map(product => {
        // Vérifier que le produit a toutes les propriétés nécessaires
        if (!product.name || product.price === undefined) {
            console.warn('Produit invalide ignoré:', product);
            return '';
        }
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-price">${Number(product.price).toFixed(2)} €</div>
                    <span class="product-category">${product.category || 'Non catégorisé'}</span>
                </div>
                <button class="btn-delete" onclick="deleteProduct(${product.id})">🗑 Supprimer</button>
            </div>
        `;
    }).filter(html => html !== '').join(''); 
    
    console.log('HTML généré, nombre de cartes:', document.querySelectorAll('.product-card').length);
} 
 
// ========== EVENT LISTENERS ========== 
function setupEventListeners() { 
    // Soumission formulaire 
    productForm.addEventListener('submit', (e) => { 
        e.preventDefault(); 
        const name = document.getElementById('productName').value; 
        const price = document.getElementById('productPrice').value; 
        const category = document.getElementById('productCategory').value; 
         
        addProduct(name, price, category); 
        productForm.reset(); 
    }); 
     
    // Filtre par catégorie 
    filterCategory.addEventListener('change', (e) => { 
        displayProducts(e.target.value); 
    }); 
     
    // Recherche en temps réel 
    document.getElementById('searchInput').addEventListener('input', (e) => { 
        searchProducts(e.target.value); 
    }); 
     
    // Toggle thème 
    document.getElementById('themeToggle').addEventListener('click', toggleTheme); 
     
    // Import JSON 
    document.getElementById('importFile').addEventListener('change', (e) => { 
        importProducts(e.target.files[0]); 
    }); 
} 
 
// ========== STATUT RÉSEAU ========== 
function monitorOnlineStatus() { 
    updateOnlineStatus(); 
     
    window.addEventListener('online', updateOnlineStatus); 
    window.addEventListener('offline', updateOnlineStatus); 
} 
 
function updateOnlineStatus() { 
    if (navigator.onLine) { 
        statusIndicator.classList.remove('offline'); 
        statusIndicator.classList.add('online'); 
        statusText.textContent = 'En ligne'; 
    } else { 
        statusIndicator.classList.remove('online'); 
        statusIndicator.classList.add('offline'); 
        statusText.textContent = 'Hors ligne'; 
    } 
} 
 
// ========== INSTALLATION PWA ========== 
let deferredPrompt; 
const installBtn = document.getElementById('installBtn'); 
 
function setupInstallButton() { 
    window.addEventListener('beforeinstallprompt', (e) => { 
        e.preventDefault(); 
        deferredPrompt = e; 
        installBtn.hidden = false; 
    }); 
     
    installBtn.addEventListener('click', async () => { 
        if (!deferredPrompt) return; 
         
        deferredPrompt.prompt(); 
        const { outcome } = await deferredPrompt.userChoice; 
         
        console.log(`Installation: ${outcome}`); 
         
        if (outcome === 'accepted') { 
            showNotification('Application installée avec succès ! 🎉'); 
        } 
         
        deferredPrompt = null; 
        installBtn.hidden = true; 
    }); 
     
    window.addEventListener('appinstalled', () => { 
        console.log('PWA installée'); 
        showNotification('L\'application est maintenant sur votre écran d\'accueil'); 
    }); 
} 
 
function showNotification(message) { 
    const notif = document.createElement('div'); 
    notif.textContent = message; 
    notif.style.cssText = ` 
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: #4CAF50; 
        color: white; 
        padding: 1rem 1.5rem; 
        border-radius: 0.5rem; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
        z-index: 1000; 
    `; 
    document.body.appendChild(notif); 
    setTimeout(() => notif.remove(), 3000); 
} 
 
// ========== DARK MODE ========== 
function loadTheme() { 
    const savedTheme = localStorage.getItem('theme'); 
    if (savedTheme === 'dark') { 
        document.body.classList.add('dark-mode'); 
        updateThemeButton(); 
    } 
} 
 
function toggleTheme() { 
    document.body.classList.toggle('dark-mode'); 
    const isDark = document.body.classList.contains('dark-mode'); 
    localStorage.setItem('theme', isDark ? 'dark' : 'light'); 
    updateThemeButton(); 
} 
 
function updateThemeButton() { 
    const themeBtn = document.getElementById('themeToggle'); 
    if (document.body.classList.contains('dark-mode')) { 
        themeBtn.textContent = '☀️'; 
        themeBtn.title = 'Basculer vers le thème clair'; 
    } else { 
        themeBtn.textContent = '🌙'; 
        themeBtn.title = 'Basculer vers le thème sombre'; 
    } 
} 
 
// ========== NOTIFICATIONS PUSH ========== 
function requestNotificationPermission() { 
    if ('Notification' in window && Notification.permission === 'default') { 
        Notification.requestPermission(); 
    } 
} 
 
function notifyProductAdded(productName) { 
    if ('Notification' in window && Notification.permission === 'granted') { 
        new Notification('✅ Produit ajouté', { 
            body: `${productName} a été ajouté au catalogue`, 
            icon: '/icons/icon-192.png', 
            badge: '/icons/icon-192.png' 
        }); 
    } 
} 
 
// ========== RECHERCHE EN TEMPS RÉEL ========== 
function searchProducts(searchTerm) { 
    const lowerSearchTerm = searchTerm.toLowerCase(); 
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(lowerSearchTerm) || 
        p.category.toLowerCase().includes(lowerSearchTerm) 
    ); 
     
    productCount.textContent = filtered.length; 
     
    if (filtered.length === 0) { 
        productsList.innerHTML = '<p style="text-align:center; color:#999;">Aucun produit trouvé</p>'; 
        return; 
    } 
     
    productsList.innerHTML = filtered.map(product => ` 
        <div class="product-card" data-id="${product.id}"> 
            <div class="product-info"> 
                <h3>${product.name}</h3> 
                <div class="product-price">${product.price.toFixed(2)} €</div> 
                <span class="product-category">${product.category}</span> 
            </div> 
            <button class="btn-delete" onclick="deleteProduct(${product.id})">🗑 Supprimer</button> 
        </div> 
    `).join(''); 
} 
 
// ========== EXPORT/IMPORT JSON ========== 
function exportProducts() { 
    const dataStr = JSON.stringify(products, null, 2); 
    const dataBlob = new Blob([dataStr], { type: 'application/json' }); 
     
    const link = document.createElement('a'); 
    link.href = URL.createObjectURL(dataBlob); 
    link.download = `mesproduits-export-${new Date().toISOString().split('T')[0]}.json`; 
    link.click(); 
    URL.revokeObjectURL(link.href); 
    showNotification('📥 Produits exportés avec succès !'); 
} 
 
function importProducts(file) { 
    if (!file) return; 
     
    const reader = new FileReader(); 
    reader.onload = (e) => { 
        try { 
            const imported = JSON.parse(e.target.result); 
            if (Array.isArray(imported)) { 
                products = imported; 
                saveProducts(); 
                displayProducts(); 
                showNotification('✅ Produits importés avec succès !'); 
            } else { 
                showNotification('❌ Format JSON invalide'); 
            } 
        } catch (error) { 
            showNotification('❌ Erreur lors de l\'import'); 
            console.error('Erreur import:', error); 
        } 
    }; 
    reader.readAsText(file); 
} 
 
// ========== ENREGISTREMENT SERVICE WORKER ========== 
if ('serviceWorker' in navigator) { 
    window.addEventListener('load', () => { 
        navigator.serviceWorker.register('/sw.js') 
            .then(registration => { 
                console.log('✅ Service Worker enregistré:', registration.scope); 
            }) 
            .catch(error => { 
                console.error('❌ Erreur Service Worker:', error); 
            }); 
    }); 
}