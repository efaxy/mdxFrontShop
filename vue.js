let app = new Vue({
	// Mount the Vue instance to the element with id="app"
	el: '#app',

	// Initial state of the application
	data: {
		sitename: 'After School Activities',
		activities: [], // List of all loaded activities from the DB
		order: {
			fullName: '',
			email: '',
			telephone: '',
			country: '',
			city: '',
			address: '',
		},
		cart: [], // Stores only the IDs of items added to the cart
		searchQuery: '', // The user's search input
		sortOption: 'default', // Current sorting selection
		showCheckout: false, // Toggles between the main view and checkout view
	},

	// Lifecycle hook: runs immediately after the instance is created
	created() {
		this.loadProducts()
	},

	methods: {
		// Fetch the list of lessons from the backend
		loadProducts() {
			fetch('https://mdxbackshop-cle9.onrender.com/collection/lessons')
				.then((response) => response.json())
				.then((json) => {
					this.activities = json
				})
				.catch((err) => {
					console.error('Error fetching activities:', err)
				})
		},

		// Add item to cart and decrease inventory on the server
		addToCart(activity) {
			if (this.canAddToCart(activity)) {
				// Send a PUT request to decrease stock by 1
				fetch(
					`https://mdxbackshop-cle9.onrender.com/collection/lessons/${activity._id}`,
					{
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ stock: -1 }),
					}
				)
					.then((response) => response.json())
					.then((json) => {
						this.cart.push(activity._id) // Add ID to local cart array
						this.loadProducts() // Reload data to reflect new stock levels
					})
					.catch((err) => {
						console.error('Error updating inventory:', err)
					})
			}
		},

		// Remove item from cart and restore inventory on the server
		removeFromCart(id) {
			const index = this.cart.indexOf(id)
			if (index > -1) {
				const activity = this.activities.find((act) => act._id === id)
				if (activity) {
					// Send a PUT request to increase stock by 1 (restore it)
					fetch(
						`https://mdxbackshop-cle9.onrender.com/collection/lessons/${activity._id}`,
						{
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ stock: 1 }),
						}
					)
						.then((response) => response.json())
						.then((json) => {
							this.cart.splice(index, 1) // Remove from local cart array
							this.loadProducts()
						})
						.catch((err) => {
							console.error('Error restoring inventory:', err)
						})
				}
			}
		},

		// Check if there is inventory available for the item
		canAddToCart(activity) {
			return activity.availableInventory > 0
		},

		// Helper to count how many of a specific item are in the cart
		cartCount(id) {
			return this.cart.filter((itemId) => itemId === id).length
		},

		// Toggle the view state
		toggleCheckout() {
			this.showCheckout = !this.showCheckout
		},

		// Construct and submit the final order to the backend
		submitOrder() {
			// Prepare a detailed list of items for the order object
			const detailedCart = this.cartDetails.map((item) => ({
				lessonID: item._id,
				id: item._id,
				title: item.title,
				location: item.location,
				price: item.price,
				day: item.day,
				quantity: item.quantity,
				totalPrice: item.price * item.quantity,
			}))

			// Combine form data with the detailed cart data
			const newOrder = {
				...this.order,
				cart: detailedCart,
			}

			// POST the order to the server
			fetch('https://mdxbackshop-cle9.onrender.com/collection/orders', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(newOrder),
			})
				.then((response) => response.json())
				.then((json) => {
					alert('Order submitted!')
					this.cart = [] // Clear the cart
					this.showCheckout = false // Go back to the main page
				})
				.catch((error) => {
					console.error('Error submitting order:', error)
					alert('Failed to submit order')
				})
		},

		// Client-side sorting logic
		filteredActivities() {
			let filtered = this.activities

			// Sorting based on price, title, or stock availability
			if (this.sortOption === 'price-asc') {
				filtered.sort(
					(a, b) => parseFloat(a.price) - parseFloat(b.price)
				)
			} else if (this.sortOption === 'price-desc') {
				filtered.sort(
					(a, b) => parseFloat(b.price) - parseFloat(a.price)
				)
			} else if (this.sortOption === 'a-z') {
				filtered.sort((a, b) => a.title.localeCompare(b.title))
			} else if (this.sortOption === 'z-a') {
				filtered.sort((a, b) => b.title.localeCompare(a.title))
			} else if (this.sortOption === 'stock-asc') {
				filtered.sort(
					(a, b) => a.availableInventory - b.availableInventory
				)
			} else if (this.sortOption === 'stock-desc') {
				filtered.sort(
					(a, b) => b.availableInventory - a.availableInventory
				)
			}

			return filtered
		},
	},

	watch: {
		// Watch the search query input; runs whenever the user types
		searchQuery(val) {
			if (val) {
				// Fetch search results from the backend
				fetch(
					`https://mdxbackshop-cle9.onrender.com/collection/lessons/search?q=${val}`
				)
					.then((response) => response.json())
					.then((json) => {
						this.activities = json
					})
					.catch((err) => {
						console.error('Error searching:', err)
					})
			} else {
				// If the search bar is cleared, reload all products
				this.loadProducts()
			}
		},
	},

	computed: {
		// Returns the total number of items in the cart
		cartItemCount() {
			return this.cart.length
		},

		// Form validation: checks if all required fields are filled and cart is not empty
		isOrderValid() {
			return (
				this.order.fullName &&
				this.order.email &&
				this.order.telephone &&
				this.order.country &&
				this.order.city &&
				this.order.address &&
				this.cart.length > 0
			)
		},

		// Transforms the flat array of IDs into a list of objects with quantity counts
		cartDetails() {
			if (this.cart.length === 0) return []

			// Step 1: Count occurrences of each ID
			const counts = {}
			this.cart.forEach((id) => {
				counts[id] = (counts[id] || 0) + 1
			})

			// Step 2: Map IDs to actual activity objects and add the 'quantity' property
			return Object.keys(counts)
				.map((id) => {
					const activity = this.activities.find(
						(act) => act._id == id
					)
					if (!activity) return null

					return {
						...activity,
						quantity: counts[id],
					}
				})
				.filter((item) => item !== null)
		},

		// Calculates the total cost of all items in the cart
		cartTotal() {
			return this.cartDetails.reduce((total, item) => {
				return total + item.price * item.quantity
			}, 0)
		},
	},
})
