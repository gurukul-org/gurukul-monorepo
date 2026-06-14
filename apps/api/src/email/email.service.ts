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

  async sendInvitationEmail(
    to: string,
    tenantName: string,
    inviterName: string,
    roles: string[],
    inviteLink: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.get<string>('EMAIL_FROM'),
      to,
      subject: `You have been invited to join ${tenantName}`,
      text: `${inviterName} has invited you to join ${tenantName} with the following roles: ${roles.join(', ')}. Use this link to accept the invitation: ${inviteLink}`,
      html: `
        <h2>You're Invited!</h2>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${tenantName}</strong>.</p>
        <p>Assigned Roles: ${roles.join(', ')}</p>
        <br/>
        <p>Click the link below to accept the invitation:</p>
        <p><a href="${inviteLink}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#ffffff;text-decoration:none;border-radius:5px;">Accept Invitation</a></p>
        <br/>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p>${inviteLink}</p>
      `,
    });
  }
}
