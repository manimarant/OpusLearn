import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

// Mock database for development when DATABASE_URL is not set
let pool: Pool | null = null;
let db: any;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Using mock database for development.");
  
  // Create a mock database that returns empty results
  const mockDb = {
    select: () => ({ from: () => ({ where: () => [], limit: () => [], orderBy: () => [] }) }),
    insert: () => ({ values: () => ({ onConflictDoUpdate: () => ({ returning: () => [] }), returning: () => [] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
    delete: () => ({ from: () => ({ where: () => ({ returning: () => [] }) }) }),
    query: {
      users: { findMany: () => [], findFirst: () => null },
      courses: { findMany: () => [], findFirst: () => null },
      courseModules: { findMany: () => [], findFirst: () => null },
      chapters: { findMany: () => [], findFirst: () => null },
      enrollments: { findMany: () => [], findFirst: () => null },
      discussions: { findMany: () => [], findFirst: () => null },
      assignments: { findMany: () => [], findFirst: () => null },
      submissions: { findMany: () => [], findFirst: () => null },
      notifications: { findMany: () => [], findFirst: () => null },
      certificates: { findMany: () => [], findFirst: () => null },
    }
  };
  
  pool = null;
  db = mockDb;
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { pool, db };
