import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

const requiredDate = z
  .coerce
  .date();

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.date().optional()
);

export const assetSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  purchasePrice: z.number().nonnegative(),
  purchaseDate: requiredDate,
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE"]).optional(),
});

export const locationSchema = z.object({
  assetId: z.number().int().positive(),
  date: requiredDate,
  price: z.number().nonnegative(),
  clientName: z.string().optional().nullable(),
  locationStatus: z.enum(["PLANNED", "COMPLETED", "CANCELLED"]).optional(),
});

export const expenseTemplateSchema = z.object({
  name: z.string().min(1),
  defaultCost: z.number().nonnegative().optional(),
});

export const expenseSchema = z.object({
  locationId: z.number().int().positive().optional().nullable(),
  templateId: z.number().int().positive().optional().nullable(),
  name: z.string().min(1).optional(),
  cost: z.number().nonnegative().optional(),
});

export const dateFilterSchema = z.object({
  start: optionalDate,
  end: optionalDate,
});

