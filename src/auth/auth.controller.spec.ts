import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthEntity } from './entity/auth.entity';
import { LoginDto } from './dto/login.dto';
import RequestWithUser from './requestWithUser.interface';
import { UserEntity } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const authServiceMock = {
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return an AuthEntity when login is successful', async () => {
      const email = 'test@gmail.com';
      const password = 'password123';
      const authEntity: AuthEntity = {
        accessToken: 'access-token',
        email,
      };
      const loginDto: LoginDto = {
        email,
        password,
      };
      jest.spyOn(authService, 'login').mockResolvedValue(authEntity);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(authEntity);
    });
  });

  describe('authenticate', () => {
    it('should return a UserEntity when authentication is successful', () => {
      const userId = uuidv4();
      const user = new UserEntity({ id: userId, email: 'test@gmail.com' });
      const requestWithUser: RequestWithUser = {
        user,
      } as RequestWithUser;

      const result = controller.authenticate(requestWithUser);

      expect(result).toEqual(user);
    });
  });
});
