import { companyTable } from "./schema/tables/company.table";
import { centerTable } from "./schema/tables/center.table";
import { authUserTable } from "./schema/tables/auth_user.table";
import { courseModality, courseTable } from "./schema/tables/course.table";
import { groupTable } from "./schema/tables/group.table";
import { documentType, gender, userTable } from "./schema/tables/user.table";
import { userGroupTable } from "./schema/tables/user_group.table";
import { userCenterTable } from "./schema/tables/user_center.table";
import { enrollmentStatus, userCourseTable } from "./schema/tables/user_course.table";

export const auth_users = authUserTable;
export const companies = companyTable;
export const centers = centerTable;
export const courses = courseTable;
export const groups = groupTable;
export const users = userTable;
export const user_groups = userGroupTable;
export const user_center = userCenterTable;
export const user_course = userCourseTable

// Enum Data Types
export const courseModailitySchema = courseModality;
export const genderSchema = gender
export const document_type = documentType;
export const enrollment_status = enrollmentStatus;
