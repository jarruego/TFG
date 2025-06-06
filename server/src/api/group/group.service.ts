import { Inject, Injectable } from "@nestjs/common";
import { GroupRepository } from "src/database/repository/group/group.repository";
import { QueryOptions } from "src/database/repository/repository";
import { CourseRepository } from "src/database/repository/course/course.repository";
// import { EnrollmentStatus } from "src/types/user-course/enrollment-status.enum";
import { DATABASE_PROVIDER } from "src/database/database.module";
import { DatabaseService } from "src/database/database.service";
import { GroupInsertModel, GroupSelectModel, GroupUpdateModel } from "src/database/schema/tables/group.table";
import { UserGroupUpdateModel } from "src/database/schema/tables/user_group.table";
import { GroupBonificableService } from "./group-bonification.service";
import { UserCourseRepository } from "src/database/repository/course/user-course.repository";
import { UserGroupRepository } from "src/database/repository/group/user-group.repository";
import { UserCenterRepository } from "src/database/repository/center/user-center.repository";


type AddUserToGroupOptions = {id_group: number; id_user: number; id_center?: number }

@Injectable()
export class GroupService {
  constructor(private readonly groupRepository: GroupRepository,
    private readonly courseRepository: CourseRepository,
    private readonly groupBonificableService: GroupBonificableService,
    private readonly userCourseRepository: UserCourseRepository,
    private readonly userGroupRepository: UserGroupRepository,
    private readonly userCenterRepository: UserCenterRepository,
    @Inject(DATABASE_PROVIDER) private readonly databaseService: DatabaseService
  ) { }

  async findById(id: number, options?: QueryOptions) {
    return await (options?.transaction ?? this.databaseService.db).transaction(async transaction => {
      return await this.groupRepository.findById(id, { transaction });
    });
  }

  async create(groupInsertModel: GroupInsertModel, options?: QueryOptions) {
    return await (options?.transaction ?? this.databaseService.db).transaction(async transaction => {
      return await this.groupRepository.create(groupInsertModel, { transaction });
    });
  }

  async update(id: number, groupUpdateModel: GroupUpdateModel, options?: QueryOptions) {
    return await (options?.transaction ?? this.databaseService.db).transaction(async transaction => {
      await this.groupRepository.update(id, groupUpdateModel, { transaction });
      return await this.groupRepository.findById(id, { transaction });
    });
  }

  async findAll(filter: Partial<GroupSelectModel>, options?: QueryOptions) {
    return await (options?.transaction ?? this.databaseService.db).transaction(async transaction => {
      return await this.groupRepository.findAll(filter, { transaction });
    });
  }

  

  async addUserToGroup({ id_group, id_user, id_center }: AddUserToGroupOptions, options?: QueryOptions) {
    return await (options?.transaction ?? this.databaseService.db).transaction(async transaction => {
      const result = await this.userGroupRepository.addUserToGroup(id_group, id_user, { transaction });

      // Get the id_course of the group
      const group = await this.groupRepository.findById(id_group, { transaction });
      const id_course = group.id_course;

      // Check if the user is already in the course
      const userCourse = await this.userCourseRepository.findByCourseAndUserId(id_course, id_user, { transaction });

      // Associate user with the corresponding course if not already in the course
      if (!userCourse) {
        await this.userCourseRepository.create({ 
          id_user,
          id_course,
          enrollment_date: new Date(),
          completion_percentage: "0",
          time_spent: 0,
         });
      }

      // Associate group
      const userGroup = await this.userGroupRepository.findByGroupAndUserId(id_group, id_user, { transaction });

      if (userGroup) {
        if (typeof id_center !== 'undefined') {
          await this.userGroupRepository.updateById(id_user, id_group, { id_center }, { transaction });
        }
      } else {
        await this.userGroupRepository.create({
          id_group,
          id_user,
          id_center,
          join_date: new Date(),
          completion_percentage: "0",
          time_spent: 0,
          last_access: null,
        }, { transaction });
      }

      return result;
    });
  }

  async findUsersInGroup(groupId: number, options?: QueryOptions) {
    return await (options?.transaction ?? this.databaseService.db).transaction(async transaction => {
      return await this.userGroupRepository.findUsersInGroup(groupId, { transaction });
    });
  }

  async deleteById(id: number, options?: QueryOptions) {
    return await (options?.transaction ?? this.databaseService.db).transaction(async transaction => {
      return await this.groupRepository.deleteById(id, { transaction });
    });
  }

  async deleteUserFromGroup(id_group: number, id_user: number, options?: QueryOptions) {
    console.log('Deleting user from group:', id_user, id_group);
    return await (options?.transaction ?? this.databaseService.db).transaction(async transaction => {

      // Check if the user is enrolled in other groups of the same course
      const isEnrolledInOtherGroups = await this.userGroupRepository.isUserEnrolledInOtherGroups(id_group, id_user, { transaction });
      console.log('Enrolled in other groups?:', isEnrolledInOtherGroups);

      // If the user is not enrolled in any other groups of the same course, remove them from the course
      if (!isEnrolledInOtherGroups) {
        const group = await this.groupRepository.findById(id_group, { transaction });
        await this.userCourseRepository.deleteUserFromCourse(group.id_course, id_user, { transaction });
      }      
      // Delete the user from the group
      const result = await this.userGroupRepository.deleteUserFromGroup(id_group, id_user, { transaction });
      console.log('User removed from group');

      return result;
    });
  }

  async updateUserInGroup(id_group: number, id_user: number, userGroupUpdateModel: UserGroupUpdateModel, options?: QueryOptions) {
    return await (options?.transaction ?? this.databaseService.db).transaction(async transaction => {
      return await this.userGroupRepository.updateUserInGroup(id_group, id_user, userGroupUpdateModel, { transaction });
    });
  }

  async findUserInGroup(id_user: number, id_group: number, options?: QueryOptions) {
    return await (options?.transaction ?? this.databaseService.db).transaction(async transaction => {
      return await this.userGroupRepository.findUserInGroup(id_user, id_group, { transaction });
    });
  }

  async getBonificationFile(groupId: number, userIds: number[]) {
    return await this.groupBonificableService.generateBonificationFile(groupId, userIds);
  }
}
