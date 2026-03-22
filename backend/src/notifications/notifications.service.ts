import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('SMTP_PORT', 587),
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async sendEmail(to: string[], subject: string, html: string) {
    if (!this.transporter) {
      this.logger.warn('Email not configured, skipping send');
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM', 'noreply@guardianmcp.dev'),
      to: to.join(', '),
      subject,
      html,
    });
  }

  async sendSlackWebhook(webhookUrl: string, message: string) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
    } catch (err) {
      this.logger.error(`Slack notification failed: ${err}`);
    }
  }
}
