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
            notes: {
                address: "AI-KEA Corporate Office",
            },
            theme: {
                color: "#1F2937",
            },
            retry: {
                enabled: true, // Specific fix for flaky connections
            },
            modal: {
                ondismiss: () => {
                    onFailure({ message: "Payment cancelled by user" });
                }
            }
        };

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
