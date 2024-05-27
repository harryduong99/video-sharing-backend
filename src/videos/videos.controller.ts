import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import RequestWithUser from '../auth/requestWithUser.interface';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideoEntity } from './entities/video.entity';
import { VideosService } from './videos.service';

@Controller('videos')
@ApiTags('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: VideoEntity })
  async create(
    @Body() createVideoDto: CreateVideoDto,
    @Req() req: RequestWithUser,
  ) {
    return new VideoEntity(
      await this.videosService.create(createVideoDto, req.user),
    );
  }

  @Get()
  @ApiOkResponse({ type: VideoEntity, isArray: true })
  async findMany(
    @Query('page') page: number,
    @Query('per_page') perPage: number,
  ) {
    const videos = await this.videosService.findMany({ page, perPage });
    return {
      data: videos.data.map((video) => new VideoEntity(video)),
      pagination: videos.pagination,
    };
  }
}
