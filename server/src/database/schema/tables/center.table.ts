import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";
import { TIMESTAMPS } from "./timestamps";
import { companyTable } from "./company.table";
import { InferSelectModel } from "drizzle-orm";

export const centerTable = pgTable('centers', {
    id_center: serial().primaryKey(),
    center_name: varchar({length: 128}).notNull(),
    employer_number: varchar({length: 128}),
    id_company: integer().notNull().references(() => companyTable.id_company),
    contact_person: varchar({length: 64}),
    contact_phone: varchar({length: 32}),
    contact_email: varchar({length: 128}),
    // ...TIMESTAMPS,
});

export type CenterSelectModel = Partial<InferSelectModel<typeof centerTable> & {
  company_name?: string;
}>;
export type CenterInsertModel = Omit<InferSelectModel<typeof centerTable>, 'id_center'>;
export type CenterUpdateModel = Partial<InferSelectModel<typeof centerTable>>;
