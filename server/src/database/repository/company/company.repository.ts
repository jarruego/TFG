import { Injectable } from "@nestjs/common";
import { QueryOptions, Repository } from "../repository";
import { CompanySelectModel, companyTable } from "src/database/schema/tables/company.table";
import { eq, ilike, and } from "drizzle-orm";
import { CreateCompanyDTO } from "src/dto/company/create-company.dto";
import { UpdateCompanyDTO } from "src/dto/company/update-company.dto";

@Injectable()
export class CompanyRepository extends Repository {
    
    async findByCIF(cif: string, options?: QueryOptions) {
        const rows = await this.query(options).select().from(companyTable).where(eq(companyTable.cif, cif));
        return rows?.[0];
    }

    async create(createCompanyDTO: CreateCompanyDTO, options?: QueryOptions) {
        const result = await this.query(options)
            .insert(companyTable)
            .values(createCompanyDTO);
        return result;
    }

    async update(id: number, updateCompanyDTO: UpdateCompanyDTO, options?: QueryOptions) {
        const result = await this.query(options)
            .update(companyTable)
            .set(updateCompanyDTO)
            .where(eq(companyTable.id_company, id));
        return result;
    }

    async findOne(id: number, options?: QueryOptions) {
        const rows = await this.query(options).select().from(companyTable).where(eq(companyTable.id_company, id));
        return rows?.[0];
    }

    async findAll(filter: Partial<CompanySelectModel>, options?: QueryOptions) {
        
        const where = [];

        if (filter.cif) where.push(ilike(companyTable.cif, `%${filter.cif}%`));
        if (filter.company_name) where.push(ilike(companyTable.company_name, `%${filter.company_name}%`));
        if (filter.corporate_name) where.push(ilike(companyTable.corporate_name, `%${filter.corporate_name}%`));

        return await this.query(options).select().from(companyTable).where(and(...where));
        

    }

    async delete(id: number, options?: QueryOptions) {
        const result = await this.query(options)
            .delete(companyTable)
            .where(eq(companyTable.id_company, id));
        return result;
    }
}