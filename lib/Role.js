class Role {
    id = -1;
    title ="untitled"
    salary = 100000
    department_id = -1;
    constructor(id, title, salary, department_id) {
        this.id = id;
        this.title = title;
        this.salary = salary;
        this.department_id =department_id;
    }
}

module.exports = Role;