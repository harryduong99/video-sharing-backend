import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { VideosService } from './videos.service';
import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UserEntity } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

describe('VideosService', () => {
  let service: VideosService;
  let httpService: HttpService;
  // let configService: ConfigService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: PrismaService,
          useValue: {
            video: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock_google_api_key'),
          },
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
    httpService = module.get<HttpService>(HttpService);
    prismaService = module.get<PrismaService>(PrismaService);
    // configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a video record', async () => {
      const createVideoDto: CreateVideoDto = {
        url: 'https://www.youtube.com/watch?v=validVideoId',
      };
      const userId = uuidv4();
      const videoId = uuidv4();
      const user: UserEntity = {
        id: userId,
        email: 'test@gmail.com',
      } as UserEntity;

      const videoInfo = {
        title: 'Test Title',
        description: 'Test Description',
        id: 'validVideoId',
      };

      const createdVideo = {
        id: videoId,
        youtubeUrl: createVideoDto.url,
        youtubeId: videoInfo.id,
        title: videoInfo.title,
        description: videoInfo.description,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'getVideoInfo').mockResolvedValue(videoInfo);
      jest.spyOn(prismaService.video, 'create').mockResolvedValue(createdVideo);

      const result = await service.create(createVideoDto, user);

      expect(result).toEqual(createdVideo);
      expect(prismaService.video.create).toHaveBeenCalledWith({
        data: {
          youtubeUrl: createVideoDto.url,
          youtubeId: videoInfo.id,
          title: videoInfo.title,
          description: videoInfo.description,
          userId: user.id,
        },
      });
    });
  });

  describe('findMany', () => {
    it('should return paginated video results', async () => {
      const mockVideos = [
        {
          id: uuidv4(),
          youtubeUrl: 'https://www.youtube.com/watch?v=videoId1',
          youtubeId: 'videoId1',
          title: 'Video 1',
          description: 'Description 1',
          userId: uuidv4(),
          videoSharer: {} as UserEntity,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          youtubeUrl: 'https://www.youtube.com/watch?v=videoId2',
          youtubeId: 'videoId2',
          title: 'Video 2',
          description: 'Description 2',
          userId: uuidv4(),
          videoSharer: {} as UserEntity,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const pagination = {
        total: 2,
        totalPages: 1,
        currentPage: 1,
        perPage: 2,
        prev: null,
        next: null,
      };

      const mockPaginatedResult = {
        data: mockVideos,
        pagination,
      };
      jest.spyOn(prismaService.video, 'count').mockResolvedValue(2);
      jest.spyOn(prismaService.video, 'findMany').mockResolvedValue(mockVideos);

      const result = await service.findMany({ page: 1, perPage: 2 });

      expect(result).toEqual(mockPaginatedResult);
      expect(prismaService.video.count).toHaveBeenCalledWith({
        where: undefined,
      });
      expect(prismaService.video.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { videoSharer: true },
        take: 2,
        skip: 0,
      });
    });
  });

  describe('getVideoInfo', () => {
    const validVideoId = '7zxbFpIkHzk';
    it('should return video info for a valid URL', async () => {
      const url = `https://youtu.be/${validVideoId}?si=CmQTm2iopEtxo1j5`;
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${validVideoId}&key=mock_google_api_key&part=snippet`;

      const mockVideoResponse: AxiosResponse = {
        data: {
          items: [
            {
              snippet: {
                title: 'Video Test Title',
                description: 'Video Test Description',
              },
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockVideoResponse));

      const result = await service.getVideoInfo(url);
      expect(result).toEqual({
        title: 'Video Test Title',
        description: 'Video Test Description',
        id: validVideoId,
      });
      expect(httpService.get).toHaveBeenCalledWith(apiUrl);
    });

    it('should throw an error for an invalid URL', async () => {
      const url = `https://www.invalidyoutube.com/watch?v=invalidVideoId`;

      await expect(service.getVideoInfo(url)).rejects.toThrow(
        new HttpException('Invalid YouTube URL', 400),
      );
    });

    it('should throw an error if the video snippet is not found', async () => {
      const url = `https://www.youtube.com/watch?v=${validVideoId}`;
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${validVideoId}&key=mock_google_api_key&part=snippet`;

      const mockResponse: AxiosResponse = {
        data: {
          items: [],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      await expect(service.getVideoInfo(url)).rejects.toThrow(
        new HttpException('Video snippet not found', 404),
      );
      expect(httpService.get).toHaveBeenCalledWith(apiUrl);
    });

    it('should handle errors from the HTTP request', async () => {
      const url = `https://www.youtube.com/watch?v=${validVideoId}`;
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${validVideoId}&key=mock_google_api_key&part=snippet`;

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(new Error('Error fetching video data')));

      await expect(service.getVideoInfo(url)).rejects.toThrow(
        new HttpException('Error fetching video data', 500),
      );
      expect(httpService.get).toHaveBeenCalledWith(apiUrl);
    });
  });
});
