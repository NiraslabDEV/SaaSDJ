import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma/client';

async function main() {
  await prisma.$connect();
  console.log('✅ Banco de dados conectado.');

  app.listen(env.PORT, () => {
    console.log(`🚀 Pulso Musical rodando em http://localhost:${env.PORT}`);
    console.log(`   Ambiente: ${env.NODE_ENV}`);
  });
}

main().catch((err) => {
  console.error('❌ Erro ao iniciar o servidor:', err);
  process.exit(1);
});
