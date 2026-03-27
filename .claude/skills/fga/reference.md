# OpenFGA Quick Reference

## DSL Syntax

### Model Header
```
model
  schema 1.1
```

### Type Definition
```
type <type_name>
  relations
    define <relation_name>: <relation_definition>
```

## Relation Patterns

### Direct Assignment
```
define owner: [user]                    # Only users
define viewer: [user, team#member]      # Users or team members
```

### Concentric (Inheritance)
```
define viewer: [user] or editor         # Viewer if assigned OR if editor
```

### Indirect (X from Y)
```
define admin: [user] or admin from org  # Admin if assigned OR admin of parent org
```

### Computed Permission
```
define can_read: viewer or owner        # Permission based on other relations
```

### Conditional
```
define admin: [user with non_expired]
condition non_expired(current_time: timestamp, expiry: timestamp) {
  current_time < expiry
}
```

## Common Type Restrictions

| Syntax | Meaning |
|--------|---------|
| `[user]` | Only individual users |
| `[user, team#member]` | Users or team members |
| `[user:*]` | All users (wildcard) |
| `[user with condition]` | Users meeting condition |

## Test File Structure

```yaml
name: Test Name
model_file: ./model.fga
tuples:
  - user: user:alice
    relation: owner
    object: doc:readme

tests:
  - name: Check Tests
    check:
      - user: user:alice
        object: doc:readme
        assertions:
          owner: true
          viewer: true

  - name: List Objects
    list_objects:
      - user: user:alice
        type: document
        assertions:
          viewer:
            - doc:readme

  - name: List Users
    list_users:
      - object: doc:readme
        user_filter:
          - type: user
        assertions:
          viewer:
            users:
              - user:alice
```

## CLI Commands

```bash
# Test model
fga model test --tests model.fga.yaml

# Validate model
fga model validate --file model.fga

# Transform JSON to DSL
fga model transform --file model.json

# Create store
fga store create --name "My Store"

# Write authorization model
fga model write --store-id <id> --file model.fga
```

## Common Patterns

### Organization Multi-Tenancy
```
type organization
  relations
    define member: [user]
    define admin: [user]

type resource
  relations
    define organization: [organization]
    define viewer: member from organization
```

### Hierarchical Folders
```
type folder
  relations
    define parent: [folder]
    define viewer: [user] or viewer from parent
```

### Role-Based Access
```
type role
  relations
    define assignee: [user]

type resource
  relations
    define viewer: [user, role#assignee]
```

## Resources

- [OpenFGA Docs](https://openfga.dev/docs)
- [OpenFGA Playground](https://play.openfga.dev)
- [Sample Models](https://github.com/openfga/sample-stores)
