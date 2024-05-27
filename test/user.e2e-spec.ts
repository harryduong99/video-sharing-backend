import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Mock the users service
    usersService = moduleFixture.get<UsersService>(UsersService);
    jest.spyOn(usersService, 'create').mockImplementation(async () => ({
      id: 'uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
      email: 'test@gmail.com',
      password: 'password',
    }));
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create a new user', async () => {
    const createUserDto = {
      email: 'test@gmail.com',
      password: 'password',
    };

    const response = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201);

    expect(response.body).toHaveProperty('id', 'uuid');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
    expect(response.body.email).toBe(createUserDto.email);
  });
});
