import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';
import { users } from '../database/schema';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}

  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return result[0];
  }

  async create(email: string, password: string, name: string = 'User') {
    // Default name if not provided (though now required)
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await this.db
      .insert(users)
      .values({
        email,
        name,
        password: hashedPassword,
      })
      .returning();
    return result[0];
  }

  async findById(id: number) {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
}
