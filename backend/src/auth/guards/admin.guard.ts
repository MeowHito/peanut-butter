import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user; //ดึงข้อมูลจาก jwt.strategy.ts ที่ส่งมาไงอ่านดิ

        if (!user || user.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}
//Admin Guard ตรวจสอบดิ ว่าเป็นแอดมินไหม ถ้าเป็น ก็เป็นไง ถ้าไม่เป็น ก็ขึ้นว่า ต้องเป็นแอดมินดิ