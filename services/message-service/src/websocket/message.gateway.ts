import { Logger } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({
  port: 8080,
})
export class MessageGateway {
  private readonly logger = new Logger(MessageGateway.name);

  constructor() {
    this.logger.log('Message gateway initialized (stub)');
  }
}
