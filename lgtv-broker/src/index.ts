import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

const validCommands = [
  'pause',
  'play',
  'turnoff',
  'volumePlus',
  'volumeMinus',
  'mute'
] as const;

type Command = typeof validCommands[number];

interface CommandBody {
  command: Command;
}

fastify.post<{ Body: CommandBody }>('/command', async (request, reply) => {
  const { command } = request.body;

  if (!validCommands.includes(command)) {
    return reply.status(400).send({ error: 'Commande invalide' });
  }

  return { status: 'ok', command };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info('Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
