# Item Permissions Model

## Current Items Management Release

The web Items release is read-only.

Readable items:

- Personal items are readable by the item owner.
- Group items are readable by users who are current members of that group.
- The list view can show all readable items, personal items only, or one or more readable groups.
- The detail view must return a result only when the requested item is readable by the current viewer.

The Supabase RPC layer is the source of truth for read authorization. UI filters are convenience controls, not authorization checks.

## Mutation Gate

Item create, edit, and delete controls stay out of the UI until a separate mutation permissions model is implemented.

Required decisions before enabling mutations:

- Who can edit a group item: group owner only, item creator only, or any group member.
- Who can delete a group item.
- Whether deleting an item is a hard delete, soft delete, or blocked when purchase history exists.
- Whether category changes are global, user-owned, or group-owned.
- Whether purchases remain immutable when item metadata changes.

## Expected Future Shape

Future write operations should use Server Actions or Route Handlers that call scoped mutation RPCs. They should not write directly from Client Components.
