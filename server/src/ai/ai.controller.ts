import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('query')
  async processQuery(@Body() body: { query: string }) {
    return this.aiService.processQuery(body.query);
  }

  @Post('project-data')
  async getProjectData(@Body() body: { projectId: string; queryType: string }) {
    return this.aiService.getProjectData(body.projectId, body.queryType);
  }
}
