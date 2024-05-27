import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideoEntity } from './entities/video.entity';
import RequestWithUser from '../auth/requestWithUser.interface';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../users/entities/user.entity';

describe('VideosController', () => {
  let controller: VideosController;
  let videosService: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        {
          provide: VideosService,
          useValue: {
            create: jest.fn(),
            findMany: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VideosController>(VideosController);
    videosService = module.get<VideosService>(VideosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a video', async () => {
      const userId = uuidv4();
      const req = { user: { id: userId } } as RequestWithUser;
      const createVideoDto: CreateVideoDto = {
        url: 'https://www.youtube.com/watch?v=videoId',
      };

      const videoId = uuidv4();
      const videoEntity = new VideoEntity({ id: videoId });
      jest.spyOn(videosService, 'create').mockResolvedValue(videoEntity);

      const result = await controller.create(createVideoDto, req);

      expect(result).toBeInstanceOf(VideoEntity);
      expect(result).toEqual(videoEntity);
      expect(videosService.create).toHaveBeenCalledWith(
        createVideoDto,
        req.user,
      );
    });
  });

  describe('findMany', () => {
    it('should find multiple videos with pagination', async () => {
      const page = 1;
      const perPage = 2;

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
        total: 6,
        totalPages: 3,
        currentPage: 1,
        perPage,
        prev: null,
        next: 2,
      };

      jest.spyOn(videosService, 'findMany').mockResolvedValue({
        data: mockVideos,
        pagination,
      });

      const result = await controller.findMany(page, perPage);

      expect(result).toEqual({
        data: mockVideos,
        pagination,
      });
      expect(videosService.findMany).toHaveBeenCalledWith({ page, perPage });
    });
  });
});
