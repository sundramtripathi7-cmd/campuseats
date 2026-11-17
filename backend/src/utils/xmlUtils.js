function xmlEscape(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    return JSON.stringify(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function element(name, value) {
  if (Array.isArray(value)) {
    return `<${name}>` + value.map(v => element('item', v)).join('') + `</${name}>`;
  }
  if (value !== null && typeof value === 'object') {
    const inner = Object.keys(value).map(k => element(k, value[k])).join('');
    return `<${name}>${inner}</${name}>`;
  }
  return `<${name}>${xmlEscape(value)}</${name}>`;
}

function toOrderXml(data) {
  if (Array.isArray(data)) {
    return element('orders', data);
  }
  if (data !== null && typeof data === 'object') {
    return element('order', data);
  }
  return String(data);
}

module.exports = {
  xmlEscape,
  toOrderXml,
};

