/* Campus Eats frontend. Demo token is for local coursework only; do not expose production secrets in browser code. */
const GRAPHQL_URL = '/graphql';
const DEMO_TOKEN = 'campuseats-demo-token';
let menuItems = [];

const $ = (id) => document.getElementById(id);
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

async function graphql(query, variables = {}) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${DEMO_TOKEN}`
    },
    body: JSON.stringify({ query, variables })
  });
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error(`Server returned an invalid response (HTTP ${response.status}).`); }
  if (!response.ok) throw new Error(payload?.message || `Request failed (HTTP ${response.status}).`);
  if (payload.errors?.length) throw new Error(payload.errors.map(e => e.message).join('; '));
  return payload.data;
}

function foodEmoji(category = '', name = '') {
  const text = `${category} ${name}`.toLowerCase();
  if (/pizza/.test(text)) return '🍕';
  if (/burger/.test(text)) return '🍔';
  if (/drink|juice|coffee|tea|beverage/.test(text)) return '🥤';
  if (/dessert|cake|sweet|ice cream/.test(text)) return '🍰';
  if (/sandwich|wrap|roll/.test(text)) return '🌯';
  if (/salad/.test(text)) return '🥗';
  if (/rice|biryani|meal|thali/.test(text)) return '🍛';
  if (/snack|fries|fry/.test(text)) return '🍟';
  return '🍽️';
}

async function loadMenu() {
  const status = $('statusMessage');
  status.classList.remove('error');
  status.textContent = 'Loading menu from GraphQL…';
  $('menuGrid').innerHTML = '';
  try {
    const data = await graphql(`query GetMenu { menuItems { id name category price available } }`);
    menuItems = data.menuItems || [];
    fillCategories();
    fillUpdateSelect();
    renderMenu();
    updateStats();
    status.textContent = `Loaded ${menuItems.length} menu item${menuItems.length === 1 ? '' : 's'} from GraphQL.`;
  } catch (error) {
    status.classList.add('error');
    status.textContent = `Could not load menu: ${error.message}. Check that the backend server is running and /graphql is available.`;
  }
}

function fillCategories() {
  const select = $('categoryFilter');
  const current = select.value;
  const categories = [...new Set(menuItems.map(item => item.category).filter(Boolean))].sort((a,b) => a.localeCompare(b));
  select.innerHTML = '<option value="">All categories</option>' + categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if (categories.includes(current)) select.value = current;
}

function fillUpdateSelect() {
  const select = $('updateItemId');
  const current = select.value;
  select.innerHTML = menuItems.length
    ? '<option value="">Choose a menu item</option>' + menuItems.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} (ID: ${escapeHtml(item.id)})</option>`).join('')
    : '<option value="">No menu items available</option>';
  if (menuItems.some(item => String(item.id) === current)) select.value = current;
}

function renderMenu() {
  const search = $('searchInput').value.trim().toLowerCase();
  const category = $('categoryFilter').value;
  const availability = $('availabilityFilter').value;
  const filtered = menuItems.filter(item => {
    const matchesSearch = `${item.name} ${item.category} ${item.id}`.toLowerCase().includes(search);
    const matchesCategory = !category || item.category === category;
    const matchesAvailability = availability === 'all' || (availability === 'available' ? Boolean(item.available) : !item.available);
    return matchesSearch && matchesCategory && matchesAvailability;
  });
  $('menuGrid').innerHTML = filtered.map(item => `
    <article class="menu-card">
      <div class="food-card-top"><span class="food-symbol">${foodEmoji(item.category, item.name)}</span><span class="availability ${item.available ? '' : 'off'}">${item.available ? '● AVAILABLE' : '● UNAVAILABLE'}</span></div>
      <h3>${escapeHtml(item.name)}</h3><p class="category-label">${escapeHtml(item.category || 'Uncategorized')}</p>
      <div class="food-card-bottom"><span class="price">${money(item.price)} <small>/ item</small></span><span class="item-id">ID #${escapeHtml(item.id)}</span></div>
    </article>`).join('');
  $('emptyState').classList.toggle('hidden', filtered.length > 0);
}

function updateStats() {
  $('totalCount').textContent = menuItems.length;
  $('availableCount').textContent = menuItems.filter(item => item.available).length;
  const avg = menuItems.length ? menuItems.reduce((sum, item) => sum + Number(item.price || 0), 0) / menuItems.length : 0;
  $('averagePrice').textContent = money(avg);
}

$('searchInput').addEventListener('input', renderMenu);
$('categoryFilter').addEventListener('change', renderMenu);
$('availabilityFilter').addEventListener('change', renderMenu);
$('refreshBtn').addEventListener('click', loadMenu);

$('createForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = $('createMessage');
  message.className = 'form-message';
  message.textContent = 'Creating item…';
  const name = $('itemName').value.trim();
  const category = $('itemCategory').value.trim();
  const price = Number($('itemPrice').value);
  const available = $('itemAvailable').checked;
  try {
    const data = await graphql(`mutation CreateMenuItem($name: String!, $category: String!, $price: Float!, $available: Boolean) {
      createMenuItem(name: $name, category: $category, price: $price, available: $available) {
        menuItem { id name category price available }
      }
    }`, { name, category, price, available });
    const created = data.createMenuItem?.menuItem;
    message.textContent = created ? `Created “${created.name}” successfully.` : 'Mutation completed, but no item was returned.';
    $('createForm').reset();
    $('itemAvailable').checked = true;
    await loadMenu();
  } catch (error) {
    message.classList.add('error');
    message.textContent = `Could not create item: ${error.message}`;
  }
});

$('availabilityForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = $('updateMessage');
  message.className = 'form-message';
  const id = $('updateItemId').value;
  if (!id) { message.classList.add('error'); message.textContent = 'Please select a menu item first.'; return; }
  message.textContent = 'Updating availability…';
  try {
    const data = await graphql(`mutation UpdateAvailability($id: ID!, $available: Boolean!) {
      updateMenuAvailability(id: $id, available: $available) {
        menuItem { id name available }
      }
    }`, { id, available: $('updatedAvailable').checked });
    const updated = data.updateMenuAvailability?.menuItem;
    message.textContent = updated ? `Availability updated for “${updated.name}”.` : 'Mutation completed, but no item was returned.';
    await loadMenu();
    $('updateItemId').value = id;
    const item = menuItems.find(entry => String(entry.id) === String(id));
    if (item) $('updatedAvailable').checked = Boolean(item.available);
  } catch (error) {
    message.classList.add('error');
    message.textContent = `Could not update item: ${error.message}`;
  }
});

$('updateItemId').addEventListener('change', () => {
  const item = menuItems.find(entry => String(entry.id) === $('updateItemId').value);
  if (item) $('updatedAvailable').checked = Boolean(item.available);
});

loadMenu();
