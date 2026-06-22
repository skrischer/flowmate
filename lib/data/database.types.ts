/**
 * Database schema types for the typed Supabase client.
 *
 * Empty until the first migration lands (issue #5), after which this file is
 * regenerated from the live local schema with:
 *   supabase gen types typescript --local > lib/data/database.types.ts
 * Keeping it typed (rather than the SDK's `any` default) preserves the
 * lib/data/ boundary contract.
 */
export type Database = {
  public: {
    Tables: { [key in never]: never };
    Views: { [key in never]: never };
    Functions: { [key in never]: never };
    Enums: { [key in never]: never };
    CompositeTypes: { [key in never]: never };
  };
};
