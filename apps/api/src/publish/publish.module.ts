import { Module } from '@nestjs/common';
import { AuditModule } from '@/audit/audit.module';
import { ListingPackagesModule } from '@/listing-packages/listing-packages.module';
import { AmazonConnector } from './connectors/amazon.connector';
import { EbayConnector } from './connectors/ebay.connector';
import { EtsyConnector } from './connectors/etsy.connector';
import { ShopifyConnector } from './connectors/shopify.connector';
import { WalmartConnector } from './connectors/walmart.connector';
import { PublishController } from './publish.controller';
import { PublishService } from './publish.service';

@Module({
  imports: [AuditModule, ListingPackagesModule],
  controllers: [PublishController],
  providers: [
    PublishService,
    AmazonConnector,
    EbayConnector,
    ShopifyConnector,
    WalmartConnector,
    EtsyConnector,
  ],
  exports: [PublishService],
})
export class PublishModule {}
