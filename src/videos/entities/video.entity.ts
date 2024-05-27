import { Video } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../users/entities/user.entity';

export class VideoEntity implements Video {
  constructor({ videoSharer, ...data }: Partial<VideoEntity>) {
    Object.assign(this, data);

    if (videoSharer) {
      this.videoSharer = new UserEntity(videoSharer);
    }
  }

  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false, nullable: true })
  description: string | null;

  @ApiProperty()
  youtubeUrl: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  youtubeId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: UserEntity })
  videoSharer: UserEntity;
}
