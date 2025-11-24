import { Test, TestingModule } from '@nestjs/testing';
import { ProjectProgressController } from './project-progress.controller';

describe('ProjectProgressController', () => {
  let controller: ProjectProgressController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectProgressController],
    }).compile();

    controller = module.get<ProjectProgressController>(ProjectProgressController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
