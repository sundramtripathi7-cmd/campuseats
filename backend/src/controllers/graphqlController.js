const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  graphql,
} = require('graphql');
const { validateMenuItem } = require('../models/menuItemModel');
const {
  createItem,
  getItem,
  listItems,
  updateAvailability,
} = require('../services/catalogService');
const { sendProblem } = require('../utils/problemDetails');

const MenuItemType = new GraphQLObjectType({
  name: 'MenuItemType',
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    category: { type: GraphQLString },
    price: { type: GraphQLFloat },
    available: { type: GraphQLBoolean },
  },
});

const CreateMenuItemPayload = new GraphQLObjectType({
  name: 'CreateMenuItemPayload',
  fields: {
    menuItem: { type: MenuItemType },
  },
});

const UpdateMenuAvailabilityPayload = new GraphQLObjectType({
  name: 'UpdateMenuAvailabilityPayload',
  fields: {
    menuItem: { type: MenuItemType },
  },
});

const RootQuery = new GraphQLObjectType({
  name: 'Query',
  fields: {
    menuItems: {
      type: new GraphQLList(MenuItemType),
      args: {
        category: { type: GraphQLString },
      },
      resolve: async (root, args) => {
        return await listItems(args.category);
      },
    },
    menuItem: {
      type: MenuItemType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (root, args) => {
        return await getItem(args.id);
      },
    },
  },
});

const RootMutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createMenuItem: {
      type: CreateMenuItemPayload,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        category: { type: new GraphQLNonNull(GraphQLString) },
        price: { type: new GraphQLNonNull(GraphQLFloat) },
        available: { type: GraphQLBoolean, defaultValue: true },
      },
      resolve: async (root, args) => {
        const item = validateMenuItem({
          name: args.name,
          category: args.category,
          price: args.price,
          available: args.available !== undefined ? args.available : true,
        });
        const created = await createItem(item);
        return { menuItem: created };
      },
    },
    updateMenuAvailability: {
      type: UpdateMenuAvailabilityPayload,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        available: { type: new GraphQLNonNull(GraphQLBoolean) },
      },
      resolve: async (root, args) => {
        const updated = await updateAvailability(args.id, args.available);
        if (!updated) {
          throw new Error('Menu item not found');
        }
        return { menuItem: updated };
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: RootMutation,
});

async function handleGraphQL(req, res) {
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

  const query = data.query;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return sendProblem(
      res,
      400,
      'Bad Request',
      'A non-empty GraphQL query is required',
      'https://campuseats.example/problems/400'
    );
  }

  const result = await graphql({
    schema,
    source: query,
    variableValues: data.variables || null,
    operationName: data.operationName || null,
  });

  const responseBody = {};
  if (result.errors && result.errors.length > 0) {
    responseBody.errors = result.errors.map(err => ({ message: err.message }));
  }
  if (result.data !== undefined) {
    responseBody.data = result.data;
  }

  return res.status(200).json(responseBody);
}

module.exports = {
  schema,
  handleGraphQL,
};

