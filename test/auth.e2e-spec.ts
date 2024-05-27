import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'user-uuid', email: 'test@gmail.com' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    jest.spyOn(authService, 'login').mockImplementation(async () => ({
      email: 'test@gmail.com',
      accessToken: 'test-access-token',
      expiresIn: 3600 * 24 * 7,
    }));
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return an access token when logging in', async () => {
    const userLoginDto = { email: 'test@gmail.com', password: 'password' };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(userLoginDto)
      .expect(201);

    expect(response.body).toHaveProperty('accessToken', 'test-access-token');
    expect(response.body).toHaveProperty('expiresIn', 3600 * 24 * 7);
  });

  it('should return user information when verifying token', async () => {
    const accessToken = 'test-access-token';

    const response = await request(app.getHttpServer())
      .get('/auth/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', 'user-uuid');
    expect(response.body).toHaveProperty('email', 'test@gmail.com');
  });
});
