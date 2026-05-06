import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator'; 

@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector, dekoratördeki (@Roles) bilgileri okumamızı sağlar
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Gerekli rollerin okunması
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // metot da @rol yoksa herkes girer.
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Kullanıcının rolü, gereken rollerden mi? 
    const hasRole = requiredRoles.some((role) => user?.role === role);

    if (!hasRole) {
      throw new ForbiddenException('Bu işlem için Operatör yetkisine sahip olmanız gerekir');
    }

    return true;
  }
}