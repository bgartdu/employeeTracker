const mysql = require("mysql2/promise");
const Employee = require("./lib/Employee");
const Department = require("./lib/Department");
const Role = require("./lib/Role");
const inquirer = require("inquirer");

const departments = {};
const departmentsByName = {};
const employees = {};
const employeesByName = {};
const employeesCountByName = {};
const roles = {};
const rolesByTitle = {};
let connection = null;

function clear(obj) {
    for (let obj in arguments) {
        for (let key in obj) { delete obj[key]; } 
    }
}

async function refreshDatabase() {
    const [employeeData] = await connection.execute("SELECT * FROM employee;")
    const [departmentData] = await connection.execute("SELECT * FROM department;")
    const [roleData] = await connection.execute("SELECT * FROM role;")

    clear(departments, departmentsByName, employees, employeesByName, roles, rolesByTitle);
    
    employeeData.map( (it) => {
        const employee = Employee.from(it);
        employees[employee.id] = employee;

        const fullName = employee.fullName();
        let displayName = fullName;
        if (employeesCountByName[fullName]) {
            employeesCountByName[fullName] += 1;
            displayName += ` (${employeesCountByName[fullName]})`;
        } else {
            employeesCountByName[fullName] = 1;
        }

        employee.displayName = displayName;
        employeesByName[displayName] = employee.id;
    });
    
    departmentData.map( (it) => {
        const department = Department.from(it);
        departments[department.id] = department;
        departmentsByName[department.name] = department.id;
    });
    
    roleData.map( (it) => {
        const role = Role.from(it);
        roles[role.id] = role;
        rolesByTitle[role.title] = role.id;
    });
}




String.prototype.compareTo = function(other) {
     return (this == other) ? 0 : ((this < other) ? -1 : 1);
    }

function leftPad(str, width, char) {
    char = char || " ";
    while (str.length < width) {
        str = char + str;
    }
    return str;
}

function rightPad(str, width, char) {
    char = char || " ";
    while (str.length < width) {
        str = str + char;
    }
    return str;
}

const employeeTableHeaders = [ "id", "first_name", "last_name", "title", "department", "salary", "manager"]
const departmentTableHeaders = [ "id", "name", ]
const roleTableHeaders = [ "id", "title", "salary", "department" ]



function printTable(headers, table, spacing, divider) {
    spacing = spacing || 2;
    divider = divider || '-';
    
    const spacer = leftPad("", spacing, " ")
    const columnWidth = [];
    for (let i= 0; i < headers.length; i++) {
        columnWidth[i] = headers[i].length;
    }
    
    for (let i =0; i < table.length; i++) {
        for (let k = 0; k < table[i].length; k++) {
            columnWidth[k] = Math.max(columnWidth[k], ("" +table[i][k]).length);
        }
    }
    
    let line1 = "";
    let line2 = "";
    
    for (let i = 0; i < headers.length; i++) {
        line1 += rightPad(headers[i], columnWidth[i], " ") + spacer;
        line2 += rightPad("", columnWidth[i], "-") + spacer;
    }
    console.log(line1);
    console.log(line2);
    
    for(let i = 0; i < table.length; i++) {
        let line = "";
        for (let k = 0; k < table[i].length; k++){
            line += rightPad(""+table[i][k], columnWidth[k], " ") + spacer
        }
        console.log(line);
    }
}

function formatEmployeeData() {
    const result = [];
    for (let id in employees) {
        const emp = employees[id];
        const role = roles[emp.role_id];
        const dpt = departments[role.department_id];
        const manager = employees[emp.manager_id];
        const managerName = manager ? manager.displayName : "null";
        
        const row = [emp.id, emp.first_name, emp.last_name, role.title, dpt.name, role.salary, managerName];
        
        result[result.length] = row;
    }
    
    
    
    return result;
}

function formatDepartmentData() {
    const result = [];
    for (let id in departments) {
        const dep = departments[id];

        const row = [ dep.id, dep.name ]

        result[result.length] = row;

    }

    return result;

}

function formatRoleData() {
    const result = [];
    for (let id in roles) {
        const role = roles[id];
        const dep = departments[role.department_id];

        const row = [ role.id, role.title, role.salary, dep.name ]
        result[result.length] = row;
    }

    return result; 
}

