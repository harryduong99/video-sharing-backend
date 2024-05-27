import { HttpException, Injectable } from '@nestjs/common';
import { CreateVideoDto } from './dto/create-video.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UserEntity } from '../users/entities/user.entity';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import {
  PaginatedResult,
  PaginateFunction,
  paginator,
} from '../utils/pagination';
import { VideoEntity } from './entities/video.entity';
import { ConfigService } from '@nestjs/config';

const paginate: PaginateFunction = paginator({ perPage: 2 });

@Injectable()
export class VideosService {
  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(createVideoDto: CreateVideoDto, user: UserEntity) {
    const videoSnippet = await this.getVideoInfo(createVideoDto.url);
    return this.prisma.video.create({
      data: {
        youtubeUrl: createVideoDto.url,
        youtubeId: videoSnippet.id,
        title: videoSnippet.title,
        description: videoSnippet.description,
        userId: user.id,
      },
    });
  }

  async findMany({
    page,
    perPage = 5,
  }: {
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResult<VideoEntity>> {
    return paginate(
      this.prisma.video,
      {
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          videoSharer: true,
        },
      },
      {
        page,
        perPage,
      },
    );
  }

  private parseVideoId(url: string) {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length == 11 ? match[7] : '';
  }

  async getVideoInfo(url: string) {
    const videoId = this.parseVideoId(url);
    if (!videoId) {
      throw new HttpException('Invalid YouTube URL', 400);
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${this.configService.get('GOOGLE_API_KEY')}&part=snippet`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(apiUrl).pipe(
          catchError(() => {
            throw new HttpException('Error fetching video data', 500);
          }),
        ),
      );

      const snippet = response?.data?.items[0]?.snippet;
      if (!snippet) {
        throw new HttpException('Video snippet not found', 400);
      }

      return {
        title: snippet.title,
        description: snippet.description,
        id: videoId,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
