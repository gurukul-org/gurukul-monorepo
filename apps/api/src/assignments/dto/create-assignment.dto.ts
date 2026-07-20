import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class AssignmentQuestionDto {
  @ApiProperty({
    example: 'q1-id',
    description: 'Unique ID for the question',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    example: 'What is the capital of India?',
    description: 'The question text',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    example: 10,
    description: 'Marks assigned to this question',
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  marks: number;

  @ApiProperty({
    example: 'New Delhi',
    description: 'Optional reference answer or solution for this question',
    required: false,
  })
  @IsString()
  @IsOptional()
  referenceAnswer?: string;
}

export class CreateAssignmentDto {
  @ApiProperty({
    example: 'd4197a05-f274-4484-75e9-9b580a1fb2fa',
    description: 'The UUID of the class/section',
  })
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({
    example: 'Midterm Essay',
    description: 'The title of the assignment',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Please write a 500-word essay on the topic.',
    description: 'The description or instructions for the assignment',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '2026-07-16T12:00:00.000Z',
    description: 'The start date and time for the assignment',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    example: '2026-07-23T12:00:00.000Z',
    description: 'The end date and time (deadline) for the assignment',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    example: 100,
    description: 'Maximum marks achievable for this assignment',
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  marks: number;

  @ApiProperty({
    type: [AssignmentQuestionDto],
    description:
      'List of questions with text, marks, and optional reference answers',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentQuestionDto)
  @IsOptional()
  questions?: AssignmentQuestionDto[];
}
