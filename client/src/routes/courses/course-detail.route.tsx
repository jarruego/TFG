import { useParams } from "react-router-dom";
import { useCourseQuery } from "../../hooks/api/courses/use-course.query";
import { useGroupsQuery } from "../../hooks/api/groups/use-groups.query";
import { useUpdateCourseMutation } from "../../hooks/api/courses/use-update-course.mutation";
import { Button, DatePicker, Form, Input, Table, Select, Checkbox, Modal, App } from "antd";
import { DeleteOutlined, SaveOutlined, TeamOutlined } from "@ant-design/icons";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { useState, useEffect } from "react";
import { useUsersByGroupQuery } from "../../hooks/api/users/use-users-by-group.query";
import { CourseModality } from "../../shared/types/course/course-modality.enum";
import { useDeleteCourseMutation } from "../../hooks/api/courses/use-delete-course.mutation";
import { useNavigate } from "react-router-dom";
import { USERS_TABLE_COLUMNS } from "../../constants/tables/users-table-columns.constant";
import dayjs from "dayjs";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "../../shared/types/user/user";
import { useCreateBonificationFileMutation } from "../../hooks/api/groups/use-create-bonification-file.mutation";
import { useUpdateUserMainCenterMutation } from "../../hooks/api/centers/use-update-user-main-center.mutation";

const COURSE_DETAIL_FORM_SCHEMA = z.object({
  id_course: z.number(),
  course_name: z.string({ required_error: "El nombre del curso es obligatorio" }).min(2, "El nombre es demasiado corto"),
  short_name: z.string({ required_error: "El nombre corto es obligatorio" }).min(2, "El nombre corto es demasiado corto"),
  start_date: z.date().nullable().optional().nullish(),
  end_date: z.date().nullable().optional().nullish(),
  modality: z.nativeEnum(CourseModality, { required_error: "La modalidad es obligatoria" }),
  hours: z.coerce.number().min(0, "Las horas deben ser un número positivo").optional().nullish(),
  price_per_hour: z.coerce.number().min(0, "El precio/hora debe ser un número positivo").optional().nullish(),
  fundae_id: z.string().optional().nullish(),
  active: z.boolean().optional().nullish(),
  moodle_id: z.number().optional().nullish(),
  category: z.string().optional().nullish(),
});

