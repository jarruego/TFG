import { useParams } from "react-router-dom";
import { useCourseQuery } from "../hooks/api/courses/use-course.query";
import { useGroupsQuery } from "../hooks/api/groups/use-groups.query";
import { useUpdateCourseMutation } from "../hooks/api/courses/use-update-course.mutation";
import { Button, DatePicker, Form, Input, Table, Select, message } from "antd";
import { DeleteOutlined, SaveOutlined, TeamOutlined } from "@ant-design/icons";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { useState, useEffect } from "react";
import { useUsersByGroupQuery } from "../hooks/api/users/use-users-by-group.query";
import { Course } from "../shared/types/course/course";
import { CourseModality } from "../shared/types/course/course-modality.enum";
import { useDeleteCourseMutation } from "../hooks/api/courses/use-delete-course.mutation";
import { useNavigate } from "react-router-dom";
import { USERS_TABLE_COLUMNS } from "../constants/tables/users-table-columns.constant";

export default function CourseDetailRoute() {
  const navigate = useNavigate();
  const { id_course } = useParams();
  const { data: courseData, isLoading: isCourseLoading } = useCourseQuery(id_course || "");
  const { data: groupsData, isLoading: isGroupsLoading } = useGroupsQuery(id_course || "");
  const { mutateAsync: updateCourse } = useUpdateCourseMutation(id_course || "");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const { data: usersData, isLoading: isUsersLoading } = useUsersByGroupQuery(selectedGroupId);
  const { mutateAsync: deleteCourse } = useDeleteCourseMutation(id_course || "");

  const { handleSubmit, control, reset } = useForm<Course>();

  useEffect(() => {
    if (courseData) {
      reset(courseData);
    }
  }, [courseData, reset]);

  useEffect(() => {
    if (groupsData && groupsData.length > 0) {
      setSelectedGroupId(groupsData[0].id_group);
    }
  }, [groupsData]);

  useEffect(() => {
    document.title = `Detalle del Curso ${id_course}`;
  }, [id_course]);

  if (!courseData) return <div>Curso no encontrado</div>;
  if (isCourseLoading || isGroupsLoading) return <div>Cargando...</div>;

  const submit: SubmitHandler<Course> = async (info) => {
    await updateCourse(info);
  }

  const handleDelete = async () => {
    try {
      await deleteCourse();
      navigate('/courses');
    } catch {
      message.error('No se pudo eliminar el curso. Recuerde que debe de estar vacío');
    }
  };

  const handleAddGroup = () => {
    navigate(`/courses/${id_course}/add-group`);
  };

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
        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item label="Fecha Inicio" name="start_date">
            <Controller name="start_date" control={control} render={({ field }) => <DatePicker {...field} />} />
          </Form.Item>
          <Form.Item label="Fecha Fin" name="end_date">
            <Controller name="end_date" control={control} render={({ field }) => <DatePicker {...field} />} />
          </Form.Item>
          <Form.Item label="Modalidad" name="modality">
            <Controller
              name="modality"
              control={control}
              render={({ field }) => (
                <Select {...field}>
                  {Object.values(CourseModality).map((modality) => (
                    <Select.Option key={modality} value={modality}>
                      {modality}
                    </Select.Option>
                  ))}
                </Select>
              )}
            />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit">Guardar</Button>
            <Button type="primary" icon={<TeamOutlined />} onClick={handleAddGroup}>Añadir Grupo</Button>
        </div>
      </Form>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Table
          rowKey="id_group"
          columns={[
            { title: 'ID', dataIndex: 'id_group' },
            { title: 'MOODLE ID', dataIndex: 'moodle_id' },
            { title: 'Nombre del grupo', dataIndex: 'group_name' },
            { title: 'Descripción', dataIndex: 'description' },
          ]}
          dataSource={groupsData}
          loading={isGroupsLoading}
          onRow={(record) => ({
            onClick: () => setSelectedGroupId(record.id_group),
            onDoubleClick: () => navigate(`/groups/${record.id_group}/edit`),
            style: { cursor: 'pointer' }
          })}
        />
        <Table
          rowKey="id_user"
          columns={[
            ...USERS_TABLE_COLUMNS,
            {
              title: 'Extra'
            },
          ]}
          dataSource={usersData}
          loading={isUsersLoading}
          onRow={(record) => ({
            onDoubleClick: () => navigate(`/users/${record.id_user}`, { state: { from: location.pathname } }),
            style: { cursor: 'pointer' }
          })}
        />
      </div>
      <Button icon={<DeleteOutlined />} type="primary" danger onClick={handleDelete} style={{ marginTop: '16px' }}>
        Eliminar Curso
      </Button>
    </div>
  );
}
