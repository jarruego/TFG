import { Module } from '@nestjs/common';
import { CenterService } from './center.service';
import { CenterController } from './center.controller';
import { CenterRepository } from 'src/database/repository/center/center.repository';
import { CompanyModule } from 'src/api/company/company.module'; 
import { UserCenterRepository } from 'src/database/repository/center/user-center.repository';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [CompanyModule, UserModule], 
  providers: [CenterService, CenterRepository, UserCenterRepository],
  controllers: [CenterController],
  exports: [CenterService],
})
export class CenterModule {}