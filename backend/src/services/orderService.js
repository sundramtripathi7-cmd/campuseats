const crypto = require('crypto');

const defaultMenu = {
  '1': { id: '1', name: 'Veg Burger', price: 80.0, available: true },
  '2': { id: '2', name: 'Paneer Roll', price: 100.0, available: true },
};

let menu = { ...defaultMenu };
let orders = new Map();
const idempotency = new Map();

const allowedTransitions = {
  created: new Set(['paid', 'cancelled']),
  paid: new Set(['preparing', 'cancelled']),
  preparing: new Set(['ready']),
  ready: new Set(['completed']),
  completed: new Set(),
  cancelled: new Set(),
};

function getMenu() {
  return menu;
}

function setMenu(newMenu) {
  menu = { ...newMenu };
}

function listOrders() {
  return Array.from(orders.values());
}

function getOrder(id) {
  return orders.get(String(id)) || null;
}

function createOrder(data, idempotencyKey = null) {
  if (idempotencyKey && idempotency.has(idempotencyKey)) {
    return {
      isIdempotent: true,
      cached: idempotency.get(idempotencyKey),
    };
  }

  // Check if ALL requested menu items are unavailable
  const allUnavailable = data.items.every(i => {
    const item = menu[String(i.menuItemId)];
    return item && !item.available;
  });

  if (allUnavailable) {
    const err = new Error('No requested menu items are currently available');
    err.status = 409;
    err.title = 'Items Unavailable';
    err.type = 'item-unavailable';
    throw err;
  }

  // Calculate total and check individual item availability
  let total = 0;
  for (const i of data.items) {
    const item = menu[String(i.menuItemId)];
    if (!item || !item.available) {
      const err = new Error(`Menu item ${item ? item.id : i.menuItemId} is unavailable`);
      err.status = 409;
      err.title = 'Item Unavailable';
      err.type = 'item-unavailable';
      throw err;
    }
    total += item.price * i.qty;
  }

  const orderId = crypto.randomUUID().slice(0, 8);
  const order = {
    id: orderId,
    items: data.items,
    address: data.address.trim(),
    status: 'created',
    total: Math.round(total * 100) / 100,
  };

  orders.set(orderId, order);
  const location = `/orders/${orderId}`;

  const result = {
    order,
    status: 201,
    location,
  };

  if (idempotencyKey) {
    idempotency.set(idempotencyKey, {
      body: order,
      status: 201,
      location,
    });
  }

  return {
    isIdempotent: false,
    ...result,
  };
}

function updateOrderStatus(id, newStatus, simulatePayment = null) {
  const order = orders.get(String(id));
  if (!order) {
    const err = new Error('No order exists with this id');
    err.status = 404;
    err.title = 'Order Not Found';
    err.type = 'order-not-found';
    throw err;
  }

  const allowed = allowedTransitions[order.status] || new Set();
  if (!allowed.has(newStatus)) {
    const err = new Error(`Cannot change order from ${order.status} to ${newStatus}`);
    err.status = 409;
    err.title = 'Illegal Transition';
    err.type = 'illegal-transition';
    throw err;
  }

  if (newStatus === 'paid') {
    if (simulatePayment === 'unavailable') {
      const err = new Error('Payment processor is temporarily unavailable');
      err.status = 503;
      err.title = 'Service Unavailable';
      err.type = 'payment-service-unavailable';
      err.retryAfter = '5';
      throw err;
    }
    if (simulatePayment === 'declined') {
      const err = new Error('Payment was declined; no order status change was made');
      err.status = 402;
      err.title = 'Payment Declined';
      err.type = 'payment-declined';
      throw err;
    }
  }

  order.status = newStatus;
  return order;
}

function deleteOrder(id) {
  const order = orders.get(String(id));
  if (!order) {
    const err = new Error('No order exists with this id');
    err.status = 404;
    err.title = 'Order Not Found';
    err.type = 'order-not-found';
    throw err;
  }

  if (order.status !== 'created' && order.status !== 'cancelled') {
    const err = new Error('Only a created order can be deleted');
    err.status = 409;
    err.title = 'Illegal Transition';
    err.type = 'illegal-transition';
    throw err;
  }

  orders.delete(String(id));
  return true;
}

function clearOrders() {
  orders.clear();
  idempotency.clear();
  menu = { ...defaultMenu };
}

module.exports = {
  getMenu,
  setMenu,
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  clearOrders,
};

