import { useParams, useNavigate } from "react-router-dom";
import { Button, message, Table } from "antd";
import { useUsersQuery } from "../hooks/api/users/use-users.query";
import { useAddUserToGroupMutation } from "../hooks/api/groups/use-add-user-to-group.mutation";
import { useUsersByGroupQuery } from "../hooks/api/users/use-users-by-group.query";
import { useState, useEffect } from "react";
import { PlusOutlined } from "@ant-design/icons"; 

export default function CreateUserGroupRoute() {
  const { id_group } = useParams();
  const navigate = useNavigate();
  const { data: usersData, isLoading: isUsersLoading } = useUsersQuery();
  const { mutateAsync: addUserToGroup } = useAddUserToGroupMutation();
  const { data: groupUsersData, isLoading: isGroupUsersLoading } = useUsersByGroupQuery(id_group ? parseInt(id_group, 10) : null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  useEffect(() => {
    document.title = "Añadir Usuarios al Grupo";
  }, []);

  const handleSaveUsers = async () => {
    if (!id_group || selectedUserIds.length === 0) return;
    try {
      await Promise.all(selectedUserIds.map(id_user => addUserToGroup({ id_group: parseInt(id_group, 10), id_user })));
      message.success('Usuarios añadidos exitosamente');
      navigate(`/courses/${id_group}`);
    } catch {
      message.error('No se pudo añadir a los usuarios');
    }
  };

  const rowSelection = {
    selectedRowKeys: selectedUserIds,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedUserIds(selectedRowKeys as number[]);
    },
  };

  return (
    <div>
      <h2>Usuarios BD</h2>
      <Table
        rowKey="id_user"
        columns={[
          { title: 'ID', dataIndex: 'id_user' },
          { title: 'Nombre', dataIndex: 'name' },
          { title: 'Apellidos', dataIndex: 'surname' },
          { title: 'Email', dataIndex: 'email' },
        ]}
        dataSource={usersData}
        loading={isUsersLoading}
        rowSelection={rowSelection}
      />
      <Button type="primary" icon={<PlusOutlined />} onClick={handleSaveUsers}>
        Añadir Usuarios al Grupo
      </Button>
      <h2>Usuarios Grupo</h2>
      <Table
        rowKey="id_user"
        columns={[
          { title: 'ID', dataIndex: 'id_user' },
          { title: 'Nombre', dataIndex: 'name' },
          { title: 'Apellidos', dataIndex: 'surname' },
          { title: 'Email', dataIndex: 'email' },
        ]}
        dataSource={groupUsersData}
        loading={isGroupUsersLoading}
      />
    </div>
  );
}