import { IsOptional, IsString, IsInt, IsBoolean, IsDateString, IsIn, IsNumber, isNumberString, IsNumberString } from "class-validator";
import { CourseModality } from "src/types/course/course-modality.enum";

export class FilterCourseDTO {
  @IsOptional()
  @IsInt()
  moodle_id?: number;

  @IsOptional()
  @IsString()
  course_name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  short_name?: string;

  // @IsOptional()
  // @IsDateString()
  // start_date?: Date;

  // @IsOptional()
  // @IsDateString()
  // end_date?: Date;

  // @IsOptional()
  // @IsString()
  // fundae_id?: string;

  // @IsOptional()
  // @IsString()
  // @IsIn(Object.values(CourseModality)) // Validación de valores permitidos
  // modality?: CourseModality;

  // @IsOptional()
  // @IsInt()
  // hours?: number;

  // @IsOptional()
  // @IsBoolean()
  // active?: boolean;

  // @IsOptional()
  // @IsNumberString()
  // price_per_hour?: string;
}
