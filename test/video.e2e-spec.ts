import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { VideosService } from '../src/videos/videos.service';
import { v4 as uuidv4 } from 'uuid';
import { VideoEntity } from '../src/videos/entities/video.entity';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { UserEntity } from '../src/users/entities/user.entity';

describe('VideosController (e2e)', () => {
  let app: INestApplication;
  let videosService: VideosService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'uuid' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    videosService = moduleFixture.get<VideosService>(VideosService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/videos (POST) should create a video', async () => {
    const userId = uuidv4();
    const createVideoDto = {
      url: 'https://youtu.be/7zxbFpIkHzk?si=CmQTm2iopEtxo1j5',
    };

    jest.spyOn(videosService, 'create').mockImplementation(async () => {
      return new VideoEntity({
        id: uuidv4(),
        youtubeUrl: createVideoDto.url,
        title: 'Test Video Title',
        description: 'Test Video Description',
        createdAt: new Date(),
        updatedAt: new Date(),
        youtubeId: 'videoId',
        userId,
        videoSharer: { id: userId } as UserEntity,
      });
    });

    const response = await request(app.getHttpServer())
      .post('/videos')
      .send(createVideoDto)
      .set('Authorization', `Bearer `)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Test Video Title');
    expect(response.body.description).toBe('Test Video Description');
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.updatedAt).toBeDefined();
    expect(response.body.youtubeId).toBe('videoId');
    expect(response.body.userId).toBe(userId);
    expect(response.body.videoSharer).toBeDefined();
  });

  it('/videos (GET) should return paginated video results', async () => {
    // Mock paginated video data
    const mockPaginatedResult = {
      data: [
        new VideoEntity({
          id: uuidv4(),
          youtubeUrl: 'https://www.youtube.com/watch?v=videoId1',
          title: 'Test Video Title 1',
          description: 'Test Video Description 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          youtubeId: 'videoId1',
          userId: uuidv4(),
          videoSharer: { id: uuidv4() } as UserEntity,
        }),
        new VideoEntity({
          id: uuidv4(),
          youtubeUrl: 'https://www.youtube.com/watch?v=videoId2',
          title: 'Test Video Title 2',
          description: 'Test Video Description 2',
          createdAt: new Date(),
          updatedAt: new Date(),
          youtubeId: 'videoId2',
          userId: uuidv4(),
          videoSharer: { id: uuidv4() } as UserEntity,
        }),
      ],
      pagination: {
        total: 2,
        totalPages: 1,
        currentPage: 1,
        perPage: 2,
        prev: null,
        next: null,
      },
    };

    jest
      .spyOn(videosService, 'findMany')
      .mockResolvedValue(mockPaginatedResult);

    const response = await request(app.getHttpServer())
      .get('/videos')
      .query({ page: 1, per_page: 2 })
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toHaveProperty('id');
    expect(response.body.data[0].title).toBe('Test Video Title 1');
    expect(response.body.data[0].description).toBe('Test Video Description 1');

    expect(response.body.pagination).toEqual({
      total: 2,
      totalPages: 1,
      currentPage: 1,
      perPage: 2,
      prev: null,
      next: null,
    });
  });
});
