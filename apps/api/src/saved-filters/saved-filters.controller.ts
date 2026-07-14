import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { GetCurrentTenant, GetCurrentUserId } from '../common/decorators';
import { CreateSavedFilterDto } from './dto/create-saved-filter.dto';
import { SavedFiltersService } from './saved-filters.service';

@ApiTags('Saved Filters')
@ApiBearerAuth()
@Controller('saved-filters')
export class SavedFiltersController {
  constructor(private readonly savedFiltersService: SavedFiltersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Save a new filter configuration',
    description:
      'Saves a filter state for a feature under the current user account.',
  })
  @ApiCreatedResponse({
    description: 'Filter configuration saved successfully.',
  })
  @ApiForbiddenResponse({ description: 'Tenant context required.' })
  async create(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateSavedFilterDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.savedFiltersService.create(tenantId, userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List saved filters for a feature',
    description:
      'Returns all filters saved by the current user for a specific feature.',
  })
  @ApiQuery({ name: 'feature', required: true, type: String })
  @ApiOkResponse({ description: 'Saved filters retrieved successfully.' })
  async findAll(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Query('feature') feature: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.savedFiltersService.findAll(tenantId, userId, feature);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a saved filter configuration',
    description:
      'Deletes a saved filter by its ID, ensuring it belongs to the current user.',
  })
  @ApiOkResponse({ description: 'Saved filter deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Saved filter not found.' })
  async remove(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.savedFiltersService.remove(tenantId, userId, id);
  }
}
