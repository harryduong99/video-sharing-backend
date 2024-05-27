import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [VideosController],
  providers: [VideosService],
  imports: [PrismaModule, HttpModule, ConfigModule.forRoot()],
})
export class VideosModule {}
