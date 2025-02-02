import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString, IsInt, IsBoolean,  IsIn, IsOptional, IsDateString, IsNumberString, IsDate } from "class-validator";
import { CourseModality } from "src/types/course/course-modality.enum";

export class CreateCourseDTO {
  @ApiProperty()
  @IsOptional()
  @IsInt()
  moodle_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  course_name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  category: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  short_name: string;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date: Date;

  // @ApiProperty()
  // @IsOptional()
  // @IsString()
  // fundae_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(CourseModality)) // Validación de valores permitidos
  modality: CourseModality;

  // @ApiProperty()
  // @IsOptional()
  // @IsInt()
  // hours: number;

  // @ApiProperty()
  // @IsOptional()
  // @IsNumberString()
  // price_per_hour: string;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsBoolean()
  // active: boolean;
}