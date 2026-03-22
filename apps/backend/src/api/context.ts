import { GraphService } from '../services/graphService.js';
import { MetadataService } from '../services/metadataService.js';
import { RouteService } from '../services/routeService.js';
import { SearchService } from '../services/searchService.js';
import { PipelineService } from '../services/pipelineService.js';

export interface AppContext {
  graphService: GraphService;
  routeService: RouteService;
  searchService: SearchService;
  metadataService: MetadataService;
  pipelineService: PipelineService;
}

export function createAppContext(): AppContext {
  const graphService = new GraphService();
  const routeService = new RouteService(graphService.getGraphologyInstance());
  const searchService = new SearchService(graphService.getGraph().nodes);
  const metadataService = new MetadataService();
  const pipelineService = new PipelineService();

  return { graphService, routeService, searchService, metadataService, pipelineService };
}
