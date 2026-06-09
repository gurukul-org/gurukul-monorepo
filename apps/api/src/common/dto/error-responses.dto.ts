import { ApiProperty } from '@nestjs/swagger';

// =====================================================
// TENANT MODULE VALIDATION ERROR DTOS
// =====================================================

export class TenantValidationErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'The HTTP status code.',
  })
  statusCode: number;

  @ApiProperty({
    type: [String],
    example: [
      'Subdomain must be 3-63 chars, lowercase letters, digits, or hyphens, and not start or end with a hyphen.',
      'name must be longer than or equal to 1 and shorter than or equal to 255 characters',
      'type must be one of the following values: SCHOOL, INSTITUTE, COACHING',
    ],
    description: 'List of tenant validation error messages.',
  })
  message: string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'The HTTP error message.',
  })
  error: string;
}

// =====================================================
// USER MODULE VALIDATION ERROR DTOS
// =====================================================

export class LoginValidationErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'The HTTP status code.',
  })
  statusCode: number;

  @ApiProperty({
    type: [String],
    example: [
      'email must be an email',
      'password must be longer than or equal to 6 characters',
    ],
    description: 'List of login validation error messages.',
  })
  message: string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'The HTTP error message.',
  })
  error: string;
}

export class ForgotPasswordValidationErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'The HTTP status code.',
  })
  statusCode: number;

  @ApiProperty({
    type: [String],
    example: ['email must be an email'],
    description: 'List of forgot password validation error messages.',
  })
  message: string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'The HTTP error message.',
  })
  error: string;
}

export class ResetPasswordValidationErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'The HTTP status code.',
  })
  statusCode: number;

  @ApiProperty({
    type: [String],
    example: [
      'token should not be empty',
      'password must be longer than or equal to 6 characters',
    ],
    description: 'List of reset password validation error messages.',
  })
  message: string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'The HTTP error message.',
  })
  error: string;
}

export class UpdateProfileValidationErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'The HTTP status code.',
  })
  statusCode: number;

  @ApiProperty({
    type: [String],
    example: [
      'firstName must be longer than or equal to 1 characters',
      'phone must be a string',
    ],
    description: 'List of update profile validation error messages.',
  })
  message: string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'The HTTP error message.',
  })
  error: string;
}

export class ChangePasswordValidationErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'The HTTP status code.',
  })
  statusCode: number;

  @ApiProperty({
    type: [String],
    example: [
      'currentPassword should not be empty',
      'newPassword must be longer than or equal to 6 characters',
    ],
    description: 'List of change password validation error messages.',
  })
  message: string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'The HTTP error message.',
  })
  error: string;
}

export class ChangeEmailValidationErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'The HTTP status code.',
  })
  statusCode: number;

  @ApiProperty({
    type: [String],
    example: ['email must be an email', 'currentPassword should not be empty'],
    description: 'List of change email validation error messages.',
  })
  message: string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'The HTTP error message.',
  })
  error: string;
}

// =====================================================
// STANDARD HTTP ERROR DTOS
// =====================================================

export class UnauthorizedErrorResponseDto {
  @ApiProperty({
    example: 401,
    description: 'The HTTP status code.',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Unauthorized',
    description: 'The error message.',
  })
  message: string;
}

export class ForbiddenErrorResponseDto {
  @ApiProperty({
    example: 403,
    description: 'The HTTP status code.',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Access Denied',
    description: 'The error message.',
  })
  message: string;

  @ApiProperty({
    example: 'Forbidden',
    description: 'The HTTP error message.',
  })
  error: string;
}

export class NotFoundErrorResponseDto {
  @ApiProperty({
    example: 404,
    description: 'The HTTP status code.',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Workspace not found',
    description: 'The error message.',
  })
  message: string;

  @ApiProperty({
    example: 'Not Found',
    description: 'The HTTP error message.',
  })
  error: string;
}

export class ConflictErrorResponseDto {
  @ApiProperty({
    example: 409,
    description: 'The HTTP status code.',
  })
  statusCode: number;

  @ApiProperty({
    example: 'This subdomain is already taken.',
    description: 'The error message.',
  })
  message: string;

  @ApiProperty({
    example: 'Conflict',
    description: 'The HTTP error message.',
  })
  error: string;
}
