import { functions } from './firebaseConfig';
import { httpsCallable } from 'firebase/functions';

/**
 * Loads the Razorpay checkout script dynamically.
 * @returns {Promise<boolean>}
 */
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

/**
 * Initiates the payment process.
 * @param {Object} orderDetails - { amount, receipt, userEmail, userContact }
 * @param {Function} onSuccess - Callback when payment is successful
 * @param {Function} onFailure - Callback when payment fails or is dismissed
 */
export const initiatePayment = async (orderDetails, onSuccess, onFailure) => {
    const { amount, receipt, userEmail, userContact } = orderDetails;

    // 1. Load Script (Ideally should be pre-loaded)
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
        onFailure({ message: "Razorpay SDK failed to load. Are you online?" });
        return;
    }

    try {
        // 2. Create Order on Server
        const createRazorpayOrder = httpsCallable(functions, 'createRazorpayOrder');
        const response = await createRazorpayOrder({ amount, receipt });
        const { id: order_id, currency, amount: order_amount } = response.data;

        // 3. Open Razorpay Checkout
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order_amount.toString(),
            currency: currency,
            name: "AI-KEA Furniture",
            description: "Custom Furniture Order",
            order_id: order_id,
            handler: onSuccess, // Simplified handler passing
            prefill: {
                email: userEmail || "",
                contact: userContact || "",
            },
            theme: {
                color: "#1F2937",
            },
            notes: {
                address: "AI-KEA Corporate Office",
            },
        };

        // --- iOS OPTIMIZATION: Use Redirect Flow ---
        // Safari on iOS blocks frames/popups. We force a redirect by adding callback_url.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        if (isIOS) {
            // Redirect to Cloud Function which handles the POST callback, verification, and DB update.
            // Then it redirects back to the app with ?payment_success=true
            const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
            const firestoreOrderId = receipt.replace('order_', ''); // Extract real ID

            // Construct Cloud Function URL (assuming default region us-central1)
            // If we change region, we must update this.
            options.callback_url = `https://us-central1-${projectId}.cloudfunctions.net/handlePaymentCallback?orderId=${firestoreOrderId}`;
        } else {
            // Standard Popup Handler for Desktop/Android
            options.handler = onSuccess;
            options.retry = { enabled: true };
            options.modal = {
                ondismiss: () => {
                    onFailure({ message: "Payment cancelled by user" });
                }
            };
        }

        const paymentObject = new window.Razorpay(options);

        // ios-fix: Handle potential failure in opening
        paymentObject.on('payment.failed', function (response) {
            console.error("Payment Failed Event:", response.error);
            onFailure(response.error);
        });

        paymentObject.open();

    } catch (error) {
        console.error("Payment Initiation Error:", error);
        onFailure({ message: error.message || "Could not initiate payment" });
    }
};
