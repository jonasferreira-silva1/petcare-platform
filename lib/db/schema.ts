import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  doublePrecision,
} from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  // Custom fields (registered as additionalFields in lib/auth.ts)
  role: text("role").notNull().default("tutor"), // "tutor" | "petshop"
  phone: text("phone"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- App tables ------------------------------------------------------------

// A pet shop / clinic profile. Owned by a user with role "petshop".
export const petshops = pgTable("petshops", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(), // owner (role "petshop")
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city"),
  phone: text("phone"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Pets owned by a tutor.
export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(), // tutor owner
  name: text("name").notNull(),
  species: text("species").notNull(), // dog, cat, etc
  breed: text("breed"),
  birthdate: text("birthdate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Services offered by a pet shop.
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  petshopId: integer("petshopId").notNull(),
  userId: text("userId").notNull(), // petshop owner, for scoping
  name: text("name").notNull(),
  description: text("description"),
  priceCents: integer("priceCents").notNull().default(0),
  durationMin: integer("durationMin").notNull().default(30),
  active: boolean("active").notNull().default(true), // soft delete — false = removido
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Messages exchanged between tutor and petshop per appointment.
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointmentId").notNull(),
  senderId: text("senderId").notNull(),
  senderRole: text("senderRole").notNull(), // "tutor" | "petshop"
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  readAt: timestamp("readAt"),
})

// Reviews left by tutors after completed appointments.
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointmentId").notNull().unique(), // 1 review por agendamento
  tutorId: text("tutorId").notNull(),
  petshopId: integer("petshopId").notNull(),
  rating: integer("rating").notNull(), // 1 a 5
  comment: text("comment"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Appointments booked by a tutor at a pet shop.
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  tutorId: text("tutorId").notNull(), // tutor user id
  petshopUserId: text("petshopUserId").notNull(), // petshop owner user id
  petshopId: integer("petshopId").notNull(),
  petId: integer("petId").notNull(),
  serviceId: integer("serviceId").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: text("status").notNull().default("pending"), // pending | confirmed | cancelled | completed
  notes: text("notes"),
  // Observações ou orientações inseridas pelo pet shop ao confirmar ou concluir o agendamento
  petshopNotes: text("petshopNotes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})
