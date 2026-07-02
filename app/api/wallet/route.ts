import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CIRCLE_API_URL = 'https://api.circle.com/v1/w3s';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, userId, userToken, walletId, contractAddress, callData } = body;
    const apiKey = process.env.CIRCLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'CIRCLE_API_KEY environment variable is not configured' }, { status: 500 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    // 1. Create User
    if (action === 'create-user') {
      if (!userId || userId.length < 5) {
        return NextResponse.json({ success: false, error: 'User ID is required and must be at least 5 characters' }, { status: 400 });
      }

      console.log(`[Circle Wallet API] Creating user: ${userId}`);
      const res = await fetch(`${CIRCLE_API_URL}/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage = data.message || '';
        if (
          data.code === 155106 || 
          res.status === 409 || 
          errorMessage.toLowerCase().includes('already created') || 
          errorMessage.toLowerCase().includes('already exists')
        ) {
          console.log(`[Circle Wallet API] User ${userId} already exists, proceeding...`);
          return NextResponse.json({ success: true, code: 155106, message: 'User already exists' });
        }
        return NextResponse.json({ success: false, error: data.message || 'Failed to create user' }, { status: res.status });
      }

      return NextResponse.json({ success: true, data: data.data });
    }

    // 2. Get User Token
    if (action === 'get-token') {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
      }

      console.log(`[Circle Wallet API] Fetching session token for user: ${userId}`);
      const res = await fetch(`${CIRCLE_API_URL}/users/token`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ success: false, error: data.message || 'Failed to get session token' }, { status: res.status });
      }

      // Ensure appId is always returned — the W3SSdk client needs it for challenge execution.
      // Circle's /users/token may not include appId, so we inject it from the server env.
      const appId = data.data?.appId || process.env.CIRCLE_APP_ID || '';
      return NextResponse.json({ success: true, ...data.data, appId });
    }

    // 3. Initialize User (Get PIN setup Challenge ID)
    if (action === 'initialize') {
      if (!userToken) {
        return NextResponse.json({ success: false, error: 'User token is required' }, { status: 400 });
      }

      console.log('[Circle Wallet API] Creating PIN challenge & wallets');
      const res = await fetch(`${CIRCLE_API_URL}/user/initialize`, {
        method: 'POST',
        headers: {
          ...headers,
          'X-User-Token': userToken,
        },
        body: JSON.stringify({
          blockchains: ['arc-testnet'],
          idempotencyKey: crypto.randomUUID(),
          accountType: 'SCA',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 155106) {
          return NextResponse.json({ success: true, code: 155106, message: 'User already initialized' });
        }
        return NextResponse.json({ success: false, error: data.message || 'Failed to initialize PIN challenge' }, { status: res.status });
      }

      return NextResponse.json({ success: true, challengeId: data.data?.challengeId });
    }

    // 4. List User Wallets
    if (action === 'list-wallets') {
      if (!userToken) {
        return NextResponse.json({ success: false, error: 'User token is required' }, { status: 400 });
      }

      console.log('[Circle Wallet API] Listing wallets');
      const res = await fetch(`${CIRCLE_API_URL}/wallets`, {
        method: 'GET',
        headers: {
          ...headers,
          'X-User-Token': userToken,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ success: false, error: data.message || 'Failed to list wallets' }, { status: res.status });
      }

      return NextResponse.json({ success: true, wallets: data.data?.wallets || [] });
    }

    // 5. Create Contract Execution Challenge
    if (action === 'execute-contract') {
      if (!userToken || !walletId || !contractAddress || !callData) {
        return NextResponse.json({ success: false, error: 'userToken, walletId, contractAddress, and callData are required' }, { status: 400 });
      }

      console.log('[Circle Wallet API] Creating contract execution challenge');
      const res = await fetch(`${CIRCLE_API_URL}/user/transactions/contractExecution`, {
        method: 'POST',
        headers: {
          ...headers,
          'X-User-Token': userToken,
        },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          walletId,
          contractAddress,
          callData,
          fee: { type: 'level', config: { feeLevel: 'MEDIUM' } }
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ success: false, error: data.message || 'Failed to create contract execution challenge' }, { status: res.status });
      }

      return NextResponse.json({ success: true, challengeId: data.data?.challengeId });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Circle Wallet API Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
