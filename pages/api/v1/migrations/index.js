import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database.js";
import { error } from "node:console";

async function migrations(request, response) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({
      error: `Method "${request.method}" Not Allowed`
    });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const defaultMigrationOptons = {
      dbClient: dbClient,
      dryRun: true,
      dir: join("infra", "migrations"), // Independente do Sistema Operacional ele vai fazer o caminho certo ex: "infra/migrations"
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    }

    if (request.method === "GET") {
      const pendingMigrations = await migrationRunner(defaultMigrationOptons);
      return response.status(200).json(pendingMigrations);
    }

    if (request.method === "POST") {
      const migratedMigrations = await migrationRunner({
        ...defaultMigrationOptons,
        dryRun: false,
      });

      if (migratedMigrations.length > 0) {
        return response.status(201).json(migratedMigrations);
      }

      return response.status(200).json(migratedMigrations);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
  finally {
    await dbClient.end();
  }
}
export default migrations;