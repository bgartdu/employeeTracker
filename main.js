const mysql = require("mysql2/promise");
const Employee = require("./lib/Employee");
const Department = require("./lib/Department");
const Role = require("./lib/Role");
const inquirer = require("inquirer");

const departments = {};
const employees = {};
const roles = {};
let connection = null;

async function refreshDatabase() {
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
        const managerName = manager ? manager.fullName() : "null";
        
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
        
        const query = "INSERT INTO `department` (`name`) VALUES (?)";
        const params = [data.name];
        try {
            let [result] = await connection.execute(query, params);
            let id = result.insertId
            data.id= id;
            let dep = Department.from(data);
            departments[id] = dep;

            console.log("Success");
            console.log(result);

        } catch (err) {
            console.log("SQL error occurred");
            console.log(err);
        }
    }

}



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