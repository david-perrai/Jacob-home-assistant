import { config } from "dotenv";
import Fastify from "fastify";
import { registerTvController } from "./controllers/tvController";
import { TvService } from "./services/tvService";

config();

const fastify = Fastify({ logger: true });
const tvService = new TvService(
  process.env.LGTV_URL ?? "ws://lgwebostv:3000",
  {
    error: (error) => {
      fastify.log.error({ err: error }, "Erreur de connexion au téléviseur LG");
    },
    warn: (message) => {
      fastify.log.warn(message);
    },
  },
);

registerTvController(fastify, tvService);

fastify.addHook("onClose", async () => {
  tvService.disconnect();
});

const start = async () => {
  try {
    await fastify.listen({
      port: Number(process.env.PORT ?? 3000),
      host: process.env.HOST ?? "0.0.0.0",
    });
    fastify.log.info("Broker LG TV démarré");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
