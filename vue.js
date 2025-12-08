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
        sortOption: 'default'
    },
    created() {
        // Fetch activities from the backend
        // Replace this URL with your actual API endpoint
        fetch('https://mdxbackshop-cle9.onrender.com/collection/lessons')
            .then(response => response.json())
            .then(json => {
                this.activities = json;
            })
            .catch(err => {
                console.error('Error fetching activities:', err);
            });
    },
    methods: {
        addToCart(activity) {
            if (this.canAddToCart(activity)) {
                this.cart.push(activity.id);
            }
        },
        canAddToCart(activity) {
            return activity.availableInventory > this.cartCount(activity.id);
        },
        cartCount(id) {
            return this.cart.filter(itemId => itemId === id).length;
        },
        filteredActivities() {
            let filtered = this.activities;

            if (this.searchQuery) {
                filtered = filtered.filter(activity =>
                    activity.title.toLowerCase().includes(this.searchQuery.toLowerCase())
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
            }

            return filtered;
        }
    },
    computed: {
        cartItemCount() {
            return this.cart.length;
        }
    }
});

