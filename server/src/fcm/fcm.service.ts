import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  constructor() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
  }

  async sendNotification(token: string, title: string, body: string, data?: any) {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    try {
      const response = await admin.messaging().send(message);
      return { success: true, messageId: response };
    } catch (error) {
      throw new Error(`FCM send failed: ${error.message}`);
    }
  }

  async sendToMultipleTokens(tokens: string[], title: string, body: string, data?: any) {
    const messages = tokens.map(token => ({
      token,
      notification: {
        title,
        body,
      },
      data: data || {},
    }));

    try {
      const responses = await Promise.allSettled(
        messages.map(message => admin.messaging().send(message))
      );

      const successCount = responses.filter(r => r.status === 'fulfilled').length;
      const failureCount = responses.filter(r => r.status === 'rejected').length;

      return {
        success: successCount,
        failure: failureCount,
        responses: responses.map(r => r.status === 'fulfilled' ? r.value : r.reason),
      };
    } catch (error) {
      throw new Error(`FCM multicast send failed: ${error.message}`);
    }
  }
}
