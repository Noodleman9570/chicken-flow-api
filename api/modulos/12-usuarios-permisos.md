# 12 - Usuarios y permisos

## Objetivo
Administrar usuarios, roles, permisos y granjas asignadas.

## Vista frontend
- `/dashboard/users`
- `/dashboard/profile`

## Entidad principal
```ts
interface UserAccount {
  id: string
  name: string
  email: string
  role: 'admin' | 'operator' | 'client' | 'develop'
  assignedFarm?: string
  status: 'activo' | 'pendiente' | 'bloqueado'
  lastLogin: string
  permissions: string[]
}
```

## GET /api/v1/users
Lista usuarios.

## POST /api/v1/users/invite
Invita usuario.

## PUT /api/v1/users/:id
Actualiza usuario, rol o granja asignada.

## PATCH /api/v1/users/:id/status
Activa, bloquea o desactiva usuario.

## GET /api/v1/permissions
Lista permisos disponibles.

## GET /api/v1/profile
Devuelve perfil del usuario autenticado.
