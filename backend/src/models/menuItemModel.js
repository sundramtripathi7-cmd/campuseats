function validateMenuItem(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Request body must be a JSON object');
  }

  if (data.name === undefined) {
    throw new Error('name is required');
  }
  if (data.category === undefined) {
    throw new Error('category is required');
  }
  if (data.price === undefined) {
    throw new Error('price is required');
  }

  if (typeof data.name !== 'string' || !data.name.trim()) {
    throw new Error('name must be a non-empty string');
  }
  if (typeof data.category !== 'string' || !data.category.trim()) {
    throw new Error('category must be a non-empty string');
  }
  if (typeof data.price === 'boolean' || typeof data.price !== 'number' || isNaN(data.price) || data.price < 0) {
    throw new Error('price must be a non-negative number');
  }
  if (data.available !== undefined && typeof data.available !== 'boolean') {
    throw new Error('available must be a boolean');
  }

  return {
    name: data.name.trim(),
    category: data.category.trim(),
    price: Number(data.price),
    available: data.available !== undefined ? Boolean(data.available) : true,
  };
}

function validateAvailability(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Request body must be a JSON object');
  }
  if (data.available === undefined) {
    throw new Error('available is required');
  }
  if (typeof data.available !== 'boolean') {
    throw new Error('available must be a boolean');
  }
  return { available: data.available };
}

module.exports = {
  validateMenuItem,
  validateAvailability,
};

