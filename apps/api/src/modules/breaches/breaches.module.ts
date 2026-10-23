import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { BreachesController } from './breaches.controller'
import { BreachesProcessor } from './breaches.processor'
import { BREACHES_QUEUE, BreachesService } from './breaches.service'
import { HibpClient } from './hibp.client'

@Module({
  imports: [BullModule.registerQueue({ name: BREACHES_QUEUE })],
  controllers: [BreachesController],
  providers: [BreachesService, BreachesProcessor, HibpClient],
})
export class BreachesModule {}
