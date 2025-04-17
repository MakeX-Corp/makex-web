import postgres from 'postgres';

export class DatabaseTool {
  constructor() {}

  async execute<T = any>(connectionUri: string, query: string, params?: any[]): Promise<T[]> {
    let sql: ReturnType<typeof postgres> | null = null;
    
    try {
      // Log the connection attempt (without sensitive info)
      const uri = new URL(connectionUri);
      console.log(`Attempting to connect to ${uri.hostname}:${uri.port}`);

      sql = postgres(connectionUri, {
        ssl: { rejectUnauthorized: false },
        max: 10,
        idle_timeout: 30,
        connect_timeout: 5,
        onnotice: (notice) => console.log('Postgres notice:', notice),
        onparameter: (key, value) => console.log('Postgres parameter:', key, value),
      });

      // Test the connection
      await sql`SELECT 1`;
      console.log('Successfully connected to database');

      // Execute the query
      const result = await sql.unsafe(query, params) as unknown as T[];
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error('Connection refused. Please check if the database is running and the connection details are correct.');
        } else if (error.message.includes('ENOTFOUND')) {
          throw new Error('Host not found. Please check the hostname in your connection URI.');
        } else if (error.message.includes('ETIMEDOUT')) {
          throw new Error('Connection timed out. Please check if the database is accessible.');
        }
      }
      throw error;
    } finally {
      if (sql) {
        try {
          await sql.end();
          console.log('Successfully disconnected from database');
        } catch (error) {
          console.error('Error disconnecting from database:', error);
        }
      }
    }
  }

}
