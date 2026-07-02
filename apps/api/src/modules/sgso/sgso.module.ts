import { Module } from '@nestjs/common';
import { SgsoController } from './sgso.controller';
import { SgsoService } from './sgso.service';

@Module({
  controllers: [SgsoController],
  providers: [SgsoService],
  exports: [SgsoService],
})
export class SgsoModule {}
