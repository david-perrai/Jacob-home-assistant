import type { FastifyInstance } from "fastify";
import { TvService, validCommands, type Command } from "../services/tvService";

interface CommandBody {
  command: Command;
  option?: string;
}

export function registerTvController(
  fastify: FastifyInstance,
  tvService: TvService,
) {
  fastify.get("/audioStatus", async (_request, reply) => {
    try {
      return {
        status: "ok",
        command: "audioStatus",
        response: await tvService.getAudioStatus(),
      };
    } catch (error) {
      fastify.log.error({ err: error }, "Échec de la récupération du statut audio");
      return reply.status(502).send({ error: "Échec de la récupération du statut audio" });
    }
  });

  fastify.post<{ Body: CommandBody }>(
    "/command",
    {
      schema: {
        body: {
          type: "object",
          required: ["command"],                    
          properties: {
            command: { type: "string", enum: validCommands },
            option: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const response = await tvService.executeCommand(request.body.command, request.body.option);
        return { status: "ok", command: request.body.command, response};
      } catch (error) {
        fastify.log.error(
          { err: error, command: request.body.command },
          "Échec de la commande envoyée au téléviseur LG",
        );
        return reply.status(502).send({ error: "Échec de la commande TV" });
      }
    },
  );
}
