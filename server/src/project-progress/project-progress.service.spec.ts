import { Test, TestingModule } from '@nestjs/testing';
import { ProjectProgressService } from './project-progress.service';

describe('ProjectProgressService', () => {
  let service: ProjectProgressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectProgressService],
    }).compile();

    service = module.get<ProjectProgressService>(ProjectProgressService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
