
import graphene

from models import validate_menu_item
from store import create_item, get_item, list_items, update_availability


class MenuItemType(graphene.ObjectType):
    id = graphene.ID()
    name = graphene.String()
    category = graphene.String()
    price = graphene.Float()
    available = graphene.Boolean()


class Query(graphene.ObjectType):
    menu_items = graphene.List(
        MenuItemType,
        category=graphene.String()
    )

    menu_item = graphene.Field(
        MenuItemType,
        id=graphene.ID(required=True)
    )

    def resolve_menu_items(root, info, category=None):
        return list_items(category)

    def resolve_menu_item(root, info, id):
        return get_item(str(id))


class CreateMenuItem(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        category = graphene.String(required=True)
        price = graphene.Float(required=True)
        available = graphene.Boolean(default_value=True)

    menu_item = graphene.Field(MenuItemType)

    def mutate(root, info, name, category, price, available=True):
        item = validate_menu_item({
            "name": name,
            "category": category,
            "price": price,
            "available": available,
        })

        created_item = create_item(item)
        return CreateMenuItem(menu_item=created_item)


class UpdateMenuAvailability(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        available = graphene.Boolean(required=True)

    menu_item = graphene.Field(MenuItemType)

    def mutate(root, info, id, available):
        updated_item = update_availability(str(id), available)

        if updated_item is None:
            raise Exception("Menu item not found")

        return UpdateMenuAvailability(menu_item=updated_item)


class Mutation(graphene.ObjectType):
    create_menu_item = CreateMenuItem.Field()
    update_menu_availability = UpdateMenuAvailability.Field()


schema = graphene.Schema(
    query=Query,
    mutation=Mutation
)
