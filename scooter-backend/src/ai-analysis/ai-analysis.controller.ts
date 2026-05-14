import {
  Controller,
  Post,
  Query,
  UseGuards,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { AiAnalysisService } from './ai-analysis.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('ai-analysis')
export class AiAnalysisController {
  constructor(private aiAnalysisService: AiAnalysisService) {}

  /**
   * Trigger AI anomaly detection analysis
   * Only operators/admins can access
   */
  @Post('analyze')
  @UseGuards(AuthGuard)
  async analyzeIncidents(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.aiAnalysisService.performAnalysis(startDate, endDate);
  }

  /**
   * Get incidents ready for AI analysis (debugging/preview)
   */
  @Get('incidents-preview')
  @UseGuards(AuthGuard)
  async getIncidentsForAnalysis(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new BadRequestException('Geçersiz başlangıç tarihi formatı');
      }
    }

    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new BadRequestException('Geçersiz bitiş tarihi formatı');
      }
    }

    return this.aiAnalysisService.getIncidentsForAnalysis(start, end);
  }
}
