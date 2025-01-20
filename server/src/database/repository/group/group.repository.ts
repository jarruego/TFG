import { Injectable } from "@nestjs/common";
import { QueryOptions, Repository } from "../repository";
import { GroupSelectModel, groupTable } from "src/database/schema/tables/group.table";
import { eq, ilike, and } from "drizzle-orm";
import { CreateGroupDTO } from "src/dto/group/create-group.dto";
import { UpdateGroupDTO } from "src/dto/group/update-group.dto";
import { userGroupTable } from "src/database/schema/tables/user_group.table";
import { CreateUserGroupDTO } from "src/dto/user-group/create-user-group.dto";
import { userTable } from "src/database/schema/tables/user.table";

@Injectable()
export class GroupRepository extends Repository {
  async findById(id: number, options?: QueryOptions) {
    const rows = await this.query(options).select().from(groupTable).where(eq(groupTable.id_group, id));
    return rows?.[0];
  }

  async create(createGroupDTO: CreateGroupDTO) {
    const result = await this.query()
      .insert(groupTable)
      .values(createGroupDTO);
    return result;
  }

  async update(id: number, updateGroupDTO: UpdateGroupDTO) {
    const result = await this.query()
      .update(groupTable)
      .set(updateGroupDTO)
      .where(eq(groupTable.id_group, id));
    return result;
  }

  async findAll(filter: Partial<GroupSelectModel>) {
    const where = [];
    if (filter.moodle_id) where.push(eq(groupTable.moodle_id, filter.moodle_id));
    if (filter.group_name) where.push(ilike(groupTable.group_name, `%${filter.group_name}%`));
    if (filter.id_course) where.push(eq(groupTable.id_course, filter.id_course));
    if (filter.description) where.push(ilike(groupTable.description, `%${filter.description}%`));
    if (filter.start_date) where.push(eq(groupTable.start_date, filter.start_date));
    if (filter.end_date) where.push(eq(groupTable.end_date, filter.end_date));
    
    return await this.query().select().from(groupTable).where(and(...where));
  }

  async addUserToGroup(createUserGroupDTO: CreateUserGroupDTO) {
    const result = await this.query()
      .insert(userGroupTable)
      .values(createUserGroupDTO);
    return result;
  }

  async findUsersInGroup(groupId: number) {
    const rows = await this.query()
      .select()
      .from(userGroupTable)
      .innerJoin(userTable, eq(userGroupTable.id_user, userTable.id_user))
      .where(eq(userGroupTable.id_group, groupId));
    return rows;
  }
}
