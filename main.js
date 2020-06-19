const mysql = require("mysql2/promise");
const Employee = require("./lib/Employee");
const Department = require("./lib/Department");
const Role = require("./lib/Role");

const departments = {};
const employees = {};
const roles = {};


async function main() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: "root",
        password: "password",
        database: "employee_db",
    });
    
    const [employeeData] = await connection.execute("SELECT * FROM employee;")
    const [departmentData] = await connection.execute("SELECT * FROM department;")
    const [roleData] = await connection.execute("SELECT * FROM role;")

    employeeData.map( (it) => {
        const employee = Employee.from(it);
        employees[employee.id] = employee;
    });

    departmentData.map( (it) => {
        const department = Department.from(it);
        departments[department.id] = department;
    });

    roleData.map( (it) => {
        const role = Role.from(it);
        roles[role.id] = role;
    });

    console.log(employees);
    console.log(departments);
    console.log(roles);
   
    
}

main();