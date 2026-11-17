function validateOrder(data, knownMenuItems = {}) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return [{ field: 'body', message: 'must be a JSON object' }];
  }

  const items = data.items;
  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ field: 'items', message: 'must be a non-empty array' });
  } else {
    items.forEach((item, i) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push({ field: `items[${i}]`, message: 'must be an object' });
        return;
      }

      const q = item.qty;
      if (typeof q === 'boolean' || !Number.isInteger(q) || q < 1) {
        errors.push({
          field: `items[${i}].qty`,
          message: 'must be an integer greater than or equal to 1',
        });
      }

      const mid = String(item.menuItemId || '');
      if (!mid) {
        errors.push({ field: `items[${i}].menuItemId`, message: 'is required' });
      } else if (knownMenuItems && Object.keys(knownMenuItems).length > 0 && !knownMenuItems[mid]) {
        errors.push({
          field: `items[${i}].menuItemId`,
          message: 'does not identify a known menu item',
        });
      }
    });
  }

  if (typeof data.address !== 'string' || !data.address.trim()) {
    errors.push({
      field: 'address',
      message: 'is required and must be a non-empty string',
    });
  }

  return errors;
}

module.exports = {
  validateOrder,
};

