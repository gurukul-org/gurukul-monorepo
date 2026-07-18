import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { AnswerDto } from './submit-assignment.dto';

export class MarkSubmissionDto {
  @ApiProperty({
    example: 85,
    description: 'The score given by the teacher',
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  score: number;

  @ApiProperty({
    example:
      'Great work on the first question. Try to elaborate more next time.',
    description: 'Teacher remarks or feedback',
    required: false,
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({
    type: [AnswerDto],
    description: 'Optional question-level scoring for the answers',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  @IsOptional()
  answers?: AnswerDto[];
}
