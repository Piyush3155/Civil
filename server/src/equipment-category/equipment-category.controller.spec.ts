import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentCategoryController } from './equipment-category.controller';

describe('EquipmentCategoryController', () => {
  let controller: EquipmentCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentCategoryController],
    }).compile();

    controller = module.get<EquipmentCategoryController>(EquipmentCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
