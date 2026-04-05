import { Module } from '@nestjs/common';
import { AmazonGenerator } from './generators/amazon.generator';
import { EbayGenerator } from './generators/ebay.generator';
import { EtsyGenerator } from './generators/etsy.generator';
import { ShopifyGenerator } from './generators/shopify.generator';
import { WalmartGenerator } from './generators/walmart.generator';
import { ListingPackagesController } from './listing-packages.controller';
import { ListingPackagesService } from './listing-packages.service';

@Module({
  controllers: [ListingPackagesController],
  providers: [
    ListingPackagesService,
    AmazonGenerator,
    EbayGenerator,
    WalmartGenerator,
    ShopifyGenerator,
    EtsyGenerator,
  ],
  exports: [ListingPackagesService],
})
export class ListingPackagesModule {}
