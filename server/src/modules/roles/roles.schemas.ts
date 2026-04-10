import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre del rol debe tener al menos 2 caracteres'),
    description: z.string().optional(),
    permissionIds: z.array(z.string()).min(1, 'Debe seleccionar al menos un permiso'),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    permissionIds: z.array(z.string()).optional(),
  }),
});
