// src/app/api/ping/route.ts
// Endpoint de keepalive para evitar que Render duerma el servicio en el plan gratuito.
// Servicios como cron-job.org o UptimeRobot pueden llamar este endpoint cada 14 minutos.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'Sayta Mall',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Keepalive': 'true',
      },
    }
  );
}

// HEAD tambien para herramientas que usan HEAD en vez de GET
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'X-Keepalive': 'true',
    },
  });
}