const choiceFunctions = {
    "Refresh Local Data": async function(){
        await refreshDatabase();
    },
    "View All Employees" : async function(){
        printTable(employeeTableHeaders, formatEmployeeData() );
    }, "View All Employees By Department" : async function(){
        const table = formatEmployeeData();
        table.sort( (a,b) => { return a[4].compareTo(b[4]); } )
        printTable(employeeTableHeaders, table);
    }, "View All Employees By Manager" : async function(){
        const table = formatEmployeeData();
        table.sort( (a,b) => { return a[6].compareTo(b[6]); } )
        printTable(employeeTableHeaders, table);
    }, "View All Roles" : async function(){
        printTable(roleTableHeaders, formatRoleData());
        
    }, "View All Departments" : async function(){
        printTable(departmentTableHeaders, formatDepartmentData());
        
    }, "Add Department": async function() {
        let data = await inquirer.prompt([
            {
                type: "input",
                message: "what will the department name be?",
                name: "name"
            }
        ]);

        if (departmentsByName[data.name]) {
            console.log("Sorry, a department already exists with that name.");
            return;
        }
        
        const query = "INSERT INTO `department` (`name`) VALUES (?)";
        const params = [data.name];
        try {
            let [result] = await connection.execute(query, params);
            let id = result.insertId
            data.id= id;
            let dep = Department.from(data);
            departments[id] = dep;
            departmentsByName[dep.name] = id;

            console.log("Success");
            console.log(result);

        } catch (err) {
            console.log("SQL error occurred");
            console.log(err);
        }
    }, "Add Role": async function() {
        let data = await inquirer.prompt([
            {
                type: "input",
                message: "what will the role's title be?",
                name: "title"
            },
            {
                type: "number",
                message: "what is the role's annual salary?",
                name: "salary", 

            }, 
            {
                type: "list",
                message: "what department is the role associated with?",
                name: "department",
                choices: Object.keys(departmentsByName)

            }
        ]);

        data.department_id = departmentsByName[data.department];

        if (isNaN(data.salary) || data.salary <  0) {
            console.log("Sorry, please use a positive number for salary?");
            return;
        }

        if (rolesByTitle[data.title]) {
            console.log("Sorry, that title is already taken.");
            return;
        }

        const query = "INSERT INTO `role` (`title`, `salary`, `department_id`) VALUES (?, ?, ?)";
        const params = [ data.title, data.salary, data.department_id ];
        try {
            let [result] = await connection.execute(query, params);
            let id = result.insertId
            data.id= id;
            let role = Role.from(data);
            role[id] = role;
            rolesByTitle[role.title] = id;
            
            console.log("Success!");
            console.log(result);
            
        } catch (err) {
            console.log("SQL error occurred");
            console.log(err);
        }

    }, "Add Employee": async function() {
        const NO_MANAGER = "--- ---Nobody--- ---" 
        let data = await inquirer.prompt([
            {
                type: "input",
                message: "what will the first name be?",
                name: "first_name"
            },
            {
                type: "input",
                message: "what will the last name be?",
                name: "last_name"
            },
            {
                type: "list",
                message: "what is this employees role?",
                name: "role",
                choices: Object.keys(rolesByTitle),
            },
            {
                type: "list",
                message: "who is this employee's manager?",
                name: "manager",
                choices: [NO_MANAGER, ...Object.keys(employeesByName) ]

            }
        ]);
        data.role_id = rolesByTitle[data.role];
        data.manager_id = (data.manager === NO_MANAGER) ? null : employeesByName[data.manager];
        const query = "INSERT INTO `employee` (`first_name`, `last_name`, `role_id`, manager_id) VALUES (?, ?, ?, ?)";
        const params = [ data.first_name, data.last_name, data.role_id, data.manager_id ];
        try {
            let [result] = await connection.execute(query, params);
            let id = result.insertId
            data.id= id;
            let employee = Employee.from(data);
            employees[id] = employee;
            const fullName = employee.fullName();
            let displayName = fullName;



            if (employeesCountByName[fullName]) {
                employeesCountByName[fullName] += 1;
                displayName += ` (${employeesCountByName[fullName]})`;
            } else {
                employeesCountByName[fullName] = 1;
            }
    
            employee.displayName = displayName;
            employeesByName[displayName] = employee.id;
        
            
            console.log("Success!");
            console.log(result);
            
        } catch (err) {
            console.log("SQL error occurred");
            console.log(err);
        }
    }

};



async function main() {
    connection = await mysql.createConnection({
        host: 'localhost',
        user: "root",
        password: "password",
        database: "employee_db",
    });
    
    await refreshDatabase();
    
    
    
    
    
    // console.log(employees);
    // console.log(departments);
    // console.log(roles);
    
    while (true) {
        
        let data = await inquirer.prompt([
            
            {
                type: "list",
                message: "what would you like to do?",
                name: "choice",
                choices:  [
                    "Refresh Local Data",
                    "View All Employees",
                    "View All Employees By Department",
                    "View All Employees By Manager",
                    "Add Employee",
                    "Remove Employee",
                    "Update Employee Role",
                    "Update Employee Manager",
                    "View All Roles",
                    "Add Role",
                    "Remove Role",
                    "View All Departments",
                    "Add Department",
                    "Remove Department",
                    "Quit"
                    
                ]
                
            }
        ]);
        if (data.choice === "Quit") {
            console.log("Okay, goodbye");
            break;
        }

        const func = choiceFunctions[data.choice];
        if (func) { await func(); }
        else { console.log("\n\nNOT YET IMPLEMENTED\n\n");}
    }
}

main();