require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'Nishamani@#098',
          database: process.env.DB_NAME || 'vaccination_census',
        },
    migrations: {
      directory: './src/migrations',
    },
    seeds: {
      directory: './src/seeds',
    },
  },
};
