import { Controller, Get, Query } from '@nestjs/common';
import { SearchService, GlobalSearchResult } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') query: string = '',
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ): Promise<GlobalSearchResult> {
    const maxResults = limit ? Math.min(parseInt(limit, 10), 50) : 10;
    return this.searchService.searchAll(query, maxResults, category);
  }
}
