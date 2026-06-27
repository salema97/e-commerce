import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { validate } from './config/env.validation.js';
import { RedisService } from './common/redis/redis.service.js';
import { RedisThrottlerStorage } from './common/throttler/redis-throttler.storage.js';
import { AppThrottlerGuard } from './common/throttler/app-throttler.guard.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './health/health.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ProductsModule } from './products/products.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { SuppliersModule } from './suppliers/suppliers.module.js';
import { UsersModule } from './users/users.module.js';
import { CartModule } from './cart/cart.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AuditModule } from './audit/audit.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { ReturnsModule } from './returns/returns.module.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { RolesGuard } from './auth/roles.guard.js';
import { AuditInterceptor } from './audit/audit.interceptor.js';
import { WhatsAppModule } from './whatsapp/whatsapp.module.js';
import { ConversationModule } from './conversations/conversation.module.js';
import { MessageModule } from './messages/message.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import { FinanceModule } from './finance/finance.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { AiModule } from './ai/ai.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { EventBusModule } from './event-bus/event-bus.module.js';
import { ShippingModule } from './shipping/shipping.module.js';
import { TaxModule } from './tax/tax.module.js';
import { FulfillmentModule } from './fulfillment/fulfillment.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { ReferralsModule } from './referrals/referrals.module.js';
import { LoyaltyModule } from './loyalty/loyalty.module.js';
import { EngagementModule } from './engagement/engagement.module.js';
import { B2bModule } from './b2b/b2b.module.js';
import { QuotesModule } from './quotes/quotes.module.js';
import { MarketplaceModule } from './marketplace/marketplace.module.js';
import { AccountingModule } from './accounting/accounting.module.js';
import { PrivacyModule } from './privacy/privacy.module.js';
import { CaptchaModule } from './common/captcha/captcha.module.js';
import { PosModule } from './pos/pos.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { SellersModule } from './sellers/sellers.module.js';
import { DropshipModule } from './dropship/dropship.module.js';
import { BulkImportModule } from './bulk-import/bulk-import.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      },
      forRoutes: [{ path: '/*path', method: RequestMethod.ALL }],
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redis: RedisService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60_000,
            limit: 100,
          },
        ],
        storage: new RedisThrottlerStorage(redis),
      }),
    }),
    AuthModule,
    AuditModule,
    PrismaModule,
    HealthModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    SuppliersModule,
    UsersModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    InvoicesModule,
    ReturnsModule,
    WhatsAppModule,
    ConversationModule,
    MessageModule,
    WebhooksModule,
    RedisModule,
    FinanceModule,
    NotificationsModule,
    AiModule,
    AnalyticsModule,
    EventBusModule,
    ShippingModule,
    TaxModule,
    FulfillmentModule,
    CatalogModule,
    ReviewsModule,
    ReferralsModule,
    LoyaltyModule,
    EngagementModule,
    B2bModule,
    QuotesModule,
    MarketplaceModule,
    AccountingModule,
    PrivacyModule,
    CaptchaModule,
    PosModule,
    SubscriptionsModule,
    SellersModule,
    DropshipModule,
    BulkImportModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
