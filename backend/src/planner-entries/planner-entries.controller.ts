import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserGuard } from '../auth/current-user.guard';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { CreatePlannerEntryDto } from './dto/create-planner-entry.dto';
import { ListPlannerEntriesQueryDto } from './dto/list-planner-entries-query.dto';
import { PlannerEntryResponseDto } from './dto/planner-entry-response.dto';
import { PlannerEntriesService } from './planner-entries.service';

@Controller('planner')
@UseGuards(CurrentUserGuard)
export class PlannerEntriesController {
  constructor(private readonly plannerEntriesService: PlannerEntriesService) {}

  @Get()
  findAll(
    @CurrentUser() user: UserResponseDto,
    @Query() query: ListPlannerEntriesQueryDto,
  ): Promise<PlannerEntryResponseDto[]> {
    return this.plannerEntriesService.findAll(user.id, query);
  }

  @Post()
  // The assignment returns 201 both for a new entry and an accumulated quantity.
  create(
    @CurrentUser() user: UserResponseDto,
    @Body() dto: CreatePlannerEntryDto,
  ): Promise<PlannerEntryResponseDto> {
    return this.plannerEntriesService.create(user.id, dto);
  }
}
