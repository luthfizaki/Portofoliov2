import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(projectRoot, ".env"), quiet: true });
dotenv.config({
  path: path.join(projectRoot, ".env.local"),
  override: true,
  quiet: true
});

const app = express();
const appPort = Number.parseInt(process.env.APP_PORT || "3101", 10);
const useSsl = process.env.DB_SSL === "true";

const pool = new pg.Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: useSsl ? { rejectUnauthorized: false } : false
      }
    : {
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number.parseInt(process.env.DB_PORT || "5432", 10),
        database: process.env.DB_NAME || "portfolio_v2",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "",
        ssl: useSsl ? { rejectUnauthorized: false } : false
      }
);

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "100kb" }));

async function readSeed(section) {
  const seedPath = path.join(projectRoot, "data", `${section}.json`);
  return JSON.parse(await fs.readFile(seedPath, "utf8"));
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_v2_hero (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const heroSeed = await readSeed("hero");
  await pool.query(
    `INSERT INTO portfolio_v2_hero (id, content)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(heroSeed)]
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_v2_about (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const aboutSeed = await readSeed("about");
  await pool.query(
    `INSERT INTO portfolio_v2_about (id, content)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(aboutSeed)]
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_v2_experience (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const experienceSeed = await readSeed("experience");
  await pool.query(
    `INSERT INTO portfolio_v2_experience (id, content)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(experienceSeed)]
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_v2_selected_work (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const selectedWorkSeed = await readSeed("selected-work");
  await pool.query(
    `INSERT INTO portfolio_v2_selected_work (id, content)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(selectedWorkSeed)]
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_v2_flagship_products (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const flagshipProductsSeed = await readSeed("flagship-products");
  await pool.query(
    `INSERT INTO portfolio_v2_flagship_products (id, content)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(flagshipProductsSeed)]
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_v2_creative_practice (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const creativePracticeSeed = await readSeed("creative-practice");
  await pool.query(
    `INSERT INTO portfolio_v2_creative_practice (id, content)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(creativePracticeSeed)]
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_v2_project_archive (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const projectArchiveSeed = await readSeed("project-archive");
  await pool.query(
    `INSERT INTO portfolio_v2_project_archive (id, content)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(projectArchiveSeed)]
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_v2_how_i_work (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const howIWorkSeed = await readSeed("how-i-work");
  await pool.query(
    `INSERT INTO portfolio_v2_how_i_work (id, content)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(howIWorkSeed)]
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_v2_capabilities_tools (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const capabilitiesToolsSeed = await readSeed("capabilities-tools");
  await pool.query(
    `INSERT INTO portfolio_v2_capabilities_tools (id, content)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(capabilitiesToolsSeed)]
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_v2_collaboration_testimonials (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const collaborationTestimonialsSeed = await readSeed(
    "collaboration-testimonials"
  );
  await pool.query(
    `INSERT INTO portfolio_v2_collaboration_testimonials (id, content)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(collaborationTestimonialsSeed)]
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_v2_contact_final_statement (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const contactFinalStatementSeed = await readSeed("contact-final-statement");
  await pool.query(
    `INSERT INTO portfolio_v2_contact_final_statement (id, content)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(contactFinalStatementSeed)]
  );
}

app.get("/api/health", async (_request, response, next) => {
  try {
    await pool.query("SELECT 1");
    response.json({ ok: true, app: "portfolio-v2" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/hero", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT content FROM portfolio_v2_hero WHERE id = 1"
    );
    response.json(result.rows[0]?.content || (await readSeed("hero")));
  } catch (error) {
    next(error);
  }
});

app.get("/api/about", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT content FROM portfolio_v2_about WHERE id = 1"
    );
    response.json(result.rows[0]?.content || (await readSeed("about")));
  } catch (error) {
    next(error);
  }
});

app.get("/api/experience", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT content FROM portfolio_v2_experience WHERE id = 1"
    );
    response.json(result.rows[0]?.content || (await readSeed("experience")));
  } catch (error) {
    next(error);
  }
});

app.get("/api/selected-work", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT content FROM portfolio_v2_selected_work WHERE id = 1"
    );
    response.json(result.rows[0]?.content || (await readSeed("selected-work")));
  } catch (error) {
    next(error);
  }
});

app.get("/api/flagship-products", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT content FROM portfolio_v2_flagship_products WHERE id = 1"
    );
    response.json(
      result.rows[0]?.content || (await readSeed("flagship-products"))
    );
  } catch (error) {
    next(error);
  }
});

app.get("/api/creative-practice", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT content FROM portfolio_v2_creative_practice WHERE id = 1"
    );
    response.json(
      result.rows[0]?.content || (await readSeed("creative-practice"))
    );
  } catch (error) {
    next(error);
  }
});

app.get("/api/project-archive", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT content FROM portfolio_v2_project_archive WHERE id = 1"
    );
    response.json(
      result.rows[0]?.content || (await readSeed("project-archive"))
    );
  } catch (error) {
    next(error);
  }
});

app.get("/api/how-i-work", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT content FROM portfolio_v2_how_i_work WHERE id = 1"
    );
    response.json(
      result.rows[0]?.content || (await readSeed("how-i-work"))
    );
  } catch (error) {
    next(error);
  }
});

app.get("/api/capabilities-tools", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT content FROM portfolio_v2_capabilities_tools WHERE id = 1"
    );
    response.json(
      result.rows[0]?.content || (await readSeed("capabilities-tools"))
    );
  } catch (error) {
    next(error);
  }
});

app.get("/api/collaboration-testimonials", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT content FROM portfolio_v2_collaboration_testimonials WHERE id = 1"
    );
    response.json(
      result.rows[0]?.content ||
        (await readSeed("collaboration-testimonials"))
    );
  } catch (error) {
    next(error);
  }
});

app.get("/api/contact-final-statement", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT content FROM portfolio_v2_contact_final_statement WHERE id = 1"
    );
    response.json(
      result.rows[0]?.content || (await readSeed("contact-final-statement"))
    );
  } catch (error) {
    next(error);
  }
});

const distPath = path.join(projectRoot, "dist");
try {
  await fs.access(distPath);
  app.use(express.static(distPath));
  app.get("*", (_request, response) => {
    response.sendFile(path.join(distPath, "index.html"));
  });
} catch {
  // Vite serves the frontend during local development.
}

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Portfolio V2 API error" });
});

async function start() {
  await initializeDatabase();
  app.listen(appPort, () => {
    console.log(`Portfolio V2 API running on http://localhost:${appPort}`);
  });
}

start().catch((error) => {
  console.error("Unable to start Portfolio V2:", error);
  process.exit(1);
});
