require('dotenv').config();

const common = {
  client: 'pg',
  migrations: {
    directory: './src/migrations',
  },
  seeds: {
    directory: './src/seeds',
  },
};

module.exports = {
  development: {
    ...common,
    connection: process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 5432,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD, // no hardcoded password
          database: process.env.DB_NAME || 'vaccination_census',
        },
  },

  production: {
    ...common,
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
  },
};
