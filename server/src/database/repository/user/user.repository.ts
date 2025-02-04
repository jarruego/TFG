import { Injectable } from "@nestjs/common";
import { QueryOptions, Repository } from "../repository";
import { UserSelectModel, userTable } from "src/database/schema/tables/user.table";
import { eq, ilike, and } from "drizzle-orm";
import { CreateUserDTO } from "src/dto/user/create-user.dto";
import { UpdateUserDTO } from "src/dto/user/update-user.dto";
import { MoodleUser } from "src/types/moodle/user";
import { userGroupTable } from "src/database/schema/tables/user_group.table";
import { userCourseTable } from "src/database/schema/tables/user_course.table";
import { userCourseMoodleRoleTable } from "src/database/schema/tables/user_course_moodle_role.table";

@Injectable()
export class UserRepository extends Repository {
  async findById(id: number, options?: QueryOptions) {
    const rows = await this.query(options).select().from(userTable).where(eq(userTable.id_user, id));
    return rows?.[0];
  }

  async create(createUserDTO: CreateUserDTO, options?: QueryOptions): Promise<{ insertId: number }> {
    const result = await this.query(options)
      .insert(userTable)
      .values(createUserDTO)
      .returning({ insertId: userTable.id_user });
    return result[0];
  }

  async update(id: number, updateUserDTO: UpdateUserDTO, options?: QueryOptions) {
      const result = await this.query(options)
        .update(userTable)
        .set(updateUserDTO)
        .where(eq(userTable.id_user, id));
      return result;
  }

  async delete(id: number, options?: QueryOptions) {
    const result = await this.query(options)
      .delete(userTable)
      .where(eq(userTable.id_user, id));
    return result;
  }

  async findAll(filter: Partial<UserSelectModel>, options?: QueryOptions) {
        const where = [];

        if (filter.name) where.push(ilike(userTable.name, `%{filter.name}%`));
        if (filter.surname) where.push(ilike(userTable.surname, `%{filter.surname}%`));
        if (filter.email) where.push(ilike(userTable.email, `%{filter.email}%`));
        if (filter.moodle_username) where.push(ilike(userTable.moodle_username, `%{filter.moodle_username}%`));
        //if (filter.dni) where.push(ilike(userTable.dni, `%{filter.dni}%`));
        //if (filter.phone) where.push(ilike(userTable.phone, `%{filter.phone}%`));
        //if (filter.nss) where.push(ilike(userTable.nss, `%{filter.nss}%`));
        //if (filter.document_type) where.push(ilike(userTable.document_type, `%{filter.document_type}%`));
        
        return await this.query(options).select().from(userTable).where(and(...where));
  }

  async findByMoodleId(moodleId: number, options?: QueryOptions) {
    const rows = await this.query(options).select().from(userTable).where(eq(userTable.moodle_id, moodleId));
    return rows?.[0];
  }

  async upsertMoodleUserByGroup(moodleUser: MoodleUser, id_group: number, options?: QueryOptions) {
    const existingUser = await this.findByMoodleId(moodleUser.id, options);
    const data = {
      name: moodleUser.firstname,
      surname: moodleUser.lastname,
      email: moodleUser.email,
      moodle_username: moodleUser.username,
      moodle_id: moodleUser.id
    };

    let userId: number;

    if (existingUser) {
      await this.update(existingUser.id_user, data, options);
      userId = existingUser.id_user;
    } else {
      const result = await this.create(data, options);
      userId = result.insertId;
    }

    // Actualizar la tabla user_group
    const userGroupRows = await this.query(options).select().from(userGroupTable).where(and(eq(userGroupTable.id_user, userId), eq(userGroupTable.id_group, id_group)))
    if(userGroupRows.length <= 0) {
      await this.query(options)
      .insert(userGroupTable)
      .values({ id_user: userId, id_group: id_group });
    }
  }

  async upsertMoodleUserByCourse(moodleUser: MoodleUser, id_course: number, options?: QueryOptions) {
    const existingUser = await this.findByMoodleId(moodleUser.id, options);
    const data = {
      name: moodleUser.firstname,
      surname: moodleUser.lastname,
      email: moodleUser.email,
      moodle_username: moodleUser.username,
      moodle_id: moodleUser.id
    };
    let userId: number;

    if (existingUser) {
      await this.update(existingUser.id_user, data, options);
      userId = existingUser.id_user;
    } else {
      const result = await this.create(data, options);
      userId = result.insertId;
    }

    // Actualizar la tabla user_course
    await this.query(options)
      .insert(userCourseTable)
      .values({ id_user: userId, id_course: id_course })
      .onConflictDoNothing();

    // TODO: optimize
    // Actualizar la tabla user_course_moodle_role
    for (const role of moodleUser.roles) {
      await this.query(options)
        .insert(userCourseMoodleRoleTable)
        .values({
          id_user: userId,
          id_course: id_course,
          id_role: role.roleid,
          role_shortname: role.shortname
        })
        .onConflictDoNothing();
    }
    return await this.findById(userId); // TODO: is necesary?
  }
}