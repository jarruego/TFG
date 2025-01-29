import { useParams } from "react-router-dom";
import { useCourseQuery } from "../hooks/api/courses/use-course.query";
import { useGroupsQuery } from "../hooks/api/groups/use-groups.query";
import { useUpdateCourseMutation } from "../hooks/api/courses/use-update-course.mutation";
import { Button, Form, Input, Table } from "antd";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { Course } from "../shared/types/course/course";

export default function CourseDetailRoute() {
  const { id_course } = useParams();
  const { data: courseData, isLoading: isCourseLoading } = useCourseQuery(id_course || "");
  const { data: groupsData, isLoading: isGroupsLoading } = useGroupsQuery(id_course || "");
  const { mutateAsync: updateCourse } = useUpdateCourseMutation(id_course || "");

  const { handleSubmit, control, reset } = useForm<Course>();

  useEffect(() => {
    if (courseData) {
      reset(courseData);
    }
  }, [courseData, reset]);

  if (!courseData) return <div>Curso no encontrado</div>;
  if (isCourseLoading || isGroupsLoading) return <div>Cargando...</div>;

  const submit: SubmitHandler<Course> = async (info) => {
    await updateCourse(info);
  }

  return (
    <div>
      <Form layout="vertical" onFinish={handleSubmit(submit)}>
        <Form.Item label="ID" name="id_course">
          <Controller name="id_course" control={control} render={({ field }) => <Input {...field} disabled />} />
        </Form.Item>
        <Form.Item label="Nombre del curso" name="course_name">
          <Controller name="course_name" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item label="Nombre corto" name="short_name">
          <Controller name="short_name" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Guardar</Button>
        </Form.Item>
      </Form>
      <Table rowKey="id_group" columns={[
        {
          title: 'ID',
          dataIndex: 'id_group',
        },
        {
          title: 'MOODLE ID',
          dataIndex: 'moodle_id',
        },
        {
          title: 'Nombre del grupo',
          dataIndex: 'group_name',
        },
        {
          title: 'Descripción',
          dataIndex: 'description',
        }
      ]} dataSource={groupsData} />
    </div>
  );
}
