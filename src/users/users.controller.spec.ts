import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const usersServiceMock = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user and return a UserEntity', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@gmail.com',
        password: 'password123',
      };

      const userId = uuidv4();
      const createdAt = new Date();
      const updatedAt = new Date();
      const createdUser = {
        id: userId,
        email: createUserDto.email,
        password: 'hashedpassword',
        createdAt,
        updatedAt,
      };

      jest.spyOn(usersService, 'create').mockResolvedValue(createdUser);

      const result = await controller.create(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(new UserEntity(createdUser));
    });
  });
});
