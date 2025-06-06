export type MoodleUser = {
    id: number,
    username: string,
    firstname: string,
    lastname: string,
    fullname: string,
    email: string,
    department: string,
    firstaccess: number,
    lastaccess: number,
    auth: string,
    suspended: boolean,
    confirmed: boolean,
    lang: string,
    theme: string,
    timezone: string,
    mailformat: number,
    description: string,
    descriptionformat: number,
    city: string,
    country: string,
    profileimageurlsmall: string,
    profileimageurl: string,
    roles: Array<{
        roleid: number,
        name: string,
        shortname: string,
        sortorder: number
    }>
};

export type ExtendedMoodleUser = MoodleUser & {
    completion_percentage: number | null;
    time_spent: number | null;
};