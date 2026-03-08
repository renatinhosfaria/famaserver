import {
    bigint,
    boolean,
    integer,
    pgTable,
    serial,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().default('User'),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  parentId: uuid('parent_id'), // Self reference possible in logic, but Drizzle doesn't enforce standard FK for self-ref easily without type issues sometimes, keep simple.
  name: text('name').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(), // Size in bytes
  mimeType: text('mime_type').notNull(),
  type: text('type').notNull(), // 'file' or 'folder'
  s3Key: text('s3_key'), // Nullable for folders
  thumbnailS3Key: text('thumbnail_s3_key'),
  isPublic: boolean('is_public').default(false),
  isStarred: boolean('is_starred').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft delete
});

export const shares = pgTable('shares', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileId: uuid('file_id')
    .references(() => files.id)
    .notNull(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
