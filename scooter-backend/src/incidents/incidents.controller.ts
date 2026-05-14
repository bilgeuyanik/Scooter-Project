import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() createIncidentDto: CreateIncidentDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    return this.incidentsService.create({
      ...createIncidentDto,
      reportedByUserId: userId,
    });
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll() {
    return this.incidentsService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('nearby/:lat/:lon')
  async findNearby(
    @Param('lat') lat: string,
    @Param('lon') lon: string,
  ) {
    return this.incidentsService.findNearby(+lat, +lon, 10);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/report')
  async reportIncident(@Param('id') id: string) {
    return this.incidentsService.incrementReportCount(+id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async updateIncident(
    @Param('id') id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ) {
    return this.incidentsService.update(+id, updateIncidentDto);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/resolve')
  async resolveIncident(@Param('id') id: string) {
    return this.incidentsService.resolveIncident(+id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.incidentsService.remove(+id);
  }
}
