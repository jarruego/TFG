import { Injectable } from "@nestjs/common";
import { QueryOptions, Repository } from "../repository";
import { CourseSelectModel, courseTable } from "src/database/schema/tables/course.table";
import { eq, ilike, and } from "drizzle-orm";
import { CreateCourseDTO } from "src/dto/course/create-course.dto";
import { UpdateCourseDTO } from "src/dto/course/update-course.dto";
import { userCourseTable } from "src/database/schema/tables/user_course.table";
import { CreateUserCourseDTO } from "src/dto/user-course/create-user-course.dto";
import { UpdateUserCourseDTO } from "src/dto/user-course/update-user-course.dto";
import { userCourseMoodleRoleTable } from "src/database/schema/tables/user_course_moodle_role.table";
import { CreateUserCourseRoleDTO } from "src/dto/user-course-role/create-user-course-role.dto";
import { MoodleCourse } from "src/types/moodle/course";

@Injectable()
export class CourseRepository extends Repository {

  async findById(id: number, options?: QueryOptions) {
    const rows = await this.query(options).select().from(courseTable).where(eq(courseTable.id_course, id));
    return rows?.[0];
  }

  async create(createCourseDTO: CreateCourseDTO) {
    const result = await this.query()
      .insert(courseTable)
      .values(createCourseDTO);
    return result;
  }

  async update(id: number, updateCourseDTO: UpdateCourseDTO) {
    const result = await this.query()
      .update(courseTable)
      .set(updateCourseDTO)
      .where(eq(courseTable.id_course, id));
    return result;
  }

  async findAll(filter: Partial<CourseSelectModel>) {
        const where = [];

        if (filter.course_name) where.push(ilike(courseTable.course_name, `%${filter.course_name}%`));
        if (filter.start_date) where.push(eq(courseTable.start_date, filter.start_date));
        if (filter.end_date) where.push(eq(courseTable.end_date, filter.end_date));
        if (filter.short_name) where.push(ilike(courseTable.short_name, `%${filter.short_name}%`));
        if (filter.category) where.push(ilike(courseTable.category, `%${filter.category}%`));
        // if (filter.price_per_hour) where.push(eq(courseTable.price_per_hour, filter.price_per_hour));
        // if (filter.modality) where.push(ilike(courseTable.modality, `%${filter.modality}%`));
        // if (filter.active) where.push(eq(courseTable.active, filter.active));

        return await this.query().select().from(courseTable).where(and(...where));
  }

  async addUserToCourse(createUserCourseDTO: CreateUserCourseDTO) {
    const result = await this.query()
      .insert(userCourseTable)
      .values(createUserCourseDTO);
    return result;
  }

  async findUsersInCourse(courseId: number) {
    const rows = await this.query()
      .select()
      .from(userCourseTable)
      .where(eq(userCourseTable.id_course, courseId));
    return rows;
  }

  async updateUserInCourse(id_course: number, id_user: number, updateUserCourseDTO: UpdateUserCourseDTO) {
    const result = await this.query()
      .update(userCourseTable)
      .set(updateUserCourseDTO)
      .where(and(eq(userCourseTable.id_course, id_course), eq(userCourseTable.id_user, id_user)));
    return result;
  }

  async deleteById(id: number) {
    const result = await this.query()
      .delete(courseTable)
      .where(eq(courseTable.id_course, id));
    return result;
  }

  async deleteUserFromCourse(id_course: number, id_user: number) {
    const result = await this.query()
      .delete(userCourseTable)
      .where(and(eq(userCourseTable.id_course, id_course), eq(userCourseTable.id_user, id_user)));
    return result;
  }

  async addUserRoleToCourse(createUserCourseRoleDTO: CreateUserCourseRoleDTO) {
    const result = await this.query()
      .insert(userCourseMoodleRoleTable)
      .values(createUserCourseRoleDTO);
    return result;
  }

  async updateUserRolesInCourse(id_course: number, id_user: number, roles: CreateUserCourseRoleDTO[]) {
    await this.query()
      .delete(userCourseMoodleRoleTable)
      .where(and(eq(userCourseMoodleRoleTable.id_course, id_course), eq(userCourseMoodleRoleTable.id_user, id_user)));

    const result = await this.query()
      .insert(userCourseMoodleRoleTable)
      .values(roles);
    return result;
  }

  async findByMoodleId(moodleId: number) {
    const rows = await this.query().select().from(courseTable).where(eq(courseTable.moodle_id, moodleId));
    return rows?.[0];
  }

  async upsertMoodleCourse(moodleCourse: MoodleCourse) {
    const existingCourse = await this.findByMoodleId(moodleCourse.id);
    if (existingCourse) {
      await this.update(existingCourse.id_course, {
        course_name: moodleCourse.fullname,
        short_name: moodleCourse.shortname,
        moodle_id: moodleCourse.id,
        start_date: new Date(moodleCourse.startdate * 1000),
        end_date: new Date(moodleCourse.enddate * 1000),
        category: ""
      });
      return existingCourse;
    } else {
      const newCourse = await this.create({
        course_name: moodleCourse.fullname,
        short_name: moodleCourse.shortname,
        moodle_id: moodleCourse.id,
        start_date: new Date(moodleCourse.startdate * 1000),
        end_date: new Date(moodleCourse.enddate * 1000),
        category: ""
      });
      return newCourse;
    }
  }
}