import { Test, TestingModule } from '@nestjs/testing';
import { UsersService, hashingRounds } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should hash the password and create a user', async () => {
      const password = 'password123';
      const createUserDto: CreateUserDto = {
        email: 'test@gmail.com',
        password,
      };

      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        hashingRounds,
      );

      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));

      const createdAt = new Date();
      const updatedAt = new Date();
      const userId = uuidv4();
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        id: userId,
        ...createUserDto,
        password: hashedPassword,
        createdAt,
        updatedAt,
      });

      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, hashingRounds);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: { ...createUserDto, password: hashedPassword },
      });
      expect(result).toEqual({
        id: userId,
        ...createUserDto,
        password: hashedPassword,
        createdAt,
        updatedAt,
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = uuidv4();
      const user = {
        id: userId,
        email: 'test@gmail.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);

      const result = await service.findOne(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual(user);
    });

    it('should return null if user is not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      const userId = uuidv4();

      const result = await service.findOne(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toBeNull();
    });
  });
});
