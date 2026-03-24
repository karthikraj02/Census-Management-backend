exports.up = async function (knex) {
  // Create gender enum type
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  // Create people table
  await knex.schema.createTableIfNotExists('people', (table) => {
    table.increments('id').primary().notNullable();
    table.text('name').notNullable();
    table.boolean('is_vaccinated');
    table.timestamp('birthdate').notNullable();
    table.specificType('gender', 'gender_enum').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('people');
  await knex.raw(`DROP TYPE IF EXISTS gender_enum;`);
};
