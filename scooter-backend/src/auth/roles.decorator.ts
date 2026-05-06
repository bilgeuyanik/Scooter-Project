import { SetMetadata } from '@nestjs/common';

// Roller için metadata anahtarı 
export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);