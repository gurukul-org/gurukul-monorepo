import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The JSON Web Token (JWT) access token.',
  })
  accessToken: string;
}

export class MessageResponseDto {
  @ApiProperty({
    example: 'Operation completed successfully.',
    description: 'A status message describing the result of the operation.',
  })
  message: string;
}
