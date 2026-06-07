import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: Number(this.config.get<string>('SMTP_PORT') || 587),
      secure: Number(this.config.get<string>('SMTP_PORT') || 587) === 465,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.get<string>('EMAIL_FROM'),
      to,
      subject: 'Reset your password',
      text: `Use this link to reset your password: ${resetLink}`,
      html: `<p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });
  }
}
