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

export class AnswerDto {
  @ApiProperty({
    example: 0,
    description: 'The index of the question in the assignment questions array',
  })
  @IsInt()
  @IsNotEmpty()
  questionIndex: number;

  @ApiProperty({
    example: '<p>My response is typed using TipTap here...</p>',
    description: 'The rich text answer value',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    example: 8,
    description: 'Optional score for this answer (marked by the teacher)',
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  score?: number;
}

export class SubmitAssignmentDto {
  @ApiProperty({
    type: [AnswerDto],
    description: 'The list of answers matching each question index',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
