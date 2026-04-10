import { z } from 'zod';

export const inviteUserSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    firstName: z.string().min(1, 'Nombre es requerido'),
    lastName: z.string().min(1, 'Apellido es requerido'),
    roleId: z.string().min(1, 'Debe seleccionar un rol'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    roleId: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'INVITED']).optional(),
  }),
});

export type InviteUserDto = z.infer<typeof inviteUserSchema>['body'];
export type UpdateUserDto = z.infer<typeof updateUserSchema>['body'];
