import { ApiProperty } from '@nestjs/swagger';

import { IsArray, IsUUID } from 'class-validator';

export class UpdateInstructorCoursesDto {
  @ApiProperty({
    example: ['b55faa86-2bec-1d9e-9962-9282afd10341'],
    type: [String],
    description:
      'Course IDs (from the class program) this instructor teaches in this class. Replaces the existing set.',
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  courseIds: string[];
}
