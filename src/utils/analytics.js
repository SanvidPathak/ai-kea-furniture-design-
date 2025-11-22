/**
 * Analytics utility for tracking user events and page views
 *
 * To enable Google Analytics:
 * 1. Add your GA4 Measurement ID to .env as VITE_GA_MEASUREMENT_ID
 * 2. Add the GA script to index.html
 * 3. Events will automatically be tracked
 */

const isDevelopment = import.meta.env.MODE === 'development';
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Initialize analytics
 */
export function initAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    if (isDevelopment) {
      console.log('[Analytics] No measurement ID found. Analytics disabled.');
    }
    return;
  }

  // GA4 will be initialized via the script tag in index.html
  if (isDevelopment) {
    console.log('[Analytics] Initialized with ID:', GA_MEASUREMENT_ID);
  }
}

/**
 * Track a page view
 * @param {string} path - Page path
 * @param {string} title - Page title
 */
export function trackPageView(path, title) {
  if (isDevelopment) {
    console.log('[Analytics] Page View:', { path, title });
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  }
}

/**
 * Track a custom event
 * @param {string} category - Event category
 * @param {string} action - Event action
 * @param {string} label - Event label (optional)
 * @param {number} value - Event value (optional)
 */
export function trackEvent(category, action, label, value) {
  if (isDevelopment) {
    console.log('[Analytics] Event:', { category, action, label, value });
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

/**
 * Track design creation
 * @param {string} furnitureType - Type of furniture
 * @param {string} material - Material used
 * @param {number} cost - Total cost
 */
export function trackDesignCreated(furnitureType, material, cost) {
  trackEvent('Design', 'create', furnitureType, cost);

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'design_created', {
      furniture_type: furnitureType,
      material: material,
      cost: cost,
    });
  }
}

/**
 * Track order placement
 * @param {string} designId - Design ID
 * @param {number} amount - Order amount
 */
export function trackOrderPlaced(designId, amount) {
  trackEvent('Order', 'place', designId, amount);

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'purchase', {
      transaction_id: designId,
      value: amount,
      currency: 'INR',
    });
  }
}

/**
 * Track export action
 * @param {string} exportType - Type of export (pdf, csv, instructions)
 * @param {string} designType - Type of design
 */
export function trackExport(exportType, designType) {
  trackEvent('Export', exportType, designType);
}

/**
 * Track search
 * @param {string} searchTerm - Search term used
 * @param {string} context - Where search happened (designs, orders)
 */
export function trackSearch(searchTerm, context) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'search', {
      search_term: searchTerm,
      context: context,
    });
  }
}

/**
 * Track user signup
 * @param {string} method - Signup method (email, google)
 */
export function trackSignup(method) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'sign_up', {
      method: method,
    });
  }
}

/**
 * Track user login
 * @param {string} method - Login method (email, google)
 */
export function trackLogin(method) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'login', {
      method: method,
    });
  }
}