export default function CourseDetailRoute() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { id_course } = useParams();
  const { data: courseData, isLoading: isCourseLoading } = useCourseQuery(id_course || "");
  const { data: groupsData, isLoading: isGroupsLoading } = useGroupsQuery(id_course || "");
  const { mutateAsync: updateCourse } = useUpdateCourseMutation(id_course || "");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const { data: usersData, isLoading: isUsersLoading, refetch: refetchUsersByGroup } = useUsersByGroupQuery(selectedGroupId);
  const { mutateAsync: deleteCourse } = useDeleteCourseMutation(id_course || "");
  const { mutateAsync: createBonificationFile } = useCreateBonificationFileMutation();
  const updateUserMainCenterMutation = useUpdateUserMainCenterMutation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [modal, contextHolder] = Modal.useModal();
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]); // IDs selected in the table
  const [isBonificationModalOpen, setIsBonificationModalOpen] = useState(false);
  // Estado para centros seleccionados en la modal de bonificación
  const [selectedCenters, setSelectedCenters] = useState<Record<number, number>>({}); // { [id_user]: id_center }

  const { handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof COURSE_DETAIL_FORM_SCHEMA>>({
    resolver: zodResolver(COURSE_DETAIL_FORM_SCHEMA),
  });

  useEffect(() => {
    if (courseData) {
      reset({
        ...courseData,
        start_date: courseData.start_date ? (dayjs.isDayjs(courseData.start_date) ? courseData.start_date.toDate() : courseData.start_date) : null,
        end_date: courseData.end_date ? (dayjs.isDayjs(courseData.end_date) ? courseData.end_date.toDate() : courseData.end_date) : null,
      });
    }
  }, [courseData, reset]);

  useEffect(() => {
    if (groupsData && groupsData.length > 0) {
      setSelectedGroupId(groupsData[0].id_group);
      setSelectedRowKeys([groupsData[0].id_group]); 
    }
  }, [groupsData]);

  useEffect(() => {
    document.title = `Detalle del Curso ${id_course}`;
  }, [id_course]);

  if (!courseData) return <div>Curso no encontrado</div>;
  if (isCourseLoading || isGroupsLoading) return <div>Cargando...</div>;

  const submit: SubmitHandler<z.infer<typeof COURSE_DETAIL_FORM_SCHEMA>> = async (info) => {
    const data = {
      ...info,
      hours: info.hours !== undefined && info.hours !== null ? Number(info.hours) : 0,
      price_per_hour: info.price_per_hour !== undefined && info.price_per_hour !== null ? Number(info.price_per_hour) : 0,
    };
    await updateCourse({
      ...data,
      start_date: data.start_date ? dayjs(data.start_date).utc().toDate() : null,
      end_date: data.end_date ? dayjs(data.end_date).utc().toDate() : null,
    });
    navigate(-1);
  };

  const handleDelete = async () => {
    modal.confirm({
      title: "¿Seguro que desea eliminar este curso?",
      content: "Esta acción no se puede deshacer.",
      okText: "Eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await deleteCourse();
          navigate('/courses');
          message.success('Curso borrado exitosamente');
        } catch {
          modal.error({
            title: "Error al eliminar el curso",
            content: "No se pudo eliminar el curso. Recuerde que debe de estar vacío.",
          });
        }
      },
    });
  };

  const handleAddGroup = () => {
    navigate(`/courses/${id_course}/add-group`);
  };

  const handleRowClick = (record: { id_group: number }) => {
    setSelectedGroupId(record.id_group);
    setSelectedRowKeys([record.id_group]);
  };

  // Collects the selected users from the table
  const handleUserSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedUserIds(selectedRowKeys as number[]);
  };

  // Opens the bonification modal
  const openBonificationModal = () => {
    if (selectedUserIds.length === 0) {
      message.warning("Select at least one user to bonify.");
      return;
    }
    setIsBonificationModalOpen(true);
  };

  // Removes a user from the selection inside the modal
  const handleRemoveUserFromModal = (userId: number) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  // Confirms bonification and generates the XML
  const REQUIRED_USER_FIELDS = [
    'dni', // nif
    'document_type', // N_TIPO_DOCUMENTO
    'erteLaw', // ERTE_RD_ley
    'email',
    'phone', // telefono
    'disability', // discapacidad
    'terrorism_victim', // afectadosTerrorismo
    'gender_violence_victim', // afectadosViolenciaGenero
    'professional_category', // categoriaprofesional
    'education_level', // nivelestudios
    'accreditationDiploma', // DiplomaAcreditativo
    'seasonalWorker', // fijoDiscontinuo
  ];

  const FIELD_LABELS: Record<string, string> = {
    dni: 'NIF',
    document_type: 'Tipo de documento',
    erteLaw: 'ERTE RD Ley',
    email: 'Email',
    phone: 'Teléfono',
    disability: 'Discapacidad',
    terrorism_victim: 'Afectado por terrorismo',
    gender_violence_victim: 'Afectado por violencia de género',
    professional_category: 'Categoría profesional',
    education_level: 'Nivel de estudios',
    accreditationDiploma: 'Diploma acreditativo',
    seasonalWorker: 'Fijo discontinuo',
  };

  type UserWithMissingFields = {
    id_user: number;
    display: string;
    missingFields: string[];
  };

  const handleConfirmBonification = async () => {
    if (!selectedGroupId || selectedUserIds.length === 0) return;
    // Validación de campos requeridos antes de bonificar
    const usersToBonify = usersData?.filter(u => selectedUserIds.includes(u.id_user)) || [];
    const usersWithMissingFields: UserWithMissingFields[] = usersToBonify.map((user) => {
      const missingFields = REQUIRED_USER_FIELDS.filter(field => {
        const value = (user as Record<string, unknown>)[field];
        // Considera nulo, undefined, string vacío o NaN como campo faltante
        if (value === undefined || value === null) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        if (typeof value === 'number' && isNaN(value)) return true;
        return false;
      });
      return missingFields.length > 0 ? {
        id_user: user.id_user,
        display: `${user.name} ${user.first_surname}`.trim() || user.dni || `ID ${user.id_user}`,
        missingFields,
      } : null;
    }).filter((u): u is UserWithMissingFields => Boolean(u));

    if (usersWithMissingFields.length > 0) {
      modal.info({
        title: 'Faltan datos obligatorios en algunos usuarios',
        width: 600,
        icon: <span style={{ color: '#faad14', fontSize: 22, marginRight: 8 }}>⚠️</span>,
        content: (
          <div style={{ maxHeight: 320, overflowY: 'auto', paddingTop: 8 }}>
            <p style={{ marginBottom: 12 }}>Antes de bonificar, completa los siguientes campos en los usuarios:</p>
            <ul style={{ paddingLeft: 20 }}>
              {usersWithMissingFields.map((u) => (
                <li key={u.id_user} style={{ marginBottom: 8 }}>
                  <b>{u.display}:</b> {u.missingFields.map((f) => FIELD_LABELS[f] || f).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        ),
        okText: 'Cerrar',
        centered: true,
        maskClosable: true,
      });
      return;
    }

    try {
      const xmlBlob = await createBonificationFile({ groupId: selectedGroupId, userIds: selectedUserIds });
      const url = window.URL.createObjectURL(xmlBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bonification_group_${selectedGroupId}.xml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setIsBonificationModalOpen(false);
      message.success("XML generated successfully");
    } catch {
      Modal.error({
        title: "Error generating XML",
        content: "Could not generate the bonification file.",
      });
    }
  };

  // Definir columnas específicas para el modal de bonificación
  const BONIFICATION_MODAL_USER_COLUMNS = [
    {
      title: 'Centro (empresa)',
      dataIndex: 'centro_select',
      render: (_: unknown, user: User) => {
        const selected = selectedCenters[user.id_user] ?? user.centers?.find(c => c.is_main_center)?.id_center ?? user.centers?.[0]?.id_center;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Select
              style={{ minWidth: 220 }}
              value={selected}
              placeholder={user.centers?.length ? 'Selecciona centro' : 'Sin centros'}
              options={user.centers?.map(center => ({
                value: center.id_center,
                label: `${center.center_name} (${center.company_name ?? ''})${center.is_main_center ? ' (principal)' : ''}`
              }))}
              allowClear
              onChange={val => setSelectedCenters(prev => ({ ...prev, [user.id_user]: val }))}
            />
            {selected && (
              <Button
                type="primary"
                size="small"
                loading={updateUserMainCenterMutation.isPending}
                onClick={() => updateUserMainCenterMutation.mutate(
                  { userId: user.id_user, centerId: selected },
                  {
                    onSuccess: () => {
                      message.success('Centro principal actualizado');
                      refetchUsersByGroup();
                    },
                    onError: () => message.error('Error al actualizar el centro principal')
                  }
                )}
              >
                Guardar
              </Button>
            )}
          </div>
        );
      }
    },
    ...USERS_TABLE_COLUMNS.filter(col => col.title !== 'Centro' && col.title !== 'Empresa'),
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: unknown, record: User) => (
        <Button danger size="small" onClick={() => handleRemoveUserFromModal(record.id_user)}>
          Quitar
        </Button>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      {/* Modal de bonificación */}
      <Modal
        open={isBonificationModalOpen}
        title="Bonificar usuarios seleccionados y crear XML FUNDAE"
        onCancel={() => setIsBonificationModalOpen(false)}
        onOk={handleConfirmBonification}
        okText="Bonificar y generar XML"
        cancelText="Cancelar"
        width="90vw"
        style={{ top: 20, minHeight: '90vh', maxWidth: '90vw' }}
        styles={{ body: { minHeight: '80vh', maxHeight: '80vh', overflowY: 'auto' } }}
      >
        <Table<User>
          rowKey="id_user"
          dataSource={usersData?.filter(u => selectedUserIds.includes(u.id_user))}
          columns={BONIFICATION_MODAL_USER_COLUMNS}
          pagination={false}
          size="small"
          onRow={(record) => ({
            onDoubleClick: () => {
              window.open(`/users/${record.id_user}`, '_blank', 'noopener');
            },
            style: { cursor: 'pointer' }
          })}
        />
        {selectedUserIds.length === 0 && <div style={{color: 'red', marginTop: 12}}>No hay usuarios seleccionados.</div>}
      </Modal>
      <Form layout="vertical" onFinish={handleSubmit(submit)}>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-start' }}>
          <Form.Item label="ID" name="id_course">
            <Controller name="id_course" control={control} render={({ field }) => <Input {...field} id="id_course" disabled />} />
          </Form.Item>
          <Form.Item label="ID Moodle" name="moodle_id">
            <Controller name="moodle_id" control={control} render={({ field }) => <Input {...field} id="moodle_id" disabled value={field.value ?? undefined} />} />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            label="Nombre del curso"
            name="course_name"
            style={{ flex: 2 }}
            required={true}
            help={errors.course_name?.message}
            validateStatus={errors.course_name ? "error" : undefined}
          >
            <Controller name="course_name" control={control} render={({ field }) => <Input {...field} id="course_name" />} />
          </Form.Item>
          <Form.Item
            label="Nombre corto"
            name="short_name"
            style={{ flex: 1 }}
            required={true}
            help={errors.short_name?.message}
            validateStatus={errors.short_name ? "error" : undefined}
          >
            <Controller name="short_name" control={control} render={({ field }) => <Input {...field} id="short_name" />} />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-start' }}>
          <Form.Item
            label="Fecha Inicio"
            name="start_date"
            help={errors.start_date?.message}
            validateStatus={errors.start_date ? "error" : undefined}
          >
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  value={field.value ? dayjs(field.value) : null}
                  onChange={date => field.onChange(date ? date.toDate() : null)}
                  id="start_date"
                />
              )}
            />
          </Form.Item>
          <Form.Item
            label="Fecha Fin"
            name="end_date"
            help={errors.end_date?.message}
            validateStatus={errors.end_date ? "error" : undefined}
          >
            <Controller
              name="end_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  value={field.value ? dayjs(field.value) : null}
                  onChange={date => field.onChange(date ? date.toDate() : null)}
                  id="end_date"
                />
              )}
            />
          </Form.Item>
          <Form.Item
            label="Modalidad"
            name="modality"
            required={true}
            help={errors.modality?.message}
            validateStatus={errors.modality ? "error" : undefined}
          >
            <Controller
              name="modality"
              control={control}
              render={({ field }) => (
                <Select {...field} id="modality">
                  {Object.values(CourseModality).map((modality) => (
                    <Select.Option key={modality} value={modality}>
                      {modality}
                    </Select.Option>
                  ))}
                </Select>
              )}
            />
          </Form.Item>
          <Form.Item
            label="Horas"
            name="hours"
            help={errors.hours?.message}
            validateStatus={errors.hours ? "error" : undefined}
          >
            <Controller
              name="hours"
              control={control}
              render={({ field }) => <Input type="number" min={0} {...field} id="hours" style={{ width: 80 }} value={field.value ?? undefined} />}
            />
          </Form.Item>
          <Form.Item
            label="Precio/hora"
            name="price_per_hour"
            help={errors.price_per_hour?.message}
            validateStatus={errors.price_per_hour ? "error" : undefined}
          >
            <Controller
              name="price_per_hour"
              control={control}
              render={({ field }) => <Input type="number" min={0} step="0.01" {...field} id="price_per_hour" style={{ width: 100 }} value={field.value ?? undefined} />}
            />
          </Form.Item>
          <Form.Item
            label="FUNDAE ID"
            name="fundae_id"
            help={errors.fundae_id?.message}
            validateStatus={errors.fundae_id ? "error" : undefined}
          >
            <Controller
              name="fundae_id"
              control={control}
              render={({ field }) => <Input {...field} id="fundae_id" style={{ width: 120 }} value={field.value ?? undefined} />}
            />
          </Form.Item>
          <Form.Item
            label="Activo"
            name="active"
            valuePropName="checked"
            help={errors.active?.message}
            validateStatus={errors.active ? "error" : undefined}
          >
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  checked={!!field.value}
                >
                  {""}
                </Checkbox>
              )}
            />
          </Form.Item>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Table
            title={() => <h3>Grupos del Curso</h3>}
            rowKey="id_group"
            columns={[
              { title: 'ID', dataIndex: 'id_group' },
              { title: 'MOODLE ID', dataIndex: 'moodle_id' },
              { title: 'Nombre del grupo', dataIndex: 'group_name' },
              { title: 'Descripción', dataIndex: 'description' },
            ]}
            footer={() => <Button type="default" icon={<TeamOutlined />} onClick={handleAddGroup}>Añadir Grupo al Curso</Button>}
            dataSource={groupsData}
            loading={isGroupsLoading}
            rowSelection={{
              type: 'radio',
              selectedRowKeys,
              onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys as number[]),
              renderCell: () => null,
            }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              onDoubleClick: () => navigate(`/groups/${record.id_group}/edit`),
              style: { cursor: 'pointer' }
            })}
          />

          <div style={{ marginTop: 8, display: 'flex', width: '100%', flexDirection: 'column', gap: '8px' }}>
            <Table<User>
              title={() => <h3>Usuarios del Grupo</h3>}
              rowKey="id_user"
              columns={[
                ...USERS_TABLE_COLUMNS,
                {
                  title: 'Extra'
                },
              ]}
              dataSource={usersData}
              loading={isUsersLoading}
              scroll={{ y: 400 }}
              pagination={{ pageSize: 100 }}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: selectedUserIds,
                onChange: handleUserSelectionChange,
              }}
              onRow={(record) => ({
                onDoubleClick: () => {
                  window.open(`/users/${record.id_user}`, '_blank', 'noopener');
                  setTimeout(() => refetchUsersByGroup(), 1000); // Refresca tras abrir la ficha
                },
                style: { cursor: 'pointer' }
              })}
            />
            <Button
              type="default"
              icon={<SaveOutlined />}
              style={{ maxWidth: '450px' }}
              onClick={openBonificationModal}
            >
              Bonificar seleccionados y crear XML FUNDAE
            </Button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button type="default" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit">Guardar</Button>
          <Button icon={<DeleteOutlined />} type="primary" danger onClick={handleDelete}>Eliminar Curso</Button>
        </div>
      </Form>
    </div>
  );
}
