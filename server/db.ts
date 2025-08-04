import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

// Mock database for development when DATABASE_URL is not set
let pool: Pool | null = null;
let db: any;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Using mock database for development.");
  
  // Create a more comprehensive mock database that handles the specific operations needed
  const mockDb = {
    select: () => ({ 
      from: () => ({ 
        where: () => [], 
        limit: () => [], 
        orderBy: () => [],
        leftJoin: () => ({ where: () => [] })
      }) 
    }),
    insert: () => ({ 
      values: () => ({ 
        onConflictDoUpdate: () => ({ returning: () => [{ id: 'dev-user-123', email: 'dev@example.com', firstName: 'Development', lastName: 'User', role: 'instructor', profileImageUrl: null, createdAt: new Date(), updatedAt: new Date() }] }), 
        returning: () => [] 
      }) 
    }),
    update: () => ({ 
      set: () => ({ 
        where: () => ({ returning: () => [] }) 
      }) 
    }),
    delete: () => ({ 
      from: () => ({ 
        where: () => ({ returning: () => [] }) 
      }) 
    }),
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
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    console.warn("Falling back to mock database.");
    
    // Fallback to mock database if connection fails
    const mockDb = {
      select: () => ({ 
        from: () => ({ 
          where: () => [], 
          limit: () => [], 
          orderBy: () => [],
          leftJoin: () => ({ where: () => [] })
        }) 
      }),
      insert: () => ({ 
        values: () => ({ 
          onConflictDoUpdate: () => ({ returning: () => [{ id: 'dev-user-123', email: 'dev@example.com', firstName: 'Development', lastName: 'User', role: 'instructor', profileImageUrl: null, createdAt: new Date(), updatedAt: new Date() }] }), 
          returning: () => [] 
        }) 
      }),
      update: () => ({ 
        set: () => ({ 
          where: () => ({ returning: () => [] }) 
        }) 
      }),
      delete: () => ({ 
        from: () => ({ 
          where: () => ({ returning: () => [] }) 
        }) 
      }),
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
  }
}

export { pool, db };
