const { graphql } = require('graphql');
const request = require('supertest');
const app = require('../src/app');
const { schema } = require('../src/controllers/graphqlController');
const { clearStore } = require('../src/services/catalogService');
const { clearRateState } = require('../src/middleware/rateLimiter');

const TOKEN = 'campuseats-demo-token';
const AUTH = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/json',
};

beforeEach(() => {
  clearStore();
  clearRateState();
});

describe('GraphQL API', () => {
  test('test_menu_items_query', async () => {
    const query = `
    {
      menuItems {
        id
        name
        category
        price
        available
      }
    }
    `;

    const result = await graphql({ schema, source: query });
    expect(result.errors).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data.menuItems).toBeDefined();
    expect(Array.isArray(result.data.menuItems)).toBe(true);
  });

  test('test_create_menu_item', async () => {
    const mutation = `
    mutation {
      createMenuItem(
        name: "Test Burger"
        category: "Fast Food"
        price: 80.0
      ) {
        menuItem {
          id
          name
          category
          price
          available
        }
      }
    }
    `;

    const result = await graphql({ schema, source: mutation });
    expect(result.errors).toBeUndefined();

    const item = result.data.createMenuItem.menuItem;
    expect(item.name).toBe('Test Burger');
    expect(item.category).toBe('Fast Food');
    expect(item.price).toBe(80.0);
    expect(item.available).toBe(true);
  });

  test('test_update_menu_availability', async () => {
    // 1. Create a menu item
    const createMutation = `
    mutation {
      createMenuItem(
        name: "Availability Test Pizza"
        category: "Pizza"
        price: 199.0
      ) {
        menuItem {
          id
          name
          available
        }
      }
    }
    `;

    const createResult = await graphql({ schema, source: createMutation });
    expect(createResult.errors).toBeUndefined();

    const createdItem = createResult.data.createMenuItem.menuItem;
    const itemId = createdItem.id;

    // 2. Update its availability
    const updateMutation = `
    mutation {
      updateMenuAvailability(
        id: "${itemId}"
        available: false
      ) {
        menuItem {
          id
          name
          available
        }
      }
    }
    `;

    const updateResult = await graphql({ schema, source: updateMutation });
    expect(updateResult.errors).toBeUndefined();

    const updatedItem = updateResult.data.updateMenuAvailability.menuItem;
    expect(updatedItem.id).toBe(itemId);
    expect(updatedItem.name).toBe('Availability Test Pizza');
    expect(updatedItem.available).toBe(false);
  });

  test('test_graphql_http_endpoint', async () => {
    const res = await request(app)
      .post('/graphql')
      .set(AUTH)
      .send({
        query: `
          mutation AddItem($name: String!, $category: String!, $price: Float!) {
            createMenuItem(name: $name, category: $category, price: $price) {
              menuItem { id name price }
            }
          }
        `,
        variables: { name: 'HTTP Burger', category: 'Fast Food', price: 90 },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.createMenuItem.menuItem.name).toBe('HTTP Burger');
  });
});

