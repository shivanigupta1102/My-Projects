import { CategoryMappingService } from '../../src/category/category-mapping.service';

describe('CategoryMappingService', () => {
  let service: CategoryMappingService;

  beforeEach(() => {
    service = new CategoryMappingService();
  });

  it('should return a mapping result for a valid channel', async () => {
    const result = await service.mapProductToCategory(
      {
        title: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Premium noise canceling headphones',
        brand: 'Sony',
        attributes: { color: 'Black', type: 'Over-Ear' },
      },
      'AMAZON',
    );
    expect(result.channel).toBe('AMAZON');
    expect(result.method).toBe('AI_INFERRED');
    expect(result).toHaveProperty('categoryId');
    expect(result).toHaveProperty('categoryPath');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('alternatives');
  });

  it('should return empty alternatives array as default', async () => {
    const result = await service.mapProductToCategory(
      { title: 'Test', description: 'test', attributes: {} },
      'EBAY',
    );
    expect(Array.isArray(result.alternatives)).toBe(true);
  });
});
