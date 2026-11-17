const { validateMenuItem, validateAvailability } = require('../models/menuItemModel');
const {
  createItem,
  getItem,
  listItems,
  updateAvailability,
  updateItem,
  deleteItem,
  getIdempotencyResult,
  saveIdempotencyResult,
  createCatalogPayment,
} = require('../services/catalogService');
const { etagFor, etagMatches } = require('../utils/etag');
const { sendProblem } = require('../utils/problemDetails');

async function createMenuItem(req, res) {
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return sendProblem(
      res,
      400,
      'Bad Request',
      'Idempotency-Key header is required',
      'https://campuseats.example/problems/400'
    );
  }

  const key = `menu-item-create:${idempotencyKey}`;
  const previousResult = getIdempotencyResult(key);

  if (previousResult) {
    res.setHeader('Location', previousResult.location);
    res.setHeader('ETag', previousResult.etag);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(previousResult.status).json(previousResult.body);
  }

  let item;
  try {
    item = validateMenuItem(req.body);
  } catch (error) {
    return sendProblem(
      res,
      400,
      'Bad Request',
      error.message,
      'https://campuseats.example/problems/400'
    );
  }

  const createdItem = await createItem(item);
  const location = `/menu-items/${createdItem.id}`;
  const etag = etagFor(createdItem);

  saveIdempotencyResult(key, {
    body: createdItem,
    status: 201,
    location,
    etag,
  });

  res.setHeader('Location', location);
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(201).json(createdItem);
}

async function getMenuItem(req, res) {
  const item = await getItem(req.params.id);

  if (!item) {
    return sendProblem(
      res,
      404,
      'Not Found',
      'Menu item not found',
      'https://campuseats.example/problems/404'
    );
  }

  const etag = etagFor(item);
  const ifNoneMatch = req.headers['if-none-match'];

  if (etagMatches(ifNoneMatch, etag)) {
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(304).end();
  }

  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'private, max-age=60');
  return res.status(200).json(item);
}

async function getMenuItems(req, res) {
  const category = req.query.category || null;
  const sortBy = (req.query.sort || 'id').toLowerCase();
  const order = (req.query.order || 'asc').toLowerCase();

  const pageStr = req.query.page || '1';
  const limitStr = req.query.limit || '10';

  const page = parseInt(pageStr, 10);
  const limit = parseInt(limitStr, 10);

  if (isNaN(page) || isNaN(limit) || String(page) !== String(pageStr) || String(limit) !== String(limitStr)) {
    return sendProblem(
      res,
      400,
      'Bad Request',
      'page and limit must be integers',
      'https://campuseats.example/problems/400'
    );
  }

  if (page < 1 || limit < 1 || limit > 100) {
    return sendProblem(
      res,
      400,
      'Bad Request',
      'page must be >= 1 and limit must be between 1 and 100',
      'https://campuseats.example/problems/400'
    );
  }

  const validSorts = new Set(['id', 'name', 'category', 'price']);
  if (!validSorts.has(sortBy)) {
    return sendProblem(
      res,
      400,
      'Bad Request',
      'sort must be one of id, name, category, price',
      'https://campuseats.example/problems/400'
    );
  }

  if (order !== 'asc' && order !== 'desc') {
    return sendProblem(
      res,
      400,
      'Bad Request',
      'order must be asc or desc',
      'https://campuseats.example/problems/400'
    );
  }

  let items = await listItems(category);

  items.sort((a, b) => {
    let aVal, bVal;
    if (sortBy === 'id') {
      aVal = parseInt(a.id, 10);
      bVal = parseInt(b.id, 10);
    } else if (sortBy === 'price') {
      aVal = a.price;
      bVal = b.price;
    } else {
      aVal = String(a[sortBy]).toLowerCase();
      bVal = String(b[sortBy]).toLowerCase();
    }

    if (aVal < bVal) return order === 'desc' ? 1 : -1;
    if (aVal > bVal) return order === 'desc' ? -1 : 1;
    return 0;
  });

  const start = (page - 1) * limit;
  const paginated = items.slice(start, start + limit);

  res.setHeader('Cache-Control', 'private, max-age=30');
  return res.status(200).json(paginated);
}

