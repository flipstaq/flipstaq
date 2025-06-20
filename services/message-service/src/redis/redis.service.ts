import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    this.logger.log('Redis service initialized (stub)');
  }

  async publish(channel: string, message: string): Promise<number> {
    this.logger.log(`Publishing to ${channel}: ${message}`);
    return 1;
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    this.logger.log(`Subscribing to ${channel}`);
  }

  async unsubscribe(channel: string): Promise<void> {
    this.logger.log(`Unsubscribing from ${channel}`);
  }

  async setUserOnline(userId: string): Promise<void> {
    this.logger.log(`Setting user ${userId} online`);
  }

  async setUserOffline(userId: string): Promise<void> {
    this.logger.log(`Setting user ${userId} offline`);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    this.logger.log(`Checking if user ${userId} is online`);
    return false;
  }

  async getOnlineUsers(): Promise<string[]> {
    this.logger.log('Getting online users');
    return [];
  }
}
