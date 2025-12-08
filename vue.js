let app = new Vue({
    el: '#app',
    data: { 
        sitename: 'After School Activities',
        activities: [],
        order: {
            fullName: '',
            email: '',
            telephone: '',
            country: '',
            city: '',
            address: ''
        },
        cart: [],
        searchQuery: '',
        sortOption: 'default',
        showCheckout: false
    },
    created() {
        this.loadProducts();
    },
    methods: {
        loadProducts() {
            fetch('https://mdxbackshop-cle9.onrender.com/collection/lessons')
                .then(response => response.json())
                .then(json => {
                    this.activities = json;
                })
                .catch(err => {
                    console.error('Error fetching activities:', err);
                });
        },
        addToCart(activity) {
            if (this.canAddToCart(activity)) {
                
                fetch(`https://mdxbackshop-cle9.onrender.com/collection/lessons/${activity._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stock: -1 })
                }) 
                .then(response => response.json())
                .then(json => {
                    this.cart.push(activity._id);
                    this.loadProducts();
                })
                .catch(err => {
                    console.error('Error updating inventory:', err);
                });
            }
        },
        removeFromCart(id) {
            const index = this.cart.indexOf(id);
            if (index > -1) {
                const activity = this.activities.find(act => act._id === id);
                if (activity) {
                    fetch(`https://mdxbackshop-cle9.onrender.com/collection/lessons/${activity._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stock: 1 })
                    })
                    .then(response => response.json())
                    .then(json => {
                          this.cart.splice(index, 1);
                          this.loadProducts();
                    })
                    .catch(err => {
                        console.error('Error restoring inventory:', err);
                    });
                }
            }
        },
        canAddToCart(activity) {
            return activity.availableInventory > 0;
        },
        cartCount(id) {
            return this.cart.filter(itemId => itemId === id).length;
        },
        toggleCheckout() {
            this.showCheckout = !this.showCheckout;
        },
        submitOrder() {
            // Create detailed cart items array with required fields
            const detailedCart = this.cartDetails.map(item => ({
                lessonID: item._id, // Renamed for clarity, or keep as id if preferred
                id: item._id,       // Explicitly asked for 'id'
                title: item.title,
                location: item.location,
                price: item.price,
                day: item.day, // Added day
                quantity: item.quantity,
                totalPrice: item.price * item.quantity 
            }));

            const newOrder = {
                ...this.order,
                cart: detailedCart
            };
            
            fetch('https://mdxbackshop-cle9.onrender.com/collection/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newOrder)
            })
            .then(response => response.json())
            .then(json => {
                alert('Order submitted!');
                this.cart = [];
                this.showCheckout = false;
                // Note: Inventory was already updated during addToCart, so no need to update it here.
            })
            .catch(error => {
                console.error('Error submitting order:', error);
                alert('Failed to submit order');
            });
        },
        filteredActivities() {
            let filtered = this.activities;

            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(activity =>
                    activity.title.toLowerCase().includes(query) ||
                    activity.location.toLowerCase().includes(query) ||
                    activity.day.toLowerCase().includes(query) ||
                    activity.price.toString().includes(query)
                );
            }

            if (this.sortOption === 'price-asc') {
                filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            } else if (this.sortOption === 'price-desc') {
                filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            } else if (this.sortOption === 'a-z') {
                filtered.sort((a, b) => a.title.localeCompare(b.title));
            } else if (this.sortOption === 'z-a') {
                filtered.sort((a, b) => b.title.localeCompare(a.title));
            } else if (this.sortOption === 'stock-asc') {
                filtered.sort((a, b) => a.availableInventory - b.availableInventory);
            } else if (this.sortOption === 'stock-desc') {
                filtered.sort((a, b) => b.availableInventory - a.availableInventory);
            }

            return filtered;
        }
       
    },
    computed: {
        cartItemCount() {
            return this.cart.length;
        },
        isOrderValid() {
            return this.order.fullName && 
                   this.order.email && 
                   this.order.telephone && 
                   this.order.country && 
                   this.order.city && 
                   this.order.address && 
                   this.cart.length > 0;
        },
        cartDetails() {
            if (this.cart.length === 0) return [];
            
            const counts = {};
            this.cart.forEach(id => {
                counts[id] = (counts[id] || 0) + 1;
            });
            
        
            return Object.keys(counts).map(id => {
                const activity = this.activities.find(act => act._id == id);
                if (!activity) return null;
                
                return {
                    ...activity,
                    quantity: counts[id]
                };
            }).filter(item => item !== null);
        },
        cartTotal() {
            return this.cartDetails.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
        }
    }
});

