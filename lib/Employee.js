class Employee {
    id = -1;
    first_name ="Bob";
    last_name ="Saget";
    role_id = -1
    manager_id = -1;
    constructor(id, first_name, last_name, role_id, manager_id) {
        this.id = id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.role_id = role_id;
        this.manager_id = manager_id;
    }
}

module.exports = Employee;