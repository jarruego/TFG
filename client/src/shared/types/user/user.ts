export type User = {
    id_user: number;
    name: string;
    first_surname: string;
    second_surname: string;
    email: string;
    moodle_username: string;
    moodle_password: string;
    moodle_id: number | null; // Permitir que sea null
    dni: string;
    phone: string;
}