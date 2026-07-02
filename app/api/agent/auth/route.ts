import { NextRequest, NextResponse } from 'next/server';
import { execFileSync } from 'child_process';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'agent', 'agent.db');

function runDb(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    const db = new sqlite3.Database(DB_PATH);
    db.configure("busyTimeout", 10000);
    db.run(sql, params, (err) => {
      db.close();
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { action, email, requestId, otp } = await req.json().catch(() => ({}));
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

    if (action === 'init') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) {
        return NextResponse.json({ success: false, error: 'Valid email is required.' }, { status: 400 });
      }

      console.log(`Running login init command safely for ${email}`);
      
      try {
        const initOutput = execFileSync(
          npxCmd,
          ['circle', 'wallet', 'login', email, '--type', 'agent', '--init'],
          { 
            encoding: 'utf8',
            env: { ...process.env, CIRCLE_ACCEPT_TERMS: '1' },
            shell: true
          }
        );
        console.log(initOutput);

        // Parse request ID from output
        const match = initOutput.match(/--request\s+([a-f0-9\-]{36})/i);
        if (!match || !match[1]) {
          return NextResponse.json({
            success: false,
            error: 'Failed to request OTP code via Circle CLI. Ensure Circle CLI is configured correctly.'
          }, { status: 500 });
        }

        const parsedRequestId = match[1];
        await runDb(
          `INSERT INTO logs (timestamp, message, level) VALUES (?, ?, ?)`,
          [Date.now(), `Dispatched email-OTP code verification request for ${email}`, 'SYSTEM']
        );

        return NextResponse.json({ success: true, requestId: parsedRequestId });
      } catch (err: any) {
        console.error("Init CLI error:", err.message);
        return NextResponse.json({ success: false, error: `CLI Error: ${err.message}` }, { status: 500 });
      }
    }

    if (action === 'verify') {
      const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
      const otpRegex = /^[a-zA-Z0-9-]{3,12}$/;
      
      if (!requestId || !uuidRegex.test(requestId) || !otp || !otpRegex.test(otp)) {
        return NextResponse.json({ success: false, error: 'Request ID and OTP code are required and must be valid.' }, { status: 400 });
      }

      console.log(`Running login verification safely for request ${requestId}`);

      try {
        const verifyOutput = execFileSync(
          npxCmd,
          ['circle', 'wallet', 'login', '--type', 'agent', '--request', requestId, '--otp', otp],
          { 
            encoding: 'utf8',
            env: { ...process.env, CIRCLE_ACCEPT_TERMS: '1' },
            shell: true
          }
        );
        console.log(verifyOutput);

        // Verify status
        const statusOutput = execFileSync(
          npxCmd,
          ['circle', 'wallet', 'status'],
          { 
            encoding: 'utf8',
            env: { ...process.env, CIRCLE_ACCEPT_TERMS: '1' },
            shell: true
          }
        );
        console.log("Status check:", statusOutput);

        // Save session in db
        await runDb(
          `INSERT OR REPLACE INTO session_tokens (key, value, updated_at) VALUES ('session_token', ?, ?)`,
          [`session_active_${Date.now()}`, Date.now()]
        );

        await runDb(
          `INSERT INTO logs (timestamp, message, level) VALUES (?, ?, ?)`,
          [Date.now(), 'Agent stack authenticated successfully via user OTP verification.', 'SUCCESS']
        );

        return NextResponse.json({ success: true, status: statusOutput.trim() });
      } catch (err: any) {
        console.error("Verify CLI error:", err.message);
        return NextResponse.json({ success: false, error: `CLI Error: ${err.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
