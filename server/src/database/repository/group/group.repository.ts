import { Injectable } from "@nestjs/common";
import { QueryOptions, Repository } from "../repository";
import { GroupSelectModel, groupTable, GroupUpdateModel } from "src/database/schema/tables/group.table";
import { eq, ilike, and } from "drizzle-orm";
import { CreateGroupDTO } from "src/dto/group/create-group.dto";
import { UpdateGroupDTO } from "src/dto/group/update-group.dto";
import { userGroupTable } from "src/database/schema/tables/user_group.table";
import { CreateUserGroupDTO } from "src/dto/user-group/create-user-group.dto";
import { userTable } from "src/database/schema/tables/user.table";
import { CourseRepository } from "../course/course.repository";
import { EnrollmentStatus } from "src/types/user-course/enrollment-status.enum";
import { UpdateUserGroupDTO } from "src/dto/user-group/update-user-group.dto";
import { MoodleGroup } from "src/types/moodle/group";

@Injectable()
export class GroupRepository extends Repository {
  async findById(id: number, options?: QueryOptions) {
    const rows = await this.query(options).select().from(groupTable).where(eq(groupTable.id_group, id));
    return rows?.[0];
  }

  async findByMoodleId(moodleId: number, options?: QueryOptions) {
    const rows = await this.query(options).select().from(groupTable).where(eq(groupTable.moodle_id, moodleId));
    return rows?.[0];
  }

  async create(createGroupDTO: CreateGroupDTO,  options?: QueryOptions) {
    const result = await this.query(options)
      .insert(groupTable)
      .values(createGroupDTO).returning({id: groupTable.id_group});
    return result;
  }

  async update(id: number, updateGroupDTO: GroupUpdateModel,  options?: QueryOptions) {
    const result = await this.query(options)
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
    // if (filter.start_date) where.push(eq(groupTable.start_date, filter.start_date));
    // if (filter.end_date) where.push(eq(groupTable.end_date, filter.end_date));
    
    return await this.query().select().from(groupTable).where(and(...where));
  }

  async addUserToGroup(createUserGroupDTO: CreateUserGroupDTO) {
    const result = await this.query()
      .insert(userGroupTable)
      .values(createUserGroupDTO);

    // Get the id_course of the group
    const group = await this.findById(createUserGroupDTO.id_group);
    const id_course = group.id_course;

    // Associate user with the corresponding course
    const courseRepository = new CourseRepository(this.dbService);
    await courseRepository.addUserToCourse({
      id_user: createUserGroupDTO.id_user,
      id_course: id_course,
      enrollment_date: new Date(),
      status: EnrollmentStatus.ACTIVE,
      completion_percentage: 0,
      time_spent: 0
    });

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

  async updateUserInGroup(id_group: number, id_user: number, updateUserGroupDTO: UpdateUserGroupDTO) {
    const result = await this.query()
      .update(userGroupTable)
      .set(updateUserGroupDTO)
      .where(and(eq(userGroupTable.id_group, id_group), eq(userGroupTable.id_user, id_user)));
    return result;
  }

  async deleteUserFromGroup(id_group: number, id_user: number) {
    const result = await this.query()
      .delete(userGroupTable)
      .where(and(eq(userGroupTable.id_group, id_group), eq(userGroupTable.id_user, id_user)));
      // Check if the user is enrolled in other groups of the same course
      const group = await this.findById(id_group);
      const otherGroups = await this.query()
        .select()
        .from(userGroupTable)
        .where(and(eq(userGroupTable.id_user, id_user), eq(groupTable.id_course, group.id_course), eq(userGroupTable.id_group, groupTable.id_group)));

      // If the user is not enrolled in any other groups of the same course, remove them from the course
      if (otherGroups.length === 0) {
        const courseRepository = new CourseRepository(this.dbService);
        await courseRepository.deleteUserFromCourse(id_user, group.id_course);
      }
    return result;
  }

  async deleteById(id: number) {
    const result = await this.query()
      .delete(groupTable)
      .where(eq(groupTable.id_group, id));
    return result;
  }

  async upsertMoodleGroup(moodleGroup: MoodleGroup, id_course: number,  options?: QueryOptions) {
    const data = {
      group_name: moodleGroup.name,
      moodle_id: moodleGroup.id,
      id_course: id_course,
      description: moodleGroup.description || ''
    };
    const existingGroup = await this.findByMoodleId(moodleGroup.id, options);
    if (existingGroup) {
      await this.update(existingGroup.id_group, data, options);
      return await this.findByMoodleId(moodleGroup.id, options); // TODO: optimize
    } else {
      const newGroup = await this.create(data, options);
      return await this.findById(newGroup[0].id, options);
    }
  }

  async findGroupsByCourseId(courseId: number, options?: QueryOptions) {
    const rows = await this.query(options).select().from(groupTable).where(eq(groupTable.id_course, courseId));
    return rows;
  }
}
