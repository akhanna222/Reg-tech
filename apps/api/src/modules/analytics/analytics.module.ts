import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Filing } from '../database/entities/filing.entity';
import { Organization } from '../database/entities/organization.entity';
import { DashboardController } from './controllers/dashboard.controller';
import { SearchController } from './controllers/search.controller';
import { DashboardService } from './services/dashboard.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { CrossJurisdictionService } from './services/cross-jurisdiction.service';
import { SearchService } from './services/search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Filing, Organization]),
  ],
  controllers: [DashboardController, SearchController],
  providers: [
    DashboardService,
    AnomalyDetectionService,
    CrossJurisdictionService,
    SearchService,
  ],
  exports: [
    DashboardService,
    AnomalyDetectionService,
    CrossJurisdictionService,
    SearchService,
  ],
})
export class AnalyticsModule {}