async function changeAvailability(req, res) {
  let validated;
  try {
    validated = validateAvailability(req.body);
  } catch (error) {
    return sendProblem(
      res,
      400,
      'Bad Request',
      error.message,
      'https://campuseats.example/problems/400'
    );
  }

  const item = await getItem(req.params.id);
  if (!item) {
    return sendProblem(
      res,
      404,
      'Not Found',
      'Menu item not found',
      'https://campuseats.example/problems/404'
    );
  }

  const currentEtag = etagFor(item);
  const ifMatch = req.headers['if-match'];

  if (ifMatch && ifMatch !== '*' && ifMatch !== currentEtag) {
    return sendProblem(
      res,
      412,
      'Precondition Failed',
      'Resource changed since the client last read it',
      'https://campuseats.example/problems/412'
    );
  }

  if (item.available === validated.available) {
    return sendProblem(
      res,
      409,
      'Conflict',
      'Menu item is already in the requested availability state',
      'https://campuseats.example/problems/409'
    );
  }

  const updatedItem = await updateAvailability(req.params.id, validated.available);
  const newEtag = etagFor(updatedItem);

  res.setHeader('ETag', newEtag);
  res.setHeader('Cache-Control', 'private, max-age=60');
  return res.status(200).json(updatedItem);
}

async function updateMenuItemHandler(req, res) {
  let validated;
  try {
    validated = validateMenuItem(req.body);
  } catch (error) {
    return sendProblem(
      res,
      400,
      'Bad Request',
      error.message,
      'https://campuseats.example/problems/400'
    );
  }

  const updated = await updateItem(req.params.id, validated);
  if (!updated) {
    return sendProblem(
      res,
      404,
      'Not Found',
      'Menu item not found',
      'https://campuseats.example/problems/404'
    );
  }

  const etag = etagFor(updated);
  res.setHeader('ETag', etag);
  return res.status(200).json(updated);
}

async function deleteMenuItemHandler(req, res) {
  const deleted = await deleteItem(req.params.id);
  if (!deleted) {
    return sendProblem(
      res,
      404,
      'Not Found',
      'Menu item not found',
      'https://campuseats.example/problems/404'
    );
  }
  return res.status(204).end();
}

async function catalogPayment(req, res) {
  const data = req.body;

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return sendProblem(
      res,
      400,
      'Bad Request',
      'Request body must be a JSON object',
      'https://campuseats.example/problems/400'
    );
  }

  const required = ['orderId', 'cardToken', 'amount', 'currency'];
  for (const field of required) {
    if (data[field] === undefined) {
      return sendProblem(
        res,
        400,
        'Bad Request',
        `${field} is required`,
        'https://campuseats.example/problems/400'
      );
    }
  }

  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    return sendProblem(
      res,
      400,
      'Bad Request',
      'Idempotency-Key header is required',
      'https://campuseats.example/problems/400'
    );
  }

  const paymentResponse = await createCatalogPayment(data, idempotencyKey);
  if (!paymentResponse) {
    return sendProblem(
      res,
      503,
      'Service Unavailable',
      'Payment Service is unavailable',
      'https://campuseats.example/problems/503'
    );
  }

  const body = await paymentResponse.text();
  res.status(paymentResponse.status);

  for (const [name, value] of paymentResponse.headers.entries()) {
    if (['content-type', 'location', 'etag'].includes(name.toLowerCase())) {
      res.setHeader(name, value);
    }
  }

  return res.send(body);
}

function optionsMenuItems(req, res) {
  const path = req.path.replace(/\/+$/, '') || '/';
  let allow = 'OPTIONS';

  if (path === '/menu-items') {
    allow = 'GET, POST, OPTIONS';
  } else if (path.startsWith('/menu-items/') && path.endsWith('/availability')) {
    allow = 'POST, OPTIONS';
  } else if (path.startsWith('/menu-items/')) {
    allow = 'GET, OPTIONS';
  } else if (path === '/catalog-payments' || path === '/graphql') {
    allow = 'POST, OPTIONS';
  }

  const origin = req.headers['origin'] || 'http://localhost:3000';
  res.setHeader('Allow', allow);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', allow);
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ||
      'Authorization, Content-Type, Accept, Idempotency-Key, If-Match, If-None-Match'
  );
  res.setHeader('Access-Control-Max-Age', '600');
  return res.status(204).end();
}

module.exports = {
  createMenuItem,
  getMenuItem,
  getMenuItems,
  changeAvailability,
  updateMenuItemHandler,
  deleteMenuItemHandler,
  catalogPayment,
  optionsMenuItems,
};

